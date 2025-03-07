import { NextResponse } from 'next/server';
import { prisma } from "@/utils/db";
import { verifyToken } from '@/middleware/auth';

// Create a new hotel booking
export async function POST(request) {
  try {
    const body = await request.json();

    const {
      hotelId,
      roomTypeId,
      checkInDate,
      checkOutDate,
      hotelPrice,
      userId,
      status = 'PENDING',
      itineraryId,
    } = body;

    // Validation for required fields
    if (!hotelId || !roomTypeId || !checkInDate || !checkOutDate || !hotelPrice || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields: hotelId, roomTypeId, checkInDate, checkOutDate, hotelPrice, or userId' },
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
        { error: "Invalid user ID" },
        { status: 400 }
      );
    }

    // Check if dates are valid
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format for checkInDate or checkOutDate' },
        { status: 400 }
      );
    }
    if (checkIn >= checkOut) {
      return NextResponse.json(
        { error: 'checkInDate must be before checkOutDate' },
        { status: 400 }
      );
    }

    // hotelPrice must be greater than 0
    if (typeof hotelPrice !== 'number' || hotelPrice <= 0) {
      return NextResponse.json(
        { error: 'hotelPrice must be a positive number' },
        { status: 400 }
      );
    }

    // status must be either PENDING, CONFIRMED, or CANCELLED
    if (!['PENDING', 'CONFIRMED', 'CANCELLED'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status: must be PENDING, CONFIRMED, or CANCELLED' },
        { status: 400 }
      );
    }

    // Do hotel and room type exist?
    const hotel = await prisma.hotel.findUnique({
      where: { id: hotelId },
      include: { owner: true },
    });
    if (!hotel) {
      return NextResponse.json(
        { error: 'Hotel not found' },
        { status: 404 }
      );
    }

    const roomType = await prisma.roomType.findUnique({
      where: { id: roomTypeId },
    });
    if (!roomType || roomType.hotelId !== hotelId) {
      return NextResponse.json(
        { error: 'Room type not found or does not belong to the specified hotel' },
        { status: 404 }
      );
    }

    // Does user exist?
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // is there even availibility?
    const overlappingBookings = await prisma.hotelBooking.count({
      where: {
        roomTypeId: roomTypeId,
        status: 'CONFIRMED',
        OR: [
          {
            checkInDate: { lte: checkOut },
            checkOutDate: { gte: checkIn },
          },
        ],
      },
    });
    if (overlappingBookings >= roomType.totalRooms && status === 'CONFIRMED') {
      return NextResponse.json(
        { error: 'No rooms available for the specified date range' },
        { status: 409 }
      );
    }

    // Itinerary should also be validated here

    const bookingData = {
      hotel: { connect: { id: hotelId } },
      roomType: { connect: { id: roomTypeId } },
      checkInDate: checkIn,
      checkOutDate: checkOut,
      hotelPrice,
      status,
      user: { connect: { id: userId } },
      ...(itineraryId ? { itinerary: { connect: { id: itineraryId } } } : {}),
    };

    const newBooking = await prisma.hotelBooking.create({
      data: bookingData,
      include: {
        hotel: true,
        roomType: true,
        user: true,
        itinerary: !!itineraryId,
      },
    });

    return NextResponse.json(newBooking, { status: 201 });
  } catch (error) {
    console.error('Error creating hotel booking:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Used grok AI for help with this
// GET: hotel bookings for hotels owned by a specific owner
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const ownerId = searchParams.get('ownerId');

    // Validate required fields
    if (!ownerId) {
      return NextResponse.json(
        { error: 'Missing required query parameter: ownerId' },
        { status: 400 }
      );
    }

    const ownerIdNum = parseInt(ownerId);
    if (isNaN(ownerIdNum)) {
      return NextResponse.json(
        { error: 'Invalid ownerId: must be a valid integer' },
        { status: 400 }
      );
    }

    // Does the owner even exist? 
    const ownerExists = await prisma.user.findUnique({
      where: { id: ownerIdNum },
    });

    if (!ownerExists) {
      return NextResponse.json(
        { error: `Owner with ID ${ownerId} does not exist` },
        { status: 404 }
      );
    }
    const hotels = await prisma.hotel.findMany({
      where: { ownerId: ownerIdNum },
      select: { id: true },
    });

    if (hotels.length === 0) {
      return NextResponse.json(
        { message: 'No hotels found for this owner', bookings: [] },
        { status: 201 }
      );
    }

    const hotelIds = hotels.map(hotel => hotel.id);

    const bookings = await prisma.hotelBooking.findMany({
      where: {
        hotelId: { in: hotelIds },
      },
      include: {
        hotel: {
          select: {
            id: true,
            name: true,
            location: true,
          },
        },
        roomType: {
          select: {
            id: true,
            name: true,
            pricePerNight: true,
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        itinerary: {
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        checkInDate: 'asc',
      },
    });

    return NextResponse.json(bookings, { status: 201 });
  } catch (error) {
    console.error('Error fetching hotel bookings:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}