'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '..//contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function Book() {
  const { accessToken, userId } = useAuth();
  const [cities, setCities] = useState<string[]>([]);
  const [selectedCity, setSelectedCity] = useState('');
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [hotels, setHotels] = useState([]);
  const [selectedHotel, setSelectedHotel] = useState('');
  const [roomTypes, setRoomTypes] = useState([]);
  const [selectedRoomType, setSelectedRoomType] = useState('');
  const [itineraryId, setItineraryId] = useState('');
  const [loadingCities, setLoadingCities] = useState(true);
  const [loadingHotels, setLoadingHotels] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [loadingBooking, setLoadingBooking] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!accessToken || !userId) {
      router.push('/login');
      return;
    }
    const fetchCities = async () => {
      setLoadingCities(true);
      try {
        const res = await fetch('/api/hotels?getCities=true', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (res.ok) {
          const data = await res.json();
          setCities(data);
        } else {
          throw new Error(await res.text());
        }
      } catch (error) {
        console.error('Error fetching cities:', error);
        alert('Failed to load cities');
      } finally {
        setLoadingCities(false);
      }
    };
    fetchCities();
  }, [accessToken, userId, router]);

  useEffect(() => {
    if (!accessToken || !userId || !selectedCity || !checkInDate || !checkOutDate) return;

    const fetchHotels = async () => {
      setLoadingHotels(true);
      try {
        const res = await fetch(
          `/api/hotels?checkInDate=${checkInDate}&checkOutDate=${checkOutDate}&city=${selectedCity}`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        if (res.ok) {
          const data = await res.json();
          setHotels(data);
          setSelectedHotel('');
          setRoomTypes([]);
          setSelectedRoomType('');
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
  }, [selectedCity, checkInDate, checkOutDate, accessToken, userId]);

  useEffect(() => {
    if (!accessToken || !userId || !selectedHotel) return;

    const fetchRoomTypes = async () => {
      setLoadingRooms(true);
      try {
        const res = await fetch(
          `/api/hotels/${selectedHotel}?checkInDate=${checkInDate}&checkOutDate=${checkOutDate}`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        if (res.ok) {
          const data = await res.json();
          setRoomTypes(data.roomTypes || []);
          setSelectedRoomType('');
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
  }, [selectedHotel, checkInDate, checkOutDate, accessToken, userId]);

  const handleBook = async () => {
    if (!accessToken || !userId) {
      router.push('/login');
      return;
    }
    if (!selectedHotel || !selectedRoomType || !checkInDate || !checkOutDate) {
      alert('Please select city, dates, hotel, and room type');
      return;
    }
    setLoadingBooking(true);
    try {
      const bookingData = {
        hotelId: selectedHotel,
        roomTypeId: selectedRoomType,
        checkInDate,
        checkOutDate,
        userId,
        ...(itineraryId && { itineraryId }),
      };
      const res = await fetch('/api/bookings/hotel-bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(bookingData),
      });
      if (res.ok) {
        alert('Booking confirmed!');
        router.push('/bookings'); // Redirect to My Bookings
      } else {
        throw new Error(await res.text());
      }
    } catch (error) {
      console.error('Error booking hotel:', error);
      alert('Error booking hotel');
    } finally {
      setLoadingBooking(false);
    }
  };

  return (
    <div className="booking-container">
      <h1 className="booking-title">Book a Stay</h1>
      <div className="booking-form">
        <select
          value={selectedCity}
          onChange={(e) => setSelectedCity(e.target.value)}
          className="form-input"
          disabled={loadingCities || loadingHotels || loadingRooms || loadingBooking}
        >
          <option value="">Select City</option>
          {loadingCities ? (
            <option value="">Loading cities...</option>
          ) : (
            cities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))
          )}
        </select>

        <input
          type="date"
          value={checkInDate}
          onChange={(e) => setCheckInDate(e.target.value)}
          className="form-input"
          min={new Date().toISOString().split('T')[0]}
          disabled={!selectedCity || loadingCities || loadingHotels || loadingRooms || loadingBooking}
        />

        <input
          type="date"
          value={checkOutDate}
          onChange={(e) => setCheckOutDate(e.target.value)}
          className="form-input"
          min={checkInDate || new Date().toISOString().split('T')[0]}
          disabled={!checkInDate || loadingCities || loadingHotels || loadingRooms || loadingBooking}
        />

        <select
          value={selectedHotel}
          onChange={(e) => setSelectedHotel(e.target.value)}
          className="form-input"
          disabled={!checkInDate || !checkOutDate || loadingHotels || loadingRooms || loadingBooking}
        >
          <option value="">Select Hotel</option>
          {loadingHotels ? (
            <option value="">Loading hotels...</option>
          ) : (
            hotels.map((hotel) => (
              <option key={hotel.id} value={hotel.id}>
                {hotel.name} ({hotel.starRating} stars)
              </option>
            ))
          )}
        </select>

        <select
          value={selectedRoomType}
          onChange={(e) => setSelectedRoomType(e.target.value)}
          className="form-input"
          disabled={!selectedHotel || loadingRooms || loadingBooking}
        >
          <option value="">Select Room Type</option>
          {loadingRooms ? (
            <option value="">Loading room types...</option>
          ) : (
            roomTypes.map((room) => (
              <option key={room.id} value={room.id}>
                {room.name} - ${room.pricePerNight}/night ({room.availableRooms} available)
              </option>
            ))
          )}
        </select>

        <input
          type="text"
          placeholder="Itinerary ID (optional)"
          value={itineraryId}
          onChange={(e) => setItineraryId(e.target.value)}
          className="form-input"
          disabled={loadingBooking}
        />

        <button
          onClick={handleBook}
          disabled={loadingBooking || !selectedRoomType}
          className="submit-button"
        >
          {loadingBooking ? 'Booking...' : 'Book'}
        </button>
      </div>
    </div>
  );
}