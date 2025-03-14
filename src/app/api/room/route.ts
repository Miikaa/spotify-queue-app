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
    const { searchParams } = new URL(request.url);
    const hostId = searchParams.get('hostId');

    if (!hostId) {
      return NextResponse.json({ error: 'Host ID is required' }, { status: 400 });
    }

    // Find active room for the host
    const room = await prisma.room.findFirst({
      where: {
        hostId,
        active: true,
      },
      include: {
        host: true,
      },
    });

    return NextResponse.json({ room });
  } catch (error) {
    console.error('Error fetching room:', error);
    return NextResponse.json(
      { error: 'Failed to fetch room' },
      { status: 500 }
    );
  }
} 