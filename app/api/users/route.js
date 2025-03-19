import { NextResponse } from 'next/server';
import { prisma } from "@/utils/db";
import bcrypt from 'bcrypt';
import { isString } from "@/middleware/auth"


// Create a new user
export async function POST(request) {
  try {
    const body = await request.json();

    const {
      firstName,
      lastName,
      email,
      password,
      phoneNumber,
      role = 'USER',
    } = body;

    // Validation for required fields
    if (!firstName || !lastName || !email || !password || !phoneNumber) {
      return NextResponse.json(
        { error: 'Missing required fields: firstName, lastName, email, password, or phoneNumber' },
        { status: 400 }
      );
    }

    // Validate strings
    if (
      !isString(firstName) || (firstName.trim() === '') ||
      !isString(lastName) || (lastName.trim() === '') ||
      !isString(email) || (email.trim() === '') ||
      !isString(password) || (password.trim() === '') ||
      !isString(phoneNumber) || (phoneNumber.trim() === '')
    ) {
      return NextResponse.json(
        { error: "All user data must be sent as non-empty strings" },
        { status: 400 }
      );
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Role can onle be USER or HOTEL_OWNER
    if (!['USER', 'HOTEL_OWNER'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role: must be USER or HOTEL_OWNER' },
        { status: 400 }
      );
    }

    // Email must be unique
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already in use' },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const userData = {
      firstName,
      lastName,
      email,
      password: hashedPassword,
      phoneNumber,
      role,
    };

    const newUser = await prisma.user.create({
      data: userData,
    });

    const { password: _, ...userWithoutPassword } = newUser;
    return NextResponse.json(userWithoutPassword, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}