import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SpotifyApi, AccessToken } from '@spotify/web-api-ts-sdk';

const prisma = new PrismaClient();

export async function GET(
  request: Request,
  { params }: { params: { code: string } }
) {
  try {
    const { code } = params;
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    // Find the room
    const room = await prisma.room.findUnique({
      where: { code, active: true },
    });

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    // Get host's session to search using their credentials
    const session = await getServerSession(authOptions);
    const user = session?.user;

    // If we have host credentials, use them
    if (user?.id === room.hostId && user.accessToken && user.refreshToken) {
      const accessToken: AccessToken = {
        access_token: user.accessToken,
        token_type: "Bearer",
        expires_in: 3600,
        refresh_token: user.refreshToken
      };
      const spotifyApi = SpotifyApi.withAccessToken(
        process.env.SPOTIFY_CLIENT_ID!,
        accessToken
      );
      const results = await spotifyApi.search(query, ['track']);
      return NextResponse.json(results);
    }

    // If no host credentials, use client credentials flow
    const clientApi = SpotifyApi.withClientCredentials(
      process.env.SPOTIFY_CLIENT_ID!,
      process.env.SPOTIFY_CLIENT_SECRET!
    );
    const results = await clientApi.search(query, ['track']);
    return NextResponse.json(results);
  } catch (error) {
    console.error('Error searching tracks:', error);
    return NextResponse.json(
      { error: 'Failed to search tracks' },
      { status: 500 }
    );
  }
} 