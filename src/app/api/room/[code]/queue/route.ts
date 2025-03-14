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

    // Create Spotify API client with host's tokens
    const accessToken: AccessToken = {
      access_token: room.hostAccessToken,
      token_type: "Bearer",
      expires_in: 3600,
      refresh_token: room.hostRefreshToken
    };

    const spotify = SpotifyApi.withAccessToken(
      process.env.SPOTIFY_CLIENT_ID!,
      accessToken
    );

    // Get queue from Spotify
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

    const spotify = SpotifyApi.withAccessToken(
      process.env.SPOTIFY_CLIENT_ID!,
      accessToken
    );

    // Add track to queue using host's tokens
    const response = await fetch(`https://api.spotify.com/v1/me/player/queue?uri=${trackUri}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${room.hostAccessToken}`,
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: 'No active device found. The host needs to have Spotify open and playing.' },
          { status: 404 }
        );
      }
      throw new Error('Failed to add track to queue');
    }

    return NextResponse.json({ message: 'Track added to queue' });
  } catch (error) {
    console.error('Error adding track to queue:', error);
    return NextResponse.json(
      { error: 'Failed to add track to queue' },
      { status: 500 }
    );
  }
} 