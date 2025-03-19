import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { isString, comparePassword, generateToken, generateRefreshToken } from "@/middleware/auth"

export async function POST(request) {
  try {
    // Parse the request body
    const { email, password } = await request.json();

    // Validate input
    if (!email || !password || !isString(email) || !isString(password)) {
      return NextResponse.json(
        { error: "Email and password are required and must be strings" },
        { status: 400 }
      );
    }

    // Find the user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Compare the provided password with the stored hashed password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Define token payload
    const payload = {
      userId: user.id
    };

    // Generate tokens using auth utilities
    const accessToken = generateToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Return success response with tokens
    return NextResponse.json(
      {
        accessToken,
        refreshToken,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}