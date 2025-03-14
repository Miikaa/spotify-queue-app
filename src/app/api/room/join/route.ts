import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { roomCode } = await request.json();
    const session = await getServerSession(authOptions);

    // Validate room code
    if (!roomCode || roomCode.length !== 6) {
      return NextResponse.json(
        { error: 'Invalid room code' },
        { status: 400 }
      );
    }

    // Check if room exists with host information
    const room = await prisma.room.findUnique({
      where: { code: roomCode },
      include: {
        host: true,
        connectedUsers: true,
      },
    });

    if (!room) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      );
    }

    // Generate a unique ID for guest users
    const userId = session?.user?.id || `guest-${uuidv4()}`;

    // Update or create connected user entry
    await prisma.connectedUser.upsert({
      where: {
        roomId_userId: {
          roomId: room.id,
          userId: userId,
        },
      },
      update: {
        lastSeen: new Date(),
      },
      create: {
        roomId: room.id,
        userId: userId,
        lastSeen: new Date(),
      },
    });

    // Clean up inactive users (not seen in the last 5 minutes)
    await prisma.connectedUser.deleteMany({
      where: {
        roomId: room.id,
        lastSeen: {
          lt: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
        },
      },
    });

    // Get updated connected users count
    const connectedUsers = await prisma.connectedUser.count({
      where: {
        roomId: room.id,
        lastSeen: {
          gt: new Date(Date.now() - 5 * 60 * 1000), // Active in last 5 minutes
        },
      },
    });

    // Return room info with host details and connected users count
    return NextResponse.json({
      room: {
        code: room.code,
        hostId: room.hostId,
        hostName: room.host.name,
        hostImage: room.host.image,
        connectedUsers: connectedUsers + 1, // +1 to include the host
      },
    });
  } catch (error) {
    console.error('Error joining room:', error);
    return NextResponse.json(
      { error: 'Failed to join room' },
      { status: 500 }
    );
  }
} 