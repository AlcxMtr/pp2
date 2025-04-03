'use client';
import { useState, useEffect, use } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@heroui/react';
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
    const fetchFlightInfo = async (bookingRef: string) => {
      try {
        const response = await fetch(`/api/bookings/flight-bookings/verify?lastName=${userProfile?.lastName}&bookingReference=${bookingRef}`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          }
        });
        if (!response.ok) return; //throw new Error('Failed to fetch flight info');
        const data = await response.json();
        setFlightBookings((prev) => new Map(prev).set(bookingRef, data));
      } catch (err) {
        console.error(err);
      }
    };

    // Loop over each booking and check if it has a flight booking, then add info to map
    bookings.forEach((booking) => {
      if (!flightBookings.has(booking.flightBooking?.flightBookingRef || '')){
        if (accessToken && booking.flightBooking) {
          fetchFlightInfo(booking.flightBooking.flightBookingRef);
        }
      }
    });
  }, [bookings, userProfile]);

  const pendingBookings = bookings.filter(
    (booking) => booking.status === 'PENDING'
  );
  const confirmedBookings = bookings.filter(
    (booking) => booking.status === 'CONFIRMED'
  );

  const viewInvoice = () => {
    //Todo: Implement view invoice functionality
  }


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
    <div key={booking.id} className="relative bg-white p-6 rounded-lg shadow-md mb-4">
      <div className="absolute top-0 right-0 mt-4 mr-4 flex flex-col space-y-2">
        {booking.status === "CONFIRMED" && (
          <Button
            onPress={viewInvoice}
            className="bg-black text-white hover:bg-gray-700 dark:bg-white dark:text-black"
          >
            View Invoice
          </Button>
        )}

        {booking.status === "CONFIRMED" && (
          <Button
            onPress={() => setCancelHotelId(booking.hotelBooking?.id || null)}
            className="bg-black text-white hover:bg-red-700 dark:bg-white dark:text-black size:sm"
          >
            Cancel Hotel Stay
          </Button>
        )}

        {booking.status === "CONFIRMED" && (
          <Button
            onPress={() => setCancelFlightId(booking.flightBooking?.id || null)}
            className="bg-black text-white hover:bg-red-700 dark:bg-white dark:text-black size:sm"
          >
            Cancel Flight
          </Button>
        )}

        {booking.status === "PENDING" && (
          <Button
            onPress={() => router.push('/checkout')}
            className="bg-black text-white hover:bg-gray-700 dark:bg-white dark:text-black"
          >
            Checkout
          </Button>
        )}
        {booking.status === "PENDING" && (
          <Button
            onPress={() => router.push('/search')}
            className="bg-black text-white hover:bg-gray-700 dark:bg-white dark:text-black"
          >
            Edit
          </Button>
        )}
        {booking.status === "PENDING" && booking.flightBooking && (
            <Button
            onPress={() => router.push(`/search?searchType=hotels&city=${flightBookingInfo?.destination}&checkInDate=${flightBookingInfo?.departureDate.substring(0, 10)}&checkOutDate=${flightBookingInfo?.returnDate.substring(0, 10)}`)}
            className="bg-black text-white hover:bg-gray-700 dark:bg-white dark:text-black"
            >
            Suggest Hotels
            </Button>
        )}
        {booking.status === "PENDING" && booking.hotelBooking && (
          <Button
            onPress={() => router.push(`/search?searchType=flights&origin=Toronto&destination=${booking.hotelBooking?.hotel.location}&departureDate=${booking.hotelBooking?.checkInDate.substring(0, 10)}&returnDate=${booking.hotelBooking?.checkOutDate.substring(0, 10)}`
            )}
            className="bg-black text-white hover:bg-gray-700 dark:bg-white dark:text-black"
          >
            Suggest Flights
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {booking.hotelBooking && !deletedHotelBookings.includes(booking.hotelBooking.id) && (
          <div>
            <div className="text-lg font-medium text-gray-800 mb-1">Hotel Booking</div>
            <p className="text-gray-700">
              {booking.hotelBooking.hotel.address}
            </p>
            <p className="text-gray-700">
              {booking.hotelBooking.hotel.name} - {booking.hotelBooking.roomType.name}
            </p>
            <p className="text-gray-700">
              From: {new Date(booking.hotelBooking.checkInDate).toLocaleDateString()}
            </p>
            <p className="text-gray-700">
              Until: {new Date(booking.hotelBooking.checkOutDate).toLocaleDateString()}
            </p>
            <p className="text-gray-700">
              Star Rating: {booking.hotelBooking.hotel.starRating}
            </p>
            <p className="text-gray-700">
              Price: ${booking.hotelBooking.roomType.pricePerNight}/night
            </p>
          </div>
        )}

        {booking.flightBooking && !deletedFlightBookings.includes(booking.flightBooking.id) && (
          <div className="">
            <h4 className="text-lg font-medium text-gray-800 mb-1">Flight Booking</h4>
            <p className="text-md text-gray-700">
              {flightBookingInfo?.origin} → {flightBookingInfo?.destination}
            </p>
            <p className="text-gray-700">
              Status: {booking.flightBooking.status}
            </p>
            <p className="text-gray-700">
              Ref: {booking.flightBooking.flightBookingRef}
            </p>
            <p className="text-gray-700">
              Ticket: {booking.flightBooking.flightTicketNumber}
            </p>
            <p className="text-gray-700">
              Number of Legs: {flightBookingInfo?.numLegs}
            </p>
            <p className="text-gray-700">
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
        console.log(bookingId);
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
    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Itineraries</h1>

        {/* Pending Bookings */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Pending Itinerary
          </h2>
          {pendingBookings.length > 0 ? (
            pendingBookings.map(renderBookingCard)
          ) : (
            <p className="text-gray-600">No pending itinerary found.</p>
          )}
        </section>

        {/* Confirmed Bookings */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Confirmed Itineraries ({confirmedBookings.length - deletedBookings.size})
          </h2>
          {confirmedBookings.length > 0 ? (
            confirmedBookings.map(renderBookingCard)
          ) : (
            <p className="text-gray-600">No confirmed itineraries found.</p>
          )}
        </section>

        {/* Confirmation Modal for Cancel Hotel Booking */}
        {cancelHotelId && (
          <div className="confirmation-modal fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="modal-content bg-[var(--card-bg-light)] dark:bg-black p-6 rounded-lg shadow-lg">
              <p className="text-[var(--text-dark)] dark:text-[var(--text-light)]">
                Are you sure you want to cancel this booking?
              </p>
              <div className="modal-actions flex justify-center">
                <Button
                  onClick={() => handleCancelHotel(cancelHotelId)}
                  className="confirm-button bg-red-500 text-white hover:bg-red-600"
                >
                  Yes
                </Button>
                <Button
                  onClick={() => setCancelHotelId(null)}
                  className="cancel-modal-button bg-gray-300 text-black hover:bg-gray-400 dark:bg-gray-600 dark:text-white dark:hover:bg-gray-500"
                >
                  No
                </Button>
              </div>
            </div>
          </div>
        )}

        {cancelFlightId && (
          <div className="confirmation-modal fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="modal-content bg-[var(--card-bg-light)] dark:bg-black p-6 rounded-lg shadow-lg">
              <p className="text-[var(--text-dark)] dark:text-[var(--text-light)]">
                Are you sure you want to cancel this booking?
              </p>
              <div className="modal-actions flex justify-center">
                <Button
                  onClick={() => handleCancelFlight(cancelFlightId)}
                  className="confirm-button bg-red-500 text-white hover:bg-red-600"
                >
                  Yes
                </Button>
                <Button
                  onClick={() => setCancelFlightId(null)}
                  className="cancel-modal-button bg-gray-300 text-black hover:bg-gray-400 dark:bg-gray-600 dark:text-white dark:hover:bg-gray-500"
                >
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