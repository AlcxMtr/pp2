'use client';
import React, { useState } from 'react';
import { Slide } from 'react-slideshow-image';
import 'react-slideshow-image/dist/styles.css';
import { FiMapPin, FiStar, FiDollarSign, FiHome, FiX } from 'react-icons/fi';
import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Link from 'next/link';

interface RoomType {
  id: string;
  name: string;
  pricePerNight: number;
  availableRooms: number;
  amenities: string[];
  images: string[];
}

interface HotelSummary {
  id: string;
  name: string;
  logo: string;
  location: string;
  address: string;
  starRating: number;
  startingPrice: number;
  roomTypes: RoomType[];
  images: string[];
}

interface HotelCardProps {
  hotel: HotelSummary;
  isOwnerView?: boolean; // New prop to distinguish owner view
  checkInDate: string;
  checkOutDate: string;
}

interface CityCoordinates {
  [key: string]: [number, number];
}

const cityCoordinates: CityCoordinates = {
  Toronto: [43.653226, -79.383184],
  Paris: [48.856614, 2.352222],
  'New York': [40.712775, -74.005973],
  London: [51.507351, -0.127758],
  Tokyo: [35.676192, 139.650311],
  'Los Angeles': [34.052234, -118.243685],
  Sydney: [-33.868820, 151.209295],
  Beijing: [39.904211, 116.407395],
  Moscow: [55.755826, 37.617300],
  Dubai: [25.204849, 55.270783],
};

