import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

function generateRoomCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the user's Spotify tokens from the session
    const spotifyAccount = await prisma.account.findFirst({
      where: {
        userId: session.user.id,
        provider: 'spotify',
      },
    });

    if (!spotifyAccount?.access_token || !spotifyAccount?.refresh_token) {
      return NextResponse.json(
        { error: 'Spotify account not connected' },
        { status: 400 }
      );
    }

    // Create or update user
    const user = await prisma.user.upsert({
      where: { id: session.user.id },
      update: {
        name: session.user.name || 'Unknown User',
        email: session.user.email,
        image: session.user.image,
      },
      create: {
        id: session.user.id,
        name: session.user.name || 'Unknown User',
        email: session.user.email,
        image: session.user.image,
      },
    });

    // Generate a unique room code
    let roomCode = generateRoomCode();
    let isUnique = false;
    
    while (!isUnique) {
      const existingRoom = await prisma.room.findUnique({
        where: { code: roomCode },
      });
      if (!existingRoom) {
        isUnique = true;
      } else {
        roomCode = generateRoomCode();
      }
    }

    // Create new room with Spotify tokens
    const room = await prisma.room.create({
      data: {
        code: roomCode,
        hostId: user.id,
        hostAccessToken: spotifyAccount.access_token,
        hostRefreshToken: spotifyAccount.refresh_token,
        active: true,
      },
      include: {
        host: true,
      },
    });

    return NextResponse.json({ room });
  } catch (error) {
    console.error('Error creating room:', error);
    return NextResponse.json(
      { error: 'Failed to create room' },
      { status: 500 }
    );
  }
} 