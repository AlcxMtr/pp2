const { NextResponse } = require('next/server');
const { PrismaClient } = require('@prisma/client');
const { stat } = require('fs');
require('dotenv').config();

const prisma = new PrismaClient();

const AFS_BASE_URL = process.env.AFS_BASE_URL;
const AFS_API_KEY = process.env.AFS_API_KEY;

// Reusable function to create a flight booking
async function createFlightBooking({fBookingRef, fTicketNumber, fPrice, passportNumber, flightIds, userId, itineraryId, status}) {
  try {
    // Validation for required fields
    if (!passportNumber || !flightIds || !userId || !itineraryId) {
      throw new Error('Missing required fields: passportNumber, flightIds, userId, or itineraryId');
    }

    if (!Array.isArray(flightIds) || flightIds.length === 0) {
      throw new Error('flightIds must be a non-empty array');
    }

    // Validate user existence
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new Error('User not found');
    }

    const email = user.email;
    const firstName = user.firstName;
    const lastName = user.lastName;

    // Validate itinerary existence
    const itinerary = await prisma.itinerary.findUnique({
      where: { id: itineraryId },
    });
    if (!itinerary) {
      throw new Error('Itinerary not found');
    }

    // Check for existing booking under this itinerary
    const existingFlightBooking = await prisma.flightBooking.findFirst({
      where: { itineraryId },
    });
    if (existingFlightBooking) {
      await prisma.$transaction([
        prisma.flightBooking.delete({
          where: { id: existingFlightBooking.id },
        }),
      ]);
    }

    // Call external AFS API
    const afsResponse = await fetch(`${AFS_BASE_URL}/api/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': AFS_API_KEY,
      },
      body: JSON.stringify({
        email,
        firstName,
        flightIds,
        lastName,
        passportNumber,
      }),
    });
    let flightBookingRef = "";
    let flightTicketNumber = "";
    let flightPrice = 0;
    if (status === "CONFIRMED") {
      if (!afsResponse.ok) {
        const errorText = await afsResponse.text();
        throw new Error(`AFS API error: ${errorText}`);
      }
      const afsData = await afsResponse.json();
      flightBookingRef = afsData.bookingReference;
      flightTicketNumber = afsData.ticketNumber;
      flightPrice = afsData.flights.reduce((total, flight) => total + flight.price, 0);
    } else {
      flightBookingRef = fBookingRef || "N/A";
      flightTicketNumber = fTicketNumber || "N/A";
      flightPrice = fPrice || 0;
    }
    // Construct flight booking data
    const bookingData = {
      flightBookingRef,
      flightTicketNumber,
      flightPrice,
      status,
      user: { connect: { id: userId } },
      itinerary: { connect: { id: itineraryId } },
    };

    // Create the flight booking
    const newBooking = await prisma.flightBooking.create({
      data: bookingData,
      include: {
        user: true,
        itinerary: true,
      },
    });

    return newBooking;
  } catch (error) {
    console.error('Error in createFlightBooking:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

module.exports = { createFlightBooking };