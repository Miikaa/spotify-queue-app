export function Loading() {
  return (
    <div className="flex items-center justify-center p-4">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#1DB954]"></div>
    </div>
  );
}

export function LoadingOverlay() {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#1DB954]"></div>
    </div>
  );
} 