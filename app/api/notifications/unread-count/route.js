import { NextResponse } from 'next/server';
import { prisma } from "@/utils/db";
import { verifyToken } from "@/middleware/auth"

// GET Get the number of unread notifications for a user
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = parseInt(searchParams.get('userId'), 10);

    // Validation for required fields
    if (!userId) {
      return NextResponse.json(
        { error: 'Missing required parameter: userId' },
        { status: 400 }
      );
    }

    // Does the user even exist?
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Authenticate user
    const authResult = verifyToken(request);
    if (authResult instanceof NextResponse) {
      return authResult; // Return error response directly
    }
    const authUserId = authResult.userId;

    // Check id
    if (!userId || userId !== authUserId) {
      return NextResponse.json(
        { error: "Invalid user ID or credentials" },
        { status: 400 }
      );
    }

    // Check unread notifications
    const unreadCount = await prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });

    return NextResponse.json({ unreadCount }, { status: 201 });
  } catch (error) {
    console.error('Error fetching unread notification count:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}