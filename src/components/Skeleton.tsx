export function TrackSkeleton() {
  return (
    <div className="flex items-center gap-4 bg-[#282828] p-4 rounded-lg animate-pulse">
      <div className="w-12 h-12 bg-[#3E3E3E] rounded" />
      <div className="flex-1">
        <div className="h-4 bg-[#3E3E3E] rounded w-3/4 mb-2" />
        <div className="h-3 bg-[#3E3E3E] rounded w-1/2" />
      </div>
      <div className="w-24 h-8 bg-[#3E3E3E] rounded-full" />
    </div>
  );
}

export function TrackListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <TrackSkeleton key={i} />
      ))}
    </div>
  );
} 