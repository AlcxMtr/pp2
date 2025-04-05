import { NextResponse } from "next/server";
import { verifyRefreshToken, generateToken } from "@/middleware/auth"

export async function POST(request) {
  try {
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