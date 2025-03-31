'use client';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import Link from 'next/link';

export default function AddRoomType() {
  const { hotelId: hotelIdString } = useParams();
  const hotelId = Number(hotelIdString);
  const { accessToken, userId } = useAuth();
  const [form, setForm] = useState({
    name: '',
    totalRooms: '',
    pricePerNight: '',
    amenities: [] as string[],
    images: [] as { url: string }[],
  });
  const [amenityInput, setAmenityInput] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !userId) {
      router.push('/login');
      return;
    }
    if (!form.name || !form.totalRooms || !form.pricePerNight) {
      alert('Please fill in all required fields: Name, Total Rooms, and Price per Night');
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
          name: form.name,
          totalRooms: Number(form.totalRooms),
          pricePerNight: Number(form.pricePerNight),
          hotelId,
          amenities: form.amenities.map((name) => ({ name })),
          images: form.images,
        }),
      });
      if (res.ok) {
        router.push(`/hotels/${hotelId}/manage`);
      } else {
        throw new Error(await res.text());
      }
    } catch (error) {
      console.error('Error adding room type:', error);
      alert('Error adding room type');
    } finally {
      setLoading(false);
    }
  };

  const addAmenity = () => {
    if (amenityInput.trim() && !form.amenities.includes(amenityInput.trim())) {
      setForm({ ...form, amenities: [...form.amenities, amenityInput.trim()] });
      setAmenityInput('');
    }
  };

  const removeAmenity = (index: number) => {
    setForm({
      ...form,
      amenities: form.amenities.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="room-type-container">
      <div className="flex justify-between items-center mb-4">
        <h1 className="room-type-title">Add Room Type</h1>
        <Link href={`/hotels/${hotelId}/manage`} className="back-button">
          Back
        </Link>
      </div>
      <form onSubmit={handleSubmit} className="room-type-form">
        <input
          type="text"
          placeholder="Room Type Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="form-input"
          required
        />
        <input
          type="number"
          placeholder="Total Rooms"
          value={form.totalRooms}
          onChange={(e) => setForm({ ...form, totalRooms: e.target.value })}
          className="form-input"
          min="1"
          required
        />
        <input
          type="number"
          placeholder="Price per Night"
          value={form.pricePerNight}
          onChange={(e) => setForm({ ...form, pricePerNight: e.target.value })}
          className="form-input"
          min="0.01"
          step="0.01"
          required
        />
        <div className="amenities-section">
          <label className="amenities-label">Amenities (Optional)</label>
          <div className="amenity-input-group">
            <input
              type="text"
              placeholder="Add an amenity (e.g., Wi-Fi)"
              value={amenityInput}
              onChange={(e) => setAmenityInput(e.target.value)}
              className="form-input"
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAmenity())}
            />
            <button
              type="button"
              onClick={addAmenity}
              className="add-amenity-button"
              disabled={!amenityInput.trim()}
            >
              Add
            </button>
          </div>
          {form.amenities.length > 0 && (
            <ul className="amenities-list">
              {form.amenities.map((amenity, index) => (
                <li key={index} className="amenity-item">
                  {amenity}
                  <button
                    type="button"
                    onClick={() => removeAmenity(index)}
                    className="remove-amenity-button"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <button type="submit" disabled={loading} className="submit-button">
          {loading ? 'Adding...' : 'Add Room Type'}
        </button>
      </form>
    </div>
  );
}