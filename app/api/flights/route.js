import axios from 'axios';
import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";

const AFS_BASE_URL = process.env.AFS_BASE_URL;
const AFS_API_KEY = process.env.AFS_API_KEY;

async function getLocation(input) {
    // Check if input is an airport code or name 
    // TODO: Case sensitivity?
    const airport = await prisma.airport.findFirst({
      where: {
        OR: [
          { code: { equals: input } },
          { name: { equals: input } },
        ],
      },
      include: {
        city: true, // Include the associated city
      },
    });
  
    if (airport) {
      return {
        type: 'airport',
        city: airport.city.name,
        airportCode: airport.code, 
      };
    }
  
    const city = await prisma.city.findFirst({ where: { name: { equals: input } } });

    if (city) {
        return { type: 'city', city: city.name };
    }

    return null; // Invalid location
}


export async function GET(req) {
    const origin = req.nextUrl.searchParams.get('origin');
    const destination = req.nextUrl.searchParams.get('destination');
    const departureDate = req.nextUrl.searchParams.get('departureDate');
    const returnDate = req.nextUrl.searchParams.get('returnDate');
  
    if (!origin || !destination || !departureDate) {
      return NextResponse.json({ message: 'Origin, destination, and departure date required!' }, { status: 400 });
    }
  
    try {

      const originLocation = await getLocation(origin);
      const destinationLocation = await getLocation(destination);
  
      if (!originLocation || !destinationLocation) {
        return NextResponse.json({ message: 'Origin/destination location not found!' }, { status: 400 });
      }
  
      const fetchFlights = async (origin, destination, date) => {
        const response = await axios.get(`${AFS_BASE_URL}/api/flights`, {
          params: { origin, destination, date },
          headers: { 'x-api-key': AFS_API_KEY },
        });
        return response.data.results || [];
      };
  
  
      // Validate airports if needed
      const validateAirports = (flights, originLocation, destinationLocation) => {
        return flights.filter((flight) => {
          if (!flight.flights || flight.flights.length === 0) return false;
      
          const firstLeg = flight.flights[0];
          const lastLeg = flight.flights[flight.flights.length - 1];
      
          const matchesOrigin =
            originLocation.type === 'airport' ? firstLeg.origin.code === originLocation.airportCode : true;
      
          const matchesDestination =
            destinationLocation.type === 'airport' ? lastLeg.destination.code === destinationLocation.airportCode : true;
      
          return matchesOrigin && matchesDestination;
        });
      };
  
      let outboundFlights = await fetchFlights(originLocation.city, destinationLocation.city, departureDate);
      outboundFlights = validateAirports(outboundFlights, originLocation, destinationLocation);
  
      let inboundFlights = null;
      if (returnDate) {
        inboundFlights = await fetchFlights(destinationLocation.city, originLocation.city, returnDate);
        inboundFlights = validateAirports(inboundFlights, destinationLocation, originLocation);
      }
  
      return NextResponse.json({
        outbound: outboundFlights,
        inbound: inboundFlights,
      });
    } catch (error) {
      console.error('Error fetching flights:', error);
      return NextResponse.json({ message: 'Failed to fetch flights' }, { status: 500 });
    }
}