const HotelCard: React.FC<HotelCardProps> = ({ hotel, isOwnerView = false, checkInDate, checkOutDate }) => {
  const [showRoomsModal, setShowRoomsModal] = useState(false);
  const { accessToken, userId } = useAuth();
  const [addHotelLoading, setAddHotelLoading] = React.useState(false);

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <FiStar
            key={i}
            className={`${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} w-4 h-4`}
          />
        ))}
      </div>
    );
  };

  const rooms = hotel.roomTypes;

  const Map = useMemo(
    () =>
      dynamic(() => import('./Map'), {
        loading: () => <p>Loading map...</p>,
        ssr: false,
      }),
    []
  );

  const handleAddToItinerary = async (roomTypeId: number) => {
  if (!accessToken) {
    // Redirect to login
    window.location.href = '/login';
    return;
  }
  setAddHotelLoading(true);

  let itineraryId = 0;

  try {
    const response = await fetch('/api/itinerary/active', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        userId: Number(userId)
      })
    });

    const data = await response.json();
    itineraryId = data.id;
  } catch (error) {
    console.error('Error requesting itinerary:', error);
  }

  try {
    const response = await fetch('/api/bookings/hotel-bookings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        hotelId: Number(hotel.id),
        roomTypeId: Number(roomTypeId),
        checkInDate: checkInDate,
        checkOutDate: checkOutDate,
        userId: Number(userId),
        itineraryId: itineraryId,
      })
    });

    const data = await response.json();
  } catch (error) {
    console.error('Error adding to itinerary:', error);
  } finally {
    setAddHotelLoading(false);
    alert('Hotel booking request completed!');
  }
  }

  return (
    <>
      {/* Hotel Card */}
      <div className="flex flex-col border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden shadow-sm bg-[var(--card-bg-light)] dark:bg-black h-full">
        {/* Image Section - Fixed Height Container */}
        <div className="h-48 bg-gray-100 relative overflow-hidden">
          {hotel.images?.length > 0 ? (
            <Slide
              autoplay={false}
              arrows={true}
              indicators={true}
              cssClass="h-full w-full"
              transitionDuration={500}
            >
              {hotel.images.map((image, index) => (
                <div key={index} className="h-48 w-full">
                  <img
                    src={image}
                    alt={`${hotel.name} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </Slide>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <FiHome className="w-12 h-12" />
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="p-4 flex flex-col space-between">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-bold text-gray-900 line-clamp-1">{hotel.name}</h3>
              <div className="flex items-center mt-1">
                {renderStars(hotel.starRating)}
                <span className="text-sm text-gray-500 ml-2">{hotel.starRating} stars</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">{isOwnerView ? 'Listed at' : 'Starting from'}</p>
              <p className="text-xl font-bold text-gray-900">
                {hotel.startingPrice} CAD
              </p>
            </div>
          </div>

          <div className="mt-3 flex space-between">
            <FiMapPin className="text-gray-500 mr-2 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-gray-900">{hotel.location}</p>
              {'address' in hotel && (
                <p className="text-xs text-gray-500 line-clamp-1">{hotel.address}</p>
              )}
            </div>
          </div>

          {isOwnerView ? (
            <Link
              href={`/hotels/${hotel.id}/manage`}
              className="mt-4 w-full py-2 px-4 bg-black hover:bg-blue-900 text-white rounded-md transition duration-200 text-center"
            >
              Manage
            </Link>
          ) : (
            <button
              onClick={() => setShowRoomsModal(true)}
              className="mt-4 w-full py-2 px-4 bg-black hover:bg-blue-900 text-white rounded-md transition duration-200"
            >
              View Details
            </button>
          )}
        </div>
      </div>

      {/* Rooms Modal (Only for non-owner view) */}
      {!isOwnerView && showRoomsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white z-10">
              <img src={hotel.logo} className="h-10" alt={`${hotel.name} logo`} />
              <h2 className="text-4xl font-bold text-gray-900">{hotel.name}</h2>
              <button
                onClick={() => setShowRoomsModal(false)}
                className="text-sm text-white hover:text-gray-300 p-1 bg-black border-2 rounded-full border-black"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content - Scrollable Area */}
            <div className="overflow-y-auto p-4 flex-1">
              <div className="font-bold text-3xl text-center mb-5 text-black">Location</div>
              <Map posix={cityCoordinates[hotel.location] || [43.5483, -79.6627]} />
              <div className="mt-5 text-black text-3xl font-bold text-center mb-5">Available Rooms</div>
              {rooms.map((room) => (
                <div key={room.id} className="mb-6 last:mb-0">
                  <h3 className="text-2xl font-semibold mb-2 text-black">{room.name}</h3>

                  {/* Room Images - Fixed Height Container */}
                  <div className="h-80 bg-gray-100 rounded-lg overflow-hidden mb-4">
                    {room.images.length > 0 ? (
                      <Slide
                        autoplay={false}
                        arrows={true}
                        indicators={true}
                        cssClass="h-full w-full"
                        transitionDuration={300}
                      >
                        {room.images.map((image, index) => (
                          <div key={index} className="h-80 w-full">
                            <img
                              src={image}
                              alt={`${room.name} ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </Slide>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <FiHome className="w-12 h-12" />
                      </div>
                    )}
                  </div>

                  {/* Room Details */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <div className="mb-4">
                        <h4 className="font-medium text-gray-900 mb-1">Price</h4>
                        <p className="text-2xl font-bold text-black">
                          {room.pricePerNight} CAD
                          <span className="text-sm font-normal text-gray-500"> / night</span>
                        </p>
                        <p
                          className={`text-sm mt-1 ${
                            room.availableRooms < 10 ? 'text-red-500' : 'text-black'
                          }`}
                        >
                          {room.availableRooms < 10 && 'Only'} {room.availableRooms} room
                          {room.availableRooms !== 1 && 's'} left!
                        </p>
                      </div>

                      {room.amenities.length > 0 && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Amenities</h4>
                          <div className="flex flex-wrap gap-2">
                            {room.amenities.map((amenity, index) => (
                              <span
                                key={index}
                                className="text-xs bg-gray-100 text-gray-800 px-3 py-1 rounded-full"
                              >
                                {amenity}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col justify-end">
                        <button
                        onClick={() => handleAddToItinerary(Number(room.id))}
                        className={`bg-black text-white font-bold py-2 rounded-lg hover:bg-gray-700 p-2 dark:text-gray-300
                          ${addHotelLoading ? 'opacity-75' : ''}`}
                        >
                          {addHotelLoading 
                            ? 'Adding...' 
                            : accessToken 
                              ? 'Add To Itinerary' 
                              : 'Login to Book'}
                        </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default HotelCard;