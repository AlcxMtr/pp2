import { NextResponse } from 'next/server';
import { prisma } from "@/utils/db";
import { verifyToken } from "@/middleware/auth";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const ownerId = parseInt(searchParams.get('ownerId'), 10);
    const roomTypeId = searchParams.get('roomTypeId') ? parseInt(searchParams.get('roomTypeId'), 10) : null;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!ownerId) {
      return NextResponse.json({ error: 'Missing required parameter: ownerId' }, { status: 400 });
    }

    const authResult = verifyToken(request);
    if (authResult instanceof NextResponse) return authResult;
    const authUserId = authResult.userId;

    if (ownerId !== authUserId) {
      return NextResponse.json({ error: "Invalid user ID or credentials" }, { status: 400 });
    }

    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'Missing required parameters: startDate or endDate' }, { status: 400 });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json({ error: 'Invalid date format for startDate or endDate' }, { status: 400 });
    }
    if (start >= end) {
      return NextResponse.json({ error: 'startDate must be before endDate' }, { status: 400 });
    }

    const hotels = await prisma.hotel.findMany({
      where: { ownerId },
      select: { id: true },
    });
    if (!hotels.length) {
      return NextResponse.json({ error: 'No hotels found for this owner' }, { status: 404 });
    }
    const hotelIds = hotels.map(hotel => hotel.id);

    const whereClause = { hotelId: { in: hotelIds } };
    if (roomTypeId) whereClause.id = roomTypeId;

    const roomTypes = await prisma.roomType.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        totalRooms: true,
        pricePerNight: true, // Added
        hotelId: true,
        amenities: { select: { name: true } }, // Fetch amenities
        images: { select: { url: true } }, // Fetch images
      },
    });

    if (!roomTypes.length) {
      return NextResponse.json({ error: 'No room types found' }, { status: 404 });
    }

    const availability = await Promise.all(
      roomTypes.map(async (roomType) => {
        const overlappingBookings = await prisma.hotelBooking.count({
          where: {
            roomTypeId: roomType.id,
            status: 'CONFIRMED',
            OR: [{ checkInDate: { lte: end }, checkOutDate: { gte: start } }],
          },
        });

        const availableRooms = Math.max(0, roomType.totalRooms - overlappingBookings);

        return {
          roomTypeId: roomType.id,
          name: roomType.name,
          totalRooms: roomType.totalRooms,
          pricePerNight: roomType.pricePerNight,
          amenities: roomType.amenities,
          images: roomType.images.map(img => img.url),
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

    return NextResponse.json(response, { status: 200 }); // 201 was incorrect for GET
  } catch (error) {
    console.error('Error fetching room availability:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}