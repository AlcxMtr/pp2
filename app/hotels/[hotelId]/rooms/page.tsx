'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import RoomCard from '../../../components/RoomCard';

export default function Rooms() {
  const { hotelId } = useParams();
  const { accessToken } = useAuth(); // Optional auth
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRooms = async () => {
      const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
      const res = await fetch(`/api/hotels/${hotelId}?checkInDate=2025-04-01&checkOutDate=2025-04-05`, { headers });
      const data = await res.json();
      setRooms(data.roomTypes || []);
      setLoading(false);
    };
    fetchRooms();
  }, [hotelId, accessToken]);

  if (loading) return <p className="loading-text">Loading...</p>;

  return (
    <div className="rooms-container">
      <h1 className="rooms-title">Available Rooms</h1>
      <div className="rooms-grid">
        {rooms.map((room) => (
          <RoomCard key={room.id} room={room} />
        ))}
      </div>
    </div>
  );
}