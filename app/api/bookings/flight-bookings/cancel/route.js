import { NextResponse } from 'next/server';
import { prisma } from "@/utils/db";
import { verifyToken } from "@/middleware/auth"

export async function POST(request) {
  try {
    const body = await request.json();
    const { flightBookingId } = body;

    // Validate required flightBookingId
    if (!flightBookingId || isNaN(parseInt(flightBookingId, 10))) {
      return NextResponse.json(
        { error: 'Missing or invalid flightBookingId' },
        { status: 400 }
      );
    }

    // Fetch the flight booking
    const flightBooking = await prisma.flightBooking.findUnique({
      where: { id: parseInt(flightBookingId, 10) },
      include: {
        user: true, // Include user for notification
        itinerary: true, // Include itinerary if linked
      },
    });

    if (!flightBooking) {
      return NextResponse.json(
        { error: 'Flight booking not found' },
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
        { error: "Invalid user ID" },
        { status: 400 }
      );
    }

    // Check if the flight booking is already CANCELLED
    if (flightBooking.status === 'CANCELLED') {
      return NextResponse.json(
        { error: 'Flight booking is already cancelled' },
        { status: 400 }
      );
    }

    // Check if the flight booking is not yet booked
    if (flightBooking.status === 'PENDING') {
        return NextResponse.json(
            { error: 'Flight booking is not yet booked' },
            { status: 400 }
        );
        }

    // Update flight booking status to CANCELLED within a transaction
    const updates = [
      prisma.flightBooking.update({
        where: { id: parseInt(flightBookingId, 10) },
        data: { status: 'CANCELLED' },
      }),
    ];

    // If linked to an itinerary, update its status to CANCELLED as well
    if (flightBooking.itinerary && flightBooking.itinerary.status !== 'CANCELLED') {
      updates.push(
        prisma.itinerary.update({
          where: { id: flightBooking.itineraryId },
          data: { status: 'CANCELLED' },
        })
      );
    }

    // Execute updates in a transaction
    await prisma.$transaction(updates);

    // Send notification to the user
    await prisma.notification.create({
      data: {
        userId: flightBooking.userId,
        message: `Flight booking ${flightBooking.flightBookingRef} has been cancelled.`,
        flightBookingId: flightBooking.id,
      },
    });

    // Fetch updated flight booking for response
    const updatedFlightBooking = await prisma.flightBooking.findUnique({
      where: { id: parseInt(flightBookingId, 10) },
      include: {
        user: true,
        itinerary: true,
      },
    });

    return NextResponse.json(updatedFlightBooking, { status: 200 });
  } catch (error) {
    console.error('Error cancelling flight booking:', error.message, error.stack);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}