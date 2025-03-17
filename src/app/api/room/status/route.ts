import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Find the user's active room
    const room = await prisma.room.findFirst({
      where: {
        hostId: session.user.id,
        active: true
      }
    });

    return NextResponse.json({ room });
  } catch (error) {
    console.error('Error checking room status:', error);
    return NextResponse.json(
      { error: 'Failed to check room status' },
      { status: 500 }
    );
  }
} 