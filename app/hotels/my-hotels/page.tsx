'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Hotel {
  id: number;
  name: string;
  location: string;
  starRating: number;
}

interface Booking {
  id: number;
  hotel: { name: string; location: string };
  roomType: { name: string };
  checkInDate: string;
  checkOutDate: string;
  user: { firstName: string; lastName: string; email: string };
  itinerary?: { id: number };
}

export default function MyHotels() {
  const { accessToken, userId } = useAuth();
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [bookings, setBookings] = useState<{ [hotelId: number]: Booking[] }>({});
  const [expandedHotel, setExpandedHotel] = useState<number | null>(null);
  const [loadingHotels, setLoadingHotels] = useState(true);
  const [loadingBookings, setLoadingBookings] = useState<{ [hotelId: number]: boolean }>({});
  const router = useRouter();

  // Fetch hotels on mount
  useEffect(() => {
    if (!accessToken || !userId) {
      router.push('/login');
      return;
    }
    const fetchHotels = async () => {
      try {
        const res = await fetch(`/api/hotels?ownerId=${userId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (res.ok) {
          const data = await res.json();
          setHotels(data);
        } else {
          throw new Error(await res.text());
        }
      } catch (error) {
        console.error('Error fetching hotels:', error);
        alert('Failed to load hotels');
      } finally {
        setLoadingHotels(false);
      }
    };
    fetchHotels();
  }, [accessToken, userId, router]);

  // Fetch bookings for a specific hotel when expanded
  const fetchBookings = async (hotelId: number) => {
    if (!accessToken || !userId || bookings[hotelId]) return;

    setLoadingBookings((prev) => ({ ...prev, [hotelId]: true }));
    try {
      const res = await fetch(`/api/bookings/hotel-bookings?ownerId=${userId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const allBookings = await res.json();
        const hotelBookings = allBookings.filter((b: Booking) => b.hotel.id === hotelId);
        setBookings((prev) => ({ ...prev, [hotelId]: hotelBookings }));
      } else {
        throw new Error(await res.text());
      }
    } catch (error) {
      console.error(`Error fetching bookings for hotel ${hotelId}:`, error);
      alert(`Failed to load bookings for hotel ${hotelId}`);
    } finally {
      setLoadingBookings((prev) => ({ ...prev, [hotelId]: false }));
    }
  };

  const toggleBookings = (hotelId: number) => {
    if (expandedHotel === hotelId) {
      setExpandedHotel(null);
    } else {
      setExpandedHotel(hotelId);
      fetchBookings(hotelId);
    }
  };

  if (loadingHotels) return <p className="loading-text">Loading your hotels...</p>;

  return (
    <div className="my-hotels-container">
      <h1 className="my-hotels-title">My Hotels</h1>
      {hotels.length === 0 ? (
        <p className="no-hotels-text">
          You don’t have any hotels yet.{' '}
          <Link href="/hotels/register" className="text-[var(--deep-purple)] hover:text-[var(--lavender)]">
            Register one now!
          </Link>
        </p>
      ) : (
        <ul className="hotels-list">
          {hotels.map((hotel) => (
            <li key={hotel.id} className="hotel-item">
              <div className="hotel-info">
                <h2 className="hotel-name">{hotel.name}</h2>
                <p className="hotel-detail">Location: {hotel.location}</p>
                <p className="hotel-detail">Stars: {hotel.starRating}</p>
              </div>
              <div className="hotel-actions">
                <Link href={`/hotels/${hotel.id}/room-types`} className="action-button">
                  Add Room Type
                </Link>
                <Link href={`/hotels/${hotel.id}/update-availability`} className="action-button">
                  Update Availability
                </Link>
                <Link href={`/hotels/${hotel.id}/rooms`} className="action-button">
                  View Rooms
                </Link>
                <button
                  onClick={() => toggleBookings(hotel.id)}
                  className="action-button"
                >
                  {expandedHotel === hotel.id ? 'Hide Bookings' : 'Show Bookings'}
                </button>
              </div>
              {expandedHotel === hotel.id && (
                <div className="bookings-section">
                  {loadingBookings[hotel.id] ? (
                    <p className="loading-text">Loading bookings...</p>
                  ) : !bookings[hotel.id] || bookings[hotel.id].length === 0 ? (
                    <p className="no-bookings-text">No bookings for this hotel yet.</p>
                  ) : (
                    <ul className="bookings-list">
                      {bookings[hotel.id].map((booking) => (
                        <li key={booking.id} className="booking-item">
                          <p className="booking-detail">Guest: {booking.user.firstName} {booking.user.lastName} ({booking.user.email})</p>
                          <p className="booking-detail">Room: {booking.roomType.name}</p>
                          <p className="booking-detail">Check-In: {new Date(booking.checkInDate).toLocaleDateString()}</p>
                          <p className="booking-detail">Check-Out: {new Date(booking.checkOutDate).toLocaleDateString()}</p>
                          {booking.itinerary && <p className="booking-detail">Itinerary ID: {booking.itinerary.id}</p>}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}