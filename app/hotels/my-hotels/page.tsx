'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import LoadingMessage from '../../components/LoadingMessage';
import HotelCard from '../../components/HotelCard';

interface HotelSummary {
  id: string;
  name: string;
  logo: string;
  location: string;
  address: string;
  starRating: number;
  startingPrice: number;
  roomTypes: {
    id: string;
    name: string;
    pricePerNight: number;
    availableRooms: number;
    amenities: string[];
    images: string[];
  }[];
  images: string[];
}

export default function MyHotels() {
  const { accessToken, userId } = useAuth();
  const [hotels, setHotels] = useState<HotelSummary[]>([]);
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
    <div className='flex flex-col justify-center rounded-lg bg-gray-500 dark:bg-gray-900'>
          {/* Hotel Results */}
          {hotels.length > 0 ? (
            <div className="w-full flex flex-col gap-6 items-center pt-10 pb-20 dark:bg-gray-900">
              <h1 className='text-3xl font-bold mt-5 dark:text-gray-300 mb-10'>My Hotels</h1>
              <div className="w-full px-20">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">                 
                    {hotels.map((hotel) => (
                      <HotelCard key={hotel.id} hotel={hotel} isOwnerView={true} />
                    ))}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-center text-[var(--text-dark)] dark:text-[var(--lavender)] font-bold mt-20 p-20 text-2xl">
              No hotels added.
              <br></br>
            <Link
              href="/hotels/register"
              className="text-blue-900 hover:text-[var(--lavender)] dark:text-blue-200 dark:hover:text-[var(--lavender)] text-4xl font-bold"
            >
              Register one now!
            </Link>
        </p>
          )
            }
      </div>
    )}
