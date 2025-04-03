import React from 'react';

import { useAuth } from '../contexts/AuthContext';
import { FiClock, FiMapPin, FiCalendar, FiLayers, FiDollarSign } from 'react-icons/fi';
import { it } from 'node:test';


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
  
  const { accessToken, userId } = useAuth();
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
  
  const [addFlightLoading, setAddFlightLoading] = React.useState(false);

  // Function to handle adding flight to itinerary
  const handleAddToItinerary = async () => {
    if (!accessToken) {
      // Redirect to login
      window.location.href = '/login';
      return;
    }
    setAddFlightLoading(true);

    let itineraryId = 0;
    const passportNumber = "482473977"; // Temp

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
      const response = await fetch('/api/bookings/flight-bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          passportNumber: passportNumber,
          flightIds: itinerary.flights.map(flight => flight.id),
          userId: Number(userId),
          itineraryId: itineraryId,
        })
      });

      const data = await response.json();
    } catch (error) {
      console.error('Error adding to itinerary:', error);
    } finally {
      setAddFlightLoading(false);
      alert('Flight booking request completed!');
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg shadow-lg overflow-hidden mb-6">
      {/* Header with total info */}
      <div className="bg-gray-200 p-4 border-b border-gray-300 flex justify-between items-center dark:bg-gray-400 dark:border-black">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <FiLayers className="text-gray-500 mr-2 dark:text-black" />
            <span className="text-sm font-medium text-gray-700 dark:text-black">
              {itinerary.legs === 1 ? 'Non-stop' : `${itinerary.legs - 1} stop${itinerary.legs > 2 ? 's' : ''}`}
            </span>
          </div>
          <div className="flex items-center">
            <FiClock className="text-gray-500 mr-2 dark:text-black" />
            <span className="text-sm font-medium text-gray-700 dark:text-black">
              {formatDuration(totalDuration)}
            </span>
          </div>
        </div>
        <div className="flex items-center">
          <FiDollarSign className="text-gray-500 mr-2 dark:text-black" />
          <span className="text-lg font-bold text-gray-900 dark:text-black">
            {totalPrice} {itinerary.flights[0].currency}
          </span>
        </div>
      </div>

      {/* Flight legs */}
      <div className="divide-y divide-gray-200">
        {itinerary.flights.map((flight, index) => (
          <React.Fragment key={flight.id}>
            <div className="p-4 dark:bg-gray-500">
              <div className="flex justify-between items-start mb-2 p-3 border-2 rounded-2xl border-gray-150 dark:border-black">
                <div className="flex items-center">
                  <div className="bg-gray-100 p-2 rounded-full mr-3 dark:bg-black">
                    <span className="font-medium text-gray-800 dark:text-white">{flight.airline.code}</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{flight.airline.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-black">Flight {flight.flightNumber}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm text-gray-500 dark:text-black">Duration</span>
                  <p className="font-medium text-sm text-gray-900">{formatDuration(flight.duration)}</p>
                </div>
              </div>

              <div className="flex justify-between items-center mt-4">
                {/* Departure */}
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900 dark:text-black">
                    {formatTime(flight.departureTime)}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-black">
                    {formatDate(flight.departureTime)}
                  </p>
                  <div className="mt-1">
                    <p className="text-sm text-black">
                      {flight.origin.city}, {flight.origin.country}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-black">{flight.origin.name} ({flight.origin.code})</p>
                  </div>
                </div>

                {/* Flight path */}
                <div className="flex flex-col items-center px-4">
                  <div className="w-24 h-px bg-gray-300 relative dark:bg-black">
                    <div className="absolute -top-1.5 left-0 w-3 h-3 rounded-full bg-gray-300 dark:bg-black"></div>
                    <div className="absolute -top-1.5 right-0 w-3 h-3 rounded-full bg-gray-300 dark:bg-black"></div>
                  </div>
                  <div className="mt-1 text-xs text-gray-500 dark:text-black">
                    {formatDuration(flight.duration)}
                  </div>
                </div>

                {/* Arrival */}
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900 dark:text-black">
                    {formatTime(flight.arrivalTime)}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-black">
                    {formatDate(flight.arrivalTime)}
                  </p>
                  <div className="mt-1">
                    <p className="text-sm text-black">
                      {flight.destination.city}, {flight.destination.country}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-black">{flight.destination.name} ({flight.destination.code})</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Layover information if not last flight */}
            {index < itinerary.flights.length - 1 && (
              <div className="dark:bg-gray-400 p-3 text-center dark:border-gray-400">
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-gray-200 text-sm font-medium text-gray-700 dark:bg-gray-300">
                  <FiClock className="mr-1" />
                  Layover: {formatDuration(calculateLayover(flight, itinerary.flights[index + 1]))}
                </div>
                <p className="text-xs text-gray-500 mt-1 dark:text-black">
                  At {flight.destination.name} ({flight.destination.code})
                </p>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      <div className='text-center p-3 dark:bg-gray-400'>
      <button
        className={`bg-black text-white font-bold py-2 rounded-lg hover:bg-gray-700 p-2 dark:text-gray-300
           ${addFlightLoading ? 'opacity-75' : ''}`}
        onClick={handleAddToItinerary}
        disabled={addFlightLoading}
      >
        {addFlightLoading 
          ? 'Adding...' 
          : accessToken 
            ? 'Add To Itinerary' 
            : 'Login to Book'}
      </button>
    </div>
    </div>
  );
};

export default FlightCard;