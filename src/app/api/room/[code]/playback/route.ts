import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { AccessToken } from '@spotify/web-api-ts-sdk';

const prisma = new PrismaClient();

interface SpotifyTrack {
  id: string;
  name: string;
  uri: string;
  duration_ms: number;
  artists: {
    name: string;
  }[];
  album: {
    name: string;
    images: {
      url: string;
      width: number;
      height: number;
    }[];
  };
}

interface QueueItem {
  id: string;
  roomId: string;
  trackUri: string;
  trackName: string;
  addedBy: string;
  addedAt: Date;
  played: boolean;
}

interface PlaybackResponse {
  currentTrack: SpotifyTrack | null;
  queue: QueueItem[];
  progress_ms: number;
  is_playing: boolean;
  status: 'ok' | 'no_playback' | 'no_device' | 'host_session_expired' | 'no_premium' | 'error';
  message?: string;
}

async function refreshAccessToken(refreshToken: string): Promise<AccessToken | null> {
  try {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(
          `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
        ).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return {
      access_token: data.access_token,
      token_type: "Bearer",
      expires_in: data.expires_in,
      refresh_token: refreshToken,
    };
  } catch (error) {
    console.error('Error refreshing token:', error);
    return null;
  }
}

export async function GET(
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

    // First try to get playback state directly
    const playbackResponse = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
      headers: {
        'Authorization': `Bearer ${room.hostAccessToken}`,
      },
    });

    console.log('Spotify API Response Status:', playbackResponse.status);

    // Handle different response statuses
    if (playbackResponse.status === 204) {
      const response: PlaybackResponse = {
        currentTrack: null,
        queue: [],
        progress_ms: 0,
        is_playing: false,
        status: 'no_playback',
        message: 'The host needs to start playing music on their Spotify account.',
      };
      return NextResponse.json(response);
    }

    if (playbackResponse.status === 401) {
      // Token expired, try to refresh
      const newToken = await refreshAccessToken(room.hostRefreshToken);
      
      if (!newToken) {
        const response: PlaybackResponse = {
          currentTrack: null,
          queue: [],
          progress_ms: 0,
          is_playing: false,
          status: 'host_session_expired',
          message: 'The host needs to log in to Spotify again.',
        };
        return NextResponse.json(response);
      }

      // Update the room with the new access token
      await prisma.room.update({
        where: { id: room.id },
        data: {
          hostAccessToken: newToken.access_token,
        },
      });

      // Try again with new token
      const retryResponse = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
        headers: {
          'Authorization': `Bearer ${newToken.access_token}`,
        },
      });

      if (!retryResponse.ok && retryResponse.status !== 204) {
        const response: PlaybackResponse = {
          currentTrack: null,
          queue: [],
          progress_ms: 0,
          is_playing: false,
          status: 'error',
          message: 'Please make sure Spotify is open and playing on any device.',
        };
        return NextResponse.json(response);
      }

      if (retryResponse.status === 204) {
        const response: PlaybackResponse = {
          currentTrack: null,
          queue: [],
          progress_ms: 0,
          is_playing: false,
          status: 'no_playback',
          message: 'The host needs to start playing music on their Spotify account.',
        };
        return NextResponse.json(response);
      }

      const playbackState = await retryResponse.json();

      // Get queue from our database
      const queueItems = await prisma.queue.findMany({
        where: {
          roomId: room.id,
          played: false,
        },
        orderBy: {
          addedAt: 'asc',
        },
        take: 10,
      });

      const response: PlaybackResponse = {
        currentTrack: playbackState.item,
        queue: queueItems,
        progress_ms: playbackState.progress_ms,
        is_playing: playbackState.is_playing,
        status: 'ok',
      };

      return NextResponse.json(response);
    }

    if (!playbackResponse.ok) {
      if (playbackResponse.status === 403) {
        const response: PlaybackResponse = {
          currentTrack: null,
          queue: [],
          progress_ms: 0,
          is_playing: false,
          status: 'no_premium',
          message: 'This feature requires the host to have a Spotify Premium account.',
        };
        return NextResponse.json(response);
      }

      const response: PlaybackResponse = {
        currentTrack: null,
        queue: [],
        progress_ms: 0,
        is_playing: false,
        status: 'error',
        message: 'Please make sure Spotify is open and playing on any device.',
      };
      return NextResponse.json(response);
    }

    const playbackData = await playbackResponse.json();

    // Get queue information
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

    const response: PlaybackResponse = {
      currentTrack: playbackData.item,
      queue,
      progress_ms: playbackData.progress_ms,
      is_playing: playbackData.is_playing,
      status: 'ok',
      message: '',
    };
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching playback state:', error);
    const response: PlaybackResponse = {
      currentTrack: null,
      queue: [],
      progress_ms: 0,
      is_playing: false,
      status: 'error',
      message: 'There was an error connecting to the room. Please try again.',
    };
    return NextResponse.json(response);
  }
} 