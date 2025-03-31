'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import LoadingMessage from '../../components/LoadingMessage';

interface Hotel {
  id: number;
  name: string;
  location: string;
  starRating: number;
}

export default function MyHotels() {
  const { accessToken, userId } = useAuth();
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loadingHotels, setLoadingHotels] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!accessToken || !userId) {
      router.push('/login');
      return;
    }
    const fetchHotels = async () => {
      try {
        const res = await fetch(`/api/hotels?ownerId=${userId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (res.ok) {
          const data = await res.json();
          setHotels(data);
        } else {
          throw new Error(await res.text());
        }
      } catch (error) {
        console.error('Error fetching hotels:', error);
        alert('Failed to load hotels');
      } finally {
        setLoadingHotels(false);
      }
    };
    fetchHotels();
  }, [accessToken, userId, router]);

  if (loadingHotels) return <LoadingMessage message="Loading your hotels..." />;

  return (
    <div className="my-hotels-container">
      <h1 className="my-hotels-title">My Hotels</h1>
      {hotels.length === 0 ? (
        <p className="no-hotels-text">
          You don’t have any hotels yet.{' '}
          <Link href="/hotels/register" className="text-[var(--deep-purple)] hover:text-[var(--lavender)]">
            Register one now!
          </Link>
        </p>
      ) : (
        <ul className="hotels-list">
          {hotels.map((hotel) => (
            <li key={hotel.id} className="hotel-item">
              <div className="hotel-info">
                <h2 className="hotel-name">{hotel.name}</h2>
                <p className="hotel-detail">Location: {hotel.location}</p>
                <p className="hotel-detail">Stars: {hotel.starRating}</p>
              </div>
              <div className="hotel-actions">
                <Link href={`/hotels/${hotel.id}/manage`} className="action-button">
                  Manage
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}