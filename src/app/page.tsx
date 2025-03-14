'use client';

import { useSession, signIn, signOut } from "next-auth/react";
import { useState, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Image from 'next/image';
import { spotifyApi } from '@/services/spotify';
import type { SpotifyTrack } from '@/types/spotify';
import { useNotification } from '@/hooks/useNotification';
import { NotificationContainer } from '@/components/Notification';
import { LoadingOverlay } from '@/components/Loading';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { TrackItem } from '@/components/TrackItem';
import { TrackListSkeleton } from '@/components/Skeleton';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { handleSpotifyError } from '@/utils/errorHandler';
import debounce from 'lodash.debounce';

type Tab = 'queue' | 'search';

export default function Home() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>('queue');
  const [searchQuery, setSearchQuery] = useState("");
  const { notifications, addNotification, removeNotification } = useNotification();

  // Queries
  const { data: playbackData, isLoading: isLoadingPlayback } = useQuery({
    queryKey: ['playback', session?.accessToken],
    queryFn: async () => {
      if (!session?.accessToken) throw new Error('No access token');
      return spotifyApi.getCurrentPlayback(session.accessToken);
    },
    enabled: !!session?.accessToken,
    refetchInterval: 5000,
  });

  const { data: queueData, isLoading: isLoadingQueue } = useQuery({
    queryKey: ['queue', session?.accessToken],
    queryFn: async () => {
      if (!session?.accessToken) throw new Error('No access token');
      return spotifyApi.getQueue(session.accessToken);
    },
    enabled: !!session?.accessToken,
    refetchInterval: 5000,
  });

  // Search with debounce
  const debouncedSearch = useMemo(
    () => debounce(async (query: string, token: string) => {
      if (!query.trim()) return;
      const results = await spotifyApi.searchTracks(token, query);
      queryClient.setQueryData(['search', query], results);
    }, 300),
    [queryClient]
  );

  // Search query
  const { data: searchResults, isLoading: isLoadingSearch } = useQuery({
    queryKey: ['search', searchQuery],
    queryFn: async () => {
      if (!session?.accessToken) throw new Error('No access token');
      return spotifyApi.searchTracks(session.accessToken, searchQuery);
    },
    enabled: !!session?.accessToken && !!searchQuery.trim(),
  });

  // Mutations
  const addToQueueMutation = useMutation({
    mutationFn: async (uri: string) => {
      if (!session?.accessToken) throw new Error('No access token');
      return spotifyApi.addToQueue(session.accessToken, uri);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queue'] });
      addNotification('Track added to queue', 'success');
      setSearchQuery('');
    },
    onError: (error) => handleSpotifyError(error, { addNotification }),
  });

  const skipTrackMutation = useMutation({
    mutationFn: async () => {
      if (!session?.accessToken) throw new Error('No access token');
      return spotifyApi.skipTrack(session.accessToken);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queue'] });
      queryClient.invalidateQueries({ queryKey: ['playback'] });
      addNotification('Skipped to next track', 'success');
    },
    onError: (error) => handleSpotifyError(error, { addNotification }),
  });

  const clearQueueMutation = useMutation({
    mutationFn: async () => {
      if (!session?.accessToken) throw new Error('No access token');
      return spotifyApi.clearQueue(session.accessToken);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queue'] });
      addNotification('Queue cleared successfully', 'success');
    },
    onError: (error) => handleSpotifyError(error, { addNotification }),
  });

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onSearch: () => setActiveTab('search'),
    onSkip: () => skipTrackMutation.mutate(),
    onClearQueue: () => clearQueueMutation.mutate(),
    onSwitchTab: () => setActiveTab(prev => prev === 'queue' ? 'search' : 'queue'),
  });

  const handleSearch = useCallback(() => {
    if (!session?.accessToken) {
      addNotification('Please sign in to search tracks', 'error');
      return;
    }

    if (!searchQuery.trim()) {
      addNotification('Please enter a search query', 'info');
      return;
    }

    debouncedSearch(searchQuery, session.accessToken);
  }, [session, searchQuery, debouncedSearch, addNotification]);

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#121212] gap-8 px-4">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 text-center">Spotify Queue Manager</h1>
        <p className="text-gray-400 mb-8 text-center">Manage your Spotify queue with ease</p>
        <button
          onClick={() => signIn('spotify', { callbackUrl: '/' })}
          className="bg-[#1DB954] hover:bg-[#1ed760] text-black px-6 md:px-8 py-3 rounded-full font-semibold transition-all duration-200 hover:scale-105 flex items-center gap-2 w-full md:w-auto justify-center"
        >
          <svg className="w-5 h-5 md:w-6 md:h-6" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
          </svg>
          Login with Spotify
        </button>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-b from-[#181818] to-[#121212] p-4 md:p-8 relative">
        {(isLoadingPlayback || isLoadingQueue || isLoadingSearch) && <LoadingOverlay />}
        <NotificationContainer notifications={notifications} onClose={removeNotification} />
        <div className="max-w-4xl mx-auto relative">
          <div className="flex flex-col md:flex-row justify-end items-end md:items-center gap-2 md:gap-4 mb-8">
            <div className="flex items-center gap-3">
              {session.user?.image && (
                <Image
                  src={session.user.image}
                  alt={session.user?.name || 'User'}
                  width={32}
                  height={32}
                  className="rounded-full"
                />
              )}
              <span className="text-white font-medium">{session.user?.name}</span>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="text-gray-400 hover:text-white transition-colors duration-200"
            >
              Sign Out
            </button>
          </div>

          {playbackData && (
            <div className="bg-[#282828] p-4 rounded-lg mb-8">
              <h2 className="text-lg font-semibold text-white mb-4">Now Playing</h2>
              <div className="flex items-center gap-4">
                <Image
                  src={playbackData.album.images[0]?.url}
                  alt={playbackData.album.name}
                  width={64}
                  height={64}
                  className="rounded"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-medium truncate">{playbackData.name}</h3>
                  <p className="text-gray-400 text-sm truncate">
                    {playbackData.artists.map((artist) => artist.name).join(', ')}
                  </p>
                </div>
                <button
                  onClick={() => skipTrackMutation.mutate()}
                  className="bg-[#1DB954] text-black px-4 py-2 rounded-full font-semibold hover:bg-[#1ed760] transition-colors duration-200"
                >
                  Skip
                </button>
              </div>
            </div>
          )}

          <div className="flex gap-4 mb-8">
            <button
              onClick={() => setActiveTab('queue')}
              className={`flex-1 py-2 px-4 rounded-full font-semibold transition-colors duration-200 ${
                activeTab === 'queue'
                  ? 'bg-[#1DB954] text-black'
                  : 'bg-[#282828] text-white hover:bg-[#3E3E3E]'
              }`}
            >
              Queue
            </button>
            <button
              onClick={() => setActiveTab('search')}
              className={`flex-1 py-2 px-4 rounded-full font-semibold transition-colors duration-200 ${
                activeTab === 'search'
                  ? 'bg-[#1DB954] text-black'
                  : 'bg-[#282828] text-white hover:bg-[#3E3E3E]'
              }`}
            >
              Search
            </button>
          </div>

          {activeTab === 'search' ? (
            <div>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Search for tracks..."
                  className="w-full bg-[#282828] text-white px-4 py-3 rounded-lg pr-10 focus:outline-none focus:ring-2 focus:ring-[#1DB954]"
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      queryClient.removeQueries({ queryKey: ['search'] });
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white focus:outline-none"
                  >
                    ×
                  </button>
                )}
              </div>

              {isLoadingSearch ? (
                <TrackListSkeleton count={5} />
              ) : searchResults && searchResults.length > 0 ? (
                <div className="mt-4 space-y-2">
                  {searchResults.map((track) => (
                    <TrackItem
                      key={track.id}
                      track={track}
                      onAddToQueue={async () => await addToQueueMutation.mutateAsync(track.uri)}
                    />
                  ))}
                </div>
              ) : (
                searchQuery.trim() && <p className="text-gray-400 mt-4">No results found</p>
              )}
            </div>
          ) : (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-white">Queue</h2>
                {queueData && queueData.length > 0 && (
                  <button
                    onClick={() => clearQueueMutation.mutate()}
                    className="bg-red-600 text-white px-4 py-2 rounded-full font-semibold hover:bg-red-700 transition-colors duration-200 text-sm"
                  >
                    Clear Queue
                  </button>
                )}
              </div>
              {isLoadingQueue ? (
                <TrackListSkeleton count={3} />
              ) : queueData && queueData.length === 0 ? (
                <p className="text-gray-400">No tracks in queue</p>
              ) : (
                <div className="space-y-2">
                  {queueData?.map((track) => (
                    <TrackItem
                      key={track.id}
                      track={track}
                      onAddToQueue={async () => await addToQueueMutation.mutateAsync(track.uri)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}
