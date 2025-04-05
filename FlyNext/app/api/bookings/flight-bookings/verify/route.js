import { NextResponse } from 'next/server';
import { prisma } from "@/utils/db";
import { verifyToken } from "@/middleware/auth";

const AFS_BASE_URL = process.env.AFS_BASE_URL;
const AFS_API_KEY = process.env.AFS_API_KEY;

export async function GET(request) {
  try {
    // Extract query parameters (bookingReference and lastName)
    const { searchParams } = new URL(request.url);
    const bookingReference = searchParams.get('bookingReference');
    const lastName = searchParams.get('lastName');

    // Validate query parameters
    if (!bookingReference || !lastName) {
      return NextResponse.json(
        { error: 'Missing bookingReference or lastName' },
        { status: 400 }
      );
    }

    // Fetch flight booking from local database to get userId
    const flightBooking = await prisma.flightBooking.findFirst({
      where: { flightBookingRef: bookingReference },
      include: { user: true },
    });

    if (!flightBooking) {
      return NextResponse.json(
        { error: 'Flight booking not found in local database' },
        { status: 404 }
      );
    }

    // Authenticate user
    const authResult = verifyToken(request);
    if (authResult instanceof NextResponse) {
      return authResult; // Return error response directly
    }
    const authUserId = authResult.userId;

    // Check id
    if (!flightBooking.userId || flightBooking.userId !== authUserId) {
      return NextResponse.json(
        { error: "Invalid user ID or credentials" },
        { status: 400 }
      );
    }

    // Query AFS API
    const afsResponse = await fetch(
      `${AFS_BASE_URL}/api/bookings/retrieve?lastName=${encodeURIComponent(lastName)}&bookingReference=${encodeURIComponent(bookingReference)}`,
      {
        method: 'GET',
        headers: {
          'x-api-key': AFS_API_KEY,
        },
      }
    );

    if (!afsResponse.ok) {
      const errorText = await afsResponse.text();
      return NextResponse.json(
        { error: `AFS API error: ${errorText}` },
        { status: afsResponse.status }
      );
    }

    const afsData = await afsResponse.json();

    // Extract flight statuses
    const flightStatuses = afsData.flights.map(flight => ({
      flightId: flight.id,
      flightNumber: flight.flightNumber,
      status: flight.status,
      departureTime: flight.departureTime,
      originCity: flight.origin.city,
      arrivalTime: flight.arrivalTime,
      destinationCity: flight.destination.city,
    }));

    // Sort by increasing departureTime
    flightStatuses.sort((a, b) => {
      return new Date(a.departureTime) - new Date(b.departureTime);
    });

    const numLegs = afsData.flights.length;
    const departureDate = flightStatuses[0].departureTime;
    const origin = flightStatuses[0].originCity;
    const returnDate = flightStatuses[numLegs - 1].arrivalTime;
    const destination = flightStatuses[numLegs - 1].destinationCity;

    // Check for CANCELLED or DELAYED flights

    let bookingStatus = 'SCHEDULED';
    const cancelledOrDelayed = flightStatuses.filter(
      flight => flight.status !== 'SCHEDULED'
    );

    // If any flights are CANCELLED or DELAYED, create a notification
    if (cancelledOrDelayed.length > 0 && flightBooking) {
      const affectedFlights = cancelledOrDelayed.map(f => `${f.flightNumber} : (${f.status})`).join(', ');
      bookingStatus = cancelledOrDelayed.map(f => `(${f.status})`).join(', ');
      await prisma.notification.create({
        data: {
          userId: flightBooking.userId,
          message: `Flight booking ${bookingReference} has issues: ${affectedFlights}.`,
          flightBookingId: flightBooking.id,
        },
      });
    }

    // Return flight statuses
    return NextResponse.json({
      flightStatuses,
      status: bookingStatus,
      numLegs,
      origin,
      destination,
      departureDate,
      returnDate,
    }, { status: 200 });
  } catch (error) {
    console.error('Error verifying flight booking:', error.message, error.stack);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}