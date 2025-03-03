import { NextResponse } from 'next/server';
import { prisma } from "@/utils/db";

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      userId,
      creditCardNumber,
      cardExpiry,
      invoiceUrl,
    } = body;

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

    // Optional field validations
    if (creditCardNumber && typeof creditCardNumber !== 'string') {
      return NextResponse.json(
        { error: 'creditCardNumber must be a string' },
        { status: 400 }
      );
    }

    if (cardExpiry && typeof cardExpiry !== 'string') {
      return NextResponse.json(
        { error: 'cardExpiry must be a string' },
        { status: 400 }
      );
    }

    if (invoiceUrl && typeof invoiceUrl !== 'string') {
      return NextResponse.json(
        { error: 'invoiceUrl must be a string' },
        { status: 400 }
      );
    }

    // Construct itinerary data
    const itineraryData = {
      user: { connect: { id: userId } },
      creditCardNumber: creditCardNumber || null,
      cardExpiry: cardExpiry || null,
      invoiceUrl: invoiceUrl || null,
    };

    // Create the itinerary
    const newItinerary = await prisma.itinerary.create({
      data: itineraryData,
      include: {
        user: true,
      },
    });

    return NextResponse.json(newItinerary, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}