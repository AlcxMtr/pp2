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
      origin,
      destination,
      departureTime,
      price,
      flightIds,      // Array of flight IDs for AFS API
      userId,
      itineraryId,
    } = body;

    // Validation for required fields (ours + AFS API requirements)
    if (!origin || !destination || !departureTime || !price || !flightIds || !userId || !itineraryId) {
      return NextResponse.json(
        { error: 'Missing required fields: origin, destination, departureTime, price, flightIds, userId, itineraryId' },
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

    const itinerary = await prisma.itinerary.findUnique({
      where: { id: itineraryId },
    });

    if (!itinerary) {
      return NextResponse.json(
        { error: 'Itinerary not found' },
        { status: 404 }
      );
    }

    if (itinerary.status !== "PENDING") {
      return NextResponse.json(
        { error: 'Itinerary is not in PENDING status' },
        { status: 400 } // or 403, depending on your use case
      );
    }

    // Temporarily using these to store the origin and destination
    const flightBookingRef = origin + "|" + destination + "|" + departureTime; // Weird, I know... sorry
    const flightTicketNumber = flightIds.join('|'); // Assuming flightIds are unique and can be concatenated
    const flightPrice = price;

    // Check for existing booking under this itinerary
    const existingFlightBooking = await prisma.flightBooking.findFirst({
      where: { itineraryId },
    });

    let same_trip = false;

    // Check if the existing booking is for the same trip
    if (existingFlightBooking) {
      const location = existingFlightBooking.flightBookingRef.split('|');
      const existingOrigin = location[0];
      const existingDestination = location[1];
      same_trip = (origin === existingOrigin && destination === existingDestination);
    }

    let newBooking = null;

    // If the booking already exists and is for the same trip, update it
    if (existingFlightBooking && same_trip) {
      newBooking = await prisma.flightBooking.update({
        where: { id: existingFlightBooking.id },
        data: {
          // Concatenate the new flightTicketNumber with the existing one
          flightTicketNumber: `${existingFlightBooking.flightTicketNumber}|${flightTicketNumber}`,
          // Add the new flightPrice to the existing one
          flightPrice: existingFlightBooking.flightPrice + flightPrice,
        },
        include: {
          user: true,
          itinerary: !!itineraryId, // Include itinerary if itineraryId exists
        },
      });

      return NextResponse.json(newBooking, { status: 200 });
    } else {

      if (existingFlightBooking) {
        await prisma.flightBooking.delete({
          where: { id: existingFlightBooking.id },
        });
      }
      // Construct flight booking data
      const bookingData = {
        flightBookingRef,
        flightTicketNumber,
        flightPrice,
        user: { connect: { id: userId } },
        ...(itineraryId ? { itinerary: { connect: { id: itineraryId } } } : {}),
      };

      // Create the flight booking
      newBooking = await prisma.flightBooking.create({
        data: bookingData,
        include: {
          user: true,
          itinerary: !!itineraryId,
        },
      });

      return NextResponse.json(newBooking, { status: 201 });
    }
  } catch (error) {
    console.error('Error creating flight booking:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}