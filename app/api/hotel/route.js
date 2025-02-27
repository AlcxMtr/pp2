import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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