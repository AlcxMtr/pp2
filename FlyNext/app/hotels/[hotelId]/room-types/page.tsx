'use client';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import Link from 'next/link';
import { Input, Button } from '@heroui/react';

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
  const [newImageUrl, setNewImageUrl] = useState('');
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
        router.push(`/hotels/${hotelId}/rooms`);
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

  const addImage = () => {
    if (newImageUrl.trim()) {
      setForm({ ...form, images: [...form.images, { url: newImageUrl.trim() }] });
      setNewImageUrl('');
    }
  };

  const removeImage = (index: number) => {
    setForm({ ...form, images: form.images.filter((_, i) => i !== index) });
  };

  return (
    <div className="flex flex-col items-center min-h-screen p-10 bg-[var(--gray-bg-light)] dark:bg-[var(--gray-bg-dark)]">
      <div className="w-full max-w-2xl bg-[var(--card-bg-light)] dark:bg-black rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-center text-[var(--text-dark)] dark:text-[var(--lavender)]">
            Add Room Type
          </h1>
          <Link
            href={`/hotels/${hotelId}/rooms`}
            className="bg-[var(--deep-purple)] text-white px-4 py-2 rounded-lg hover:bg-[var(--lavender)] dark:hover:text-[var(--text-dark)]"
          >
            Back
          </Link>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="flex gap-4 items-end">
              <Input
                isRequired
                label="Room Type Name"
                labelPlacement="outside"
                placeholder="Enter room type name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                errorMessage="Please enter a room type name"
                className="w-full"
              />
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex gap-4 items-end">
              <Input
                isRequired
                type="number"
                label="Total Rooms"
                labelPlacement="outside"
                placeholder="Enter total rooms"
                value={form.totalRooms}
                onChange={(e) => setForm({ ...form, totalRooms: e.target.value })}
                min={1}
                errorMessage="Please enter a number of rooms (minimum 1)"
                className="w-full"
              />
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex gap-4 items-end">
              <Input
                isRequired
                type="number"
                label="Price Per Night"
                labelPlacement="outside"
                placeholder="Enter price per night"
                value={form.pricePerNight}
                onChange={(e) => setForm({ ...form, pricePerNight: e.target.value })}
                min={0.01}
                step={0.01}
                errorMessage="Please enter a price (minimum 0.01)"
                className="w-full"
              />
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex gap-4 items-end">
              <Input
                label="Amenity"
                labelPlacement="outside"
                placeholder="Enter an amenity (e.g., Wi-Fi)"
                value={amenityInput}
                onChange={(e) => setAmenityInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAmenity())}
                className="flex-1"
              />
              <Button
                onClick={addAmenity}
                className="bg-black text-white hover:bg-gray-700 dark:bg-white dark:text-black"
                disabled={!amenityInput.trim()}
              >
                Add Amenity
              </Button>
            </div>
            {form.amenities.length > 0 && (
              <div className="space-y-2">
                {form.amenities.map((amenity, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <span className="text-sm text-gray-700 dark:text-gray-300 truncate flex-1">
                      {amenity}
                    </span>
                    <Button
                      onClick={() => removeAmenity(index)}
                      className="bg-red-500 text-white hover:bg-red-600"
                      size="sm"
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="space-y-4">
            <div className="flex gap-4 items-end">
              <Input
                label="Image URL"
                labelPlacement="outside"
                placeholder="Enter image URL"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                className="flex-1"
              />
              <Button
                onClick={addImage}
                className="bg-black text-white hover:bg-gray-700 dark:bg-white dark:text-black"
                disabled={!newImageUrl.trim()}
              >
                Add Image
              </Button>
            </div>
            {form.images.length > 0 && (
              <div className="space-y-2">
                {form.images.map((image, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <span className="text-sm text-gray-700 dark:text-gray-300 truncate flex-1">
                      {image.url}
                    </span>
                    <Button
                      onClick={() => removeImage(index)}
                      className="bg-red-500 text-white hover:bg-red-600"
                      size="sm"
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white font-semibold py-2 rounded-lg hover:bg-gray-700 dark:bg-white dark:text-black"
          >
            {loading ? 'Adding...' : 'Add Room Type'}
          </Button>
        </form>
      </div>
    </div>
  );
}