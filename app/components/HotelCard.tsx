'use client'
import React, { useState } from 'react';
import { Slide } from 'react-slideshow-image';
import 'react-slideshow-image/dist/styles.css';
import { FiMapPin, FiStar, FiDollarSign, FiHome, FiX } from 'react-icons/fi';
import dynamic from "next/dynamic";
import { useMemo } from "react";



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
}


const HotelCard: React.FC<HotelCardProps> = ({ hotel }) => {
    const [showRoomsModal, setShowRoomsModal] = useState(false);

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

    const Map = useMemo(() => dynamic(
        () => import('./Map'),
        {
            loading: () => <p>A map is loading</p>,
            ssr: false
        }
    ), [])

    return (
    <>
    {/* Hotel Card */}
    <div className="flex flex-col border border-gray-200 rounded-lg overflow-hidden shadow-sm bg-white h-full">
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
                <span className="text-sm text-gray-500 ml-2">
                {hotel.starRating} stars
                </span>
            </div>
            </div>
            <div className="text-right">
            <p className="text-sm text-gray-500">Starting from</p>
            <p className="text-xl font-bold text-gray-900">
                {Math.min(...rooms.map(r => r.pricePerNight))} CAD
            </p>
            </div>
        </div>

        <div className="mt-3 flex space-between">
            <FiMapPin className="text-gray-500 mr-2 mt-0.5 flex-shrink-0" />
            <div>
            <p className="text-sm text-gray-900">
                {hotel.location}
            </p>
            {'address' in hotel && (
                <p className="text-xs text-gray-500 line-clamp-1">
                {hotel.address}
                </p>
            )}
            </div>
        </div>

        <button
            onClick={() => setShowRoomsModal(true)}
            className="mt-4 w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition duration-200"
        >
            View Details
        </button>
        </div>
    </div>

    {/* Rooms Modal */}
    {showRoomsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white z-10">
            <h2 className="text-3xl font-bold text-gray-900">{hotel.name}</h2>
            <button
                onClick={() => setShowRoomsModal(false)}
                className="text-gray-500 hover:text-gray-700 p-1"
            >
                <FiX className="w-6 h-6" />
            </button>
            </div>

            {/* Modal Content - Scrollable Area */}
            <div className="overflow-y-auto p-4 flex-1">
            <div className='font-bold text-xl text-center mb-5'>Location</div>
            <Map posix={[4.79029, -75.69003]} />
            {rooms.map((room) => (
                <div key={room.id} className="mb-6 last:mb-0">
                <h3 className="text-lg font-semibold mb-2">{room.name}</h3>
                
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
                            className="w-full h-full object-fill"
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
                        <p className="text-2xl font-bold">
                        {room.pricePerNight} CAD
                        <span className="text-sm font-normal text-gray-500"> / night</span>
                        </p>
                        <p className={`text-sm mt-1 ${room.availableRooms < 10 ? 'text-red-500' : 'text-black'}`}>
                        {room.availableRooms < 10 && 'Only'} {room.availableRooms} room{room.availableRooms > 1 && 's'} left!
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
                    <button className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition duration-200">
                    Add To Itinerary
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