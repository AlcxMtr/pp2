'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import Link from 'next/link';

interface RoomType {
  roomTypeId: number;
  name: string;
  totalRooms: number;
  hotelId: number;
}

export default function UpdateAvailability() {
  const { hotelId: hotelIdString } = useParams();
  const hotelId = Number(hotelIdString);
  const { accessToken, userId } = useAuth();
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [form, setForm] = useState({
    roomTypeId: '',
    newTotalRooms: '',
    checkInDate: '',
    checkOutDate: '',
    useDateRange: false,
  });
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
          const hotelRoomTypes = data.availability.filter((rt: RoomType) => rt.hotelId === hotelId);
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

  const handleUpdate = async () => {
    if (!accessToken || !userId) {
      router.push('/login');
      return;
    }
    if (!form.roomTypeId || !form.newTotalRooms) {
      alert('Please select a room type and provide a new total number of rooms');
      return;
    }
    if (form.useDateRange && (!form.checkInDate || !form.checkOutDate)) {
      alert('Please provide both check-in and check-out dates when using a date range for cancellations');
      return;
    }
    setSubmitting(true);
    try {
      const url = form.useDateRange
        ? `/api/rooms/room-availabilities/update-availabilities?ownerId=${userId}&startDate=${form.checkInDate}&endDate=${form.checkOutDate}`
        : `/api/rooms/room-availabilities/update-availabilities?ownerId=${userId}`;
      const res = await fetch(url, {
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
        router.push(`/hotels/${hotelId}/manage`);
      } else {
        throw new Error(await res.text());
      }
    } catch (error) {
      console.error('Error updating availability:', error);
      alert('Error updating availability');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingRooms) return <p className="loading-text">Loading room types...</p>;

  return (
    <div className="update-availability-container">
      <div className="flex justify-between items-center mb-4">
        <h1 className="update-availability-title">Update Room Availability</h1>
        <Link href={`/hotels/${hotelId}/manage`} className="back-button">
          Back
        </Link>
      </div>
      <div className="update-availability-form">
        <p className="text-[var(--text-dark)] mb-2">
          Update the total number of rooms for a room type. This is a permanent change.
        </p>
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
          placeholder="New Total Rooms"
          value={form.newTotalRooms}
          onChange={(e) => setForm({ ...form, newTotalRooms: e.target.value })}
          className="form-input"
          min="0"
        />
        <label className="text-[var(--text-dark)] mt-2">
          <input
            type="checkbox"
            checked={form.useDateRange}
            onChange={(e) => setForm({ ...form, useDateRange: e.target.checked })}
            className="mr-2"
          />
          Limit cancellations to a date range (optional)
        </label>
        {form.useDateRange && (
          <>
            <input
              type="date"
              value={form.checkInDate}
              onChange={(e) => setForm({ ...form, checkInDate: e.target.value })}
              className="form-input"
              placeholder="Check-in Date"
            />
            <input
              type="date"
              value={form.checkOutDate}
              onChange={(e) => setForm({ ...form, checkOutDate: e.target.value })}
              className="form-input"
              placeholder="Check-out Date"
            />
          </>
        )}
        <button onClick={handleUpdate} disabled={submitting} className="submit-button">
          {submitting ? 'Updating...' : 'Update Total Rooms'}
        </button>
      </div>
    </div>
  );
}