import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

export async function POST(
  request: Request,
  { params }: { params: { code: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const { code } = params;
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find the room and verify the user is the host
    const room = await prisma.room.findFirst({
      where: {
        code,
        hostId: session.user.id,
        active: true,
      },
    });

    if (!room) {
      return NextResponse.json(
        { error: 'Room not found or user is not host' },
        { status: 404 }
      );
    }

    // Update the room with the latest tokens from session
    await prisma.room.update({
      where: { id: room.id },
      data: {
        hostAccessToken: session.user.accessToken!,
        hostRefreshToken: session.user.refreshToken!,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error syncing tokens:', error);
    return NextResponse.json(
      { error: 'Failed to sync tokens' },
      { status: 500 }
    );
  }
} 