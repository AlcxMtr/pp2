import axios from 'axios';
import { NextResponse } from 'next/server';

const AFS_BASE_URL = process.env.AFS_BASE_URL;
const AFS_API_KEY = process.env.AFS_API_KEY;

export async function GET(req, { params }) {
  const { 'flight-id': flightId } = await params;
  try {
    const fetchFlights = async () => {
      const url = `${AFS_BASE_URL}/api/flights/${flightId}`;
      const response = await axios.get(url, {
        headers: { 'x-api-key': AFS_API_KEY },
      });
      return response.data;
    };

    const flight = await fetchFlights();
    return NextResponse.json(flight, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: 'Failed to fetch flights', error: error.message },
      { status: 500 }
    );
  }
}