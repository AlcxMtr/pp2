'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import LoadingMessage from '../components/LoadingMessage';

interface Booking {
  id: number;
  hotel: { name: string; location: string };
  roomType: { name: string };
  checkInDate: string;
  checkOutDate: string;
  itineraryId?: number;
}

export default function MyBookings() {
  const { accessToken, userId } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!accessToken || !userId) {
      router.push('/login');
      return;
    }
    const fetchBookings = async () => {
      try {
        const res = await fetch(`/api/bookings/hotel-bookings?ownerId=${userId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (res.ok) {
          const data = await res.json();
          setBookings(data);
        } else {
          throw new Error(await res.text());
        }
      } catch (error) {
        console.error('Error fetching bookings:', error);
        alert('Failed to load bookings');
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, [accessToken, userId, router]);

  if (loading) return <LoadingMessage message="Loading your bookings..." />;

  return (
    <div className="my-bookings-container">
      <h1 className="my-bookings-title">My Bookings</h1>
      {bookings.length === 0 ? (
        <p className="no-bookings-text">
          You have no bookings yet. <a href="/book" className="text-[var(--deep-purple)] hover:text-[var(--lavender)]">Book a stay now!</a>
        </p>
      ) : (
        <ul className="bookings-list">
          {bookings.map((booking) => (
            <li key={booking.id} className="booking-item">
              <p className="booking-detail">Hotel: {booking.hotel.name} ({booking.hotel.location})</p>
              <p className="booking-detail">Room: {booking.roomType.name}</p>
              <p className="booking-detail">Check-In: {new Date(booking.checkInDate).toLocaleDateString()}</p>
              <p className="booking-detail">Check-Out: {new Date(booking.checkOutDate).toLocaleDateString()}</p>
              {booking.itineraryId && <p className="booking-detail">Itinerary ID: {booking.itineraryId}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}