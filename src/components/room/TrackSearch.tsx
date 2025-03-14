'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useDebounce } from '@/hooks/useDebounce';

interface TrackSearchProps {
  roomCode: string;
}

interface Track {
  id: string;
  name: string;
  artists: { name: string }[];
  album: {
    name: string;
    images: { url: string }[];
  };
}

export default function TrackSearch({ roomCode }: TrackSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      const response = await fetch(`/api/room/${roomCode}/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to search tracks');
      }

      setSearchResults(data.tracks);
    } catch (err) {
      console.error('Error searching tracks:', err);
      setError('Failed to search tracks');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToQueue = async (track: Track) => {
    try {
      const response = await fetch(`/api/room/${roomCode}/queue`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ trackId: track.id }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add track to queue');
      }

      // Clear search results after adding
      setSearchTerm('');
      setSearchResults([]);
    } catch (err) {
      console.error('Error adding track to queue:', err);
      setError('Failed to add track to queue');
    }
  };

  useEffect(() => {
    handleSearch(debouncedSearchTerm);
  }, [debouncedSearchTerm]);

  return (
    <div className="space-y-4">
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search for tracks..."
          className="w-full px-4 py-2 bg-zinc-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1DB954] border border-zinc-700"
        />
        {isLoading && (
          <div className="absolute right-3 top-2.5">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#1DB954]"></div>
          </div>
        )}
      </div>

      {error && (
        <p className="text-red-500 text-sm">{error}</p>
      )}

      <div className="space-y-2">
        {searchResults.map((track) => (
          <div
            key={track.id}
            className="flex items-center space-x-3 bg-zinc-800 p-3 rounded-lg hover:bg-zinc-700 transition-colors cursor-pointer border border-zinc-700"
            onClick={() => handleAddToQueue(track)}
          >
            {track.album.images[0] && (
              <Image
                src={track.album.images[0].url}
                alt={track.album.name}
                width={40}
                height={40}
                className="rounded-md"
              />
            )}
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-medium truncate">
                {track.name}
              </h3>
              <p className="text-gray-400 text-sm truncate">
                {track.artists.map(artist => artist.name).join(', ')}
              </p>
            </div>
            <button
              className="p-2 text-gray-400 hover:text-[#1DB954] transition-colors"
              title="Add to queue"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path fillRule="evenodd" d="M12 3.75a.75.75 0 01.75.75v6.75h6.75a.75.75 0 010 1.5h-6.75v6.75a.75.75 0 01-1.5 0v-6.75H4.5a.75.75 0 010-1.5h6.75V4.5a.75.75 0 01.75-.75z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
} 