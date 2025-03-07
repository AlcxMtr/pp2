import { NextResponse } from 'next/server';
import { prisma } from "@/utils/db";
import { verifyToken } from "@/middleware/auth"

// Create a new room type
export async function POST(request) {
  try {
    const body = await request.json();

    const {
      name,
      totalRooms,
      pricePerNight,
      hotelId,
      amenities = [],
      images = [], 
    } = body;

    // Validation for required fields
    if (!name || !totalRooms || !pricePerNight || !hotelId) {
      return NextResponse.json(
        { error: 'Missing required fields: name, totalRooms, pricePerNight, or hotelId' },
        { status: 400 }
      );
    }

    // totalRooms must be greater than 0
    if (!Number.isInteger(totalRooms) || totalRooms <= 0) {
        return NextResponse.json(
          { error: 'totalRooms must be a positive integer' },
          { status: 400 }
        );
      }

    // Price must be greater than 0
    if (typeof pricePerNight !== 'number' || pricePerNight <= 0) {
      return NextResponse.json(
        { error: 'pricePerNight must be a positive number' },
        { status: 400 }
      );
    }

    // Hotel must exist
    const hotel = await prisma.hotel.findUnique({
      where: { id: hotelId },
    });
    if (!hotel) {
      return NextResponse.json(
        { error: 'Hotel not found' },
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
    if (!hotel.ownerId || hotel.ownerId !== authUserId) {
      return NextResponse.json(
        { error: "Invalid Hotel Owner" },
        { status: 400 }
      );
    }

    const roomTypeData = {
      name,
      totalRooms,
      pricePerNight,
      hotelId,
      amenities: {
        create: amenities.map((amenity) => ({
          name: amenity.name,
        })),
      },
      images: {
        create: images.map((image) => ({
          url: image.url,
        })),
      },
    };

    const newRoomType = await prisma.roomType.create({
      data: roomTypeData,
      include: {
        amenities: true,
        images: true,
      },
    });

    return NextResponse.json(newRoomType, { status: 201 });
  } catch (error) {
    console.error('Error creating room type:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}