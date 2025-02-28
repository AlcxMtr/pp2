import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// PUT Update the number of available rooms for a room type
export async function PUT(request) {
  try {
    const { searchParams } = new URL(request.url);
    const ownerId = parseInt(searchParams.get('ownerId'), 10);
    const startDate = searchParams.get('startDate'); 
    const endDate = searchParams.get('endDate');

    const body = await request.json();
    const { roomTypeId, newTotalRooms } = body;

    // Validation for required fields
    if (!ownerId) {
      return NextResponse.json(
        { error: 'Missing required parameter: ownerId' },
        { status: 400 }
      );
    }
    if (!roomTypeId || newTotalRooms === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: roomTypeId or newTotalRooms' },
        { status: 400 }
      );
    }

    // newTotalRooms must be greater than 0
    if (!Number.isInteger(newTotalRooms) || newTotalRooms < 0) {
      return NextResponse.json(
        { error: 'newTotalRooms must be a non-negative integer' },
        { status: 400 }
      );
    }

    // Validate dates
    const start = startDate ? new Date(startDate) : new Date('2000-01-01');
    const end = endDate ? new Date(endDate) : new Date('2100-12-31');
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format for startDate or endDate' },
        { status: 400 }
      );
    }
    if (start >= end) {
      return NextResponse.json(
        { error: 'startDate must be before endDate' },
        { status: 400 }
      );
    }

    // Does the room even exist? Is the passed owner even the hotel owner?
    const roomType = await prisma.roomType.findUnique({
      where: { id: roomTypeId },
      include: { hotel: true },
    });
    if (!roomType) {
      return NextResponse.json(
        { error: 'Room type not found' },
        { status: 404 }
      );
    }
    if (roomType.hotel.ownerId !== ownerId) {
      return NextResponse.json(
        { error: 'You do not have permission to update this room type' },
        { status: 403 }
      );
    }

    // Do we need to cancel existing reservations?
    if (newTotalRooms < roomType.totalRooms) {
      const overlappingBookings = await prisma.hotelBooking.findMany({
        where: {
          roomTypeId: roomTypeId,
          status: 'CONFIRMED',
          OR: [
            {
              checkInDate: { lte: end },
              checkOutDate: { gte: start },
            },
          ],
        },
        orderBy: { id: 'desc' }, // Get the most recent ones first 
      });

      const excessBookings = overlappingBookings.length - newTotalRooms;
      if (excessBookings > 0) {
        // Cancel excess
        const bookingsToCancel = overlappingBookings.slice(0, excessBookings);
        await prisma.$transaction(
          bookingsToCancel.map(booking =>
            prisma.hotelBooking.update({
              where: { id: booking.id },
              data: { status: 'CANCELLED' },
            })
          )
        );

        //Notify cancelled users
        await prisma.$transaction(
          bookingsToCancel.map(booking =>
            prisma.notification.create({
              data: {
                userId: booking.userId,
                message: `Your booking for ${roomType.name} from ${booking.checkInDate.toISOString().split('T')[0]} to ${booking.checkOutDate.toISOString().split('T')[0]} has been cancelled due to reduced room availability.`,
                isRead: false,
                hotelBookingId: booking.id,
              },
            })
          )
        );
      }
    }

    const updatedRoomType = await prisma.roomType.update({
      where: { id: roomTypeId },
      data: { totalRooms: newTotalRooms },
      include: {
        hotel: true,
        amenities: true,
        images: true,
      },
    });

    return NextResponse.json(updatedRoomType, { status: 201 });
  } catch (error) {
    console.error('Error updating room availability:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}