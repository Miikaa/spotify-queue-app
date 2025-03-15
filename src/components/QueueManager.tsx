'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { SpotifyApi, AccessToken } from '@spotify/web-api-ts-sdk';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Track } from '@spotify/web-api-ts-sdk';
import TrackSearch from './TrackSearch';
import TrackList from './TrackList';

interface QueueManagerProps {
  isHost: boolean;
  code: string;
}

interface ExtendedSession {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    accessToken: string;
    refreshToken: string;
  };
}

interface QueueResponse {
  tracks: Track[];
}

export default function QueueManager({ isHost, code }: QueueManagerProps) {
  const { data: session } = useSession() as { data: ExtendedSession | null };
  const [activeTab, setActiveTab] = useState<'queue' | 'search'>('queue');
  const queryClient = useQueryClient();

  // Initialize Spotify API
  const spotifyApi = isHost && session?.user?.accessToken
    ? SpotifyApi.withAccessToken(process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID!, {
        access_token: session.user.accessToken,
        token_type: 'Bearer',
        expires_in: 3600
      } as AccessToken)
    : null;

  // Fetch queue
  const { data: queueData, isLoading: isLoadingQueue } = useQuery<QueueResponse>({
    queryKey: ['queue', code],
    queryFn: async () => {
      if (!spotifyApi && !isHost) {
        // For guests, fetch from our database
        const response = await fetch(`/api/room/${code}/queue`);
        if (!response.ok) throw new Error('Failed to fetch queue');
        return response.json();
      }
      if (spotifyApi) {
        // For host, fetch from Spotify
        const currentTrack = await spotifyApi.player.getPlaybackState();
        return { tracks: currentTrack ? [currentTrack.item as Track] : [] };
      }
      return { tracks: [] };
    },
    refetchInterval: 5000,
  });

  // Add to queue mutation
  const addToQueueMutation = useMutation({
    mutationFn: async (track: Track) => {
      if (isHost && spotifyApi) {
        // Host adds directly to Spotify
        await spotifyApi.player.addItemToPlaybackQueue(track.uri);
      } else {
        // Guests add through our API
        const response = await fetch(`/api/room/${code}/queue`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ trackUri: track.uri, trackName: track.name }),
        });
        if (!response.ok) throw new Error('Failed to add to queue');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queue', code] });
    },
  });

  // Skip track mutation (host only)
  const skipTrackMutation = useMutation({
    mutationFn: async () => {
      if (!isHost || !spotifyApi) throw new Error('Only host can skip tracks');
      await spotifyApi.player.skipToNext();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queue', code] });
    },
  });

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex gap-4">
        <button
          onClick={() => setActiveTab('queue')}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
            activeTab === 'queue'
              ? 'bg-green-600 text-white'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          Queue
        </button>
        <button
          onClick={() => setActiveTab('search')}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
            activeTab === 'search'
              ? 'bg-green-600 text-white'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          Add Songs
        </button>
      </div>

      {/* Content */}
      <div className="bg-gray-800 rounded-lg p-6">
        {activeTab === 'queue' ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-white">Current Queue</h2>
              {isHost && (
                <button
                  onClick={() => skipTrackMutation.mutate()}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Skip Current
                </button>
              )}
            </div>
            <TrackList
              tracks={queueData?.tracks || []}
              isLoading={isLoadingQueue}
            />
          </div>
        ) : (
          <TrackSearch
            onTrackSelect={(track) => addToQueueMutation.mutate(track)}
            spotifyApi={spotifyApi}
            roomCode={code}
          />
        )}
      </div>
    </div>
  );
} 