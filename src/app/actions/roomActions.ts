'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { redirect } from 'next/navigation';

const prisma = new PrismaClient();

export async function createRoom() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    throw new Error('Must be logged in to create a room');
  }

  if (!session.user.accessToken || !session.user.refreshToken) {
    throw new Error('Missing Spotify tokens');
  }

  try {
    // Generate a unique room code
    let roomCode: string;
    let isUnique = false;
    
    while (!isUnique) {
      roomCode = Math.floor(100000 + Math.random() * 900000).toString();
      const existingRoom = await prisma.room.findUnique({
        where: { code: roomCode },
      });
      if (!existingRoom) {
        isUnique = true;
      }
    }

    // Create new room
    const room = await prisma.room.create({
      data: {
        code: roomCode!,
        hostId: session.user.id,
        hostAccessToken: session.user.accessToken,
        hostRefreshToken: session.user.refreshToken,
      },
    });

    redirect(`/room/${room.code}`);
  } catch (error) {
    console.error('Error creating room:', error);
    throw new Error('Failed to create room');
  }
} 