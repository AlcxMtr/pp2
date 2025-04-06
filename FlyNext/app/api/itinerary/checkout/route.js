import { NextResponse } from 'next/server';
import { prisma } from "@/utils/db";
import { verifyToken } from "@/middleware/auth"

// This API route is responsible for finalizing the checkout process for an itinerary
// It updates the itinerary status to CONFIRMED, as well as the status of any bookings within
// It also sends a notification to the user to confirm the successful checkout

export async function POST(request) {
  try {
    const body = await request.json();
    const { passport, itineraryId, creditCardNumber, cardExpiry, totalCost, flightPresent, destination} = body;

    if (flightPresent) {
      if (!passport || typeof passport !== 'string') {
        return NextResponse.json(
          { error: 'Missing or invalid passport' },
          { status: 400 }
        );
      }

      // Validate passportNumber is a 9-digit number
      const passportRegex = /^\d{9}$/;
      if (!passportRegex.test(passport)) {
        return NextResponse.json(
          { error: 'passportNumber must be a 9-digit number' },
          { status: 400 }
        );
      }
    }

    // Validate required fields
    if (!itineraryId || isNaN(parseInt(itineraryId, 10))) {
      return NextResponse.json(
        { error: 'Missing or invalid itineraryId' },
        { status: 400 }
      );
    }
    if (!creditCardNumber || !cardExpiry) {
      return NextResponse.json(
        { error: 'Missing creditCardNumber or cardExpiry' },
        { status: 400 }
      );
    }

    if (typeof creditCardNumber !== 'string') {
      return NextResponse.json(
        { error: 'creditCardNumber must be a string' },
        { status: 400 }
      );
    }
  
    if (typeof cardExpiry !== 'string') {
      return NextResponse.json(
        { error: 'cardExpiry must be a string' },
        { status: 400 }
      );
    }

    // Validate creditCardNumber (four 4-digit groups, e.g., "2343 0231 1231 1233")
    if (!/^\d{4}\s\d{4}\s\d{4}\s\d{4}$/.test(creditCardNumber.trim())) {
      return NextResponse.json(
      { error: 'Invalid credit card number format. Must be four 4-digit groups separated by spaces (e.g., 4519 0231 1231 1233)' },
      { status: 400 }
      );
    }

    // Validate cardExpiry (MM/YY format)
    if (!/^\d{2}\/\d{2}$/.test(cardExpiry)) {
      return NextResponse.json(
        { error: 'Invalid expiry date format. Must be MM/YY (e.g., 12/25)' },
        { status: 400 }
      );
    }

    // Check if expiry is in the future
    const [month, year] = cardExpiry.split('/').map(Number);
    const expiryDate = new Date(2000 + year, month - 1); // Assuming 20YY
    const currentDate = new Date();
    if (expiryDate <= currentDate) {
      return NextResponse.json(
        { error: 'Card expiry date must be in the future' },
        { status: 400 }
      );
    }

    // Fetch itinerary with related bookings
    const itinerary = await prisma.itinerary.findUnique({
      where: { id: parseInt(itineraryId, 10) },
      include: {
        hotelBooking: true,
        flightBooking: true,
      },
    });

    if (!itinerary) {
      return NextResponse.json(
        { error: 'Itinerary not found' },
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
    if (!itinerary.userId || itinerary.userId !== authUserId) {
      return NextResponse.json(
        { error: "Invalid user ID or credentials" },
        { status: 400 }
      );
    }

    // Check if itinerary is still PENDING
    if (itinerary.status !== 'PENDING') {
        return NextResponse.json(
          { error: `Itinerary is already ${itinerary.status}. Checkout can only be performed on PENDING itineraries.` },
          { status: 400 }
        );
      }

    // Check if there are bookings to finalize
    const hasHotelBooking = itinerary.hotelBooking && itinerary.hotelBooking.status === 'PENDING';
    const hasFlightBooking = itinerary.flightBooking && itinerary.flightBooking.status === 'PENDING';

    if (!hasHotelBooking && !hasFlightBooking) {
      return NextResponse.json(
        { error: 'No pending hotel or flight bookings to finalize' },
        { status: 400 }
      );
    }

    // Check if hotel bookings are still available
    if (hasHotelBooking) {
      const roomTypeId = itinerary.hotelBooking.roomTypeId;

      const roomType = await prisma.roomType.findUnique({
        where: { id: roomTypeId },  
      });

      if (!roomType) {
        return NextResponse.json(
          { error: 'Room type not found or does not belong to the specified hotel' },
          { status: 404 }
        );
      }

      // are they available at that time range?
      const overlappingBookings = await prisma.hotelBooking.count({
        where: {
          roomTypeId: roomTypeId,
          status: 'CONFIRMED',
          OR: [
            {
              checkInDate: { lte: itinerary.hotelBooking.checkOutDate },
              checkOutDate: { gte: itinerary.hotelBooking.checkInDate },
            },
          ],
        },
      });
        
      if (overlappingBookings >= roomType.totalRooms) {
        return NextResponse.json(
          { error: 'No more rooms available for the specified date range' },
          { status: 409 }
        );
      }
    }

    const updates = [];

    // Update itinerary with new completed details
    const lastFourDigits = creditCardNumber.trim().slice(-4);
    updates.push(
      prisma.itinerary.update({
        where: { id: parseInt(itineraryId, 10) },
        data: {
          creditCardNumber: `**** **** **** ${lastFourDigits}`,
          cardExpiry,
          status: 'CONFIRMED',
          invoiceUrl: totalCost
        },
      })
    );

    // Finalize bookings by updating status to CONFIRMED
    if (hasHotelBooking) {
      updates.push(
        prisma.hotelBooking.update({
          where: { id: itinerary.hotelBooking.id },
          data: { status: 'CONFIRMED' },
        })
      );
    }
    if (hasFlightBooking) {
      updates.push(
        prisma.flightBooking.update({
          where: { id: itinerary.flightBooking.id },
          data: { status: 'CONFIRMED' },
        })
      );
    }

    // Execute all updates in a transaction
    await prisma.$transaction(updates);

    // Fetch updated itinerary for response
    const updatedItinerary = await prisma.itinerary.findUnique({
      where: { id: parseInt(itineraryId, 10) },
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

    // Notify user of successful checkout
    await prisma.notification.create({
      data: {
        userId: updatedItinerary.userId,
        message: `Itinerary for trip to ${destination} completed. Total cost: $${totalCost}.`,
        hotelBookingId: hasHotelBooking ? updatedItinerary.hotelBooking.id : null,
        flightBookingId: hasFlightBooking ? updatedItinerary.flightBooking.id : null,
      },
    });


    if (updatedItinerary.hotelBooking) {
      await prisma.notification.create({
        data: {
          userId: updatedItinerary.hotelBooking.hotel.ownerId,
          message: `Booking made for ${updatedItinerary.hotelBooking.roomType.name} at ${updatedItinerary.hotelBooking.hotel.name}.`,
        },
      });
    }

    return NextResponse.json(updatedItinerary, { status: 200 });
  } catch (error) {
    console.error('Error during checkout:', error.message, error.stack);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}