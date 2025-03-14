import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    
    if (session?.user?.accessToken) {
      // Revoke the Spotify access token
      await fetch('https://accounts.spotify.com/api/token/revoke', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `token=${session.user.accessToken}`,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error revoking Spotify token:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
} 