import { NextResponse } from 'next/server';
import { prisma } from "@/utils/db";
import { getAvailableRooms } from '@/utils/availability';


export async function GET(req, { params }) {
  const { hotelId } = await params;

  const checkInDate = req.nextUrl.searchParams.get('checkInDate');
  const checkOutDate = req.nextUrl.searchParams.get('checkOutDate');

  if (!hotelId) {
    return NextResponse.json(
      { message: 'Missing hotel ID' },
      { status: 400 }
    );
  }

  try {
    const hotel = await prisma.hotel.findUnique({
      where: { id: parseInt(hotelId) },
      include: {
        images: true,
        roomTypes: {
          include: {
            amenities: true,
            images: true,
          },
        },
      },
    });

    if (!hotel) {
      return NextResponse.json(
        { message: 'Hotel not found' },
        { status: 404 }
      );
    }

    // Calculate available rooms for each room type
    const roomTypesWithAvailability = await Promise.all(
      hotel.roomTypes.map(async (roomType) => {
        const availableRooms = checkInDate && checkOutDate
          ? await getAvailableRooms(
              roomType.id,
              new Date(checkInDate),
              new Date(checkOutDate)
            )
          : roomType.totalRooms;

        return {
          ...roomType,
          availableRooms,
        };
      })
    );

    const response = {
      id: hotel.id,
      name: hotel.name,
      location: hotel.location,
      starRating: hotel.starRating,
      address: hotel.address,
      logo: hotel.logo,
      images: hotel.images.map((image) => image.url),
      roomTypes: roomTypesWithAvailability.map((room) => ({
        id: room.id,
        name: room.name,
        pricePerNight: room.pricePerNight,
        availableRooms: room.availableRooms,
        amenities: room.amenities.map((amenity) => amenity.name),
        images: room.images.map((image) => image.url),
      })),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching hotel details:', error);
    return NextResponse.json(
      { message: 'Failed to fetch hotel details' },
      { status: 500 }
    );
  }
}