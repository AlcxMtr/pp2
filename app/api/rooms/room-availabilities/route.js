import { NextResponse } from 'next/server';
import { prisma } from "@/utils/db";
import { verifyToken } from "@/middleware/auth"

// GET Fetch room availability for a room type within a date range
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const ownerId = parseInt(searchParams.get('ownerId'), 10); //helps verify ownership
    const roomTypeId = searchParams.get('roomTypeId') ? parseInt(searchParams.get('roomTypeId'), 10) : null;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Validation for required parameters
    if (!ownerId) {
      return NextResponse.json(
        { error: 'Missing required parameter: ownerId' },
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
    if (!ownerId || ownerId !== authUserId) {
      return NextResponse.json(
        { error: "Invalid user ID or credentials" },
        { status: 400 }
      );
    }

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required parameters: startDate or endDate' },
        { status: 400 }
      );
    }

    // Validate dates
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

    // Does the owner even own any hotels?
    const hotels = await prisma.hotel.findMany({
      where: { ownerId },
      select: { id: true },
    });
    if (!hotels.length) {
      return NextResponse.json(
        { error: 'No hotels found for this owner' },
        { status: 404 }
      );
    }
    const hotelIds = hotels.map(hotel => hotel.id);

    // Get all room types of owner.
    const whereClause = {
      hotelId: { in: hotelIds },
    };
    if (roomTypeId) {
      whereClause.id = roomTypeId;
    }

    const roomTypes = await prisma.roomType.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        totalRooms: true,
        hotelId: true,
      },
    });

    if (!roomTypes.length) {
      return NextResponse.json(
        { error: 'No room types found' },
        { status: 404 }
      );
    }

    // Calculate availability for each room type
    const availability = await Promise.all(
      roomTypes.map(async (roomType) => {
        const overlappingBookings = await prisma.hotelBooking.count({
          where: {
            roomTypeId: roomType.id,
            status: 'CONFIRMED',
            OR: [
              {
                checkInDate: { lte: end },
                checkOutDate: { gte: start },
              },
            ],
          },
        });

        const availableRooms = Math.max(0, roomType.totalRooms - overlappingBookings);

        return {
          roomTypeId: roomType.id,
          name: roomType.name,
          totalRooms: roomType.totalRooms,
          bookedRooms: overlappingBookings,
          availableRooms,
          hotelId: roomType.hotelId,
        };
      })
    );

    const response = {
      availability,
      dateRange: {
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
      },
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error fetching room availability:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}