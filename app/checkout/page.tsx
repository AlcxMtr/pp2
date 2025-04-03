'use client';

import { useState, useEffect} from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Input, Button, Card } from '@heroui/react';
import { Booking, UserProfile, FlightBookingInfo } from '../itineraries/BookingInterfaces';

interface FlightDetails {
  airline: string;
  flightNumber: string;
  departure: string;
  arrival: string;
  date: string;
}

interface HotelDetails {
  name: string;
  address: string;
  checkIn: string;
  checkOut: string;
}

export default function ItineraryCheckout() {
  const { accessToken, userId, loading: authLoading } = useAuth();
  const router = useRouter();

  // Itinerary data
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [flightBookings, setFlightBookings] = useState<Map<string, FlightBookingInfo>>(new Map());

  const [payment, setPayment] = useState({
    creditCardNumber: '',
    cardExpiry: '',
  });
  const [loading, setLoading] = useState(false);

  const flightBooking: FlightDetails = {
    airline: 'Air Canada',
    flightNumber: 'AC123',
    departure: 'Toronto (YYZ)',
    arrival: 'San Francisco (SFO)',
    date: '2025-06-15',
  };

  const hotelBooking: HotelDetails = {
    name: 'Grand San Francisco Hotel',
    address: '123 Market Street, San Francisco, CA',
    checkIn: '2025-06-15',
    checkOut: '2025-06-18',
  };

  // Fetch user profile and bookings
  useEffect(() => {
    if (authLoading) return;
    if (!accessToken || !userId) {
      console.log('No access token or user ID found. Redirecting to login...');
      router.push('/login');
      return;
    }

    const fetchUserProfile = async () => {
      try {
        const response = await fetch('/api/users/edit-profile', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: Number(userId),
          }),
        });
        if (!response.ok) throw new Error('Failed to fetch user profile');
        const data = await response.json();
        setUserProfile(data);
      } catch (err) {
        console.error(err);
      }
    };

    
  // Fetch flight booking info for each booking
  useEffect(() => {
    const fetchFlightInfo = async (bookingRef: string) => {
      try {
        const response = await fetch(
          `/api/bookings/flight-bookings/verify?lastName=${userProfile?.lastName}&bookingReference=${bookingRef}`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          }
        );
        if (!response.ok) return null; // Return null if fetch fails
        return await response.json(); // Return fetched data
      } catch (err) {
        console.error(err);
        return null; // Return null if an error occurs
      }
    };
  
    const updateFlightBookings = async () => {
      const newEntries = new Map(); // Temporary map to store new data
  
      const fetchPromises = bookings.map(async (booking) => {
        const bookingRef = booking.flightBooking?.flightBookingRef;
        if (bookingRef && accessToken) {
          const data = await fetchFlightInfo(bookingRef);
          if (data) newEntries.set(bookingRef, data);
        }
      });
  
      await Promise.all(fetchPromises); // Wait for all fetches to complete
  
      // Update state using functional form to ensure the latest state is used
      setFlightBookings((prev) => new Map([...prev, ...newEntries]));
    };
  
    updateFlightBookings();
  }, [bookings, accessToken, userProfile]);

    const fetchBookings = async () => {
      try {
        const response = await fetch(
          `/api/users/bookings?userId=${userId}`,
          { method: 'GET',  
            headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json' } }
        );
        if (!response.ok) throw new Error('Failed to fetch bookings');
        const data = await response.json();
        setBookings(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
    fetchBookings();
  }, [authLoading]);

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
    try {
      const res = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payment),
      });
      if (res.ok) {
        alert('Payment successful!');
        router.push('/confirmation');
      } else {
        alert('Payment failed. Please try again.');
      }
    } catch (error) {
      alert('Error processing payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen p-10 bg-gray-100 dark:bg-gray-900">
      <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold mb-6 text-center">Itinerary Checkout</h1>

        <Card className="mb-6 p-4">
          <h2 className="text-xl font-semibold">Flight Details</h2>
          <p><strong>Airline:</strong> {flightBooking.airline}</p>
          <p><strong>Flight:</strong> {flightBooking.flightNumber}</p>
          <p><strong>From:</strong> {flightBooking.departure}</p>
          <p><strong>To:</strong> {flightBooking.arrival}</p>
          <p><strong>Date:</strong> {flightBooking.date}</p>
        </Card>

        <Card className="mb-6 p-4">
          <h2 className="text-xl font-semibold">Hotel Reservation</h2>
          <p><strong>Hotel:</strong> {hotelBooking.name}</p>
          <p><strong>Address:</strong> {hotelBooking.address}</p>
          <p><strong>Check-in:</strong> {hotelBooking.checkIn}</p>
          <p><strong>Check-out:</strong> {hotelBooking.checkOut}</p>
        </Card>

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

          <Button type="submit" disabled={loading} className="w-full bg-blue-600 text-white font-semibold py-2 rounded-lg">
            {loading ? 'Processing...' : 'Confirm & Pay'}
          </Button>
        </form>
      </div>
    </div>
  );
}
