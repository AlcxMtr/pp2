import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// POST Cancel a hotel booking
export async function POST(request) {
  try {
    const { searchParams } = new URL(request.url);
    const ownerId = parseInt(searchParams.get('ownerId'), 10);

    const body = await request.json();
    const { bookingId } = body;

    // Validation for required fields
    if (!ownerId) {
      return NextResponse.json(
        { error: 'Missing required parameter: ownerId' },
        { status: 400 }
      );
    }
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

    // Does hotel even belong to owner? 
    if (booking.hotel.ownerId !== ownerId) {
      return NextResponse.json(
        { error: 'You do not have permission to cancel this booking' },
        { status: 403 }
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

    return NextResponse.json(updatedBooking, { status: 200 });
  } catch (error) {
    console.error('Error cancelling hotel booking:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}