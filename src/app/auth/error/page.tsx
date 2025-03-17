'use client';

import { useSearchParams } from 'next/navigation';

export default function AuthError() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="text-3xl font-bold text-white text-center">
            Authentication Error
          </h2>
          <div className="mt-4 text-center">
            <p className="text-red-500">
              {error === 'spotify'
                ? 'There was an error connecting to Spotify. Please try again.'
                : error || 'An unknown error occurred'}
            </p>
            <a
              href="/"
              className="mt-4 inline-block text-blue-500 hover:text-blue-400"
            >
              Return to Home
            </a>
          </div>
        </div>
      </div>
    </div>
  );
} 