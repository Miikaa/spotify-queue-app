'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { SpotifyApi, AccessToken } from '@spotify/web-api-ts-sdk';
import Image from 'next/image';

interface CurrentTrackProps {
  roomCode: string;
  isHost: boolean;
}

interface Track {
  id: string;
  name: string;
  artists: { name: string }[];
  album: {
    name: string;
    images: { url: string }[];
  };
  duration_ms: number;
}

export default function CurrentTrack({ roomCode, isHost }: CurrentTrackProps) {
  const { data: session } = useSession();
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState('');
  const [deviceId, setDeviceId] = useState<string | null>(null);

  useEffect(() => {
    if (!isHost || !session?.user?.accessToken) return;

    const fetchDevices = async (spotify: SpotifyApi) => {
      const devices = await spotify.player.getAvailableDevices();
      const activeDevice = devices.devices.find(device => device.is_active);
      if (activeDevice?.id) {
        setDeviceId(activeDevice.id);
      }
    };

    const fetchCurrentTrack = async () => {
      try {
        const accessToken: AccessToken = {
          access_token: session.user.accessToken,
          token_type: "Bearer",
          expires_in: 3600,
          refresh_token: session.user.refreshToken || '',
        };

        const spotify = SpotifyApi.withAccessToken(
          process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID!,
          accessToken
        );

        await fetchDevices(spotify);
        const response = await spotify.player.getCurrentlyPlayingTrack();
        if (response && response.item) {
          setCurrentTrack(response.item as Track);
          setIsPlaying(response.is_playing);
        }
      } catch (err) {
        console.error('Error fetching current track:', err);
        setError('Failed to fetch current track');
      }
    };

    fetchCurrentTrack();
    const interval = setInterval(fetchCurrentTrack, 5000);

    return () => clearInterval(interval);
  }, [isHost, session]);

  const handlePlayPause = async () => {
    if (!session?.user?.accessToken) return;

    try {
      const accessToken: AccessToken = {
        access_token: session.user.accessToken,
        token_type: "Bearer",
        expires_in: 3600,
        refresh_token: session.user.refreshToken || '',
      };

      const spotify = SpotifyApi.withAccessToken(
        process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID!,
        accessToken
      );

      if (isPlaying) {
        await spotify.player.pausePlayback(deviceId || '');
      } else {
        await spotify.player.startResumePlayback(deviceId || '');
      }
      setIsPlaying(!isPlaying);
    } catch (err) {
      console.error('Error controlling playback:', err);
      setError('Failed to control playback');
    }
  };

  const handleSkip = async () => {
    if (!session?.user?.accessToken) return;

    try {
      const accessToken: AccessToken = {
        access_token: session.user.accessToken,
        token_type: "Bearer",
        expires_in: 3600,
        refresh_token: session.user.refreshToken || '',
      };

      const spotify = SpotifyApi.withAccessToken(
        process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID!,
        accessToken
      );

      await spotify.player.skipToNext(deviceId || '');

      // Fetch the new current track after skipping
      const response = await spotify.player.getCurrentlyPlayingTrack();
      if (response && response.item) {
        setCurrentTrack(response.item as Track);
        setIsPlaying(response.is_playing);
      }
    } catch (err) {
      console.error('Error skipping track:', err);
      setError('Failed to skip track');
    }
  };

  if (!currentTrack) {
    return (
      <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800">
        <p className="text-gray-400">
          {error || (isHost ? 'No track playing' : 'Waiting for host to play music...')}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800">
      <h2 className="text-xl font-semibold text-white mb-4">Now Playing</h2>
      <div className="flex items-center space-x-4">
        {currentTrack.album.images[0] && (
          <Image
            src={currentTrack.album.images[0].url}
            alt={currentTrack.album.name}
            width={96}
            height={96}
            className="rounded-md"
          />
        )}
        <div className="flex-1">
          <h3 className="text-lg font-medium text-white">{currentTrack.name}</h3>
          <p className="text-gray-400">
            {currentTrack.artists.map(artist => artist.name).join(', ')}
          </p>
          <p className="text-gray-500 text-sm">{currentTrack.album.name}</p>
        </div>
        {isHost && (
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePlayPause}
              className="p-2 text-white hover:text-[#1DB954] transition-colors"
            >
              {isPlaying ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
                  <path fillRule="evenodd" d="M6.75 5.25a.75.75 0 01.75-.75H9a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H7.5a.75.75 0 01-.75-.75V5.25zm7.5 0A.75.75 0 0115 4.5h1.5a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H15a.75.75 0 01-.75-.75V5.25z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
                  <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
                </svg>
              )}
            </button>
            <button
              onClick={handleSkip}
              className="p-2 text-white hover:text-[#1DB954] transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
                <path d="M5.055 7.06c-1.25-.714-2.805.189-2.805 1.628v8.123c0 1.44 1.555 2.342 2.805 1.628L12 14.471v2.34c0 1.44 1.555 2.342 2.805 1.628l7.108-4.061c1.26-.72 1.26-2.536 0-3.256L14.805 7.06C13.555 6.346 12 7.25 12 8.688v2.34L5.055 7.06z" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 