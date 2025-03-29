import React from 'react';

import { FiClock, FiMapPin, FiCalendar, FiLayers, FiDollarSign } from 'react-icons/fi';


export interface Airport {
  code: string;
  name: string;
  city: string;
  country: string;
}

export interface Airline {
  code: string;
  name: string;
}

export interface Flight {
  id: string;
  flightNumber: string;
  departureTime: string;
  arrivalTime: string;
  originId: string;
  destinationId: string;
  duration: number;
  price: number;
  currency: string;
  availableSeats: number;
  status: string;
  airline: Airline;
  origin: Airport;
  destination: Airport;
}

export interface FlightItinerary {
  legs: number;
  flights: Flight[];
}

const FlightCard: React.FC<{ itinerary: FlightItinerary }> = ({ itinerary }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'UTC'
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'UTC'
    });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const calculateLayover = (currentFlight: Flight, nextFlight: Flight) => {
    const currentArrival = new Date(currentFlight.arrivalTime).getTime();
    const nextDeparture = new Date(nextFlight.departureTime).getTime();
    return Math.floor((nextDeparture - currentArrival) / (1000 * 60));
  };

  const totalPrice = itinerary.flights.reduce((sum, flight) => sum + flight.price, 0);
  const totalDuration = itinerary.flights.reduce((sum, flight) => sum + flight.duration, 0);

  if (itinerary.legs === 0 || itinerary.flights.length === 0) {
    return null;
  }

  return (
    <div className="border border-gray-200 rounded-lg shadow-lg overflow-hidden mb-6">
      {/* Header with total info */}
      <div className="bg-gray-200 p-4 border-b border-gray-300 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <FiLayers className="text-gray-500 mr-2" />
            <span className="text-sm font-medium text-gray-700">
              {itinerary.legs === 1 ? 'Non-stop' : `${itinerary.legs - 1} stop${itinerary.legs > 2 ? 's' : ''}`}
            </span>
          </div>
          <div className="flex items-center">
            <FiClock className="text-gray-500 mr-2" />
            <span className="text-sm font-medium text-gray-700">
              {formatDuration(totalDuration)}
            </span>
          </div>
        </div>
        <div className="flex items-center">
          <FiDollarSign className="text-gray-500 mr-2" />
          <span className="text-lg font-bold text-gray-900">
            {totalPrice} {itinerary.flights[0].currency}
          </span>
        </div>
      </div>

      {/* Flight legs */}
      <div className="divide-y divide-gray-200">
        {itinerary.flights.map((flight, index) => (
          <React.Fragment key={flight.id}>
            <div className="p-4">
              <div className="flex justify-between items-start mb-2 p-3 border-2 rounded-2xl border-gray-150">
                <div className="flex items-center">
                  <div className="bg-gray-100 p-2 rounded-full mr-3">
                    <span className="font-medium text-gray-800">{flight.airline.code}</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{flight.airline.name}</h3>
                    <p className="text-sm text-gray-500">Flight {flight.flightNumber}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm text-gray-500">Duration</span>
                  <p className="font-medium text-sm text-gray-900">{formatDuration(flight.duration)}</p>
                </div>
              </div>

              <div className="flex justify-between items-center mt-4">
                {/* Departure */}
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">
                    {formatTime(flight.departureTime)}
                  </p>
                  <p className="text-sm text-gray-500">
                    {formatDate(flight.departureTime)}
                  </p>
                  <div className="mt-1">
                    <p className="text-sm text-black">
                      {flight.origin.city}, {flight.origin.country}
                    </p>
                    <p className="text-xs text-gray-400">{flight.origin.name} ({flight.origin.code})</p>
                  </div>
                </div>

                {/* Flight path */}
                <div className="flex flex-col items-center px-4">
                  <div className="w-24 h-px bg-gray-300 relative">
                    <div className="absolute -top-1.5 left-0 w-3 h-3 rounded-full bg-gray-300"></div>
                    <div className="absolute -top-1.5 right-0 w-3 h-3 rounded-full bg-gray-300"></div>
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    {formatDuration(flight.duration)}
                  </div>
                </div>

                {/* Arrival */}
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">
                    {formatTime(flight.arrivalTime)}
                  </p>
                  <p className="text-sm text-gray-500">
                    {formatDate(flight.arrivalTime)}
                  </p>
                  <div className="mt-1">
                    <p className="text-sm text-black">
                      {flight.destination.city}, {flight.destination.country}
                    </p>
                    <p className="text-xs text-gray-400">{flight.destination.name} ({flight.destination.code})</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Layover information if not last flight */}
            {index < itinerary.flights.length - 1 && (
              <div className="bg-gray-100 p-3 text-center">
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-gray-200 text-sm font-medium text-gray-700">
                  <FiClock className="mr-1" />
                  Layover: {formatDuration(calculateLayover(flight, itinerary.flights[index + 1]))}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  At {flight.destination.name} ({flight.destination.code})
                </p>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      <div className='text-center p-3'>
        <button className='bg-black text-white font-bold py-2 rounded-lg hover:bg-gray-700 p-2'>Add To Itinerary</button>
      </div>
    </div>
  );
};

export default FlightCard;