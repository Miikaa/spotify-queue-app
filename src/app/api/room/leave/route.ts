import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { roomCode } = await request.json();
    const session = await getServerSession(authOptions);
    
    // Get the user ID (either from session or generate a guest ID)
    const userId = session?.user?.id || `guest-${uuidv4()}`;

    // Find the room
    const room = await prisma.room.findUnique({
      where: { code: roomCode },
    });

    if (!room) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      );
    }

    // Remove the user from ConnectedUsers
    await prisma.connectedUser.deleteMany({
      where: {
        roomId: room.id,
        userId: userId,
      },
    });

    return NextResponse.json({ message: 'Successfully left the room' });
  } catch (error) {
    console.error('Error leaving room:', error);
    return NextResponse.json(
      { error: 'Failed to leave room' },
      { status: 500 }
    );
  }
} 