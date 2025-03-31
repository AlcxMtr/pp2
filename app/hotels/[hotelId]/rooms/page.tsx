'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import RoomCard from '../../../components/RoomCard';
import Link from 'next/link';
import LoadingMessage from '../../../components/LoadingMessage';

interface Room {
  id: number;
  name: string;
  totalRooms?: number;
  pricePerNight: number;
  amenities: { name: string }[];
  availableRooms?: number;
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
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchRooms = async () => {
      const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
      const res = await fetch(`/api/hotels/${hotelId}?checkInDate=2025-04-01&checkOutDate=2025-04-05`, { headers });
      if (!res.ok) {
        console.error('Failed to fetch rooms:', await res.text());
        setRooms([]);
      } else {
        const data = await res.json();
        setRooms(data.roomTypes || []);
      }
      setLoading(false);
    };
    fetchRooms();
  }, [hotelId, accessToken]);

  const startEditing = (room: Room) => {
    console.log('Editing room:', room); // Debug log
    setEditingRoom(room);
    setForm({
      totalRooms: room.totalRooms !== undefined ? room.totalRooms.toString() : '',
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
          roomTypeId: editingRoom.id,
          newTotalRooms: Number(form.totalRooms) || 0,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      setRooms(rooms.map(r =>
        r.id === editingRoom.id
          ? { ...r, totalRooms: Number(form.totalRooms) || 0, pricePerNight: Number(form.pricePerNight) }
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
      <div className="rooms-grid">
        {rooms.map((room) => (
          <RoomCard key={room.id} room={room} onEdit={accessToken ? startEditing : undefined} />
        ))}
      </div>
      {editingRoom && (
        <div className="edit-room-modal">
          <div className="modal-content">
            <h2 className="edit-room-title">Edit {editingRoom.name}</h2>
            <div className="edit-room-form">
              <input
                type="number"
                placeholder="Total Rooms"
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