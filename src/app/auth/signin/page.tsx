'use client';

import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

export default function SignIn() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  useEffect(() => {
    // Automatically redirect to Spotify sign in
    signIn('spotify', { callbackUrl });
  }, [callbackUrl]);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="text-3xl font-bold text-white text-center">
            Redirecting to Spotify...
          </h2>
          <p className="mt-4 text-gray-400 text-center">
            You will be redirected to Spotify to sign in. If nothing happens,{' '}
            <button
              onClick={() => signIn('spotify', { callbackUrl })}
              className="text-blue-500 hover:text-blue-400"
            >
              click here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
} 