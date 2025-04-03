'use client';

import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Input, Button, Card } from '@heroui/react';

interface FlightDetails {
  airline: string;
  flightNumber: string;
  departure: string;
  arrival: string;
  date: string;
}

interface HotelDetails {
  name: string;
  address: string;
  checkIn: string;
  checkOut: string;
}

export default function ItineraryCheckout() {
  const { accessToken } = useAuth();
  const router = useRouter();

  const [payment, setPayment] = useState({
    creditCardNumber: '',
    cardExpiry: '',
  });
  const [loading, setLoading] = useState(false);

  const flightBooking: FlightDetails = {
    airline: 'Air Canada',
    flightNumber: 'AC123',
    departure: 'Toronto (YYZ)',
    arrival: 'San Francisco (SFO)',
    date: '2025-06-15',
  };

  const hotelBooking: HotelDetails = {
    name: 'Grand San Francisco Hotel',
    address: '123 Market Street, San Francisco, CA',
    checkIn: '2025-06-15',
    checkOut: '2025-06-18',
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) {
      alert('Please log in first');
      router.push('/login');
      return;
    }
    if (!payment.creditCardNumber || !payment.cardExpiry) {
      alert('Please fill in all payment details');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payment),
      });
      if (res.ok) {
        alert('Payment successful!');
        router.push('/confirmation');
      } else {
        alert('Payment failed. Please try again.');
      }
    } catch (error) {
      alert('Error processing payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen p-10 bg-gray-100 dark:bg-gray-900">
      <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold mb-6 text-center">Itinerary Checkout</h1>

        <Card className="mb-6 p-4">
          <h2 className="text-xl font-semibold">Flight Details</h2>
          <p><strong>Airline:</strong> {flightBooking.airline}</p>
          <p><strong>Flight:</strong> {flightBooking.flightNumber}</p>
          <p><strong>From:</strong> {flightBooking.departure}</p>
          <p><strong>To:</strong> {flightBooking.arrival}</p>
          <p><strong>Date:</strong> {flightBooking.date}</p>
        </Card>

        <Card className="mb-6 p-4">
          <h2 className="text-xl font-semibold">Hotel Reservation</h2>
          <p><strong>Hotel:</strong> {hotelBooking.name}</p>
          <p><strong>Address:</strong> {hotelBooking.address}</p>
          <p><strong>Check-in:</strong> {hotelBooking.checkIn}</p>
          <p><strong>Check-out:</strong> {hotelBooking.checkOut}</p>
        </Card>

        <form onSubmit={handlePayment} className="space-y-6">
          <Input
            isRequired
            label="Credit Card Number"
            labelPlacement="outside"
            placeholder="Enter card number"
            value={payment.creditCardNumber}
            onChange={(e) => setPayment({ ...payment, creditCardNumber: e.target.value })}
            className="w-full"
          />

          <Input
            isRequired
            label="Card Expiry (MM/YY)"
            labelPlacement="outside"
            placeholder="MM/YY"
            value={payment.cardExpiry}
            onChange={(e) => setPayment({ ...payment, cardExpiry: e.target.value })}
            className="w-full"
          />

          <Button type="submit" disabled={loading} className="w-full bg-blue-600 text-white font-semibold py-2 rounded-lg">
            {loading ? 'Processing...' : 'Confirm & Pay'}
          </Button>
        </form>
      </div>
    </div>
  );
}
