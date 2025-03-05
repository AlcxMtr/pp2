// This file was created with the help of GROK AI

const { PrismaClient } = require('@prisma/client');
const { createFlightBooking } = require('../app/api/bookings/flight-bookings/route-seed');

const prisma = new PrismaClient();

async function seed() {
  try {
    // Clear existing data (optional)
    await prisma.notification.deleteMany();
    await prisma.flightBooking.deleteMany();
    await prisma.hotelBooking.deleteMany();
    await prisma.itinerary.deleteMany();
    await prisma.roomTypeAmenity.deleteMany();
    await prisma.roomTypeImage.deleteMany();
    await prisma.roomType.deleteMany();
    await prisma.hotelImage.deleteMany();
    await prisma.hotel.deleteMany();
    await prisma.airport.deleteMany();
    await prisma.city.deleteMany();
    await prisma.user.deleteMany();

    // Create Users
    const user1 = await prisma.user.create({
      data: {
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane.doe@example.com',
        password: '$2b$10$KIXe./zGZuMJDvXgW6JqMe8uO6z6sX4Qz5fG9W8gQz5fG9W8gQz5f',
        profilePicture: 'https://example.com/jane.jpg',
        phoneNumber: '123-456-7890',
        role: 'USER',
      },
    });

    const user2 = await prisma.user.create({
      data: {
        firstName: 'John',
        lastName: 'Smith',
        email: 'john.smith@example.com',
        password: '$2b$10$KIXe./zGZuMJDvXgW6JqMe8uO6z6sX4Qz5fG9W8gQz5fG9W8gQz5f',
        profilePicture: 'https://example.com/john.jpg',
        phoneNumber: '987-654-3210',
        role: 'HOTEL_OWNER',
      },
    });

    const user3 = await prisma.user.create({
        data: {
          firstName: 'Kevin',
          lastName: 'Nguyen',
          email: 'kevngu21@example.com',
          password: '$3asdff$KIXe./zGsdfsdfsO6z6sXsffsdf9W8gQzsdf5fasd423',
          profilePicture: 'https://example.com/kev.jpg',
          phoneNumber: '647-123-3265',
          role: 'USER',
        },
      });

    // Create Cities and Airports
    await prisma.city.create({
      data: {
        name: 'Toronto',
        country: 'Canada',
        airports: {
          create: [{ code: 'YYZ', name: 'Toronto Pearson International Airport' }],
        },
      },
    });

    await prisma.city.create({
      data: {
        name: 'Vancouver',
        country: 'Canada',
        airports: {
          create: [{ code: 'YVR', name: 'Vancouver International Airport' }],
        },
      },
    });

    await prisma.city.create({
      data: {
        name: 'Zurich',
        country: 'Switzerland',
        airports: {
          create: [{ code: 'ZRH', name: 'Zurich Airport' }],
        },
      },
    });

    // Create Hotels and Room Types (owned by John)
    const hotel1 = await prisma.hotel.create({
      data: {
        name: 'Grand Hotel',
        logo: 'https://example.com/grand-hotel-logo.png',
        address: '123 Grand St, Toronto, ON',
        location: 'Toronto',
        starRating: 4,
        ownerId: user2.id,
        roomTypes: {
          create: [
            {
              name: 'Deluxe Suite',
              totalRooms: 10,
              pricePerNight: 150.0,
              amenities: { create: [{ name: 'Wi-Fi' }, { name: 'TV' }] },
              images: { create: [{ url: 'https://example.com/deluxe-suite.jpg' }] },
            },
            {
              name: 'Standard Room',
              totalRooms: 20,
              pricePerNight: 100.0,
              amenities: { create: [{ name: 'Wi-Fi' }] },
              images: { create: [{ url: 'https://example.com/standard-room.jpg' }] },
            },
          ],
        },
        images: { create: [{ url: 'https://example.com/grand-hotel.jpg' }] },
      },
    });

    const hotel2 = await prisma.hotel.create({
      data: {
        name: 'Ocean View Resort',
        logo: 'https://example.com/ocean-view-logo.png',
        address: '456 Beach Rd, Vancouver, BC',
        location: 'Vancouver',
        starRating: 5,
        ownerId: user2.id,
        roomTypes: {
          create: [
            {
              name: 'Ocean Suite',
              totalRooms: 5,
              pricePerNight: 300.0,
              amenities: { create: [{ name: 'Wi-Fi' }, { name: 'Balcony' }] },
              images: { create: [{ url: 'https://example.com/ocean-suite.jpg' }] },
            },
          ],
        },
        images: { create: [{ url: 'https://example.com/ocean-view.jpg' }] },
      },
    });

    // Fetch Room Type IDs
    const roomTypes = await prisma.roomType.findMany();
    const deluxeSuiteId = roomTypes.find(rt => rt.name === 'Deluxe Suite').id;
    const standardRoomId = roomTypes.find(rt => rt.name === 'Standard Room').id;
    const oceanSuiteId = roomTypes.find(rt => rt.name === 'Ocean Suite').id;

    // Create Itineraries
    const itinerary1 = await prisma.itinerary.create({
      data: {
        userId: user1.id,
        creditCardNumber: '**** **** **** 1233',
        cardExpiry: '12/25',
        invoiceUrl: '/invoices/itinerary_1.pdf',
        status: "CONFIRMED",
      },
    });

    const itinerary2 = await prisma.itinerary.create({
      data: {
        userId: user2.id,
        creditCardNumber: '**** **** **** 4567',
        cardExpiry: '06/26',
        invoiceUrl: '/invoices/itinerary_2.pdf',
        status: 'CONFIRMED',
      },
    });

    const itinerary3 = await prisma.itinerary.create({
        data: {
          userId: user2.id,
          creditCardNumber: '**** **** **** 4567',
          cardExpiry: '06/26',
          invoiceUrl: '/invoices/itinerary_3.pdf',
          status: 'PENDING',
        },
    });

    
    const itinerary4 = await prisma.itinerary.create({
        data: {
          userId: user3.id,
          creditCardNumber: '**** **** **** 5123',
          cardExpiry: '03/27',
          invoiceUrl: '/invoices/itinerary_4.pdf',
          status: 'PENDING',
        },
    });

    const itinerary5 = await prisma.itinerary.create({
        data: {
          userId: user1.id,
          creditCardNumber: '**** **** **** 1233',
          cardExpiry: '12/25',
          invoiceUrl: '/invoices/itinerary_5.pdf',
          status: "PENDING",
        },
    });
    

    // Create Hotel Bookings
    const hotelBooking1 = await prisma.hotelBooking.create({
      data: {
        userId: user1.id,
        hotelId: hotel1.id,
        roomTypeId: deluxeSuiteId,
        checkInDate: new Date('2025-03-10T14:00:00Z'),
        checkOutDate: new Date('2025-03-12T11:00:00Z'),
        hotelPrice: 300.0,
        status: 'CONFIRMED',
        itineraryId: itinerary1.id,
      },
    });

    const hotelBooking2 = await prisma.hotelBooking.create({
      data: {
        userId: user2.id,
        hotelId: hotel2.id,
        roomTypeId: oceanSuiteId,
        checkInDate: new Date('2025-04-01T15:00:00Z'),
        checkOutDate: new Date('2025-04-03T12:00:00Z'),
        hotelPrice: 600.0,
        status: 'CONFIRMED',
        itineraryId: itinerary2.id,
      },
    });

    const hotelBooking3 = await prisma.hotelBooking.create({
        data: {
          userId: user2.id,
          hotelId: hotel1.id,
          roomTypeId: deluxeSuiteId,
          checkInDate: new Date('2025-03-10T14:00:00Z'),
          checkOutDate: new Date('2025-03-12T11:00:00Z'),
          hotelPrice: 300.0,
          status: 'PENDING',
          itineraryId: itinerary3.id,
        },
    });

    const hotelBooking4 = await prisma.hotelBooking.create({
        data: {
          userId: user3.id,
          hotelId: hotel1.id,
          roomTypeId: standardRoomId,
          checkInDate: new Date('2025-03-12T14:00:00Z'),
          checkOutDate: new Date('2025-03-14T11:00:00Z'),
          hotelPrice: 150.0,
          status: 'PENDING',
          itineraryId: itinerary4.id,
        },
    });

    const hotelBooking5 = await prisma.hotelBooking.create({
        data: {
          userId: user1.id,
          hotelId: hotel1.id,
          roomTypeId: standardRoomId,
          checkInDate: new Date('2025-03-12T14:00:00Z'),
          checkOutDate: new Date('2025-03-14T11:00:00Z'),
          hotelPrice: 150.0,
          status: 'PENDING',
          itineraryId: itinerary5.id,
        },
    });

    // Create Flight Bookings using the API function
    await createFlightBooking({
      passportNumber: '123233333',
      flightIds: [
        'bd7ee4df-004d-4c95-abda-633d276a5842',
        'f572ee8c-7db6-47ef-ac7d-fe1405c31323',
        '4dce2a75-2d6f-4906-a5b0-2d5a5e0c468d',
      ],
      userId: user1.id,
      itineraryId: itinerary1.id,
      status: 'CONFIRMED',
    });

    await createFlightBooking({
        passportNumber: '987654321',
        flightIds: ['4dce2a75-2d6f-4906-a5b0-2d5a5e0c468d'],
        userId: user2.id,
        itineraryId: itinerary2.id,
        status: 'CONFIRMED',
    });

    await createFlightBooking({
        passportNumber: '987654321',
        flightIds: ['f572ee8c-7db6-47ef-ac7d-fe1405c31323'],
        userId: user2.id,
        itineraryId: itinerary3.id,
        status: 'PENDING',
    });


    await createFlightBooking({
        passportNumber: '123515154',
        flightIds: ['bd7ee4df-004d-4c95-abda-633d276a5842'],
        userId: user3.id,
        itineraryId: itinerary4.id,
        status: 'PENDING',
    });


    // Create Notifications (after flight bookings exist)
    const flightBookings = await prisma.flightBooking.findMany();
    const flightBooking1Id = flightBookings[0]?.id;
    const flightBooking2Id = flightBookings[1]?.id;


    await prisma.notification.create({
        data: {
          userId: user1.id,
          message: `Itinerary ${itinerary1.id} checkout completed. Bookings confirmed.`,
          hotelBookingId: hotelBooking1.id,
          flightBookingId: flightBooking1Id,
        },
    });

        
    await prisma.notification.create({
        data: {
          userId: user2.id,
          message: 'Booking made for Deluxe Suite at Grand Hotel.',
          hotelBookingId: hotelBooking1.id,
        },
    });

    await prisma.notification.create({
        data: {
          userId: user2.id,
          message: `Itinerary ${itinerary2.id} checkout completed. Bookings confirmed.`,
          hotelBookingId: hotelBooking2.id,
          flightBookingId: flightBooking2Id,
        },
    });
  
      await prisma.notification.create({
        data: {
          userId: user2.id,
          message: 'Booking made for Ocean Suite at Ocean View Resort.',
          hotelBookingId: hotelBooking2.id,
        },
    });

    console.log('Database seeded successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seed();