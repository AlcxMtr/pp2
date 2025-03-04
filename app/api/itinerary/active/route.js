import { NextResponse } from 'next/server';
import { prisma } from "@/utils/db";

// This route create a new itinerary ONLY if no existing PENDING itinerary exists
// If a PENDING itinerary exists, it returns the PENDING itinerary
// The goal is to return the currently active planning itinerary for the user

export async function POST(request) {
  try {
    const body = await request.json();
    const { userId } = body;

    // Validation for required fields
    if (!userId) {
      return NextResponse.json(
        { error: 'Missing required field: userId' },
        { status: 400 }
      );
    }

    // Validate user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check for existing PENDING itinerary
    const existingPendingItinerary = await prisma.itinerary.findFirst({
      where: {
        userId,
        status: 'PENDING',
      },
      include: {
        hotelBooking: true,
        flightBooking: true,
        user: true,
      },
    });

    // If a PENDING itinerary exists, return it
    if (existingPendingItinerary) {
      return NextResponse.json(existingPendingItinerary, { status: 200 });
    }

    // If no PENDING itinerary exists, create a new one
    const itineraryData = {
      user: { connect: { id: userId } },
      creditCardNumber: null,
      cardExpiry: null,
      invoiceUrl: null,
      status: 'PENDING', // Explicitly set status to PENDING
    };

    const newItinerary = await prisma.itinerary.create({
      data: itineraryData,
      include: {
        user: true,
      },
    });

    return NextResponse.json(newItinerary, { status: 201 });
  } catch (error) {
    console.error('Error creating itinerary:', error.message, error.stack);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}