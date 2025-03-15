import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function DELETE() {
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
        active: true,
      },
    });

    if (!room) {
      return NextResponse.json(
        { message: 'No active room found' },
        { status: 404 }
      );
    }

    // Delete all related records first
    await prisma.$transaction([
      // Delete all queue items for the room
      prisma.queue.deleteMany({
        where: { roomId: room.id },
      }),
      // Delete all connected users for the room
      prisma.connectedUser.deleteMany({
        where: { roomId: room.id },
      }),
      // Finally, delete the room itself
      prisma.room.delete({
        where: { id: room.id },
      }),
    ]);

    return NextResponse.json(
      { message: 'Room destroyed successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error destroying room:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 