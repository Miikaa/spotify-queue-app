import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type QueueItem = {
  id: string;
  trackUri: string;
  trackName: string;
  addedBy: string;
  addedAt: Date;
};

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
    const room = await prisma.$transaction(async (tx) => {
      const userRoom = await tx.room.findFirst({
        where: {
          hostId: session.user.id,
          active: true,
        },
        include: {
          queue: {
            orderBy: {
              addedAt: 'asc',
            },
          },
          connectedUsers: true,
        },
      });

      if (!userRoom) {
        return null;
      }

      // Clean up inactive users
      await tx.connectedUser.deleteMany({
        where: {
          roomId: userRoom.id,
          lastSeen: {
            lt: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
          },
        },
      });

      // Get updated connected users count
      const connectedUsers = await tx.connectedUser.count({
        where: {
          roomId: userRoom.id,
          lastSeen: {
            gt: new Date(Date.now() - 5 * 60 * 1000), // Active in last 5 minutes
          },
        },
      });

      return {
        ...userRoom,
        connectedUsersCount: connectedUsers + 1, // +1 to include the host
      };
    });

    if (!room) {
      return NextResponse.json(
        { message: 'No active room found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ room });
  } catch (error) {
    console.error('Error fetching room:', error);
    return NextResponse.json(
      { error: 'Failed to fetch room' },
      { status: 500 }
    );
  }
} 