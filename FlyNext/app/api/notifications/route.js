import { NextResponse } from 'next/server';
import { prisma } from "@/utils/db";
import { verifyToken } from "@/middleware/auth"

// POST  Create a new notification
export async function POST(request) {
  try {
    const body = await request.json();

    const {
      userId,
      message,
      hotelBookingId,
      flightBookingId,
      isRead = false,
    } = body;

    // Validation for required fields
    if (!userId || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: userId or message' },
        { status: 400 }
      );
    }

    // Does the user even exist?
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
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
    if (!userId || userId !== authUserId) {
      return NextResponse.json(
        { error: "Invalid user ID or credentials" },
        { status: 400 }
      );
    }

    // Is the hotel booking valid?
    if (hotelBookingId) {
      const booking = await prisma.hotelBooking.findUnique({
        where: { id: hotelBookingId },
      });
      if (!booking) {
        return NextResponse.json(
          { error: 'Hotel booking not found' },
          { status: 404 }
        );
      }
    }

    // Is the flight booking valid?
    // flight booking code

    // One notification per hotel booking/flight booking
    if (hotelBookingId && flightBookingId) {
      return NextResponse.json(
        { error: 'Cannot link notification to both hotelBookingId and flightBookingId' },
        { status: 400 }
      );
    }

    const notificationData = {
      userId,
      message,
      isRead,
      ...(hotelBookingId ? { hotelBookingId } : {}),
      ...(flightBookingId ? { flightBookingId } : {}),
    };

    const newNotification = await prisma.notification.create({
      data: notificationData,
      include: {
        user: true,
        hotelBooking: !!hotelBookingId,
        flightBooking: !!flightBookingId,
      },
    });

    return NextResponse.json(newNotification, { status: 201 });
  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET Fetch all notifications for a user
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = parseInt(searchParams.get('userId') || '', 10);

    if (!userId) {
      return NextResponse.json({ error: 'Missing required parameter: userId' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const authResult = verifyToken(request);
    if (authResult instanceof NextResponse) return authResult;
    const authUserId = authResult.userId;

    if (userId !== authUserId) {
      return NextResponse.json({ error: "Invalid user ID or credentials" }, { status: 400 });
    }

    const notifications = await prisma.notification.findMany({
      where: { userId },
      include: { hotelBooking: true, flightBooking: true },
    });

    return NextResponse.json(notifications, { status: 200 });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}