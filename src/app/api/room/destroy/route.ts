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

    // Find and delete the user's active room
    await prisma.room.deleteMany({
      where: {
        hostId: session.user.id,
        active: true,
      },
    });

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