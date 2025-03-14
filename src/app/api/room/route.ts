import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

type QueueItem = {
  id: string;
  trackUri: string;
  trackName: string;
  addedBy: string;
  addedAt: Date;
};

export async function GET(request: Request) {
  try {
    // Get parameters from the URL
    const { searchParams } = new URL(request.url);
    const roomCode = searchParams.get('code');
    const hostId = searchParams.get('hostId');

    // If hostId is provided, find the active room for that host
    if (hostId) {
      const room = await prisma.room.findFirst({
        where: {
          hostId: hostId,
          active: true,
        },
        include: {
          host: true,
          queue: {
            where: { played: false },
            orderBy: { addedAt: 'asc' },
          },
          connectedUsers: true,
        },
      });

      if (!room) {
        return NextResponse.json(
          { error: 'No active room found for host' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        room: {
          id: room.id,
          code: room.code,
          hostId: room.hostId,
          hostName: room.host.name,
          hostImage: room.host.image,
          active: room.active,
          connectedUsers: room.connectedUsers.length,
          queue: room.queue.map(item => ({
            id: item.id,
            trackUri: item.trackUri,
            trackName: item.trackName,
            addedBy: item.addedBy,
            addedAt: item.addedAt,
          })),
        },
      });
    }

    // If roomCode is provided, find that specific room
    if (roomCode) {
      const room = await prisma.room.findUnique({
        where: { code: roomCode },
        include: {
          host: true,
          queue: {
            where: { played: false },
            orderBy: { addedAt: 'asc' },
          },
          connectedUsers: true,
        },
      });

      if (!room) {
        return NextResponse.json(
          { error: 'Room not found' },
          { status: 404 }
        );
      }

      // Check if room is active
      if (!room.active) {
        return NextResponse.json(
          { error: 'Room is no longer active' },
          { status: 400 }
        );
      }

      return NextResponse.json({
        room: {
          id: room.id,
          code: room.code,
          hostId: room.hostId,
          hostName: room.host.name,
          hostImage: room.host.image,
          active: room.active,
          connectedUsers: room.connectedUsers.length + 1, // +1 to include the host
          queue: room.queue.map(item => ({
            id: item.id,
            trackUri: item.trackUri,
            trackName: item.trackName,
            addedBy: item.addedBy,
            addedAt: item.addedAt,
          })),
        },
      });
    }

    return NextResponse.json(
      { error: 'Either roomCode or hostId is required' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error fetching room:', error);
    return NextResponse.json(
      { error: 'Failed to fetch room' },
      { status: 500 }
    );
  }
} 