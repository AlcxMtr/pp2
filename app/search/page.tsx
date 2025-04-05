'use client';

import { useState, useCallback, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import debounce from 'lodash/debounce';
import { Autocomplete, AutocompleteItem, DatePicker, DateRangePicker, Checkbox, Select, SelectItem, Input, Slider, Form, Button, Spinner } from "@heroui/react";
import { getLocalTimeZone, today, parseDate } from "@internationalized/date";
import FlightCard, { FlightItinerary } from '../components/FlightCard';
import HotelCard from '../components/HotelCard';

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
  return (
    <Suspense fallback={<div>Loading search...</div>}>
      <SearchPageInner />
    </Suspense>
  );
}

function SearchPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isUserTriggeredSearch = useRef(false);

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

  useEffect(() => {
    if (isUserTriggeredSearch.current) {
      isUserTriggeredSearch.current = false; // Reset the flag
      return;
    }

    const type = searchParams.get('searchType') as 'flights' | 'hotels' || 'flights';
    setSearchType(type);
    

    if (type === 'flights') {
        const originParam = searchParams.get('origin') || '';
        const destinationParam = searchParams.get('destination') || '';
        const departureDateParam = searchParams.get('departureDate') || today(getLocalTimeZone()).toString();
        const returnDateParam = searchParams.get('returnDate') || '';
        const isReturnParam = !!returnDateParam;

        setSelectedOrigin(originParam);
        setSelectedDestination(destinationParam);
        setDepartureDate(departureDateParam);
        setReturnDate(returnDateParam);
        setIsReturnFlight(isReturnParam);

        if (originParam && destinationParam) {
            // Call search *with* the parameters read from the URL
            handleFlightSearch({
                origin: originParam,
                destination: destinationParam,
                depDate: departureDateParam,
                retDate: returnDateParam,
                isReturn: isReturnParam
            });
        }
    } else if (type === 'hotels') {
         const cityParam = searchParams.get('city') || '';
         const checkInParam = searchParams.get('checkInDate') || '';
         const checkOutParam = searchParams.get('checkOutDate') || '';
         const nameParam = searchParams.get('name') || '';
         const starParam = searchParams.get('starRating') || '';
         const minPriceParam = searchParams.get('minPrice');
         const maxPriceParam = searchParams.get('maxPrice');
         let priceRangeParam: number[] | null = null;
         if (minPriceParam && maxPriceParam) {
            priceRangeParam = [parseInt(minPriceParam), parseInt(maxPriceParam)];
         }

         setSelectedCity(cityParam);
         setCheckInDate(checkInParam);
         setCheckOutDate(checkOutParam);
         setHotelName(nameParam);
         setStarRating(starParam);
         setPriceRange(priceRangeParam);

        if (cityParam && checkInParam && checkOutParam) {
            // Call search *with* the parameters read from the URL
            handleHotelSearch({
                 city: cityParam,
                 checkIn: checkInParam,
                 checkOut: checkOutParam,
                 name: nameParam,
                 star: starParam,
                 price: priceRangeParam
            });
        }
    }
}, [searchParams]);

  // Debounced API calls for suggestions
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

  // Update URL with current flight search parameters
  const updateFlightUrl = () => {
    const params = new URLSearchParams({
      searchType: 'flights',
      origin: selectedOrigin.split(' (')[0],
      destination: selectedDestination.split(' (')[0],
      departureDate,
      ...(isReturnFlight && returnDate ? { returnDate } : {}),
    });
    router.push(`?${params.toString()}`, { scroll: false });
  };

  // Update URL with current hotel search parameters
  const updateHotelUrl = () => {
    const params = new URLSearchParams({
      searchType: 'hotels',
      city: selectedCity,
      checkInDate,
      checkOutDate,
      ...(hotelName ? { name: hotelName } : {}),
      ...(starRating ? { starRating } : {}),
      ...(priceRange ? { minPrice: priceRange[0].toString(), maxPrice: priceRange[1].toString() } : {}),
    });
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const handleFlightSearch = async (
    searchTriggerParams?: { origin: string; destination: string; depDate: string; retDate?: string | null; isReturn: boolean },
    e?: React.FormEvent
  ) => {
    if (e) e.preventDefault(); // Prevent form submission default if event exists

    // Determine values to use: passed params take precedence (from URL load), otherwise use state (from form interaction)
    const originVal = searchTriggerParams?.origin ?? selectedOrigin;
    const destinationVal = searchTriggerParams?.destination ?? selectedDestination;
    const departureDateVal = searchTriggerParams?.depDate ?? departureDate;
    const returnDateVal = searchTriggerParams?.retDate ?? returnDate; // Can be null/undefined
    const isReturnVal = searchTriggerParams?.isReturn ?? isReturnFlight;

    // Basic validation before fetching
    if (!originVal || !destinationVal || !departureDateVal) {
      setError("Please provide your origin, destination, and departure date.");
      return;
    }
    if (isReturnVal && !returnDateVal) {
      setError("Please provide a return date for a round trip.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setHasSearchedFlights(true); // Mark that a search attempt was made

    try {
      const queryParams = new URLSearchParams({
        origin: originVal.split(' (')[0], // Extract code/city if needed
        destination: destinationVal.split(' (')[0], // Extract code/city if needed
        departureDate: departureDateVal,
        ...(isReturnVal && returnDateVal ? { returnDate: returnDateVal } : {}),
      });

      console.log("Fetching flights with params:", queryParams.toString()); // Debug log

      const response = await fetch(`/api/flights?${queryParams.toString()}`);
      if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Failed to fetch flights' }));
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data: FlightSearchResponse = await response.json();
      setFlightResults(data);

      if (!searchTriggerParams) {
        isUserTriggeredSearch.current = true; // Set the flag before updating URL
      }

      // Update URL only if the search was triggered manually (not by initial load)
      if (!searchTriggerParams) {
        updateFlightUrl();
      }

    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching flights. Please try again.');
      setFlightResults({ outbound: null, inbound: null }); // Clear results on error
    } finally {
      setIsLoading(false);
    }
  };

  const handleHotelSearch = async (
    searchTriggerParams?: { city: string; checkIn: string; checkOut: string; name?: string; star?: string; price?: number[] | null },
    e?: React.FormEvent
 ) => {
   if (e) e.preventDefault();

   const cityVal = searchTriggerParams?.city ?? selectedCity;
   const checkInVal = searchTriggerParams?.checkIn ?? checkInDate;
   const checkOutVal = searchTriggerParams?.checkOut ?? checkOutDate;
   const nameVal = searchTriggerParams?.name ?? hotelName;
   const starVal = searchTriggerParams?.star ?? starRating;
   const priceVal = searchTriggerParams?.price ?? priceRange;

   if (!cityVal || !checkInVal || !checkOutVal) {
       setError("Please provide your destination city, check-in date, and check-out date.");
       return;
   }

   setIsLoading(true);
   setError(null);
   setHasSearchedHotels(true);

   try {
     const queryParams = new URLSearchParams({
       city: cityVal,
       checkInDate: checkInVal,
       checkOutDate: checkOutVal,
       ...(nameVal ? { name: nameVal } : {}),
       ...(starVal ? { starRating: starVal } : {}),
       ...(priceVal ? { minPrice: priceVal[0].toString(), maxPrice: priceVal[1].toString() } : {}),
     });

     console.log("Fetching hotels with params:", queryParams.toString()); // Debug log

     const response = await fetch(`/api/hotels?${queryParams.toString()}`);
      if (!response.ok) {
         const errorData = await response.json().catch(() => ({ message: 'Failed to fetch hotels' }));
         throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
     }

     const data: HotelSummary[] = await response.json();
     setHotelResults(data);

      if (!searchTriggerParams) {
        isUserTriggeredSearch.current = true;
      }

      // Update URL only if the search was triggered manually (not by initial load)
      if (!searchTriggerParams) {
            updateHotelUrl();
      }

   } catch (err: any) {
     setError(err.message ||'An error occurred while fetching hotels. Please try again.');
     setHotelResults([]); // Clear results on error
     console.error(err);
   } finally {
     setIsLoading(false);
   }
 };
  

  return (
    <div className='flex flex-col justify-center bg-gray-100 rounded-lg'>
      <div className="flex items-start justify-center p-10 bg-gray-500 dark:bg-gray-900">
        <div className="w-full max-w-2xl bg-white rounded-lg shadow-lg p-6 dark:bg-black">
          {/* Search Type Switch */}
          <div className="flex justify-center mb-6">
            <div className="bg-gray-200 rounded-full p-1 flex gap-1">
              <button
                onClick={() => {
                  setSearchType('flights');
                  router.push('?searchType=flights', { scroll: false });
                }}
                className={`px-4 py-2 rounded-full flex items-center gap-2 ${
                  searchType === 'flights' ? 'bg-black text-white' : 'text-gray-600'
                }`}
              >
                ✈️ Flights
              </button>
              <button
                onClick={() => {
                  setSearchType('hotels');
                  router.push('?searchType=hotels', { scroll: false });
                }}
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
              <Form className="space-y-4" onSubmit={(e) => handleFlightSearch(undefined, e)}>
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
                    value={departureDate ? parseDate(departureDate) : null}
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
                    value={returnDate ? parseDate(returnDate) : null}
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
                  className="w-full bg-black text-white font-semibold py-2 rounded-lg hover:bg-gray-700 hover:text-white dark:bg-white dark:text-black" 
                  type="submit"
                  isDisabled={isLoading}
                >
                  {isLoading ? (
                    <Spinner 
                      classNames={{ label: "text-foreground mt-0 flex" }} 
                      variant="default" 
                      color='default'
                      size="sm"
                    />
                  ) : (
                    'Search Flights'
                  )}
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
              <Form className="space-y-4" onSubmit={(e) => handleHotelSearch(undefined, e)}>
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
                  value={checkInDate && checkOutDate ? {
                    start: parseDate(checkInDate),
                    end: parseDate(checkOutDate),
                  } : null}
                  onChange={(range) => {
                    if (range) {
                      setCheckInDate(range.start.toString());
                      setCheckOutDate(range.end.toString());
                    }
                  }}
                />

                <Input 
                  label="Hotel Name" 
                  type="text" 
                  size='sm' 
                  value={hotelName}
                  onChange={(e) => setHotelName(e.target.value)}
                />

                <Select
                  label="Minimum Star Rating"
                  className="w-full"
                  size='sm'
                  value={starRating}
                  onChange={(e) => setStarRating(e.target.value)}
                >
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
                    value={priceRange || [500, 1000]}
                    onChange={(value) => setPriceRange(value as number[])}
                  />
                </div>

                <Button 
                  className="w-full bg-black text-white font-semibold py-2 rounded-lg hover:bg-gray-700 hover:text-white dark:bg-white dark:text-black"
                  type='submit'
                  isDisabled={isLoading}
                >
                  {isLoading ? (
                    <Spinner 
                      classNames={{ label: "text-foreground mt-0 flex" }} 
                      variant="default" 
                      color='default'
                      size="sm"
                    />
                  ) : (
                    'Search Hotels'
                  )}
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
        <div className="w-full flex flex-col gap-6 items-center pt-10 dark:bg-black">
          <h1 className='text-3xl font-bold mt-5 dark:text-gray-300'>Search Results</h1>
          <div className="w-full pr-20 pl-20">
            <h2 className="text-xl font-bold mb-4 border-3 border-gray-800 rounded-full p-5 bg-gray-200 text-gray-800 mb-5 dark:bg-black dark:text-gray-300 dark:border-gray-300">Outbound Flights</h2>
            <div className="max-h-[80vh] overflow-y-auto rounded-lg shadow-lg p-4 overscroll-contain mb-20 bg-white dark:bg-gray-900">
              {flightResults.outbound.map((itinerary, index) => (
                <FlightCard key={index} itinerary={itinerary} directionOutbound={true} />
              ))}
            </div>
          </div>

          {isReturnFlight && (
            <div className="w-full p-20 pt-5">
              <h2 className="text-xl font-bold mb-4 border-3 border-gray-800 rounded-full p-5 bg-gray-200 text-gray-800 mb-5 dark:bg-black dark:text-gray-300 dark:border-gray-300">Return Flights</h2>
              <div className="max-h-[60vh] overflow-y-auto p-4 rounded-lg shadow-lg overscroll-contain mb-20 bg-white dark:bg-gray-900">
                {(flightResults.inbound && flightResults.inbound.length > 0) ? (
                  flightResults.inbound.map((itinerary, index) => (
                    <FlightCard key={index} itinerary={itinerary} directionOutbound={false} />
                  ))
                ) : (
                  <p className="text-red-800 text-xl font-medium text-center dark:text-red-400">No return flights found :(</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {searchType === 'flights' && hasSearchedFlights && flightResults.outbound && flightResults.outbound.length === 0 && !isLoading && !error && (
        <div className="w-full flex flex-col gap-6 items-center pt-10 pb-20 dark:bg-black">
          <p className="text-red-800 text-xl font-medium text-center dark:text-red-400">
            No flights found :(
          </p>
        </div>
      )}

      {/* Hotel Results */}
      {searchType === 'hotels' && hotelResults.length > 0 && (
        <div className="w-full flex flex-col gap-6 items-center pt-10 pb-20 dark:bg-black">
          <h1 className='text-3xl font-bold mt-5 dark:text-gray-300 mb-10'>Hotel Search Results</h1>
          <div className="w-full px-20">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {hotelResults.map((hotel) => (
                <HotelCard key={hotel.id} hotel={hotel} checkInDate={checkInDate} checkOutDate={checkOutDate}/>
              ))}
            </div>
          </div>
        </div>
      )}

      {searchType === 'hotels' && hasSearchedHotels && hotelResults.length === 0 && !isLoading && !error && (
        <div className="w-full flex flex-col gap-6 items-center pt-10 pb-20 dark:bg-black">
          <p className="text-red-800 text-xl font-medium text-center dark:text-red-400">
            No hotels found :(
          </p>
        </div>
      )}
    </div>
  );
}