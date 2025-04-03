'use client';
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Input, Button } from '@heroui/react';

export default function RegisterHotel() {
  const { accessToken, userId } = useAuth();
  const [form, setForm] = useState({
    name: '',
    address: '',
    location: '',
    starRating: '',
    logo: '', // Optional
    images: [] as { url: string }[],
  });
  const [newImageUrl, setNewImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !userId) {
      alert('Please log in first');
      router.push('/login');
      return;
    }
    if (!form.name || !form.address || !form.location || !form.starRating) {
      alert('Please fill in all required fields: name, address, location, and star rating');
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
        body: JSON.stringify({
          ...form,
          starRating: Number(form.starRating),
          ownerId: Number(userId),
        }),
      });
      if (res.ok) {
        alert('Hotel registered!');
        router.push('/hotels/my-hotels');
      } else {
        const data = await res.json();
        alert(data.error || 'Error registering hotel');
      }
    } catch (error) {
      alert('Error registering hotel');
    } finally {
      setLoading(false);
    }
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
        <h1 className="text-3xl font-bold mb-8 text-center text-[var(--text-dark)] dark:text-[var(--lavender)]">
          Register Hotel
        </h1>
        <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="flex gap-4 items-end">
              <Input
                isRequired
                label="Hotel Name"
                labelPlacement="outside"
                placeholder="Enter hotel name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                errorMessage="Please enter a hotel name"
                className="w-full"
              />
            </div>
        </div>
        <div className="space-y-4">
            <div className="flex gap-4 items-end">
              <Input
                isRequired
                label="Address"
                labelPlacement="outside"
                placeholder="Enter hotel address"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                errorMessage="Please enter an address"
                className="w-full"
              />
            </div>
          </div>
        <div className="space-y-4">
        <div className="flex gap-4 items-end">
          <Input
            isRequired
            label="Location (City)"
            labelPlacement="outside"
            placeholder="Enter city"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            errorMessage="Please enter a city"
            className="w-full"
          />
          </div>
          </div>
          <div className="space-y-4">
          <div className="flex gap-4 items-end">
          <Input
            isRequired
            type="number"
            label="Star Rating (1-5)"
            labelPlacement="outside"
            placeholder="Enter star rating"
            value={form.starRating}
            onChange={(e) => setForm({ ...form, starRating: e.target.value })}
            min={1}
            max={5}
            errorMessage="Please enter a rating between 1 and 5"
            className="w-full"
          />
          </div>
          </div>
          <div className="space-y-4">
          <div className="flex gap-4 items-end">
          <Input
            label="Logo URL (Optional)"
            labelPlacement="outside"
            placeholder="Enter logo URL"
            value={form.logo}
            onChange={(e) => setForm({ ...form, logo: e.target.value })}
            className="w-full"
          />
          </div>
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
            {loading ? 'Registering...' : 'Register Hotel'}
          </Button>
        </form>
      </div>
    </div>
  );
}