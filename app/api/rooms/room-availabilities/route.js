import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET Fetch room availability for a room type within a date range
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const roomTypeId = parseInt(searchParams.get('roomTypeId'), 10);
    const startDate = searchParams.get('startDate'); // e.g., "2025-03-01"
    const endDate = searchParams.get('endDate'); // e.g., "2025-03-05"

    // Validation for required fields
    if (!roomTypeId || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required parameters: roomTypeId, startDate, or endDate' },
        { status: 400 }
      );
    }

    // Validate date
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format for startDate or endDate' },
        { status: 400 }
      );
    }
    if (start >= end) {
      return NextResponse.json(
        { error: 'startDate must be before endDate' },
        { status: 400 }
      );
    }

    const roomType = await prisma.roomType.findUnique({
      where: { id: roomTypeId },
      select: {
        id: true,
        name: true,
        totalRooms: true,
        hotelId: true,
      },
    });

    if (!roomType) {
      return NextResponse.json(
        { error: 'Room type not found' },
        { status: 404 }
      );
    }

    // Count overlapping bookings
    const overlappingBookings = await prisma.hotelBooking.count({
      where: {
        roomTypeId: roomTypeId,
        status: 'CONFIRMED', // Only count confirmed bookings
        OR: [
          // Booking starts before endDate and ends after startDate
          {
            checkInDate: { lte: end },
            checkOutDate: { gte: start },
          },
        ],
      },
    });

    const availableRooms = Math.max(0, roomType.totalRooms - overlappingBookings);

    const response = {
      roomTypeId: roomType.id,
      name: roomType.name,
      totalRooms: roomType.totalRooms,
      bookedRooms: overlappingBookings,
      availableRooms,
      dateRange: {
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error fetching room availability:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}