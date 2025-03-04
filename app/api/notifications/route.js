import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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