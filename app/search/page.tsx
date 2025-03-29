'use client';

import { useState, useCallback } from 'react';
import debounce from 'lodash/debounce';
import { Autocomplete, AutocompleteItem, DatePicker, DateRangePicker, Checkbox, Select, SelectItem, Input, Slider, Form, Button } from "@heroui/react";
import { getLocalTimeZone, today, parseDate } from "@internationalized/date";
import FlightCard, { FlightItinerary } from '../components/FlightCard';
import HotelCard from '../components/HotelCard';
import { set } from 'lodash';


interface Suggestion {
  id: number;
  name: string;
  type: 'city' | 'airport';
}

interface FlightSearchResponse {
  outbound: FlightItinerary[] | null;
  inbound: FlightItinerary[] | null;
}


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


const starRatings = [
  { key: '1', label: '★☆☆☆☆ 1 Star' },
  { key: '2', label: '★★☆☆☆ 2 Stars' },
  { key: '3', label: '★★★☆☆ 3 Stars' },
  { key: '4', label: '★★★★☆ 4 Stars' },
  { key: '5', label: '★★★★★ 5 Stars' },
];

export default function SearchPage() {
  const [searchType, setSearchType] = useState<'flights' | 'hotels'>('flights');
  const [isReturnFlight, setIsReturnFlight] = useState(false);
  const [originSuggestions, setOriginSuggestions] = useState<Suggestion[]>([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState<Suggestion[]>([]);
  const [citySuggestions, setCitySuggestions] = useState<Suggestion[]>([]);

  const [selectedOrigin, setSelectedOrigin] = useState<string>('');
  const [selectedDestination, setSelectedDestination] = useState<string>('');
  const [departureDate, setDepartureDate] = useState<string>((today(getLocalTimeZone())).toString());
  const [returnDate, setReturnDate] = useState<string>('');
  const [flightResults, setFlightResults] = useState<FlightSearchResponse>({ outbound: null, inbound: null });
  const [hasSearchedFlights, setHasSearchedFlights] = useState(false);

  const [selectedCity, setSelectedCity] = useState<string>('');
  const [checkInDate, setCheckInDate] = useState<string>('');
  const [checkOutDate, setCheckOutDate] = useState<string>('');
  const [hotelName, setHotelName] = useState<string>('');
  const [starRating, setStarRating] = useState<string>('');
  const [priceRange, setPriceRange] = useState<number[] | null>(null);
  const [hotelResults, setHotelResults] = useState<HotelSummary[]>([]);
  const [hasSearchedHotels, setHasSearchedHotels] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounced API calls for each field
  const fetchOriginSuggestions = useCallback(
    debounce(async (query: string) => {
      if (!query) {
        setOriginSuggestions([]);
        return;
      }
      try {
        const response = await fetch(`/api/autocomplete?query=${query}`);
        const data = await response.json();
        setOriginSuggestions(data.suggestions);
      } catch (error) {
        console.error('Error fetching origin suggestions:', error);
      }
    }, 300),
    []
  );

  const fetchDestinationSuggestions = useCallback(
    debounce(async (query: string) => {
      if (!query) {
        setDestinationSuggestions([]);
        return;
      }
      try {
        const response = await fetch(`/api/autocomplete?query=${query}`);
        const data = await response.json();
        setDestinationSuggestions(data.suggestions);
      } catch (error) {
        console.error('Error fetching destination suggestions:', error);
      }
    }, 300),
    []
  );

  const fetchCitySuggestions = useCallback(
    debounce(async (query: string) => {
      if (!query) {
        setCitySuggestions([]);
        return;
      }
      try {
        const response = await fetch(`/api/autocomplete?query=${query}`);
        const data = await response.json();
        setCitySuggestions(data.suggestions.filter((s: Suggestion) => s.type === 'city'));
      } catch (error) {
        console.error('Error fetching city suggestions:', error);
      }
    }, 300),
    []
  );

  const handleFlightSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setHasSearchedFlights(true);
    
    try {
      const queryParams = new URLSearchParams({
        origin: selectedOrigin.split(' (')[0],
        destination: selectedDestination.split(' (')[0],
        departureDate,
        ...(isReturnFlight && returnDate ? { returnDate } : {}),
      });

      const response = await fetch(`/api/flights?${queryParams}`);
      if (!response.ok) throw new Error('Failed to fetch flights');
      
      const data: FlightSearchResponse = await response.json();
      setFlightResults(data);
    } catch (err) {
      setError('An error occurred while fetching flights. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  const handleHotelSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setHasSearchedHotels(true);

    try {
      const queryParams = new URLSearchParams({
        city: selectedCity,
        checkInDate,
        checkOutDate,
        ...(hotelName ? { name: hotelName } : {}),
        ...(starRating ? { starRating } : {}),
        ...(priceRange ? { minPrice: priceRange[0].toString(), maxPrice: priceRange[1].toString() } : {}),
      });

      const response = await fetch(`/api/hotels?${queryParams}`);
      if (!response.ok) throw new Error('Failed to fetch hotels');
      
      const data: HotelSummary[] = await response.json();
      setHotelResults(data);
    } catch (err) {
      setError('An error occurred while fetching hotels. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='flex flex-col justify-center bg-gray-100 rounded-lg'>
    <div className="flex items-start justify-center p-10 bg-gray-500">
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-lg p-6">
        {/* Search Type Switch */}
        <div className="flex justify-center mb-6">
          <div className="bg-gray-200 rounded-full p-1 flex gap-1">
            <button
              onClick={() => setSearchType('flights')}
              className={`px-4 py-2 rounded-full flex items-center gap-2 ${
                searchType === 'flights' ? 'bg-black text-white' : 'text-gray-600'
              }`}
            >
              ✈️ Flights
            </button>
            <button
              onClick={() => setSearchType('hotels')}
              className={`px-4 py-2 rounded-full flex items-center gap-2 ${
                searchType === 'hotels' ? 'bg-black text-white' : 'text-gray-600'
              }`}
            >
              🏨 Hotels
            </button>
          </div>
        </div>

        {/* Flight Search Form */}
        {searchType === 'flights' && (
          <div>
            <Form className="space-y-4" onSubmit={handleFlightSearch}>
            <Autocomplete
              label="Origin"
              placeholder="Where from?"
              className="w-full"
              isRequired
              errorMessage="Please enter an origin city/airport!"
              inputValue={selectedOrigin}
              onInputChange={(value) => {
                setSelectedOrigin(value);
                fetchOriginSuggestions(value);
              }}
              onSelectionChange={(key) => {
                const selected = originSuggestions.find(
                  (item) => `${item.id}-${item.type}` === key
                );
                setSelectedOrigin(selected?.name || '');
              }}
            >
              {originSuggestions.map((item) => (
                <AutocompleteItem key={`${item.id}-${item.type}`}>
                  {item.name}
                </AutocompleteItem>
              ))}
            </Autocomplete>

            <Autocomplete
              label="Destination"
              placeholder="Where to?"
              className="w-full"
              isRequired
              errorMessage="Please enter a destination city/airport!"
              inputValue={selectedDestination}
              onInputChange={(value) => {
                setSelectedDestination(value);
                fetchDestinationSuggestions(value);
              }}
              onSelectionChange={(key) => {
                const selected = destinationSuggestions.find(
                  (item) => `${item.id}-${item.type}` === key
                );
                setSelectedDestination(selected?.name || '');
              }}
            >
              {destinationSuggestions.map((item) => (
                <AutocompleteItem key={`${item.id}-${item.type}`}>
                  {item.name}
                </AutocompleteItem>
              ))}
            </Autocomplete>

            <div className="flex gap-4 w-full">
              <DatePicker
                label="Departure Date"
                className="w-full"
                isRequired
                errorMessage="Departure date must be in the future!"
                showMonthAndYearPickers
                minValue={today(getLocalTimeZone())}
                onChange={(date) => setDepartureDate(date ? date.toString() : '')}
              />
              <DatePicker
                label="Return Date"
                className="w-full"
                minValue={parseDate(departureDate)}
                errorMessage="Return date must be after departure!"
                showMonthAndYearPickers
                isDisabled={!isReturnFlight}
                isRequired={isReturnFlight}
                onChange={(date) => setReturnDate(date ? date.toString() : '')}
              />
            </div>

            <div className='text-center w-full'>
              <Checkbox
                isSelected={isReturnFlight}
                onValueChange={setIsReturnFlight}
                color="default"
                size='sm'
              >
                Round Trip?
              </Checkbox>
            </div>

            <Button 
            className="w-full bg-black text-white py-2 rounded-lg hover:bg-gray-700" 
            type="submit"
            isDisabled={isLoading}
            >{isLoading ? 'Searching...' : 'Search Flights'}
            </Button>

            {error && (
              <div className="text-red-500 text-sm text-center">
                {error}
              </div>
            )}
            </Form>
          </div>
        )}

        

        {/* Hotel Search Form */}
        {searchType === 'hotels' && (
          <div>
            <Form className="space-y-4" onSubmit={handleHotelSearch}>
            <Autocomplete
              label="City"
              placeholder="Enter city"
              className="w-full"
              inputValue={selectedCity}
              isRequired
              errorMessage="Please enter a destination city!"
              onInputChange={(value) => {
                setSelectedCity(value);
                fetchCitySuggestions(value);
              }}
              onSelectionChange={(key) => {
                const selected = citySuggestions.find(
                  (item) => `${item.id}-${item.type}` === key
                );
                setSelectedCity(selected?.name || '');
              }}
            >
              {citySuggestions.map((item) => (
                <AutocompleteItem key={`${item.id}-${item.type}`}>
                  {item.name}
                </AutocompleteItem>
              ))}
            </Autocomplete>

            <DateRangePicker
              label="Stay Dates"
              className="w-full"
              minValue={today(getLocalTimeZone())}
              isRequired
              errorMessage="Stay dates must be in the future!"
              showMonthAndYearPickers
              onChange={(range) => {
                if (range) {
                  setCheckInDate(range.start.toString());
                  setCheckOutDate(range.end.toString());
                }
              }}
            />

            {/* Optional Fields */}
            <Input label="Hotel Name" type="text" size='sm' 
            onChange={(e) => setHotelName(e.target.value)}/>

            <Select
              label="Minimum Star Rating"
              className="w-full"
              size='sm'
              onChange={(e) => setStarRating(e.target.value)}>
              {starRatings.map((rating) => (
                <SelectItem key={rating.key}>
                  {rating.label}
                </SelectItem>
              ))}
            </Select>

            <div className='w-full'>
            <Slider
              className="max-w p-2"
              defaultValue={[500, 1000]}
              formatOptions={{style: "currency", currency: "CAD"}}
              label="Price Range"
              maxValue={1500}
              minValue={0}
              step={20}
              size='sm'
              radius='md'
              classNames={{
                filler: "bg-gradient-to-r from-gray-300 to-black dark:from-white-600 dark:to-gray-800",
                thumb: "bg-gray-300"
              }}
              onChange={(value) => setPriceRange(value as number[])}
            />
            </div>

            <Button className="w-full bg-black text-white py-2 rounded-lg hover:bg-gray-700"
            type='submit'
            isDisabled={isLoading}>
              {isLoading ? 'Searching...' : 'Search Hotels'}
            </Button>

            {error && (
              <div className="text-red-500 text-sm text-center">
                {error}
              </div>
            )}

            </Form>
          </div>
        )}
      </div>
    </div>

    {/* Flight Results */}
    {searchType === 'flights' && flightResults.outbound && flightResults.outbound.length > 0 && (
          <div className="w-full flex flex-col gap-6 items-center pt-10">
            {/* Outbound Flights */}
            <h1 className='text-3xl font-bold mt-5'>Search Results</h1>
            <div className="w-full pr-20 pl-20">
              <h2 className="text-xl font-bold mb-4 border-3 border-gray-800 rounded-full p-5 bg-gray-200 text-gray-800 mb-5">Outbound Flights</h2>
              <div className="max-h-[80vh] overflow-y-auto rounded-lg shadow-lg p-4 overscroll-contain mb-20">
                {flightResults.outbound.map((itinerary, index) => (
                  <FlightCard key={index} itinerary={itinerary} />
                ))}
              </div>
            </div>

            {isReturnFlight && (
              <div className="w-full p-20 pt-5">
                <h2 className="text-xl font-bold mb-4 border-3 border-gray-800 rounded-full p-5 bg-gray-200 text-gray-800 mb-5">Return Flights</h2>
                <div className="max-h-[60vh] overflow-y-auto p-4 rounded-lg shadow-lg overscroll-contain mb-20">
                  {(flightResults.inbound && flightResults.inbound.length > 0) ? (
                    flightResults.inbound.map((itinerary, index) => (
                      <FlightCard key={index} itinerary={itinerary} />
                    ))
                  ) : (
                    <p className="text-red-800 text-xl font-medium text-center">No return flights found :(</p>
                  )}
                </div>
              </div>
            )}
          </div>
      )}

      {searchType === 'flights' && hasSearchedFlights && flightResults.outbound && flightResults.outbound.length === 0 && !isLoading && !error && (
        <div className="w-full flex flex-col gap-6 items-center pt-10 pb-20">
          <p className="text-red-800 text-xl font-medium text-center">
            No flights found :(
          </p>
        </div>
      )}

    
    {searchType === 'hotels' && hotelResults.length > 0 && (
        <div className="w-full flex flex-col gap-6 items-center pt-10 pb-20">
          <h1 className='text-3xl font-bold mt-5'>Hotel Search Results</h1>
          <div className="w-full px-20">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {hotelResults.map((hotel) => (
                <HotelCard key={hotel.id} hotel={hotel} />
              ))}
            </div>
          </div>
        </div>
    )}

    {searchType === 'hotels' && hasSearchedHotels && hotelResults.length === 0 && !isLoading && !error && (
      <div className="w-full flex flex-col gap-6 items-center pt-10 pb-20">
        <p className="text-red-800 text-xl font-medium text-center">
          No hotels found :(
        </p>
      </div>
    )}


    </div>
  );
}