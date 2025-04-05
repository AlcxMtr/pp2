'use client';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function CancelBooking() {
  const { hotelId } = useParams();
  const { accessToken, userId } = useAuth();
  const [bookingId, setBookingId] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleCancel = async () => {
    if (!accessToken || !userId) {
      router.push('/login');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/bookings/hotel-bookings/cancel?ownerId=${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ bookingId }),
      });
      if (res.ok) alert('Booking cancelled!');
      else throw new Error(await res.text());
    } catch (error) {
      alert('Error cancelling booking');
    }
    setLoading(false);
  };

  return (
    <div className="cancel-booking-container">
      <h1 className="cancel-booking-title">Cancel Booking</h1>
      <div className="cancel-booking-form">
        <input
          type="text"
          placeholder="Booking ID"
          value={bookingId}
          onChange={(e) => setBookingId(e.target.value)}
          className="form-input"
        />
        <button onClick={handleCancel} disabled={loading} className="submit-button">
          {loading ? 'Cancelling...' : 'Cancel Booking'}
        </button>
      </div>
    </div>
  );
}