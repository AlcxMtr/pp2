// Written with help from Grok AI

'use client';
import { useState, useEffect, use } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Button, user } from '@heroui/react';
import { Booking, UserProfile, FlightBookingInfo } from './BookingInterfaces';

export default function itinerariesPage() {
  const { accessToken, userId, loading: authLoading } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [deletedHotelBookings, setDeletedHotelBookings] = useState<number[]>([]);
  const [deletedFlightBookings, setDeletedFlightBookings] = useState<number[]>([]);
  const [deletedBookings, setDeletedBookings] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [flightBookings, setFlightBookings] = useState<Map<string, FlightBookingInfo>>(new Map());
  const [cancelHotelId, setCancelHotelId] = useState<number | null>(null);
  const [cancelFlightId, setCancelFlightId] = useState<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;
    if (!accessToken || !userId) {
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
        setError('Error loading bookings. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
    fetchBookings();
  }, [authLoading]);

  // Fetch flight booking info for each booking
  useEffect(() => {
    if (userProfile === null || bookings.length === 0) return;
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
        if (!booking.flightBooking) return;
        const bookingRef = booking.flightBooking.flightBookingRef;
        //const status = booking.flightBooking.status;
        //if (status === 'CONFIRMED') {
        if (bookingRef.split('|').length <= 1) {
          if (bookingRef && accessToken) {
            const data = await fetchFlightInfo(bookingRef);
            if (data) newEntries.set(bookingRef, data);
          }
        } else {
          const info = booking.flightBooking.flightBookingRef.split('|');
          const numLegs = booking.flightBooking.flightTicketNumber.split('|').length;
          newEntries.set(booking.flightBooking.flightBookingRef, {
            flightStatuses: [],
            status: 'PENDING',
            numLegs: numLegs,
            origin: info[0],
            destination: info[1],
            departureDate: info[2],
          });
        }

      });
  
      await Promise.all(fetchPromises); // Wait for all fetches to complete
  
      // Update state using functional form to ensure the latest state is used
      setFlightBookings((prev) => new Map([...prev, ...newEntries]));
    };
  
    updateFlightBookings();
  }, [bookings, userProfile]); // Dependencies, may need accessToken, userProfile

  const pendingBookings = bookings.filter(
    (booking) => booking.status === 'PENDING'
  );
  const confirmedBookings = bookings.filter(
    (booking) => booking.status === 'CONFIRMED'
  );


  const renderBookingCard = (booking: Booking) => {
    if (booking.status === "CONFIRMED" &&
      (!booking.hotelBooking || deletedHotelBookings.includes(booking.hotelBooking.id)) &&
     (!booking.flightBooking || deletedFlightBookings.includes(booking.flightBooking.id))
    ) {
      // Add bookingId to hashset with setdeletedBookings
      if (!deletedBookings.has(booking.id)) {
        setDeletedBookings((prev) => new Set(prev).add(booking.id));
      }
      return null; // Skip rendering if neither booking is present
    }
    let flightBookingInfo = flightBookings.get(booking.flightBooking?.flightBookingRef || '');
    return (
    <div key={booking.id} className="relative bg-white p-6 rounded-lg shadow-md mb-4 bg-[var(--text-light)] dark:bg-[var(--text-dark)]">
      <div className="absolute top-0 right-0 mt-4 mr-4 flex flex-col space-y-2">
        {booking.status === "CONFIRMED" && (
          <Button
            onPress={() => viewInvoice(booking.id)}
            className="hover:bg-[var(--beige)] dark:hover:bg-[var(--dark-hover)] cursor-pointer"
          >
            View Invoice
          </Button>
        )}

        {booking.status === "CONFIRMED" && booking.hotelBooking && !deletedHotelBookings.includes(booking.hotelBooking.id) && (
          <Button
            onPress={() => setCancelHotelId(booking.hotelBooking?.id || null)}
            className="hover:bg-red-700 cursor-pointer"
          >
            Cancel Hotel Stay
          </Button>
        )}

        {booking.status === "CONFIRMED" && booking.flightBooking && !deletedFlightBookings.includes(booking.flightBooking.id) && (
          <Button
            onPress={() => setCancelFlightId(booking.flightBooking?.id || null)}
            className="hover:bg-red-700 cursor-pointer"
          >
            Cancel Flight
          </Button>
        )}

        {booking.status === "PENDING" && (
          <Button
            onPress={() => router.push('/checkout')}
            className="hover:bg-[var(--green-hover)] dark:hover:bg-[var(--dark-green-hover)] cursor-pointer"
          >
            Checkout
          </Button>
        )}
        {booking.status === "PENDING" && (
          <Button
            onPress={() => router.push('/search')}
            className="hover:bg-[var(--beige)] dark:hover:bg-[var(--dark-hover)] cursor-pointer"
          >
            Edit
          </Button>
        )}
        {booking.status === "PENDING" && booking.flightBooking && (
            <Button
            onPress={() => router.push(`/search?searchType=hotels&city=${flightBookingInfo?.destination}&checkInDate=${flightBookingInfo?.departureDate.substring(0, 10)}&checkOutDate=${flightBookingInfo?.returnDate.substring(0, 10)}`)}
            className="hover:bg-[var(--beige)] dark:hover:bg-[var(--dark-hover)] cursor-pointer"
            >
            Suggest Hotels
            </Button>
        )}
        {booking.status === "PENDING" && booking.hotelBooking && (
          <Button
            onPress={() => router.push(`/search?searchType=flights&origin=Toronto&destination=${booking.hotelBooking?.hotel.location}&departureDate=${booking.hotelBooking?.checkInDate.substring(0, 10)}&returnDate=${booking.hotelBooking?.checkOutDate.substring(0, 10)}`
            )}
            className="hover:bg-[var(--beige)] dark:hover:bg-[var(--dark-hover)] cursor-pointer"
          >
            Suggest Flights
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {booking.hotelBooking && !deletedHotelBookings.includes(booking.hotelBooking.id) && (
          <div>
            <div className="text-lg font-medium text-[var(--text-dark)] dark:text-[var(--text-light)] mb-1">Hotel Booking</div>
            <p className="text-[var(--text-dark)] dark:text-[var(--text-light)]">
              {booking.hotelBooking.hotel.address}
            </p>
            <p className="text-[var(--text-dark)] dark:text-[var(--text-light)]">
              {booking.hotelBooking.hotel.name} - {booking.hotelBooking.roomType.name}
            </p>
            <p className="text-[var(--text-dark)] dark:text-[var(--text-light)]">
              From: {new Date(booking.hotelBooking.checkInDate).toLocaleDateString()}
            </p>
            <p className="text-[var(--text-dark)] dark:text-[var(--text-light)]">
              Until: {new Date(booking.hotelBooking.checkOutDate).toLocaleDateString()}
            </p>
            <p className="text-[var(--text-dark)] dark:text-[var(--text-light)]">
              Star Rating: {booking.hotelBooking.hotel.starRating}
            </p>
            <p className="text-[var(--text-dark)] dark:text-[var(--text-light)]">
              Price: ${booking.hotelBooking.roomType.pricePerNight}/night
            </p>
          </div>
        )}

        {booking.flightBooking && !deletedFlightBookings.includes(booking.flightBooking.id) && (
          <div className="">
            <h4 className="text-lg font-medium text-[var(--text-dark)] dark:text-[var(--text-light)] mb-1">Flight Booking</h4>
            <p className="text-md text-[var(--text-dark)] dark:text-[var(--text-light)]">
              {flightBookingInfo?.origin || "Loading..."} → {flightBookingInfo?.destination || "Loading..."}
            </p>
            <p className="text-[var(--text-dark)] dark:text-[var(--text-light)]">
              Status: {flightBookingInfo ? flightBookingInfo.status : "Loading..."}
            </p>
            <p className="text-[var(--text-dark)] dark:text-[var(--text-light)]">
              Dep. Date: {flightBookingInfo ? new Date(flightBookingInfo.departureDate).toLocaleDateString() : "Loading..."}
            </p>
            <p className="text-[var(--text-dark)] dark:text-[var(--text-light)]">
              Dep. Time: {flightBookingInfo 
                ? flightBookingInfo.departureDate.substring(11, 16) === ""
                  ? "N/A"
                  : flightBookingInfo.departureDate.substring(11, 16)
                : "Loading..."}
            </p>
            <p className="text-[var(--text-dark)] dark:text-[var(--text-light)]">
              Total Flights: {flightBookingInfo?.numLegs || "Loading..."}
            </p>
            <p className="text-[var(--text-dark)] dark:text-[var(--text-light)]">
              Price: ${booking.flightBooking.flightPrice}
            </p>
          </div>
        )}
      </div>
    </div>
    );
  };

  // Cancel a hotel stay
  const handleCancelHotel = async (bookingId: number) => {
    try {
      const res = await fetch(`/api/bookings/hotel-bookings/user-cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ bookingId }),
      });
      if (res.ok) {
        setDeletedHotelBookings((prev) => [...prev, bookingId]);
        alert('Booking cancelled successfully!');
      } else {
        throw new Error(await res.text());
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
      alert('Error cancelling booking');
    } finally {
      setCancelHotelId(null);
    }
  };

  // Cancel a flight
  const handleCancelFlight = async (bookingId: number) => {
    try {
      const res = await fetch(`/api/bookings/flight-bookings/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ flightBookingId: bookingId }),
      });
      if (res.ok) {
        setDeletedFlightBookings((prev) => [...prev, bookingId]);
        alert('Booking cancelled successfully!');
      } else {
        throw new Error(await res.text());
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
      alert('Error cancelling booking');
    } finally {
      setCancelFlightId(null);
    }
  };

  const viewInvoice = async (id: number) => {
    try {
      const response = await fetch('/api/invoice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ itineraryId: id }),
      });

      if (!response.ok) throw new Error('Failed to generate PDF');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'flight-details.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download PDF');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading bookings...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--gray-bg-light)] dark:bg-[var(--gray-bg-dark)] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-[var(--text-dark)] dark:text-[var(--text-light)] mb-8">My Itineraries</h1>

        {/* Pending Bookings */}
        <section className="mb-10 p-4 rounded-lg shadow-md bg-[var(--beige)] dark:bg-[var(--card-bg-dark)]">
          <h2 className="text-2xl font-semibold text-[var(--text-dark)] dark:text-[var(--text-light)] mb-4">
            Pending Itinerary
          </h2>
          {(pendingBookings.length > 0 && (pendingBookings[0].hotelBooking || pendingBookings[0].flightBooking)) ? pendingBookings.map(renderBookingCard) : (
            <p className="text-[var(--text-muted-dark)] dark:text-[var(--text-muted-light)]">No pending itinerary found.</p>
          )}
        </section>

        {/* Confirmed Bookings */}
        <section className="mb-12 p-4 rounded-lg shadow-md bg-[var(--beige)] dark:bg-[var(--card-bg-dark)]">
          <h2 className="text-2xl font-semibold text-[var(--text-dark)] dark:text-[var(--text-light)] mb-4">
            Confirmed Itineraries ({confirmedBookings.length - deletedBookings.size})
          </h2>
          {confirmedBookings.length > 0 ? confirmedBookings.map(renderBookingCard) : (
            <p className="text-[var(--text-muted-dark)] dark:text-[var(--text-muted-light)]">No confirmed itineraries found.</p>
          )}
        </section>

        {/* Confirmation Modal for Cancel Hotel Booking */}
        {cancelHotelId && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-[var(--card-bg-light)] dark:bg-black p-6 rounded-lg shadow-lg">
              <p className="text-[var(--text-dark)] dark:text-[var(--text-light)]">
                Are you sure you want to cancel this booking?
              </p>
              <div className="flex justify-center mt-4">
                <Button onClick={() => handleCancelHotel(cancelHotelId)} className="bg-red-500 text-white hover:bg-red-600 cursor-pointer">
                  Yes
                </Button>
                <Button onClick={() => setCancelHotelId(null)} className="bg-gray-300 text-black hover:bg-gray-400 dark:bg-gray-600 dark:text-white dark:hover:bg-gray-500 ml-4 cursor-pointer">
                  No
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Modal for Cancel Flight Booking */}
        {cancelFlightId && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-[var(--card-bg-light)] dark:bg-black p-6 rounded-lg shadow-lg">
              <p className="text-[var(--text-dark)] dark:text-[var(--text-light)]">
                Are you sure you want to cancel this booking?
              </p>
              <div className="flex justify-center mt-4">
                <Button onClick={() => handleCancelFlight(cancelFlightId)} className="bg-red-500 text-white hover:bg-red-600 cursor-pointer">
                  Yes
                </Button>
                <Button onClick={() => setCancelFlightId(null)} className="bg-gray-300 text-black hover:bg-gray-400 dark:bg-gray-600 dark:text-white dark:hover:bg-gray-500 ml-4 cursor-pointer">
                  No
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}