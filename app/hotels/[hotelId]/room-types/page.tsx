'use client';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function AddRoomType() {
  const { hotelId: hotelIdString } = useParams(); // Renamed to clarify it's a string
  const hotelId = Number(hotelIdString); // Convert to number
  const { accessToken, userId } = useAuth();
  const [form, setForm] = useState({ name: '', totalRooms: '', pricePerNight: '', amenities: [], images: [] });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !userId) {
      router.push('/login');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/rooms/room-types', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          ...form,
          totalRooms: Number(form.totalRooms),
          pricePerNight: Number(form.pricePerNight),
          hotelId, // Already a number
        }),
      });
      if (res.ok) {
        alert('Room type added!');
        router.push(`/hotels/${hotelId}/rooms`); // Redirect to view rooms after success
      } else {
        throw new Error(await res.text());
      }
    } catch (error) {
      console.error('Error adding room type:', error);
      alert('Error adding room type');
    }
    setLoading(false);
  };

  return (
    <div className="room-type-container">
      <h1 className="room-type-title">Add Room Type</h1>
      <form onSubmit={handleSubmit} className="room-type-form">
        <input
          type="text"
          placeholder="Room Type Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="form-input"
        />
        <input
          type="number"
          placeholder="Total Rooms"
          value={form.totalRooms}
          onChange={(e) => setForm({ ...form, totalRooms: e.target.value })}
          className="form-input"
        />
        <input
          type="number"
          placeholder="Price per Night"
          value={form.pricePerNight}
          onChange={(e) => setForm({ ...form, pricePerNight: e.target.value })}
          className="form-input"
        />
        <button type="submit" disabled={loading} className="submit-button">
          {loading ? 'Adding...' : 'Add Room Type'}
        </button>
      </form>
    </div>
  );
}