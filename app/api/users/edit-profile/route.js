import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { isString, verifyToken } from "@/middleware/auth"

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
        { error: "Invalid user ID or credentials" },
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

    if ((firstName && (!isString(firstName) || (firstName.trim() === ''))) ||
        (lastName && (!isString(lastName) || (lastName.trim() === ''))) ||
        (email && (!isString(email) || (email.trim() === ''))) ||
        (profilePicture && (!isString(profilePicture) || (profilePicture.trim() === ''))) ||
        (phoneNumber && (!isString(phoneNumber) || (phoneNumber.trim() === '')))) 
    {
      return NextResponse.json(
        { error: 'All user data must be sent as non-empty strings' },
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
      updateData.firstName = firstName.trim();
    }

    if (lastName) {
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

    if (profilePicture) {
      updateData.profilePicture = profilePicture === null ? null : profilePicture.trim();
    }

    if (phoneNumber) {
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