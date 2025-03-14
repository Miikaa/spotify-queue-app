'use client';

import { signIn, useSession } from 'next-auth/react';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast, Toaster } from 'react-hot-toast';

export default function Home() {
  const { data: session, status } = useSession();
  const [roomCode, setRoomCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const router = useRouter();

  // Handle authentication redirect in useEffect
  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard');
    }
  }, [status, router]);

  const handleJoinAsGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (roomCode.length !== 6) {
      toast.error('Room code must be 6 digits', {
        style: {
          background: '#ff4444',
          color: '#fff',
          borderRadius: '8px',
        },
      });
      return;
    }

    setIsJoining(true);
    try {
      const response = await fetch('/api/room/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ roomCode }),
      });

      if (response.ok) {
        router.push(`/dashboard?guest=${roomCode}`);
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to join room', {
          style: {
            background: '#ff4444',
            color: '#fff',
            borderRadius: '8px',
          },
        });
      }
    } catch (error) {
      toast.error('Failed to join room', {
        style: {
          background: '#ff4444',
          color: '#fff',
          borderRadius: '8px',
        },
      });
    } finally {
      setIsJoining(false);
    }
  };

  // Don't render anything while checking authentication
  if (status === 'loading' || status === 'authenticated') {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#121212] text-white flex flex-col items-center justify-center p-4">
      <Toaster position="top-center" />
      <div className="w-full max-w-md space-y-8">
        {/* Spotify Login Section */}
        <div className="bg-[#181818] p-8 rounded-lg text-center space-y-6">
          <h1 className="text-3xl font-bold">Spotify Queue App</h1>
          <p className="text-[#B3B3B3]">Create a room and control your Spotify queue</p>
          <button
            onClick={() => signIn('spotify', { callbackUrl: '/dashboard' })}
            className="w-full bg-[#1DB954] text-white py-3 px-4 rounded-lg font-medium hover:bg-[#1ed760] transition-colors flex items-center justify-center gap-2"
          >
            <svg
              viewBox="0 0 24 24"
              className="w-6 h-6 fill-current"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
            </svg>
            Login with Spotify
          </button>
        </div>

        {/* Guest Join Section */}
        <div className="bg-[#181818] p-8 rounded-lg text-center space-y-6">
          <h2 className="text-2xl font-bold">Join as Guest</h2>
          <p className="text-[#B3B3B3]">Enter a 6-digit room code to join</p>
          <form onSubmit={handleJoinAsGuest} className="space-y-4">
            <input
              type="text"
              value={roomCode}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                setRoomCode(value);
              }}
              placeholder="Enter room code"
              className="w-full bg-[#282828] text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1DB954] text-lg text-center tracking-wider"
              maxLength={6}
            />
            <button
              type="submit"
              disabled={isJoining || roomCode.length !== 6}
              className={`w-full bg-[#1DB954] text-white py-3 px-4 rounded-lg font-medium transition-colors ${
                isJoining || roomCode.length !== 6
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-[#1ed760]'
              }`}
            >
              {isJoining ? 'Joining...' : 'Join Room'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
