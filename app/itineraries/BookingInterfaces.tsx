// Generated with help from Grok AI

export interface Booking {
  id: number;
  userId: number;
  creditCardNumber?: string;
  cardExpiry?: string;
  invoiceUrl?: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  hotelBooking?: {
    id: number;
    hotelId: number;
    roomTypeId: number;
    checkInDate: string;
    checkOutDate: string;
    status: string;
    itineraryId: number;
    userId: number;
    hotel: {
      id: number;
      name: string;
      logo: string;
      address: string;
      location: string;
      starRating: number;
    };
    roomType: {
      id: number;
      name: string;
      pricePerNight: number;
    };
  };
  flightBooking?: {
    id: number;
    flightBookingRef: string;
    flightTicketNumber: string;
    flightPrice: number;
    status: string;
    itineraryId: number;
    userId: number;
  };
}

export interface UserProfile {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  profilePicture: string;
  phoneNumber: string;
  role: string;
}

// Interface for individual flight status objects within flightStatuses array
export interface FlightStatus {
  flightId: string; // UUID, e.g., "c9355bd2-a5c0-48f9-a5ff-8d8d112c2426"
  flightNumber: string; // e.g., "KL5000"
  origin: string; // UUID in response, but could be city name in context, e.g., "3bb318ef-7f81-4c10-98d7-1a67b80944b8"
  destination: string; // UUID in response, e.g., "370d2633-ba94-47f5-a735-513c0e332224"
  status: string; // e.g., "SCHEDULED"
}

// Main interface for information about flight bookings
export interface FlightBookingInfo {
  flightStatuses: FlightStatus[];
  hasIssues: boolean; // e.g., false
  numLegs: number; // e.g., 1
  origin: string; // City name, e.g., "Frankfurt"
  destination: string; // City name, e.g., "Zurich"
  departureDate: string; // e.g., "2023-10-01T12:00:00Z"
  returnDate: string; // e.g., "2023-10-01T14:00:00Z"
}
