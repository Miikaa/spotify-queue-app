'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-[#121212] p-4">
          <div className="bg-[#282828] p-6 rounded-lg max-w-lg w-full text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Something went wrong!</h2>
            <p className="text-gray-400 mb-6">
              {error.message || 'An unexpected error occurred'}
            </p>
            <div className="space-y-4">
              <button
                onClick={() => reset()}
                className="bg-[#1DB954] text-black px-6 py-2 rounded-full font-semibold hover:bg-[#1ed760] transition-colors duration-200 w-full"
              >
                Try again
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="bg-[#282828] text-white px-6 py-2 rounded-full font-semibold hover:bg-[#3E3E3E] transition-colors duration-200 w-full border border-white/10"
              >
                Go to home page
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
} 