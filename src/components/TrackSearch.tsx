'use client';

import { useState, useCallback } from 'react';
import { SpotifyApi, Track } from '@spotify/web-api-ts-sdk';
import { useQuery } from '@tanstack/react-query';
import debounce from 'lodash.debounce';

interface TrackSearchProps {
  onTrackSelect: (track: Track) => void;
  spotifyApi: SpotifyApi | null;
  roomCode: string;
}

export default function TrackSearch({ onTrackSelect, spotifyApi, roomCode }: TrackSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      if (!query.trim()) return null;
      if (spotifyApi) {
        return spotifyApi.search(query, ['track'], undefined, 20);
      } else {
        // Guest search through our API
        const response = await fetch(`/api/room/${roomCode}/search?q=${encodeURIComponent(query)}`);
        if (!response.ok) throw new Error('Failed to search tracks');
        return response.json();
      }
    }, 300),
    [spotifyApi, roomCode]
  );

  const { data: searchResults, isLoading } = useQuery({
    queryKey: ['search', searchQuery],
    queryFn: () => debouncedSearch(searchQuery),
    enabled: !!searchQuery.trim(),
  });

  return (
    <div className="space-y-4">
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search for songs..."
          className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          </div>
        )}
      </div>

      {searchResults?.tracks?.items && (
        <div className="space-y-2">
          {searchResults.tracks.items.map((track: Track) => (
            <div
              key={track.id}
              className="flex items-center gap-3 p-2 hover:bg-gray-700 rounded-lg cursor-pointer"
              onClick={() => onTrackSelect(track)}
            >
              {track.album.images[0] && (
                <img
                  src={track.album.images[0].url}
                  alt={track.album.name}
                  className="w-12 h-12 rounded"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">{track.name}</p>
                <p className="text-gray-400 text-sm truncate">
                  {track.artists.map(a => a.name).join(', ')}
                </p>
              </div>
              <button
                className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  onTrackSelect(track);
                }}
              >
                Add
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 