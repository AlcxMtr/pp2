import { NextResponse } from 'next/server';
import { prisma } from "@/utils/db";
import { verifyToken } from '@/middleware/auth';

// POST Cancel a hotel booking
export async function POST(request) {
  try {
    const body = await request.json();
    const { bookingId } = body;

    // Authenticate user
    const authResult = verifyToken(request);
    if (authResult instanceof NextResponse) {
      return authResult; // Return error response directly
    }
    const authUserId = authResult.userId;

    if (!bookingId) {
      return NextResponse.json(
        { error: 'Missing required field: bookingId' },
        { status: 400 }
      );
    }

    // Does booking even exist?
    const booking = await prisma.hotelBooking.findUnique({
      where: { id: bookingId },
      include: { hotel: true },
    });
    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }
    const userId = booking.userId;

    // Check id
    if (!userId || userId !== authUserId) {
      return NextResponse.json(
        { error: "Invalid user ID or credentials" },
        { status: 400 }
      );
    }

    // Is booking in the right state?
    if (booking.status === 'CANCELLED') {
      return NextResponse.json(
        { error: 'Booking is already cancelled' },
        { status: 400 }
      );
    }

    if (booking.status === 'PENDING') {
        return NextResponse.json(
          { error: "Booking hasn't been made yet" },
          { status: 400 }
        );
      }

    const updatedBooking = await prisma.hotelBooking.update({
      where: { id: bookingId },
      data: { status: 'CANCELLED' },
      include: {
        hotel: true,
        roomType: true,
        user: true,
        itinerary: true,
      },
    });

    // Delete the booking from the itinerary if it exists
    if (updatedBooking.itineraryId) {
      await prisma.itinerary.update({
        where: { id: updatedBooking.itineraryId },
        data: {
          hotelBooking: {
            delete: { id: updatedBooking.id },
          },
        },
      });
    }

    return NextResponse.json(updatedBooking, { status: 200 });
  } catch (error) {
    console.error('Error cancelling hotel booking:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}