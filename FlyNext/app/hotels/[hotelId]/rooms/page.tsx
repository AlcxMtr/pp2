'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import Link from 'next/link';
import LoadingMessage from '../../../components/LoadingMessage';
import { Input, Button } from '@heroui/react';
import { Slide } from 'react-slideshow-image';
import 'react-slideshow-image/dist/styles.css';
import { FiHome } from 'react-icons/fi';

interface Hotel {
  id: number;
  name: string;
  location: string;
  starRating: number;
  logo: string;
}

interface Room {
  roomTypeId: number;
  name: string;
  totalRooms: number;
  pricePerNight: number;
  amenities: { name: string }[];
  availableRooms: number;
  bookedRooms: number;
  images: string[];
}

const RoomCard: React.FC<{ room: Room; onEdit?: (room: Room) => void }> = ({ room, onEdit }) => {
  return (
    <div className="flex flex-col border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden shadow-sm bg-[var(--card-bg-light)] dark:bg-black h-full">
      <div className="h-48 bg-gray-100 relative overflow-hidden">
        {room.images && room.images.length > 0 ? (
          <Slide
            autoplay={false}
            arrows={true}
            indicators={true}
            cssClass="h-full w-full"
            transitionDuration={500}
          >
            {room.images.map((image, index) => (
              <div key={index} className="h-48 w-full">
                <img
                  src={image}
                  alt={`${room.name} ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </Slide>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <FiHome className="w-12 h-12" />
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col flex-grow">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-bold text-[var(--text-dark)] dark:text-[var(--text-light)] line-clamp-1">
              {room.name}
            </h3>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Price per night</p>
            <p className="text-xl font-bold text-[var(--text-dark)] dark:text-[var(--text-light)]">
              ${room.pricePerNight}
            </p>
          </div>
        </div>

        <div className="mt-3 flex-grow">
          <p className="text-sm text-[var(--text-dark)] dark:text-[var(--text-light)]">
            Num Rooms Available: {room.totalRooms}
          </p>
          <p className="text-sm text-[var(--text-dark)] dark:text-[var(--text-light)]">
            Num Booked Rooms: {room.bookedRooms}
          </p>
          <p className="text-sm text-[var(--text-dark)] dark:text-[var(--text-light)]">
            Num Empty Rooms: {room.availableRooms}
          </p>
          {room.amenities.length > 0 && (
            <div className="mt-2">
              <h4 className="text-sm font-medium text-[var(--text-dark)] dark:text-[var(--text-light)] mb-1">
                Amenities
              </h4>
              <div className="flex flex-wrap gap-2">
                {room.amenities.map((amenity, index) => (
                  <span
                    key={index}
                    className="text-xs bg-gray-100 dark:bg-gray-700 text-[var(--text-dark)] dark:text-[var(--text-light)] px-2 py-1 rounded-full"
                  >
                    {amenity.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {onEdit && (
          <button
            onClick={() => onEdit(room)}
            className="mt-4 w-full py-2 px-4 bg-black hover:bg-gray-700 text-white rounded-md transition duration-200"
          >
            Edit
          </button>
        )}
      </div>
    </div>
  );
};

export default function Rooms() {
  const { hotelId } = useParams();
  const { accessToken, userId, loading: authLoading } = useAuth();
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [showRoomFilters, setShowRoomFilters] = useState(false);
  const [form, setForm] = useState({
    totalRooms: '',
    pricePerNight: '',
  });
  const [filters, setFilters] = useState({
    checkInDate: '2000-01-01',
    checkOutDate: '2100-12-12',
  });
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  const fetchRooms = async () => {
    if (!filters.checkInDate || !filters.checkOutDate) {
      setRooms([]);
      return;
    }
    const headers = { Authorization: `Bearer ${accessToken}` };
    const queryParams = new URLSearchParams({
      ownerId: userId ? userId.toString() : '',
      startDate: filters.checkInDate,
      endDate: filters.checkOutDate,
    });
    const res = await fetch(`/api/rooms/room-availabilities?${queryParams}`, { headers });
    if (!res.ok) {
      console.error('Failed to fetch rooms:', await res.text());
      setRooms([]);
    } else {
      const data = await res.json();
      const hotelRooms = data.availability.filter((r: any) => r.hotelId === Number(hotelId));
      setRooms(
        hotelRooms.map((r: any) => ({
          roomTypeId: r.roomTypeId,
          name: r.name,
          totalRooms: r.totalRooms,
          pricePerNight: r.pricePerNight,
          amenities: r.amenities,
          availableRooms: r.availableRooms,
          bookedRooms: r.bookedRooms,
          images: r.images,
        }))
      );
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!accessToken || !userId) {
      router.push('/login');
      return;
    }

    const fetchHotelAndRooms = async () => {
      try {
        const hotelRes = await fetch(`/api/hotels/${hotelId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (hotelRes.ok) {
          const hotelData = await hotelRes.json();
          setHotel({
            id: hotelData.id,
            name: hotelData.name,
            location: hotelData.location,
            starRating: hotelData.starRating,
            logo: hotelData.logo,
          });
        } else {
          throw new Error(await hotelRes.text());
        }

        await fetchRooms();
      } catch (error) {
        console.error('Error fetching data:', error);
        alert('Failed to load hotel or rooms');
      } finally {
        setLoading(false);
      }
    };
    fetchHotelAndRooms();
  }, [hotelId, authLoading, filters.checkInDate, filters.checkOutDate, router]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const startEditing = (room: Room) => {
    setEditingRoom(room);
    setForm({
      totalRooms: room.totalRooms.toString(),
      pricePerNight: room.pricePerNight.toString(),
    });
  };

  const toggleBookings = () => {
    setShowRoomFilters(!showRoomFilters);
  };

  const handleUpdate = async () => {
    if (!accessToken || !userId || !editingRoom) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/rooms/room-availabilities/update-availabilities?ownerId=${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          roomTypeId: editingRoom.roomTypeId,
          newTotalRooms: Number(form.totalRooms) || 0,
        }),
      });
      if (!res.ok) throw new Error(await res.text());

      // Refetch rooms to get updated bookedRooms and availableRooms
      await fetchRooms();
      setEditingRoom(null);
    } catch (error) {
      console.error('Error updating room:', error);
      alert('Error updating room');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingMessage message="Loading rooms..." />;
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
                  <br />
                  <p className="text-lg text-gray-600 dark:text-gray-300 mt-1">
                    {hotel.location}
                  </p>
                </div>
              </div>
            </div>
            <Link
              href={`/hotels/${hotelId}/manage`}
              className="back-button bg-[var(--deep-purple)] text-white px-4 py-2 rounded-lg hover:bg-[var(--lavender)] dark:hover:text-[var(--text-dark)]"
            >
              Back
            </Link>
          </div>
        </div>

        <div className="manage-actions flex flex-wrap items-center justify-center gap-4 mb-6">
          <Button
            onClick={toggleBookings}
            className="action-button bg-[var(--lavender)] text-[var(--deep-purple)] hover:bg-[var(--light-green)] dark:bg-gray-600 dark:text-[var(--text-light)] dark:hover:bg-gray-500"
          >
            {showRoomFilters ? "Hide Filters" : "Filter by Date"}
          </Button>
          <Link
            href={`/hotels/${hotelId}/room-types`}
            className="action-button bg-[var(--lavender)] text-[var(--deep-purple)] hover:bg-[var(--light-green)] dark:bg-gray-600 dark:text-[var(--text-light)] dark:hover:bg-gray-500 inline-block px-4 py-2 rounded-lg z-0 group relative inline-flex items-center justify-center box-border appearance-none select-none whitespace-nowrap font-normal subpixel-antialiased overflow-hidden tap-highlight-transparent data-[pressed=true]:scale-[0.97] outline-none data-[focus-visible=true]:z-10 data-[focus-visible=true]:outline-2 data-[focus-visible=true]:outline-focus data-[focus-visible=true]:outline-offset-2 px-4 min-w-20 h-10 text-small gap-2 rounded-medium [&>svg]:max-w-[theme(spacing.8)] transition-transform-colors-opacity motion-reduce:transition-none data-[hover=true]:opacity-hover action-button bg-[var(--lavender)] text-[var(--deep-purple)] hover:bg-[var(--light-green)] dark:bg-gray-600 dark:text-[var(--text-light)] dark:hover:bg-gray-500"
          >
            Add Room Type
          </Link>
        </div>

        <div className="bookings-section">
            <div>
              {showRoomFilters && (
                <div className="filters mb-6 flex gap-4 flex-wrap">
                <Input
                  type="date"
                  label="Check-In Date"
                  labelPlacement="outside"
                  value={filters.checkInDate}
                  onChange={handleFilterChange}
                  name="checkInDate"
                  className="w-48"
                />
                <Input
                  type="date"
                  label="Check-Out Date"
                  labelPlacement="outside"
                  value={filters.checkOutDate}
                  onChange={handleFilterChange}
                  name="checkOutDate"
                  className="w-48"
                />
                </div>
              )}
              <div className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-6">
                {rooms.length === 0 ? (
                  <p className="no-rooms-text text-center text-[var(--text-dark)] dark:text-[var(--lavender)]">
                    {filters.checkInDate && filters.checkOutDate
                      ? 'No rooms available for the selected date range.'
                      : 'Please select a date range to view availability.'}
                  </p>
                ) : (
                  rooms.map((room) => (
                    <RoomCard
                      key={room.roomTypeId}
                      room={room}
                      onEdit={accessToken ? startEditing : undefined}
                    />
                  ))
                )}
              </div>
            </div>
        </div>

        {editingRoom && (
          <div className="confirmation-modal fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="modal-content bg-[var(--card-bg-light)] dark:bg-black p-6 rounded-lg shadow-lg">
              <h2 className="text-xl font-bold text-[var(--text-dark)] dark:text-[var(--lavender)] mb-4">
                Edit {editingRoom.name}
              </h2>
              <div className="space-y-4">
                <Input
                  type="number"
                  label="Total Rooms"
                  value={form.totalRooms}
                  onChange={(e) => setForm({ ...form, totalRooms: e.target.value })}
                  min="0"
                  className="w-full"
                />
                <Input
                  type="number"
                  label="Price per Night"
                  value={form.pricePerNight}
                  onChange={(e) => setForm({ ...form, pricePerNight: e.target.value })}
                  min="0.01"
                  step="0.01"
                  className="w-full"
                />
                <div className="flex gap-4 mt-4 justify-center">
                  <Button
                    onClick={handleUpdate}
                    disabled={submitting}
                    className="bg-black text-white hover:bg-gray-700 dark:hover:text-[var(--text-dark)] px-4 py-2 rounded-lg"
                  >
                    {submitting ? 'Updating...' : 'Update'}
                  </Button>
                  <Button
                    onClick={() => setEditingRoom(null)}
                    className="bg-gray-300 text-black hover:bg-gray-400 dark:bg-gray-600 dark:text-white dark:hover:bg-gray-500 px-4 py-2 rounded-lg"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}