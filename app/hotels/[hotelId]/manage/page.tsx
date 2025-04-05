'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import Link from 'next/link';
import LoadingMessage from '../../../components/LoadingMessage';
import { Input, Button, Select, SelectItem } from '@heroui/react';

interface Hotel {
  id: number;
  name: string;
  location: string;
  starRating: number;
  logo: string;
  images: string[] | { url: string }[];
}

type RoomType = {
  id: string | number; // Ensure `id` is a string or number
  name: string;
};

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
  const [showFilters, setShowFilters] = useState(false);
  const [loadingHotel, setLoadingHotel] = useState(true);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [cancelBookingId, setCancelBookingId] = useState<number | null>(null);
  const [filters, setFilters] = useState({
    checkInDate: '',
    checkOutDate: '',
    roomTypeId: '',
  });
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isSlideshowPlaying, setIsSlideshowPlaying] = useState(true);
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
          const normalizedImages = Array.isArray(data.images)
            ? data.images.map((img: any) => (typeof img === 'string' ? img : img.url))
            : [];
          setHotel({ ...data, images: normalizedImages });
          setRoomTypes(data.roomTypes || []);
        } else {
          throw new Error(await hotelRes.text());
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

  useEffect(() => {
    if (!hotel || hotel.images.length <= 1 || !isSlideshowPlaying) return;

    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % hotel.images.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [hotel, isSlideshowPlaying]);

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
        applyFilters(hotelBookings, filters);
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
    if (!showBookings) setShowFilters(false);
  };

  const toggleFilters = () => setShowFilters(!showFilters);

  const handleFilterChange = (name: string, value: string) => {
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

  const nextImage = () => {
    if (hotel && hotel.images.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % hotel.images.length);
    }
  };

  const prevImage = () => {
    if (hotel && hotel.images.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + hotel.images.length) % hotel.images.length);
    }
  };

  const toggleSlideshow = () => setIsSlideshowPlaying(!isSlideshowPlaying);

  if (loadingHotel) return <LoadingMessage message="Loading hotel details..." />;
  if (!hotel) return <p className="no-hotels-text text-[var(--text-dark)] dark:text-[var(--lavender)]">Hotel not found.</p>;

  return (
    <div className="flex flex-col items-center min-h-screen pt-10 pb-20 bg-[var(--gray-bg-light)] dark:bg-[var(--gray-bg-dark)]">
      <div className="w-full px-6">
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              {hotel.logo && (
                <img
                  src={hotel.logo}
                  alt={`${hotel.name} logo`}
                  className="w-12 h-12 rounded-full object-cover border-2 border-gray-300 dark:border-gray-600"
                />
              )}
              <div>
                <h1 className="text-3xl font-bold text-[var(--text-dark)] dark:text-[var(--lavender)]">
                  Manage {hotel.name}
                </h1>
                <div className="flex gap-1 text-yellow-500 dark:text-yellow-300 text-2xl">
                  {Array.from({ length: hotel.starRating }, (_, i) => (
                    <span key={i}>★</span>
                  ))}
                  <br></br>
                  <p className="text-lg text-gray-600 dark:text-gray-300 mt-1">
                    {hotel.location}
                  </p>
                </div>
              </div>
            </div>
            <Link
              href="/hotels/my-hotels"
              className="back-button bg-[var(--deep-purple)] text-white px-4 py-2 rounded-lg hover:bg-[var(--lavender)] dark:hover:text-[var(--text-dark)]"
            >
              Back
            </Link>
          </div>
        </div>

        <div className="hotel-info bg-[var(--card-bg-light)] dark:bg-black p-6 rounded-lg shadow-md mb-6">
          {hotel.images.length > 0 && (
            <div className="mt-4">
              <div className="relative w-full max-w-lg mx-auto">
              <img
                src={typeof hotel.images[currentImageIndex] === 'string' 
                  ? hotel.images[currentImageIndex] 
                  : hotel.images[currentImageIndex]?.url}
                alt={`${hotel.name} image ${currentImageIndex + 1}`}
                className="w-full h-64 object-cover rounded-lg"
              />
                {hotel.images.length > 1 && (
                  <>
                    <Button
                      onClick={prevImage}
                      className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white hover:bg-opacity-75 rounded-full p-2"
                    >
                      ←
                    </Button>
                    <Button
                      onClick={nextImage}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white hover:bg-opacity-75 rounded-full p-2"
                    >
                      →
                    </Button>
                    <div className="flex justify-center gap-2 mt-2">
                      <div className="flex gap-1">
                        {hotel.images.map((_, index) => (
                          <span
                            key={index}
                            className={`w-2 h-2 rounded-full ${
                              index === currentImageIndex ? 'bg-[var(--deep-purple)] dark:bg-[var(--lavender)]' : 'bg-gray-300 dark:bg-gray-600'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="manage-actions flex flex-wrap items-center justify-center gap-4 mb-6">
          <Button
            onClick={toggleBookings}
            className="action-button bg-[var(--lavender)] text-[var(--deep-purple)] hover:bg-[var(--light-green)] dark:bg-gray-600 dark:text-[var(--text-light)] dark:hover:bg-gray-500"
          >
            {showBookings ? 'Hide Bookings' : 'Show Bookings'}
          </Button>
          <Link
            href={`/hotels/${hotelId}/rooms`}
            className="action-button bg-[var(--lavender)] text-[var(--deep-purple)] hover:bg-[var(--light-green)] dark:bg-gray-600 dark:text-[var(--text-light)] dark:hover:bg-gray-500 inline-block px-4 py-2 rounded-lg z-0 group relative inline-flex items-center justify-center box-border appearance-none select-none whitespace-nowrap font-normal subpixel-antialiased overflow-hidden tap-highlight-transparent data-[pressed=true]:scale-[0.97] outline-none data-[focus-visible=true]:z-10 data-[focus-visible=true]:outline-2 data-[focus-visible=true]:outline-focus data-[focus-visible=true]:outline-offset-2 px-4 min-w-20 h-10 text-small gap-2 rounded-medium [&>svg]:max-w-[theme(spacing.8)] transition-transform-colors-opacity motion-reduce:transition-none data-[hover=true]:opacity-hover action-button bg-[var(--lavender)] text-[var(--deep-purple)] hover:bg-[var(--light-green)] dark:bg-gray-600 dark:text-[var(--text-light)] dark:hover:bg-gray-500"
          >
            View Rooms
          </Link>
        </div>

        {showBookings && (
          <div className="bookings-section">
            <Button
              onClick={toggleFilters}
              className="mb-4 bg-black text-white hover:bg-gray-700 dark:bg-white dark:text-black"
            >
              {showFilters ? 'Hide Filters' : 'Filter'}
            </Button>
            {showFilters && (
              <div className="filters mb-6 flex gap-4 flex-wrap">
                <Input
                  type="date"
                  label="Check-In Date"
                  labelPlacement="outside"
                  value={filters.checkInDate}
                  onChange={(e) => handleFilterChange('checkInDate', e.target.value)}
                  className="w-48"
                />
                <Input
                  type="date"
                  label="Check-Out Date"
                  labelPlacement="outside"
                  value={filters.checkOutDate}
                  onChange={(e) => handleFilterChange('checkOutDate', e.target.value)}
                  className="w-48"
                />
                <Select
                  label="Room Type"
                  labelPlacement="outside"
                  value={filters.roomTypeId}
                  onChange={(e) => handleFilterChange('roomTypeId', e.target.value)}
                  className="w-48"
                >
                  <SelectItem key="" id="">All Room Types</SelectItem>
                    <>
                      {roomTypes.map((rt: RoomType) => (
                        <SelectItem key={rt.id} id={rt.id.toString()}>{rt.name}</SelectItem>
                      ))}
                    </>
                </Select>
              </div>
            )}
            {loadingBookings ? (
              <LoadingMessage message="Loading bookings..." />
            ) : filteredBookings.length === 0 ? (
              <p className="no-bookings-text text-center text-[var(--text-dark)] dark:text-[var(--lavender)]">
                No confirmed bookings match your filters.
              </p>
            ) : (
              <div className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-6">
                {filteredBookings.map((booking) => (
                  <div key={booking.id} className="booking-item bg-[var(--card-bg-light)] dark:bg-black p-4 rounded-lg shadow-md">
                    <p className="booking-detail text-[var(--text-dark)] dark:text-[var(--text-light)]">
                      Guest: {booking.user.firstName} {booking.user.lastName} ({booking.user.email})
                    </p>
                    <p className="booking-detail text-[var(--text-dark)] dark:text-[var(--text-light)]">
                      Room: {booking.roomType.name}
                    </p>
                    <p className="booking-detail text-[var(--text-dark)] dark:text-[var(--text-dark)]">
                      Check-In: {new Date(booking.checkInDate).toLocaleDateString()}
                    </p>
                    <p className="booking-detail text-[var(--text-dark)] dark:text-[var(--text-light)]">
                      Check-Out: {new Date(booking.checkOutDate).toLocaleDateString()}
                    </p>
                    {booking.itinerary && (
                      <p className="booking-detail text-[var(--text-dark)] dark:text-[var(--text-light)]">
                        Itinerary ID: {booking.itinerary.id}
                      </p>
                    )}
                    <Button
                      onClick={() => setCancelBookingId(booking.id)}
                      className="cancel-button bg-red-500 text-white hover:bg-red-600 mt-2"
                    >
                      Cancel
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {cancelBookingId && (
          <div className="confirmation-modal fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="modal-content bg-[var(--card-bg-light)] dark:bg-black p-6 rounded-lg shadow-lg">
              <p className="text-[var(--text-dark)] dark:text-[var(--text-light)]">
                Are you sure you want to cancel this booking?
              </p>
              <div className="modal-actions flex gap-4 mt-4 justify-center">
                <Button
                  onClick={() => handleCancelBooking(cancelBookingId)}
                  className="confirm-button bg-red-500 text-white hover:bg-red-600"
                >
                  Yes
                </Button>
                <Button
                  onClick={() => setCancelBookingId(null)}
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