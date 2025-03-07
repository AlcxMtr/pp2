import { NextResponse } from 'next/server';
import { prisma } from "@/utils/db";
import { verifyToken } from "@/middleware/auth"

export async function GET(request) {
  try {
    // Extract userId from query parameters (e.g., ?userId=1)
    const { searchParams } = new URL(request.url);
    const userId = parseInt(searchParams.get('userId'), 10);
    
    // Authenticate user
    const authResult = verifyToken(request);
    if (authResult instanceof NextResponse) {
      return authResult; // Return error response directly
    }
    const authUserId = authResult.userId;

    // Check id
    if (!userId || userId !== authUserId) {
      return NextResponse.json(
        { error: "Invalid user ID or credentials" },
        { status: 400 }
      );
    }

    // Validate userId
    if (!userId || isNaN(userId)) {
      return NextResponse.json(
        { error: 'Missing or invalid userId' },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Fetch all itineraries for the user with related bookings
    const itineraries = await prisma.itinerary.findMany({
      where: {
        userId,
        status: {
          not: 'PENDING', // Exclude PENDING itineraries
        },
      },
      include: {
        hotelBooking: {
          include: {
            hotel: true,
            roomType: true,
          },
        },
        flightBooking: true,
        user: true,
      },
    });

    return NextResponse.json(itineraries, { status: 200 });
  } catch (error) {
    console.error('Error retrieving user bookings:', error.message, error.stack);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}