import { NextResponse } from 'next/server';
import { prisma } from "@/utils/db";

export async function GET(request, { params }) {
  try {
    // Extract itineraryId from query params (e.g., ?id=1)
    const { searchParams } = new URL(request.url);
    const itineraryId = parseInt(searchParams.get('id'), 10);

    // Validate itineraryId
    if (!itineraryId || isNaN(itineraryId)) {
      return NextResponse.json(
        { error: 'Missing or invalid itinerary ID' },
        { status: 400 }
      );
    }

    // Fetch itinerary with all related data
    const itinerary = await prisma.itinerary.findUnique({
      where: { id: itineraryId },
      include: {
        user: true, // Include User details
        hotelBooking: {
          include: {
            hotel: true,    // Include Hotel details
            roomType: true, // Include RoomType details
            user: true,     // Include User who made the booking
          },
        },
        flightBooking: {
          include: {
            user: true,     // Include User who made the booking
          },
        },
      },
    });

    // Check if itinerary exists
    if (!itinerary) {
      return NextResponse.json(
        { error: 'Itinerary not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(itinerary, { status: 200 });
  } catch (error) {
    console.error('Error retrieving itinerary:', error.message, error.stack);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}