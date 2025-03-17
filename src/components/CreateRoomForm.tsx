'use client';

import { useTransition } from 'react';
import { createRoom } from '@/app/actions/roomActions';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function CreateRoomForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const router = useRouter();

  const handleCreateRoom = async (formData: FormData) => {
    try {
      setError('');
      startTransition(async () => {
        await createRoom(formData);
      });
    } catch (err) {
      if (err instanceof Error && err.message === 'Must be logged in to create a room') {
        setError('You must be logged in to create a room');
      } else {
        setError('Failed to create room. Please try again.');
      }
    }
  };

  return (
    <div className="space-y-4">
      <form action={handleCreateRoom}>
        <button
          type="submit"
          disabled={isPending}
          className="w-full py-3 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? 'Creating...' : 'Create Room'}
        </button>
      </form>
      
      {error && (
        <div className="text-center">
          <p className="text-red-500">{error}</p>
          {error.includes('logged in') && (
            <button
              onClick={() => router.push('/auth/signin')}
              className="mt-2 text-blue-500 hover:underline"
            >
              Sign in
            </button>
          )}
        </div>
      )}
    </div>
  );
} 