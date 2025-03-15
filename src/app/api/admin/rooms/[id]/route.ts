import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

// Force dynamic to ensure fresh data
export const dynamic = 'force-dynamic';

// We can't use edge runtime with Prisma
// export const runtime = 'edge';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.split(' ')[1];

    if (!token || token !== ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;

    // Delete all queue items for the room
    await prisma.queue.deleteMany({
      where: { roomId: id },
    });

    // Delete the room
    await prisma.room.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Room deleted' });
  } catch (error) {
    console.error('Error deleting room:', error);
    return NextResponse.json(
      { error: 'Failed to delete room' },
      { status: 500 }
    );
  }
} 