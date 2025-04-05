// Made with the help of ChatGPT

import { NextResponse } from 'next/server';
import { prisma } from "@/utils/db";
import { verifyToken } from "@/middleware/auth"

const AFS_BASE_URL = process.env.AFS_BASE_URL;
const AFS_API_KEY = process.env.AFS_API_KEY;

// Create a new flight booking
export async function POST(request) {
  try {
    const body = await request.json();

    const {
      passportNumber,
      flightIds,      // Array of flight IDs for AFS API
      userId,
      itineraryId,
    } = body;

    // Validation for required fields (ours + AFS API requirements)
    if (!passportNumber || !flightIds || !userId || !itineraryId) {
      return NextResponse.json(
        { error: 'Missing required fields: email, firstName, lastName, passportNumber, flightIds, flightPrice, or userId' },
        { status: 400 }
      );
    }

    // Authenticate user
    const authResult = verifyToken(request);
    if (authResult instanceof NextResponse) {
      return authResult; // Return error response directly
    }
    const authUserId = authResult.userId;

    // Check id
    if (!userId || userId !== authUserId) {
      return NextResponse.json(
        { error: "Invalid user ID or credentials" },
        { status: 400 }
      );
    }

    // Validate flightIds is an array and not empty
    if (!Array.isArray(flightIds) || flightIds.length === 0) {
      return NextResponse.json(
        { error: 'flightIds must be a non-empty array' },
        { status: 400 }
      );
    }

    // Validate the user's existence
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    const email = user.email
    const firstName = user.firstName
    const lastName = user.lastName

    // Validate itinerary's existence
    const itinerary = await prisma.itinerary.findUnique({
      where: { id: itineraryId },
    });
    if (!itinerary) {
      return NextResponse.json(
        { error: 'Itinerary not found' },
        { status: 404 }
      );
    }
  
    // Check for existing booking under this itinerary
    const existingFlightBooking = await prisma.flightBooking.findFirst({
      where: { itineraryId },
    });
    if (existingFlightBooking) {
      // Delete the existing booking since we are replacing it with a new one
      await prisma.$transaction([
        prisma.flightBooking.delete({
          where: { id: existingFlightBooking.id },
        }),
      ]);
    }

    // Call external AFS API to get booking reference
    const afsResponse = await fetch(`${AFS_BASE_URL}/api/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': AFS_API_KEY,
      },
      body: JSON.stringify({
        email,
        firstName,
        flightIds,
        lastName,
        passportNumber,
      }),
    });

    if (!afsResponse.ok) {
      const errorText = await afsResponse.text();
      return NextResponse.json(
        { error: `AFS API error: ${errorText}` },
        { status: afsResponse.status }
      );
    }

    // Remaining data for creating the booking in our DB
    const status = 'CONFIRMED'; // Default status for new bookings

    const afsData = await afsResponse.json();
    const flightBookingRef = afsData.bookingReference;
    const flightTicketNumber = afsData.ticketNumber;

    // Calculate total flight price from flights array
    // TODO: Account for currency conversion
    const flightPrice = afsData.flights.reduce((total, flight) => total + flight.price, 0); 

    // Construct flight booking data
    const bookingData = {
      flightBookingRef,           // From AFS API
      flightTicketNumber,         // From AFS API
      flightPrice,
      status,
      user: { connect: { id: userId } },
      ...(itineraryId ? { itinerary: { connect: { id: itineraryId } } } : {}),
    };

    // Create the flight booking
    const newBooking = await prisma.flightBooking.create({
      data: bookingData,
      include: {
        user: false,
        itinerary: !!itineraryId,
      },
    });

    return NextResponse.json(newBooking, { status: 201 });
  } catch (error) {
    console.error('Error creating flight booking:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}