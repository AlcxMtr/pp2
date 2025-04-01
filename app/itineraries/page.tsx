'use client';
import { useState, useEffect, use } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Booking, UserProfile, FlightBookingInfo } from './BookingInterfaces';

export default function itinerariesPage() {
  const { accessToken, userId, loading: authLoading } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

  // TODO: Fetch flight booking info for each booking
/*   useEffect(() => {
    // Loop over each booking and check if it has a flight booking

    const fetchFlightInfo = async (bookingRef: String) => {
      try {
        const response = await fetch(`/api/users/flight-bookings/verify?lastName=${userProfile?.lastName}&bookingReference=${bookingRef}`, {
          method: 'GET',
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
        console.log('Flight Booking Info:', data);
      } catch (err) {
        console.error(err);
      }
    };

    bookings.forEach((booking) => {
      if (booking.flightBooking) {
        // Extract flight booking details using https://advanced-flights-system.replit.app/api/bookings/retrieve?lastName=Doe&bookingReference=1A381D
        //const flightBooking: FlightBooking = booking.flightBooking;
        fetchFlightInfo(booking.flightBooking.flightBookingRef);
      }
    });
  }, [bookings, userProfile]); */

  const pendingBookings = bookings.filter(
    (booking) => booking.status === 'PENDING'
  );
  const confirmedBookings = bookings.filter(
    (booking) => booking.status === 'CONFIRMED'
  );

  const renderBookingCard = (booking: Booking) => (
    <div key={booking.id} className="bg-white p-6 rounded-lg shadow-md mb-4">
      <div className="flex justify-between items-center mb-4">
        {booking.creditCardNumber && (
          <div className="text-sm text-gray-600">
            Payment: {booking.creditCardNumber}
          </div>
        )}
        {booking.invoiceUrl && (
          <a
            href={booking.invoiceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            View Invoice
          </a>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {booking.hotelBooking && (
          <div>
            <div className="font-medium text-gray-800">Hotel Booking</div>
            <p className="text-sm text-gray-600">
              {booking.hotelBooking.hotel.address}
            </p>
            <p className="text-sm text-gray-600">
              {booking.hotelBooking.hotel.name} - {booking.hotelBooking.roomType.name}
            </p>
            <p className="text-sm text-gray-600">
              Check-in: {new Date(booking.hotelBooking.checkInDate).toLocaleDateString()} | 
              Check-out: {new Date(booking.hotelBooking.checkOutDate).toLocaleDateString()}
            </p>
            <p className="text-sm text-gray-600">
              Star Rating: {booking.hotelBooking.hotel.starRating}/5
            </p>
            <p className="text-sm text-gray-600">
              Price: ${booking.hotelBooking.roomType.pricePerNight}/night
            </p>
          </div>
        )}

        {booking.flightBooking && (
          <div>
            <h4 className="font-medium text-gray-800">Flight Booking</h4>
            <p className="text-sm text-gray-600">
              Ref: {booking.flightBooking.flightBookingRef}
            </p>
            <p className="text-sm text-gray-600">
              Ticket: {booking.flightBooking.flightTicketNumber}
            </p>
            <p className="text-sm text-gray-600">
              Price: ${booking.flightBooking.flightPrice}
            </p>
          </div>
        )}
      </div>
    </div>
  );

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
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Pending Itinerary ({pendingBookings.length})
          </h2>
          {pendingBookings.length > 0 ? (
            pendingBookings.map(renderBookingCard)
          ) : (
            <p className="text-gray-600">No pending itinerary found.</p>
          )}
        </section>

        {/* Confirmed Bookings */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Confirmed Itineraries ({confirmedBookings.length})
          </h2>
          {confirmedBookings.length > 0 ? (
            confirmedBookings.map(renderBookingCard)
          ) : (
            <p className="text-gray-600">No confirmed itineraries found.</p>
          )}
        </section>
      </div>
    </div>
  );
}