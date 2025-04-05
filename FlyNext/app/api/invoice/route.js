// Made with help from ChatGPT

import { jsPDF } from 'jspdf';
import { NextResponse } from 'next/server';
import { prisma } from "@/utils/db";

export async function POST(request) {
  try {
    const { itineraryId } = await request.json();

    if (!itineraryId || isNaN(itineraryId)) {
      return NextResponse.json(
        { error: 'Missing or invalid itinerary ID' },
        { status: 400 }
      );
    }

    const itinerary = await prisma.itinerary.findUnique({
      where: { id: itineraryId },
      include: {
        user: true,
        hotelBooking: {
          include: {
            hotel: true,
            roomType: true,
          },
        },
        flightBooking: true,
      },
    });

    if (!itinerary) {
      return NextResponse.json(
        { error: 'Itinerary not found' },
        { status: 404 }
      );
    }

    const doc = new jsPDF();
    let y = 20;

    // Title
    doc.setFontSize(22);
    doc.text('Itinerary Summary', 105, y, { align: 'center' });

    y += 15;

    // Payment Summary
    doc.setFontSize(16);
    doc.text('Payment Info', 20, y);
    doc.setFontSize(12);
    y += 8;
    doc.text(`Credit Card: ${itinerary.creditCardNumber}`, 20, y);
    y += 6;
    doc.text(`Expiry: ${itinerary.cardExpiry}`, 20, y);
    y += 6;
    doc.text(`Total Price: $${itinerary.invoiceUrl}`, 20, y);

    y += 12;

    // User Details
    doc.setFontSize(16);
    doc.text('User Information', 20, y);
    doc.setFontSize(12);
    y += 8;
    doc.text(`Name: ${itinerary.user.firstName} ${itinerary.user.lastName}`, 20, y);
    y += 6;
    doc.text(`Email: ${itinerary.user.email}`, 20, y);
    y += 6;
    doc.text(`Phone: ${itinerary.user.phoneNumber}`, 20, y);

    y += 12;

    // Flight Details
    if (itinerary.flightBooking) {
      doc.setFontSize(16);
      doc.text('Flight Booking', 20, y);
      doc.setFontSize(12);
      y += 8;
      doc.text(`Booking Reference: ${itinerary.flightBooking.flightBookingRef}`, 20, y);
      y += 6;
      doc.text(`Ticket Number: ${itinerary.flightBooking.flightTicketNumber}`, 20, y);
      y += 6;
      doc.text(`Price: $${itinerary.flightBooking.flightPrice}`, 20, y);
      y += 12;
    }



    // Hotel Booking
    if (itinerary.hotelBooking) {
      doc.setFontSize(16);
      doc.text('Hotel Booking', 20, y);
      doc.setFontSize(12);
      y += 8;
      doc.text(`Hotel Name: ${itinerary.hotelBooking.hotel.name}`, 20, y);
      y += 6;
      doc.text(`Address: ${itinerary.hotelBooking.hotel.address}`, 20, y);
      y += 6;
      doc.text(`Room Type: ${itinerary.hotelBooking.roomType.name}`, 20, y);
      y += 6;
      doc.text(`Price per Night: $${itinerary.hotelBooking.roomType.pricePerNight}`, 20, y);
      y += 6;
      doc.text(`Check-In: ${new Date(itinerary.hotelBooking.checkInDate).toLocaleDateString()}`, 20, y);
      y += 6;
      doc.text(`Check-Out: ${new Date(itinerary.hotelBooking.checkOutDate).toLocaleDateString()}`, 20, y);
      y += 6;
    }

    // Buffer and response
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="itinerary.pdf"',
      },
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return new NextResponse('Error generating PDF', { status: 500 });
  }
}
