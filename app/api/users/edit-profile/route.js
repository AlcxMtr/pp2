import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { verifyToken } from "@/middleware/auth"

export async function POST(request) {
  try {
    // Parse request body
    const body = await request.json();
    const { id, firstName, lastName, email, profilePicture, phoneNumber } = body;

    // Authenticate user
    const authResult = verifyToken(request);
    if (authResult instanceof NextResponse) {
      return authResult; // Return error response directly
    }
    const userId = authResult.userId;

    // Check id
    if (!id || id !== userId) {
      return NextResponse.json(
        { error: "Invalid user ID" },
        { status: 400 }
      );
    }

    // Check if at least one field is provided
    if (!firstName && !lastName && !email && !profilePicture && !phoneNumber) {
      return NextResponse.json(
        { error: 'At least one field (firstName, lastName, email, profilePicture, phoneNumber) must be provided' },
        { status: 400 }
      );
    }

    // Fetch current user data
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData = {};

    if (firstName) {
      if (typeof firstName !== 'string' || firstName.trim() === '') {
        return NextResponse.json(
          { error: 'Invalid firstName: must be a non-empty string' },
          { status: 400 }
        );
      }
      updateData.firstName = firstName.trim();
    }

    if (lastName) {
      if (typeof lastName !== 'string' || lastName.trim() === '') {
        return NextResponse.json(
          { error: 'Invalid lastName: must be a non-empty string' },
          { status: 400 }
        );
      }
      updateData.lastName = lastName.trim();
    }

    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: 'Invalid email format' },
          { status: 400 }
        );
      }
      const existingUser = await prisma.user.findFirst({
        where: {
          email,
          NOT: { id: userId },
        },
      });
      if (existingUser) {
        return NextResponse.json(
          { error: 'Email already in use' },
          { status: 409 }
        );
      }
      updateData.email = email;
    }

    if (profilePicture !== undefined) {
      if (profilePicture !== null && (typeof profilePicture !== 'string' || profilePicture.trim() === '')) {
        return NextResponse.json(
          { error: 'Invalid profilePicture: must be a non-empty string or null' },
          { status: 400 }
        );
      }
      updateData.profilePicture = profilePicture === null ? null : profilePicture.trim();
    }

    if (phoneNumber) {
      if (typeof phoneNumber !== 'string' || phoneNumber.trim() === '') {
        return NextResponse.json(
          { error: 'Invalid phoneNumber: must be a non-empty string' },
          { status: 400 }
        );
      }
      updateData.phoneNumber = phoneNumber.trim();
    }

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    const { password: _, ...userWithoutPassword } = updatedUser;
    return NextResponse.json(userWithoutPassword, { status: 200 });
  } catch (error) {
    console.error('Error updating profile:', error.message, error.stack);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}