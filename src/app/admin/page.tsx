'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Room {
  id: string;
  code: string;
  hostId: string;
  active: boolean;
  createdAt: string;
}

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        setIsAuthenticated(true);
        fetchRooms();
      } else {
        setError('Invalid password');
      }
    } catch (error) {
      setError('Failed to authenticate');
    }
  };

  const fetchRooms = async () => {
    try {
      const response = await fetch('/api/admin/rooms', {
        headers: {
          'Authorization': `Bearer ${password}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRooms(data.rooms);
      } else {
        setError('Failed to fetch rooms');
      }
    } catch (error) {
      setError('Failed to fetch rooms');
    }
  };

  const handleDeleteRoom = async (roomId: string) => {
    if (!confirm('Are you sure you want to delete this room?')) return;

    try {
      const response = await fetch(`/api/admin/rooms/${roomId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${password}`,
        },
      });

      if (response.ok) {
        fetchRooms();
      } else {
        setError('Failed to delete room');
      }
    } catch (error) {
      setError('Failed to delete room');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#121212] text-white flex items-center justify-center">
        <div className="bg-[#282828] p-8 rounded-lg w-full max-w-md">
          <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
          {error && (
            <div className="bg-red-500 text-white p-3 rounded mb-4">
              {error}
            </div>
          )}
          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label htmlFor="password" className="block mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2 rounded bg-[#3E3E3E] text-white"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-[#1DB954] text-white py-2 px-4 rounded hover:bg-[#1ed760] transition-colors"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121212] text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <button
            onClick={() => setIsAuthenticated(false)}
            className="bg-[#282828] text-white py-2 px-4 rounded hover:bg-[#3E3E3E] transition-colors"
          >
            Logout
          </button>
        </div>

        {error && (
          <div className="bg-red-500 text-white p-4 rounded mb-6">
            {error}
          </div>
        )}

        <div className="bg-[#282828] rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-[#3E3E3E]">
                <th className="px-6 py-3 text-left">Room Code</th>
                <th className="px-6 py-3 text-left">Host ID</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-left">Created At</th>
                <th className="px-6 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rooms.map((room) => (
                <tr key={room.id} className="border-t border-[#3E3E3E]">
                  <td className="px-6 py-4">{room.code}</td>
                  <td className="px-6 py-4">{room.hostId}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded ${
                        room.active
                          ? 'bg-green-500 text-white'
                          : 'bg-red-500 text-white'
                      }`}
                    >
                      {room.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {new Date(room.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleDeleteRoom(room.id)}
                      className="bg-red-500 text-white py-1 px-3 rounded hover:bg-red-600 transition-colors"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 