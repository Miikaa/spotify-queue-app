'use client';

import { useSession, signIn } from "next-auth/react";
import { useState, useEffect, useCallback } from "react";
import Image from 'next/image';
import { spotifyApi } from '@/services/spotify';
import type { SpotifyTrack, SpotifySearchResponse } from '@/types/spotify';
import { useNotification } from '@/hooks/useNotification';
import { NotificationContainer } from '@/components/Notification';
import { Loading, LoadingOverlay } from '@/components/Loading';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import debounce from 'lodash.debounce';

type Tab = 'queue' | 'search';

export default function Home() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<Tab>('queue');
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SpotifyTrack[]>([]);
  const [queue, setQueue] = useState<SpotifyTrack[]>([]);
  const [currentTrack, setCurrentTrack] = useState<SpotifyTrack | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { notifications, addNotification, removeNotification } = useNotification();

  const fetchQueue = useCallback(async () => {
    if (!session?.accessToken) {
      console.log('No access token available');
      return;
    }

    try {
      const [playbackData, queueData] = await Promise.all([
        spotifyApi.getCurrentPlayback(session.accessToken),
        spotifyApi.getQueue(session.accessToken),
      ]);

      setCurrentTrack(playbackData);
      setQueue(queueData || []);
    } catch (error) {
      console.error('Error fetching player data:', error);
      if (error instanceof Error) {
        addNotification(error.message, 'error');
      }
    }
  }, [session, addNotification]);

  const debouncedSearch = useCallback(
    debounce(async (query: string, token: string) => {
      if (!query.trim()) return;

      try {
        setIsLoading(true);
        const results = await spotifyApi.searchTracks(token, query);
        setSearchResults(results);
      } catch (error) {
        console.error('Error searching tracks:', error);
        if (error instanceof Error) {
          addNotification(error.message, 'error');
        }
      } finally {
        setIsLoading(false);
      }
    }, 300),
    [addNotification]
  );

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

  const handleAddToQueue = async (trackUri: string) => {
    if (!session?.accessToken) return;

    try {
      setIsLoading(true);
      await spotifyApi.addToQueue(session.accessToken, trackUri);
      await fetchQueue();
      setSearchQuery('');
      setSearchResults([]);
      addNotification('Track added to queue', 'success');
    } catch (error) {
      console.error('Error adding to queue:', error);
      if (error instanceof Error) {
        addNotification(error.message, 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkipTrack = async () => {
    if (!session?.accessToken) return;

    try {
      setIsLoading(true);
      await spotifyApi.skipTrack(session.accessToken);
      await new Promise(resolve => setTimeout(resolve, 500));
      await fetchQueue();
      addNotification('Skipped to next track', 'success');
    } catch (error) {
      console.error('Error skipping track:', error);
      if (error instanceof Error) {
        addNotification(error.message, 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (session?.accessToken) {
      fetchQueue();
      const interval = setInterval(fetchQueue, 5000);
      return () => clearInterval(interval);
    }
  }, [session, fetchQueue]);

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
        {isLoading && <LoadingOverlay />}
        <NotificationContainer notifications={notifications} onClose={removeNotification} />
        <div className="max-w-4xl mx-auto relative">
          <div className="absolute right-0 -top-4 flex flex-col md:flex-row items-end md:items-center gap-2 md:gap-4">
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
              onClick={() => signIn('spotify', { callbackUrl: '/' })}
              className="text-gray-400 hover:text-white transition-colors duration-200"
            >
              Sign Out
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 md:gap-4 mb-8">
            <button
              onClick={() => setActiveTab('queue')}
              className={`py-2 md:py-3 px-4 md:px-8 rounded-full font-semibold text-base md:text-lg transition-all duration-200 ${
                activeTab === 'queue'
                  ? 'bg-[#1DB954] text-black hover:bg-[#1ed760]'
                  : 'bg-[#282828] text-white hover:bg-[#3E3E3E]'
              }`}
            >
              Queue
            </button>
            <button
              onClick={() => setActiveTab('search')}
              className={`py-2 md:py-3 px-4 md:px-8 rounded-full font-semibold text-base md:text-lg transition-all duration-200 ${
                activeTab === 'search'
                  ? 'bg-[#1DB954] text-black hover:bg-[#1ed760]'
                  : 'bg-[#282828] text-white hover:bg-[#3E3E3E]'
              }`}
            >
              Search
            </button>
          </div>

          {activeTab === 'search' && (
            <div className="mb-8">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Search for tracks..."
                  className="flex-1 bg-[#282828] text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1DB954]"
                />
                <button
                  onClick={handleSearch}
                  className="bg-[#1DB954] text-black px-6 py-2 rounded-lg font-semibold hover:bg-[#1ed760] transition-colors duration-200"
                >
                  Search
                </button>
              </div>

              {searchResults.length > 0 && (
                <div className="mt-4 space-y-2">
                  {searchResults.map((track) => (
                    <div
                      key={track.id}
                      className="flex items-center gap-4 bg-[#282828] p-4 rounded-lg hover:bg-[#3E3E3E] transition-colors duration-200"
                    >
                      <Image
                        src={track.album.images[0]?.url}
                        alt={track.album.name}
                        width={48}
                        height={48}
                        className="rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-medium truncate">{track.name}</h3>
                        <p className="text-gray-400 text-sm truncate">
                          {track.artists.map((artist) => artist.name).join(', ')}
                        </p>
                      </div>
                      <button
                        onClick={() => handleAddToQueue(track.uri)}
                        className="bg-[#1DB954] text-black px-4 py-2 rounded-full font-semibold hover:bg-[#1ed760] transition-colors duration-200 whitespace-nowrap"
                      >
                        Add to Queue
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'queue' && (
            <div className="space-y-4">
              {currentTrack && (
                <div className="bg-[#282828] p-4 rounded-lg">
                  <h2 className="text-lg font-semibold text-white mb-4">Now Playing</h2>
                  <div className="flex items-center gap-4">
                    <Image
                      src={currentTrack.album.images[0]?.url}
                      alt={currentTrack.album.name}
                      width={64}
                      height={64}
                      className="rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-medium truncate">{currentTrack.name}</h3>
                      <p className="text-gray-400 text-sm truncate">
                        {currentTrack.artists.map((artist) => artist.name).join(', ')}
                      </p>
                    </div>
                    <button
                      onClick={handleSkipTrack}
                      className="bg-[#1DB954] text-black px-4 py-2 rounded-full font-semibold hover:bg-[#1ed760] transition-colors duration-200"
                    >
                      Skip
                    </button>
                  </div>
                </div>
              )}

              <div className="bg-[#282828] p-4 rounded-lg">
                <h2 className="text-lg font-semibold text-white mb-4">Queue</h2>
                <div className="space-y-2">
                  {queue.length === 0 ? (
                    <p className="text-gray-400">No tracks in queue</p>
                  ) : (
                    queue.map((track) => (
                      <div
                        key={track.id}
                        className="flex items-center gap-4 bg-[#3E3E3E] p-4 rounded-lg"
                      >
                        <Image
                          src={track.album.images[0]?.url}
                          alt={track.album.name}
                          width={48}
                          height={48}
                          className="rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="text-white font-medium truncate">{track.name}</h3>
                          <p className="text-gray-400 text-sm truncate">
                            {track.artists.map((artist) => artist.name).join(', ')}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}
