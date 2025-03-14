import { NextResponse } from 'next/server';
import { getHostInfo } from '@/lib/roomManager';
import { getSpotifyApi } from '@/lib/spotify';

export async function POST(
  request: Request,
  { params }: { params: { code: string } }
) {
  try {
    const { code } = params;
    const hostInfo = await getHostInfo(code);

    if (!hostInfo) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    const spotifyApi = getSpotifyApi(hostInfo.accessToken, hostInfo.refreshToken);
    await spotifyApi.player.skipToNext();

    return NextResponse.json({ message: 'Track skipped' });
  } catch (error) {
    console.error('Error skipping track:', error);
    return NextResponse.json(
      { error: 'Failed to skip track' },
      { status: 500 }
    );
  }
} 