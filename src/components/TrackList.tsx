'use client';

import { Track } from '@spotify/web-api-ts-sdk';
import Image from 'next/image';

interface TrackListProps {
  tracks: Track[];
  isLoading: boolean;
}

export default function TrackList({ tracks, isLoading }: TrackListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse flex items-center gap-3 p-2">
            <div className="bg-gray-700 w-12 h-12 rounded"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-700 rounded w-3/4"></div>
              <div className="h-3 bg-gray-700 rounded w-1/2 mt-2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!tracks?.length) {
    return (
      <p className="text-gray-400 text-center py-4">No tracks in queue</p>
    );
  }

  return (
    <div className="space-y-2">
      {tracks.map((track: Track) => (
        <div
          key={track.id}
          className="flex items-center gap-3 p-2 bg-gray-700/50 rounded-lg"
        >
          {track.album.images[0] && (
            <div className="relative w-12 h-12 flex-shrink-0">
              <Image
                src={track.album.images[0].url}
                alt={track.album.name}
                fill
                className="rounded object-cover"
                sizes="48px"
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-white font-medium truncate">{track.name}</p>
            <p className="text-gray-400 text-sm truncate">
              {track.artists.map(a => a.name).join(', ')}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
} 