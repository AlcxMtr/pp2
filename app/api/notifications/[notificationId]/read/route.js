import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// PUT Mark a notification as read
export async function PUT(request, { params }) {
  try {
    const { notificationId } = params;
    const userId = parseInt(request.nextUrl.searchParams.get('userId'), 10);

    // Validation for required fields
    if (!notificationId || isNaN(parseInt(notificationId))) {
      return NextResponse.json(
        { error: 'Invalid or missing notificationId in path' },
        { status: 400 }
      );
    }
    if (!userId) {
      return NextResponse.json(
        { error: 'Missing required parameter: userId' },
        { status: 400 }
      );
    }

    // Does the notification even exist?
    const notification = await prisma.notification.findUnique({
      where: { id: parseInt(notificationId) },
    });
    if (!notification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }

    // Is it the users notification?
    if (notification.userId !== userId) {
      return NextResponse.json(
        { error: 'You do not have permission to mark this notification as read' },
        { status: 403 }
      );
    }

    // Is it already read?
    if (notification.isRead) {
      return NextResponse.json(
        { message: 'Notification is already marked as read' },
        { status: 200 }
      );
    }

    const updatedNotification = await prisma.notification.update({
      where: { id: parseInt(notificationId) },
      data: { isRead: true },
      include: {
        user: true,
        hotelBooking: true,
        flightBooking: true,
      },
    });

    return NextResponse.json(updatedNotification, { status: 201 });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}