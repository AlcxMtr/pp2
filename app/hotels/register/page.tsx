'use client';
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function RegisterHotel() {
  const { accessToken, userId } = useAuth();
  const [form, setForm] = useState({ name: '', address: '', location: '', starRating: '', logo: '', images: [] }); // Changed starRating to ''
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !userId) {
      alert('Please log in first');
      router.push('/login');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/hotels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ ...form, starRating: Number(form.starRating), ownerId: userId }), // Convert to number for API
      });
      if (res.ok) {
        alert('Hotel registered!');
        router.push('/');
      } else {
        const data = await res.json();
        alert(data.error || 'Error registering hotel');
      }
    } catch (error) {
      alert('Error registering hotel');
    }
    setLoading(false);
  };

  return (
    <div className="register-hotel-container">
      <h1 className="register-hotel-title">Register Hotel</h1>
      <form onSubmit={handleSubmit} className="register-hotel-form">
        <input
          type="text"
          placeholder="Hotel Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="form-input"
        />
        <input
          type="text"
          placeholder="Address"
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
          className="form-input"
        />
        <input
          type="text"
          placeholder="Location (City)"
          value={form.location}
          onChange={(e) => setForm({ ...form, location: e.target.value })}
          className="form-input"
        />
        <input
          type="number"
          placeholder="Star Rating (1-5)"
          value={form.starRating}
          onChange={(e) => setForm({ ...form, starRating: e.target.value })}
          className="form-input"
        />
        <input
          type="text"
          placeholder="Logo URL"
          value={form.logo}
          onChange={(e) => setForm({ ...form, logo: e.target.value })}
          className="form-input"
        />
        <button type="submit" disabled={loading} className="submit-button">
          {loading ? 'Registering...' : 'Register Hotel'}
        </button>
      </form>
    </div>
  );
}