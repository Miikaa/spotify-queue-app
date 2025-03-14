import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SpotifyApi, AccessToken } from '@spotify/web-api-ts-sdk';
import { getHostInfo } from '@/lib/roomManager';
import { getSpotifyApi } from '@/lib/spotify';

const prisma = new PrismaClient();

// GET /api/room/[code]/queue
export async function GET(
  request: Request,
  { params }: { params: { code: string } }
) {
  try {
    const { code } = params;

    // Find the room
    const room = await prisma.room.findUnique({
      where: { code, active: true },
      include: { queue: true },
    });

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    // Get host's session to access their queue
    const session = await getServerSession(authOptions);
    const user = session?.user;

    // Check if the requester is the host and has valid credentials
    if (user && user.id === room.hostId && user.accessToken && user.refreshToken) {
      // If requester is host, get queue from Spotify
      const spotifyApi = getSpotifyApi(user.accessToken, user.refreshToken);
      const playbackState = await spotifyApi.player.getPlaybackState();
      const currentTrack = playbackState?.item;
      
      // Get the next few tracks from our database as Spotify doesn't provide queue info
      const upcomingTracks = await prisma.queue.findMany({
        where: {
          roomId: room.id,
          played: false,
        },
        orderBy: {
          addedAt: 'asc',
        },
        take: 10,
      });

      return NextResponse.json({
        currentTrack,
        queue: upcomingTracks,
      });
    }

    // For guests, return the queue from our database
    return NextResponse.json({ queue: room.queue });
  } catch (error) {
    console.error('Error fetching queue:', error);
    return NextResponse.json(
      { error: 'Failed to fetch queue' },
      { status: 500 }
    );
  }
}

// POST /api/room/[code]/queue
export async function POST(
  request: Request,
  { params }: { params: { code: string } }
) {
  try {
    const { code } = params;

    // Find the room first
    const room = await prisma.room.findUnique({
      where: { code, active: true },
    });

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    const hostInfo = await getHostInfo(code);

    if (!hostInfo) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    const { trackUri, trackName } = await request.json();

    if (!trackUri || !trackName) {
      return NextResponse.json(
        { error: 'Missing track information' },
        { status: 400 }
      );
    }

    const spotifyApi = getSpotifyApi(hostInfo.accessToken, hostInfo.refreshToken);
    await spotifyApi.player.addItemToPlaybackQueue(trackUri);

    // Add track to our database queue
    await prisma.queue.create({
      data: {
        roomId: room.id,
        trackUri,
        trackName,
        addedBy: 'guest',
      },
    });

    return NextResponse.json({ message: 'Track added to queue' });
  } catch (error) {
    console.error('Error adding track to queue:', error);
    return NextResponse.json(
      { error: 'Failed to add track to queue' },
      { status: 500 }
    );
  }
} 