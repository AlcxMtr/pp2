import { NextResponse } from 'next/server';
import { prisma } from "@/utils/db";
import { getAvailableRooms } from '@/utils/availability';


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
  } finally {
    await prisma.$disconnect();
  }
}


export async function GET(req) {
  const checkInDate = req.nextUrl.searchParams.get('checkInDate');
  const checkOutDate = req.nextUrl.searchParams.get('checkOutDate');
  const city = req.nextUrl.searchParams.get('city');
  const name = req.nextUrl.searchParams.get('name');
  const starRating = req.nextUrl.searchParams.get('starRating');
  const minPrice = req.nextUrl.searchParams.get('minPrice');
  const maxPrice = req.nextUrl.searchParams.get('maxPrice');

  if (!checkInDate || !checkOutDate || !city) {
    return NextResponse.json(
      { message: 'Check-in date, check-out date, and hotel city required!' },
      { status: 400 }
    );
  }

  try {
    const hotels = await prisma.hotel.findMany({
      where: {
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