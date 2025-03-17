import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { SpotifyApi, AccessToken } from '@spotify/web-api-ts-sdk';

const prisma = new PrismaClient();

export async function POST(
  request: Request,
  { params }: { params: { code: string } }
) {
  try {
    const { code } = params;

    // Find the room and check if it's active
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

    // Skip to next track
    await spotify.player.skipToNext('');

    return NextResponse.json({ message: 'Track skipped' });
  } catch (error) {
    console.error('Error skipping track:', error);
    return NextResponse.json(
      { error: 'Failed to skip track' },
      { status: 500 }
    );
  }
} 