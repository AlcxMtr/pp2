'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { useRouter } from 'next/navigation';

interface RoomType {
  roomTypeId: number;
  name: string;
  totalRooms: number;
  hotelId: number;
}

export default function AddRoomAvailability() {
  const { hotelId: hotelIdString } = useParams();
  const hotelId = Number(hotelIdString);
  const { accessToken, userId } = useAuth();
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [form, setForm] = useState({ roomTypeId: '', newTotalRooms: '' });
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!accessToken || !userId) {
      router.push('/login');
      return;
    }
    const fetchRoomTypes = async () => {
      try {
        const res = await fetch(`/api/rooms/room-availabilities?ownerId=${userId}&startDate=2000-01-01&endDate=2100-12-31`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (res.ok) {
          const data = await res.json();
          console.log('API Response:', data); // Debug: Log the full response
          const hotelRoomTypes = data.availability.filter((rt: RoomType) => rt.hotelId === hotelId);
          console.log('Filtered Room Types:', hotelRoomTypes); // Debug: Log filtered results
          setRoomTypes(hotelRoomTypes);
        } else {
          throw new Error(await res.text());
        }
      } catch (error) {
        console.error('Error fetching room types:', error);
        alert('Failed to load room types');
      } finally {
        setLoadingRooms(false);
      }
    };
    fetchRoomTypes();
  }, [accessToken, userId, hotelId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !userId) {
      router.push('/login');
      return;
    }
    if (!form.roomTypeId || !form.newTotalRooms) {
      alert('Please select a room type and enter a number of rooms');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/rooms/room-availabilities/update-availabilities?ownerId=${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          roomTypeId: Number(form.roomTypeId),
          newTotalRooms: Number(form.newTotalRooms),
        }),
      });
      if (res.ok) {
        alert('Availability added/updated!');
        router.push(`/hotels/${hotelId}/rooms`);
      } else {
        throw new Error(await res.text());
      }
    } catch (error) {
      console.error('Error adding availability:', error);
      alert('Error adding availability');
    }
    setSubmitting(false);
  };

  if (loadingRooms) return <p className="loading-text">Loading room types...</p>;

  return (
    <div className="update-availability-container">
      <h1 className="update-availability-title">Add Room Availability</h1>
      <form onSubmit={handleSubmit} className="update-availability-form">
        <select
          value={form.roomTypeId}
          onChange={(e) => setForm({ ...form, roomTypeId: e.target.value })}
          className="form-input"
          disabled={roomTypes.length === 0}
        >
          <option value="">Select a Room Type</option>
          {roomTypes.length === 0 ? (
            <option value="">No room types available</option>
          ) : (
            roomTypes.map((room) => (
              <option key={room.roomTypeId} value={room.roomTypeId}>
                {room.name} (Current: {room.totalRooms} rooms)
              </option>
            ))
          )}
        </select>
        <input
          type="number"
          placeholder="Total Rooms Available"
          value={form.newTotalRooms}
          onChange={(e) => setForm({ ...form, newTotalRooms: e.target.value })}
          className="form-input"
          min="0"
        />
        <button type="submit" disabled={submitting} className="submit-button">
          {submitting ? 'Adding...' : 'Add Availability'}
        </button>
      </form>
    </div>
  );
}