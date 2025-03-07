import { NextResponse } from "next/server";
import { verifyRefreshToken, generateToken } from "@/middleware/auth"

export async function POST(request) {
  try {
    // Validate secrets
    if (!process.env.ACCESS_TOKEN_SECRET || !process.env.REFRESH_TOKEN_SECRET) {
      return NextResponse.json(
        { error: 'Server configuration error: Missing token secrets' },
        { status: 500 }
      );
    }

    const authResult = verifyRefreshToken(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const payload = { userId: authResult.userId };

    // Generate new access token using auth utility
    const newAccessToken = generateToken({
      userId: payload.userId
    });

    return NextResponse.json(
      { accessToken: newAccessToken },
      { status: 200 }
    );
  } catch (error) {
    console.error('Refresh token error:', error.message, error.stack);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}