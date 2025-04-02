'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import Link from 'next/link';
import LoadingMessage from '../../../components/LoadingMessage';

interface Hotel {
  id: number;
  name: string;
  location: string;
  starRating: number;
}

interface RoomType {
  id: number;
  name: string;
}

interface Booking {
  id: number;
  hotel: { name: string; location: string; id: number };
  roomType: { name: string; id: number };
  checkInDate: string;
  checkOutDate: string;
  user: { firstName: string; lastName: string; email: string };
  itinerary?: { id: number };
  status: string;
}

export default function ManageHotel() {
  const { hotelId: hotelIdString } = useParams();
  const hotelId = Number(hotelIdString);
  const { accessToken, userId } = useAuth();
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [showBookings, setShowBookings] = useState(false);
  const [loadingHotel, setLoadingHotel] = useState(true);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [cancelBookingId, setCancelBookingId] = useState<number | null>(null);
  const [filters, setFilters] = useState({
    checkInDate: '',
    checkOutDate: '',
    roomTypeId: '',
  });
  const router = useRouter();

  useEffect(() => {
    if (!accessToken || !userId) {
      router.push('/login');
      return;
    }

    const fetchHotelAndRoomTypes = async () => {
      try {
        const hotelRes = await fetch(`/api/hotels/${hotelId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (hotelRes.ok) {
          const data = await hotelRes.json();
          setHotel(data);
        } else {
          throw new Error(await hotelRes.text());
        }

        const roomTypesRes = await fetch(`/api/hotels/${hotelId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (roomTypesRes.ok) {
          const hotelData = await roomTypesRes.json();
          setRoomTypes(hotelData.roomTypes || []);
        } else {
          throw new Error(await roomTypesRes.text());
        }
      } catch (error) {
        console.error('Error fetching hotel or room types:', error);
        alert('Failed to load hotel details');
      } finally {
        setLoadingHotel(false);
      }
    };

    fetchHotelAndRoomTypes();
  }, [accessToken, userId, hotelId, router]);

  const fetchBookings = async () => {
    if (!accessToken || !userId) return;

    setLoadingBookings(true);
    try {
      const res = await fetch(`/api/bookings/hotel-bookings?ownerId=${userId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const allBookings = await res.json();
        const hotelBookings = allBookings.filter((b: Booking) => b.hotel.id === hotelId);
        setBookings(hotelBookings);
        applyFilters(hotelBookings, filters); // Apply initial filters
      } else {
        throw new Error(await res.text());
      }
    } catch (error) {
      console.error(`Error fetching bookings for hotel ${hotelId}:`, error);
      alert('Failed to load bookings');
    } finally {
      setLoadingBookings(false);
    }
  };

  const toggleBookings = () => {
    if (!showBookings && bookings.length === 0) fetchBookings();
    setShowBookings(!showBookings);
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => {
      const newFilters = { ...prev, [name]: value };
      applyFilters(bookings, newFilters);
      return newFilters;
    });
  };

  const applyFilters = (bookingsToFilter: Booking[], currentFilters: typeof filters) => {
    let filtered = bookingsToFilter.filter(b => b.status === 'CONFIRMED');

    if (currentFilters.checkInDate) {
      const filterCheckIn = new Date(currentFilters.checkInDate);
      filtered = filtered.filter(b => new Date(b.checkInDate) >= filterCheckIn);
    }

    if (currentFilters.checkOutDate) {
      const filterCheckOut = new Date(currentFilters.checkOutDate);
      filtered = filtered.filter(b => new Date(b.checkOutDate) <= filterCheckOut);
    }

    if (currentFilters.roomTypeId) {
      const roomTypeIdNum = Number(currentFilters.roomTypeId);
      filtered = filtered.filter(b => b.roomType.id === roomTypeIdNum);
    }

    setFilteredBookings(filtered);
  };

  const handleCancelBooking = async (bookingId: number) => {
    if (!accessToken || !userId) {
      router.push('/login');
      return;
    }
    try {
      const res = await fetch(`/api/bookings/hotel-bookings/cancel?ownerId=${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ bookingId }),
      });
      if (res.ok) {
        const updatedBookings = bookings.filter((b) => b.id !== bookingId);
        setBookings(updatedBookings);
        applyFilters(updatedBookings, filters);
        alert('Booking cancelled successfully!');
      } else {
        throw new Error(await res.text());
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
      alert('Error cancelling booking');
    } finally {
      setCancelBookingId(null);
    }
  };

  if (loadingHotel) return <LoadingMessage message="Loading hotel details..." />;

  if (!hotel) return <p className="no-hotels-text">Hotel not found.</p>;

  return (
    <div className="manage-hotel-container">
      <div className="flex justify-between items-center mb-6">
        <h1 className="manage-hotel-title">Manage {hotel.name}</h1>
        <div className="flex gap-4">
          <Link href="/hotels/my-hotels" className="back-button">Back</Link>
        </div>
      </div>
      <div className="hotel-info bg-[var(--card-bg-light)] dark:bg-[var(--card-bg-dark)] p-4 rounded-lg shadow-md mb-6">
        <p className="hotel-detail">Location: {hotel.location}</p>
        <p className="hotel-detail">Stars: {hotel.starRating}</p>
      </div>
      <div className="manage-actions flex gap-4 mb-6">
        <button onClick={toggleBookings} className="action-button">
          {showBookings ? 'Hide Bookings' : 'Show Bookings'}
        </button>
        <Link href={`/hotels/${hotelId}/rooms`} className="action-button">View Rooms</Link>
      </div>
      {showBookings && (
        <div className="bookings-section">
          <div className="filters mb-6 flex flex-wrap gap-4">
            <input
              type="date"
              name="checkInDate"
              value={filters.checkInDate}
              onChange={handleFilterChange}
              className="form-input"
              placeholder="Check-In Date"
            />
            <input
              type="date"
              name="checkOutDate"
              value={filters.checkOutDate}
              onChange={handleFilterChange}
              className="form-input"
              placeholder="Check-Out Date"
            />
            <select
              name="roomTypeId"
              value={filters.roomTypeId}
              onChange={handleFilterChange}
              className="form-input"
            >
              <option value="">All Room Types</option>
              {roomTypes.map((rt) => (
                <option key={rt.id} value={rt.id}>{rt.name}</option>
              ))}
            </select>
          </div>
          {loadingBookings ? (
            <LoadingMessage message="Loading bookings..." />
          ) : filteredBookings.length === 0 ? (
            <p className="no-bookings-text text-center">No confirmed bookings match your filters.</p>
          ) : (
            <div className="rooms-grid">
              {filteredBookings.map((booking) => (
                <div key={booking.id} className="booking-item">
                  <p className="booking-detail">Guest: {booking.user.firstName} {booking.user.lastName} ({booking.user.email})</p>
                  <p className="booking-detail">Room: {booking.roomType.name}</p>
                  <p className="booking-detail">Check-In: {new Date(booking.checkInDate).toLocaleDateString()}</p>
                  <p className="booking-detail">Check-Out: {new Date(booking.checkOutDate).toLocaleDateString()}</p>
                  {booking.itinerary && <p className="booking-detail">Itinerary ID: {booking.itinerary.id}</p>}
                  <button
                    onClick={() => setCancelBookingId(booking.id)}
                    className="cancel-button"
                  >
                    Cancel
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {cancelBookingId && (
        <div className="confirmation-modal">
          <div className="modal-content">
            <p>Are you sure you want to cancel this booking?</p>
            <div className="modal-actions">
              <button
                onClick={() => handleCancelBooking(cancelBookingId)}
                className="confirm-button"
              >
                Yes
              </button>
              <button
                onClick={() => setCancelBookingId(null)}
                className="cancel-modal-button"
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}