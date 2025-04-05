// This file was created with the help of GROK AI

const { PrismaClient } = require('@prisma/client');
const { createFlightBooking } = require('../app/api/bookings/flight-bookings/route-seed');
const { hashPassword } = require('../middleware/auth');
const axios = require('axios');

const prisma = new PrismaClient();

const AFS_BASE_URL = process.env.AFS_BASE_URL;
const AFS_API_KEY = process.env.AFS_API_KEY;

async function fetchCities() {
  try {
    const response = await axios.get(`${AFS_BASE_URL}/api/cities`, {
      headers: { 'x-api-key': AFS_API_KEY },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching cities:', error);
    throw error;
  }
}

async function fetchAirports() {
  try {
    const response = await axios.get(`${AFS_BASE_URL}/api/airports`, {
      headers: { 'x-api-key': AFS_API_KEY },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching airports:', error);
    throw error;
  }
}

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
        password: hashPassword('111'),
        profilePicture: 'https://images.unsplash.com/photo-1598550880863-4e8aa3d0edb4?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8cHJvZmlsZSUyMHBpY3R1cmV8ZW58MHx8MHx8fDA%3D',
        phoneNumber: '123-456-7890',
        role: 'USER',
      },
    });

    const user2 = await prisma.user.create({
      data: {
        firstName: 'John',
        lastName: 'Smith',
        email: 'john.smith@example.com',
        password: hashPassword('222'),
        profilePicture: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=2574&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        phoneNumber: '987-654-3210',
        role: 'HOTEL_OWNER',
      },
    });

    const user3 = await prisma.user.create({
        data: {
          firstName: 'Kevin',
          lastName: 'Nguyen',
          email: 'kevngu21@example.com',
          password: hashPassword('333'),
          profilePicture: 'https://images.unsplash.com/photo-1639747280804-dd2d6b3d88ac?q=80&w=2574&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
          phoneNumber: '647-123-3265',
          role: 'USER',
        },
      });


    // Fetch cities and airports from AFS API
    const cities = await fetchCities();
    const airports = await fetchAirports();

    // Populate Cities and Airports
    for (const cityData of cities) {
      const city = await prisma.city.create({
        data: {
          name: cityData.city,
          country: cityData.country,
        },
      });

      // Find airports for this city
      const cityAirports = airports.filter((airport) => airport.city === cityData.city);

      for (const airportData of cityAirports) {
        await prisma.airport.create({
          data: {
            code: airportData.code,
            name: airportData.name,
            cityId: city.id,
          },
        });
      }
    }

    const hotelImages = [
      "https://images.unsplash.com/photo-1455587734955-081b22074882?q=80&w=1920&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1495365200479-c4ed1d35e1aa?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1582719508461-905c673771fd?q=80&w=3124&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    ];
    
    const roomImages = [
      "https://images.unsplash.com/photo-1611892440504-42a792e24d32?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1572987669554-0ba2ba9aee1f?w=2940&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NTh8fGhvdGVsJTIwcm9vbXxlbnwwfHwwfHx8Mg%3D%3D",
      "https://images.unsplash.com/photo-1631049307290-bb947b114627?w=2940&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NjR8fGhvdGVsJTIwcm9vbXxlbnwwfHwwfHx8MA%3D%3D",
      "https://images.unsplash.com/photo-1605346576608-92f1346b67d6?w=2940&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NzF8fGhvdGVsJTIwcm9vbXxlbnwwfHwwfHx8MA%3D%3D",
      "https://images.unsplash.com/photo-1609602126247-4ab7188b4aa1?w=2940&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTA0fHxob3RlbCUyMHJvb218ZW58MHx8MHx8fDA%3D",
    ];
    
    const logoUrl = "https://images.unsplash.com/photo-1667840562960-ecd7c03fc6a7?q=80&w=2960&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";
    
    const hotelCities = [
      "Toronto", "Paris", "New York", "London", "Tokyo",
      "Los Angeles", "Sydney", "Beijing", "Moscow", "Dubai"
    ];
    
    const hotelPrefixes = [
      "Grand", "Royal", "Elite", "Premier", "Luxury",
      "Imperial", "Regal", "Golden", "Plaza", "Majestic", "Prestige", "Central", "Crown", "Park", "Central"
    ];
    
    const hotelTypes = [
      "Hotel", "Inn", "Resort", "Lodge", "Suites"
    ];
    
    const amenitiesList = [
      "Wi-Fi", "TV", "Mini Bar", "Sea View", "Laundry Service",
      "Coffee Maker", "Upgraded Bedding", "In-Room Dining", "Balcony", "Hot Tub"
    ];
    
    function getRandomInt(min, max) {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    
    function getRandomAmenities() {
      const shuffled = amenitiesList.sort(() => 0.5 - Math.random());
      const count = getRandomInt(2, 5); // 2 to 5 amenities
      return shuffled.slice(0, count).map(name => ({ name }));
    }
    
    function generateHotelName(city, index) {
      const prefix = hotelPrefixes[index % hotelPrefixes.length];
      const type = hotelTypes[index % hotelTypes.length];
      return `${prefix} ${city} ${type}`;
    }
    

    const ownerId = user2.id;
  
    const hotels = [];
  
    // Generate 50 hotels
    for (let i = 0; i < 50; i++) {
      const city = hotelCities[i % hotelCities.length]; // Cycle through cities

      function shuffleArr (array){
        for (var i = array.length - 1; i > 0; i--) {
            var rand = Math.floor(Math.random() * (i + 1));
            [array[i], array[rand]] = [array[rand], array[i]]
        }
      }

      shuffleArr(hotelImages);
      
      hotels.push({
        name: generateHotelName(city, getRandomInt(1, 100)),
        logo: logoUrl,
        address: `${getRandomInt(1, 999)} ${city} Boulevard, ${city}`,
        location: city,
        starRating: getRandomInt(1, 5),
        ownerId: ownerId,
        images: {
          create: hotelImages.map(url => ({ url })),
        },
        roomTypes: {
          create: [
            {
              name: "Single",
              totalRooms: getRandomInt(1, 30),
              pricePerNight: 80.0 + (i * 5), // Vary price slightly
              amenities: {
                create: getRandomAmenities(),
              },
              images: {
                create: [roomImages[0], roomImages[1]].map(url => ({ url })),
              },
            },
            {
              name: "Double",
              totalRooms: getRandomInt(10, 20), // 2 to 12 rooms
              pricePerNight: 120.0 + (i * 10),
              amenities: {
                create: getRandomAmenities(),
              },
              images: {
                create: [roomImages[2], roomImages[3]].map(url => ({ url })),
              },
            },
            {
              name: "Suite",
              totalRooms: getRandomInt(1, 10), // 1 to 5 rooms (rarer)
              pricePerNight: 200.0 + (i * 20),
              amenities: {
                create: getRandomAmenities(),
              },
              images: {
                create: [roomImages[4]].map(url => ({ url })),
              },
            },
          ],
        },
      });
    }

    for (const hotel of hotels) {
      await prisma.hotel.create({
        data: hotel,
      });
    }

    // Fetch Room Type IDs
    const roomTypes = await prisma.roomType.findMany();
    const deluxeSuiteId = roomTypes.find(rt => rt.name === 'Suite').id;
    const standardRoomId = roomTypes.find(rt => rt.name === 'Single').id;
    const oceanSuiteId = roomTypes.find(rt => rt.name === 'Double').id;
    hotelsCreated = await prisma.hotel.findMany();
    const hotel1 = hotelsCreated[0];
    const hotel2 = hotelsCreated[1];

    // Create Itineraries
    const itinerary1 = await prisma.itinerary.create({
      data: {
        userId: user1.id,
        creditCardNumber: '**** **** **** 1233',
        cardExpiry: '12/25',
        invoiceUrl: '$1392',
        status: "CONFIRMED",
      },
    });

    const itinerary2 = await prisma.itinerary.create({
      data: {
        userId: user2.id,
        creditCardNumber: '**** **** **** 4567',
        cardExpiry: '06/26',
        invoiceUrl: '$1392',
        status: 'CONFIRMED',
      },
    });

    const itinerary3 = await prisma.itinerary.create({
        data: {
          userId: user2.id,
          creditCardNumber: '**** **** **** 4567',
          cardExpiry: '06/26',
          invoiceUrl: '$1392',
          status: 'PENDING',
        },
    });

    
    const itinerary4 = await prisma.itinerary.create({
        data: {
          userId: user3.id,
          creditCardNumber: '**** **** **** 5123',
          cardExpiry: '03/27',
          invoiceUrl: '$1392',
          status: 'PENDING',
        },
    });

    const itinerary5 = await prisma.itinerary.create({
        data: {
          userId: user1.id,
          creditCardNumber: '**** **** **** 1233',
          cardExpiry: '12/25',
          invoiceUrl: '$1392',
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
          status: 'PENDING',
          itineraryId: itinerary5.id,
        },
    });

    // Create Flight Bookings using the API function
    await createFlightBooking({
      passportNumber: '123233333',
      flightIds: [
        '6bbb4978-6d03-4a11-b752-a3be17f202cb',
        'abebdfe5-77e8-4d43-b277-437e81e311cf',
        'c9355bd2-a5c0-48f9-a5ff-8d8d112c2426'
      ],
      userId: user1.id,
      itineraryId: itinerary1.id,
      status: 'CONFIRMED',
    });

    await createFlightBooking({
        passportNumber: '987654321',
        flightIds: ['abebdfe5-77e8-4d43-b277-437e81e311cf'],
        userId: user2.id,
        itineraryId: itinerary2.id,
        status: 'CONFIRMED',
    });

    await createFlightBooking({
        passportNumber: '987654321',
        flightIds: ['6bbb4978-6d03-4a11-b752-a3be17f202cb'],
        userId: user2.id,
        itineraryId: itinerary3.id,
        status: 'PENDING',
    });


    await createFlightBooking({
        passportNumber: '123515154',
        flightIds: ['6bbb4978-6d03-4a11-b752-a3be17f202cb'],
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