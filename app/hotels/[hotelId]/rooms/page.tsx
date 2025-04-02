'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import RoomCard from '../../../components/RoomCard';
import Link from 'next/link';
import LoadingMessage from '../../../components/LoadingMessage';

interface Room {
  roomTypeId: number;
  name: string;
  totalRooms: number;
  pricePerNight: number;
  amenities: { name: string }[];
  availableRooms: number;
}

export default function Rooms() {
  const { hotelId } = useParams();
  const { accessToken, userId } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [form, setForm] = useState({
    totalRooms: '',
    pricePerNight: '',
  });
  const [filters, setFilters] = useState({
    checkInDate: '', // No default, require user input
    checkOutDate: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!accessToken || !userId) {
      router.push('/login');
      return;
    }

    const fetchRooms = async () => {
      if (!filters.checkInDate || !filters.checkOutDate) {
        setRooms([]);
        setLoading(false);
        return;
      }

      const headers = { Authorization: `Bearer ${accessToken}` };
      const queryParams = new URLSearchParams({
        ownerId: userId.toString(),
        startDate: filters.checkInDate,
        endDate: filters.checkOutDate,
      });
      const res = await fetch(`/api/rooms/room-availabilities?${queryParams}`, { headers });
      if (!res.ok) {
        console.error('Failed to fetch rooms:', await res.text());
        setRooms([]);
      } else {
        const data = await res.json();
        const hotelRooms = data.availability.filter((r: Room) => r.hotelId === Number(hotelId));
        setRooms(
          hotelRooms.map((r: any) => ({
            roomTypeId: r.roomTypeId,
            name: r.name,
            totalRooms: r.totalRooms,
            pricePerNight: r.pricePerNight || 0, // Assume backend needs to provide this or adjust
            amenities: r.amenities || [],
            availableRooms: r.availableRooms,
          }))
        );
      }
      setLoading(false);
    };
    fetchRooms();
  }, [hotelId, accessToken, userId, filters.checkInDate, filters.checkOutDate, router]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const startEditing = (room: Room) => {
    console.log('Editing room:', room);
    setEditingRoom(room);
    setForm({
      totalRooms: room.totalRooms.toString(),
      pricePerNight: room.pricePerNight.toString(),
    });
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
      setRooms(rooms.map(r =>
        r.roomTypeId === editingRoom.roomTypeId
          ? { ...r, totalRooms: Number(form.totalRooms), pricePerNight: Number(form.pricePerNight) }
          : r
      ));
      setEditingRoom(null);
    } catch (error) {
      console.error('Error updating room:', error);
      alert('Error updating room');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingMessage message="Loading rooms..." />;

  return (
    <div className="rooms-container">
      <div className="flex justify-between items-center mb-4">
        <h1 className="rooms-title">Available Rooms</h1>
        <div className="flex gap-4">
          {accessToken && (
            <Link href={`/hotels/${hotelId}/room-types`} className="action-button">
              Add Room Type
            </Link>
          )}
          <Link href={`/hotels/${hotelId}/manage`} className="back-button">
            Back
          </Link>
        </div>
      </div>
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
      </div>
      <div className="rooms-grid">
        {rooms.length === 0 ? (
          <p className="no-rooms-text text-center">
            {filters.checkInDate && filters.checkOutDate
              ? 'No rooms available for the selected date range.'
              : 'Please select a date range to view availability.'}
          </p>
        ) : (
          rooms.map((room) => (
            <RoomCard key={room.roomTypeId} room={room} onEdit={accessToken ? startEditing : undefined} />
          ))
        )}
      </div>
      {editingRoom && (
        <div className="edit-room-modal">
          <div className="modal-content">
            <h2 className="edit-room-title">Edit {editingRoom.name}</h2>
            <div className="edit-room-form">
              <input
                type="number"
                placeholder="Total Rooms of Type"
                value={form.totalRooms}
                onChange={(e) => setForm({ ...form, totalRooms: e.target.value })}
                className="form-input"
                min="0"
              />
              <input
                type="number"
                placeholder="Price per Night"
                value={form.pricePerNight}
                onChange={(e) => setForm({ ...form, pricePerNight: e.target.value })}
                className="form-input"
                min="0.01"
                step="0.01"
              />
              <div className="modal-actions">
                <button onClick={handleUpdate} disabled={submitting} className="submit-button">
                  {submitting ? 'Updating...' : 'Update'}
                </button>
                <button onClick={() => setEditingRoom(null)} className="cancel-modal-button">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}