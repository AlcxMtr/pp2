// Written with help from Grok AI
'use client';

import { useState, useEffect, use} from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Input, Button, Card } from '@heroui/react';
import { Booking, UserProfile, FlightBookingInfo } from '../itineraries/BookingInterfaces';
import { refreshNotificationsGlobally } from '../components/Notification';

export interface Airport {
  code: string;
  name: string;
  city: string;
  country: string;
}

export interface Airline {
  code: string;
  name: string;
}

export interface Flight {
  id: string;
  flightNumber: string;
  departureTime: string;
  arrivalTime: string;
  originId: string;
  destinationId: string;
  duration: number;
  price: number;
  currency: string;
  availableSeats: number;
  status: string;
  airline: Airline;
  origin: Airport;
  destination: Airport;
}

export default function ItineraryCheckout() {
  const { accessToken, userId, loading: authLoading } = useAuth();
  const router = useRouter();

  // Itinerary data
  const [booking, setBooking] = useState<Booking | null>(null);
  const [flightInfo, setFlightInfo] = useState<string[]>([]);
  const [flightIds, setFlightIds] = useState<string[]>([]); 
  const [flights, setFlights] = useState<Flight[]>([]);
  interface CheckoutResponse {
    flightBookingRef?: string;
    flightTicketNumber?: string;
    [key: string]: any; // Add this to allow other properties if needed
  }
  
  const [response, setResponse] = useState<CheckoutResponse | null>(null);
  const [error, setError] = useState(null);

  const [payment, setPayment] = useState({
    creditCardNumber: '',
    cardExpiry: '',
    passportNumber: '',
  });
  const [loading, setLoading] = useState(false);

  // Fetch user profile and bookings
  useEffect(() => {
    if (authLoading) return;
    if (!accessToken || !userId) {
      console.log('No access token or user ID found. Redirecting to login...');
      router.push('/login');
      return;
    }

    const fetchBookings = async () => {
      try {
        const response = await fetch(`/api/itinerary/active`, {
          method: 'POST',  
          headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: Number(userId),
          }),
        });
        if (!response.ok) throw new Error('Failed to fetch bookings');
        const data = await response.json();

        setBooking(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [authLoading, accessToken]);

  useEffect(() => {
    if (!booking) return;
    if (booking.flightBooking) {
      setFlightInfo(booking.flightBooking.flightBookingRef.split('|'));
      setFlightIds(booking.flightBooking.flightTicketNumber.split('|'));
    }
  }, [booking]);

  // Fetch the info for each flight
  useEffect(() => {
    if (!flightIds.length) return;
    const fetchFlights = async () => {
      try {
        const flightData = await Promise.all(flightIds.map(async (flightId) => {
          const response = await fetch(`/api/flights/${flightId}`);
          if (!response.ok) throw new Error('Failed to fetch flight info');
          return response.json();
        }));
        flightData.sort((a, b) => new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime());
        setFlights(flightData);
      } catch (error) {
        console.error('Error fetching flight info:', error);
      }
    };
    fetchFlights();
  }, [flightIds]);

  const numDays = () => {
    if (booking && booking.hotelBooking) {
      const checkInDate = new Date(booking?.hotelBooking?.checkInDate);
      const checkOutDate = new Date(booking?.hotelBooking?.checkOutDate);
      const timeDiff = checkOutDate.getTime() - checkInDate.getTime();
      return Math.ceil(timeDiff / (1000 * 3600 * 24));
    } else {
      return 0;
    }
  }

  const totalCost = () => {
    let total = 0;
    if (booking && booking.flightBooking) {
      total += booking.flightBooking.flightPrice;
    }
    if (booking && booking.hotelBooking) {
      total += booking.hotelBooking.roomType.pricePerNight * numDays();
    }
    return total;
  }

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
  
    if (!accessToken) {
      alert('Please log in first');
      router.push('/login');
      return;
    }
  
    if (!payment.creditCardNumber || !payment.cardExpiry) {
      alert('Please fill in all payment details');
      return;
    }
  
    setLoading(true);
    setError(null);
    setResponse(null);
  
    try {
      const itineraryId = booking?.id;
      if (!itineraryId) {
        throw new Error('No itinerary ID found');
      }
      let destination = "N/A";

      if (booking.hotelBooking) {
        destination = booking.hotelBooking.hotel.address.split(',')[1].trim();
      } else {
        destination = flightInfo[1];
      }
  
      const checkoutRes = await fetch('/api/itinerary/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          passport: String(payment.passportNumber),
          totalCost: String(totalCost()),
          itineraryId,
          creditCardNumber: payment.creditCardNumber,
          cardExpiry: payment.cardExpiry,
          flightPresent: booking?.flightBooking ? true : false,
          destination: destination,
        }),
      });
  
      const checkoutData = await checkoutRes.json();
  
      if (!checkoutRes.ok) {
        throw new Error(checkoutData.error || 'Checkout failed');
      }
      setResponse({Result: "Booking Successful"});
  
      if (booking?.flightBooking) {
        const flightBookingRes = await fetch('/api/bookings/flight-bookings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            passportNumber: String(payment.passportNumber),
            flightIds: flightIds,
            userId: Number(userId),
            itineraryId: Number(booking.id),
          }),
        });
  
        if (!flightBookingRes.ok) {
          throw new Error('Failed to complete flight booking.');
        }
  
        const flightBookingData = await flightBookingRes.json();
        
        setResponse(flightBookingData);
      }
      alert('Checkout successful!');
      console.log("Refreshing notifications in checkout");
      refreshNotificationsGlobally()
    } catch (err: any) {
      console.error(err);
      setError(err.message);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const FlightCard = ({ flight, id }: { flight: Flight, id: number }) => {
    return (
      <Card className="mb-6 p-4">
        <h2 className="text-xl font-semibold">Flight #{id}</h2>
        <p>
          <strong>Flight Number:</strong> {flight.flightNumber} ({flight.airline.name})
        </p>
        <p>
          <strong>Origin:</strong> ({flight.origin.code}), {flight.origin.city}, {flight.origin.country}
        </p>
        <p>
          <strong>Destination:</strong> ({flight.destination.code}), {flight.destination.city}, {flight.destination.country}
        </p>
        <p>
          <strong>Departure:</strong> {new Date(flight.departureTime).toLocaleString()}
        </p>
        <p>
          <strong>Arrival:</strong> {new Date(flight.arrivalTime).toLocaleString()}
        </p>
        <p>
          <strong>Duration:</strong> {Math.floor(flight.duration / 60)}h {flight.duration % 60}m
        </p>
        <p>
          <strong>Price:</strong> ${flight.price}
        </p>
        <p>
          <strong>Status:</strong> {flight.status}
        </p>
      </Card>
    );
  };

  if (booking && !booking.hotelBooking && !booking.flightBooking) {
    return (
      <div className="flex flex-col items-center min-h-screen p-10 bg-gray-100 dark:bg-gray-900">
        <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold mb-6 text-center">Itinerary Checkout</h1>
            <div className="text-center">
              <p className="text-lg font-semibold">No Pending Itinerary Found</p>
            </div>
        </div>
      </div>
  );}

  return (
    <div className="flex flex-col items-center min-h-screen p-10 bg-gray-100 dark:bg-gray-900">
      <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold mb-6 text-center">Itinerary Checkout</h1>

        <div>
          {( flights.length > 0) ? (
            flights.map((flight, index) => (
              <FlightCard key={index} flight={flight} id={index + 1} />
            ))
          ) : (
            <p>{booking ? booking?.flightBooking ? "Flights Loading..." : "No flights available." : "Booking Loading..."}</p>
          )}
        </div>

        { booking && booking.hotelBooking &&
          <Card className="mb-6 p-4">
            <h2 className="text-xl font-semibold">Hotel Reservation</h2>
            <p><strong>Hotel:</strong> {booking.hotelBooking.hotel.name}</p>
            <p><strong>Address:</strong> {booking.hotelBooking.hotel.address}</p>
            <p><strong>Check-in:</strong> {new Date(booking.hotelBooking.checkInDate).toLocaleDateString()}</p>
            <p><strong>Check-out:</strong> {new Date(booking.hotelBooking.checkOutDate).toLocaleDateString()}</p>
            <p><strong>Price Per Day:</strong> ${booking.hotelBooking.roomType.pricePerNight}</p>
            <p><strong>Total Days:</strong> {numDays()}</p>
            <p><strong>Total cost:</strong> ${booking.hotelBooking.roomType.pricePerNight * numDays()}</p>
          </Card>
        }


        <form onSubmit={handlePayment} className="space-y-10 mt-10">
          <Input
            isRequired
            label="Credit Card Number"
            labelPlacement="outside"
            placeholder="Enter card number"
            value={payment.creditCardNumber}
            onChange={(e) => setPayment({ ...payment, creditCardNumber: e.target.value })}
            className="w-full"
          />

          <Input
            isRequired
            label="Card Expiry (MM/YY)"
            labelPlacement="outside"
            placeholder="MM/YY"
            value={payment.cardExpiry}
            onChange={(e) => setPayment({ ...payment, cardExpiry: e.target.value })}
            className="w-full"
          />

          {booking?.flightBooking && <Input
            isRequired={booking?.flightBooking ? true : false}
            label="Passport Number"
            labelPlacement="outside"
            placeholder="123 456 789"
            value={payment.passportNumber}
            onChange={(e) => setPayment({ ...payment, passportNumber: e.target.value })}
            className="w-full"
          />}

          <div className="text-center">
            <p className="text-lg font-semibold">Total Cost:</p>
            <p className="text-2xl font-bold">${totalCost()}</p>
          </div>

          {/* Display Response or Error */}
          {error && <p className="mt-4 text-red-500">{error}</p>}
          {response && (
          <>
            <div className="mt-4 p-4 border rounded-md">
              <h3 className="text-lg font-semibold">Checkout Successful</h3>
              { booking?.flightBooking &&
                <>
                  <pre className="text-sm">Flight Booking Ref: {response.flightBookingRef}</pre>
                  <pre className="text-sm">Flight Ticket Number: {response.flightTicketNumber}</pre>
                </>
              }
            </div>
            <Button onPress={() => router.push("/itineraries")} className="w-full bg-blue-600 text-white font-semibold py-2 rounded-lg">
              {"View Itineraries"}
            </Button>
          </>
          )}
          {!response &&
            <Button type="submit" disabled={loading} className="w-full bg-blue-600 text-white font-semibold py-2 rounded-lg">
              {loading ? 'Processing...' : 'Confirm & Pay'}
            </Button>
          }
        </form>
      </div>
    </div>
  );
}
