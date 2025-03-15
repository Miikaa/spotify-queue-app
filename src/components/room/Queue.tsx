'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

interface QueueProps {
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
  added_by?: string;
}

export default function Queue({ roomCode, isHost }: QueueProps) {
  const [queue, setQueue] = useState<Track[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchQueue = async () => {
      try {
        setIsLoading(true);
        setError('');

        // Fetch queue from our database
        const response = await fetch(`/api/room/${roomCode}/queue`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch queue');
        }

        setQueue(data.queue);
      } catch (err) {
        console.error('Error fetching queue:', err);
        setError('Failed to fetch queue');
      } finally {
        setIsLoading(false);
      }
    };

    fetchQueue();
    const interval = setInterval(fetchQueue, 5000);

    return () => clearInterval(interval);
  }, [roomCode]);

  const handleRemoveTrack = async (trackId: string) => {
    try {
      const response = await fetch(`/api/room/${roomCode}/queue/${trackId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to remove track');
      }
    } catch (err) {
      console.error('Error removing track:', err);
      setError('Failed to remove track');
    }
  };

  if (isLoading) {
    return (
      <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-zinc-800 rounded w-1/4"></div>
          <div className="space-y-3">
            <div className="h-20 bg-zinc-800 rounded"></div>
            <div className="h-20 bg-zinc-800 rounded"></div>
            <div className="h-20 bg-zinc-800 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800">
      <h2 className="text-xl font-semibold text-white mb-4">Queue</h2>
      {queue.length === 0 ? (
        <p className="text-gray-400">No tracks in queue</p>
      ) : (
        <div className="space-y-4">
          {queue.map((track) => (
            <div
              key={track.id}
              className="flex items-center space-x-4 bg-zinc-800 p-4 rounded-lg"
            >
              {track.album.images[0] && (
                <Image
                  src={track.album.images[0].url}
                  alt={track.album.name}
                  width={48}
                  height={48}
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
                {track.added_by && (
                  <p className="text-gray-500 text-xs">
                    Added by: <span className="text-[#1DB954]">{track.added_by}</span>
                  </p>
                )}
              </div>
              {isHost && (
                <button
                  onClick={() => handleRemoveTrack(track.id)}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  title="Remove from queue"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path fillRule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 013.878.512.75.75 0 11-.256 1.478l-.209-.035-1.005 13.07a3 3 0 01-2.991 2.77H8.084a3 3 0 01-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 01-.256-1.478A48.567 48.567 0 017.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 013.369 0c1.603.051 2.815 1.387 2.815 2.951zm-6.136-1.452a51.196 51.196 0 013.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 00-6 0v-.113c0-.794.609-1.428 1.364-1.452zm-.355 5.945a.75.75 0 10-1.5.058l.347 9a.75.75 0 101.499-.058l-.346-9zm5.48.058a.75.75 0 10-1.498-.058l-.347 9a.75.75 0 001.5.058l.345-9z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 