import { NextResponse } from 'next/server';
import { prisma } from "@/utils/db";
import { getAvailableRooms } from '@/utils/availability';
import { isString, verifyToken } from '@/middleware/auth';

// Create a new hotel
export async function POST(request) {
  try {
    const body = await request.json();

    const {
      name,
      address,
      logo,
      location,
      starRating,
      ownerId, // Passed through auth
      images = [],
    } = body;

    // Validation for required fields
    if (!name || !address || !location || !starRating || !ownerId) {
      return NextResponse.json(
        { error: 'Missing required fields: name, address, location, starRating, or ownerId' },
        { status: 400 }
      );
    }

    if (
      !isString(name) ||
      !isString(address) ||
      !isString(location) ||
      !isString(logo)
    ) {
      return NextResponse.json(
        { error: 'Sent non-string for name, address, location, or logo' },
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

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: ownerId },
      data: { role: 'HOTEL_OWNER' },
    });

    // Star rating must be between 1 and 5
    if (!Number.isInteger(starRating) || starRating < 1 || starRating > 5) {
      return NextResponse.json(
        { error: 'starRating must be an integer between 1 and 5' },
        { status: 400 }
      );
    }

    const hotelData = {
      name,
      address,
      logo,
      location,
      starRating,
      ownerId,
      images: {
        create: images.map((image) => ({
          url: image.url,
        })),
      },
    };

    const newHotel = await prisma.hotel.create({
      data: hotelData,
      include: {
        roomTypes: {
          include: {
            amenities: true,
            images: true,
          },
        },
        bookings: true,
        images: true,
      },
    });

    return NextResponse.json(newHotel, { status: 201 });
  } catch (error) {
    console.error('Error creating hotel:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const checkInDate = searchParams.get('checkInDate');
  const checkOutDate = searchParams.get('checkOutDate');
  const city = searchParams.get('city');
  const name = searchParams.get('name');
  const starRating = searchParams.get('starRating');
  const minPrice = searchParams.get('minPrice');
  const maxPrice = searchParams.get('maxPrice');
  const ownerId = searchParams.get('ownerId');
  const getCities = searchParams.get('getCities') === 'true';

  // If getCities is true, return all unique cities
  if (getCities) {
    try {
      const cities = await prisma.hotel.findMany({
        select: { location: true },
        distinct: ['location'],
      });
      const uniqueCities = cities.map((hotel) => hotel.location).sort();
      return NextResponse.json(uniqueCities);
    } catch (error) {
      console.error('Error fetching cities:', error);
      return NextResponse.json(
        { message: 'Failed to fetch cities' },
        { status: 500 }
      );
    }
  }


  if (!ownerId && (!checkInDate || !checkOutDate || !city)) {
    return NextResponse.json(
      { message: 'Check-in date, check-out date, and hotel city required unless ownerId is provided!' },
      { status: 400 }
    );
  }

  try {
    const hotels = await prisma.hotel.findMany({
      where: {
        ...(ownerId ? { ownerId: parseInt(ownerId) } : {
          location: { contains: city },
          name: name ? { contains: name } : undefined,
          starRating: starRating ? { gte: parseInt(starRating) } : undefined,
          roomTypes: {
            some: {
              pricePerNight: {
                gte: minPrice ? parseFloat(minPrice) : undefined,
                lte: maxPrice ? parseFloat(maxPrice) : undefined,
              },
            },
          },
        }),
      },
      include: {
        roomTypes: {
          select: {
            id: true,
            name: true,
            pricePerNight: true,
            totalRooms: true,
          },
        },
      },
    });

    if (ownerId) {
      return NextResponse.json(hotels);
    }

    const availableHotels = await Promise.all(
      hotels.map(async (hotel) => {
        const availableRoomTypes = await Promise.all(
          hotel.roomTypes.map(async (roomType) => {
            const availableRooms = await getAvailableRooms(
              roomType.id,
              new Date(checkInDate),
              new Date(checkOutDate)
            );
            return { ...roomType, availableRooms };
          })
        );

        // Filter out room types with no availability
        const filteredRoomTypes = availableRoomTypes.filter((room) => room.availableRooms > 0);

        return {
          ...hotel,
          roomTypes: filteredRoomTypes,
        };
      })
    );

    // Filter out hotels with no available rooms
    const results = availableHotels
      .filter((hotel) => hotel.roomTypes.length > 0)
      .map((hotel) => ({
        id: hotel.id,
        name: hotel.name,
        location: hotel.location,
        starRating: hotel.starRating,
        startingPrice: Math.min(...hotel.roomTypes.map((room) => room.pricePerNight)),
        availableRooms: hotel.roomTypes,
      }));

    return NextResponse.json(results);

  } catch (error) {
    console.error('Error searching hotels:', error);
    return NextResponse.json(
      { message: 'Failed to fetch hotels' },
      { status: 500 }
    );
  }
}