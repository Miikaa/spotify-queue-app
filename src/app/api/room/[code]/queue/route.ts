import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { SpotifyApi, AccessToken } from '@spotify/web-api-ts-sdk';

const prisma = new PrismaClient();

interface SpotifyError {
  status: number;
  message: string;
}

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

    // Get queue from Spotify using raw fetch since the SDK doesn't support queue endpoint
    const queueResponse = await fetch('https://api.spotify.com/v1/me/player/queue', {
      headers: {
        'Authorization': `Bearer ${room.hostAccessToken}`,
      },
    });

    let queue = [];
    if (queueResponse.ok) {
      const queueData = await queueResponse.json();
      queue = queueData.queue || [];
    }

    return NextResponse.json({ queue });
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
    const { trackUri } = await request.json();

    // Find the room
    const room = await prisma.room.findUnique({
      where: { code, active: true },
    });

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    // Create Spotify API client with host's tokens
    const accessToken: AccessToken = {
      access_token: room.hostAccessToken,
      token_type: "Bearer",
      expires_in: 3600,
      refresh_token: room.hostRefreshToken
    };

    const spotifyApi = SpotifyApi.withAccessToken(
      process.env.SPOTIFY_CLIENT_ID!,
      accessToken
    );

    try {
      // Add track to queue using Spotify API
      await spotifyApi.player.addItemToPlaybackQueue(trackUri);
      return NextResponse.json({ message: 'Track added to queue' });
    } catch (error) {
      const spotifyError = error as SpotifyError;
      if (spotifyError.status === 404) {
        return NextResponse.json(
          { error: 'No active device found. The host needs to have Spotify open and playing.' },
          { status: 404 }
        );
      }
      throw error;
    }
  } catch (error) {
    console.error('Error adding track to queue:', error);
    return NextResponse.json(
      { error: 'Failed to add track to queue' },
      { status: 500 }
    );
  }
} 