import Image from 'next/image';
import type { SpotifyTrack } from '@/types/spotify';

interface TrackItemProps {
  track: SpotifyTrack;
  onAddToQueue?: (uri: string) => Promise<void>;
  showAddButton?: boolean;
}

export function TrackItem({ track, onAddToQueue, showAddButton = false }: TrackItemProps) {
  return (
    <div className="flex items-center gap-4 bg-[#282828] p-4 rounded-lg hover:bg-[#3E3E3E] transition-colors duration-200">
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
      {showAddButton && onAddToQueue && (
        <button
          onClick={() => onAddToQueue(track.uri)}
          className="bg-[#1DB954] text-black px-4 py-2 rounded-full font-semibold hover:bg-[#1ed760] transition-colors duration-200 whitespace-nowrap"
        >
          Add to Queue
        </button>
      )}
    </div>
  );
} 