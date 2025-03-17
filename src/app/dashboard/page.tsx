'use client';

import { useSession, signOut } from 'next-auth/react';
import { useState, useEffect, useRef } from 'react';
import { redirect, useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Toaster, toast } from 'react-hot-toast';

interface Track {
  id: string;
  name: string;
  artists: { name: string }[];
  album: {
    name: string;
    images: { url: string }[];
  };
  duration_ms: number;
}

interface PlaybackState {
  item: Track;
  progress_ms: number;
  is_playing: boolean;
}

// Add session user interface
interface SessionUser {
  name?: string;
  email?: string;
  image?: string;
  accessToken?: string;
  refreshToken?: string;
  id?: string;
}

interface Session {
  user?: SessionUser;
  expires: string;
  error?: string;
}

interface HostInfo {
  code: string;
  hostId: string;
  hostName: string;
  hostImage: string;
  connectedUsers: number;
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const guestRoomCode = searchParams.get('guest');
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [queue, setQueue] = useState<Track[]>([]);
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [playbackProgress, setPlaybackProgress] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hostInfo, setHostInfo] = useState<HostInfo | null>(null);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);
  const [isSkipLoading, setIsSkipLoading] = useState(false);
  const [addToQueueLoading, setAddToQueueLoading] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState<boolean>(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const router = useRouter();

  // Initialize roomId from localStorage after mount
  useEffect(() => {
    const storedRoomId = localStorage.getItem('roomId');
    if (storedRoomId) {
      setRoomId(storedRoomId);
    }
  }, []);

  // Redirect if not authenticated and not a guest
  if (status === 'unauthenticated' && !guestRoomCode) {
    redirect('/');
  }

  // Initialize session and fetch initial data
  useEffect(() => {
    const initializeSession = async () => {
      if (status !== 'authenticated' || !session?.user?.accessToken) return;

      try {
        // Fetch initial data
        await Promise.all([
          fetchCurrentTrack(),
          fetchQueue()
        ]);
        setIsInitialized(true);
      } catch (error) {
        console.error('Error initializing session:', error);
      }
    };

    initializeSession();
  }, [status, session]);

  // Effect to fetch host info if in guest mode
  useEffect(() => {
    const fetchHostInfo = async () => {
      if (!guestRoomCode) return;
      
      try {
        const response = await fetch('/api/room/join', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ roomCode: guestRoomCode }),
        });

        if (response.ok) {
          const data = await response.json();
          setHostInfo(data.room);
          setRoomId(data.room.code);
        } else {
          // If room doesn't exist, redirect to home
          redirect('/');
        }
      } catch (error) {
        console.error('Error fetching host info:', error);
        redirect('/');
      }
    };

    fetchHostInfo();
  }, [guestRoomCode]);

  // Format milliseconds to mm:ss
  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const refreshAccessToken = async () => {
    if (!session?.user?.refreshToken) return null;
    
    try {
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(
            `${process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
          ).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: session.user.refreshToken,
        }),
      });

      if (!response.ok) throw new Error('Failed to refresh token');
      
      const data = await response.json();
      return data.access_token;
    } catch (error) {
      console.error('Error refreshing token:', error);
      return null;
    }
  };

  const fetchCurrentTrack = async () => {
    if (!session?.user?.accessToken) return;
    
    try {
      let response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
        headers: {
          Authorization: `Bearer ${session.user.accessToken}`,
        },
      });
      
      if (response.status === 401) {
        // Token expired, try to refresh
        const newToken = await refreshAccessToken();
        if (!newToken) return;
        
        response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
          headers: {
            Authorization: `Bearer ${newToken}`,
          },
        });
      }
      
      if (response.ok) {
        const data: PlaybackState = await response.json();
        setCurrentTrack(data.item);
        setPlaybackProgress(data.progress_ms);
        setIsPlaying(data.is_playing);

        // Clear existing interval
        if (progressInterval.current) {
          clearInterval(progressInterval.current);
        }

        // Start progress interval if playing
        if (data.is_playing) {
          progressInterval.current = setInterval(() => {
            setPlaybackProgress(prev => {
              if (prev >= data.item.duration_ms) {
                if (progressInterval.current) {
                  clearInterval(progressInterval.current);
                }
                return 0;
              }
              return prev + 1000;
            });
          }, 1000);
        }
      } else if (response.status === 204) {
        // No track currently playing
        setCurrentTrack(null);
        setPlaybackProgress(0);
        setIsPlaying(false);
        if (progressInterval.current) {
          clearInterval(progressInterval.current);
        }
      }
    } catch (error) {
      console.error('Error fetching current track:', error);
    }
  };

  const fetchQueue = async () => {
    if (!session?.user?.accessToken) return;
    
    try {
      let response = await fetch('https://api.spotify.com/v1/me/player/queue', {
        headers: {
          Authorization: `Bearer ${session.user.accessToken}`,
        },
      });
      
      if (response.status === 401) {
        // Token expired, try to refresh
        const newToken = await refreshAccessToken();
        if (!newToken) return;
        
        response = await fetch('https://api.spotify.com/v1/me/player/queue', {
          headers: {
            Authorization: `Bearer ${newToken}`,
          },
        });
      }
      
      if (response.ok) {
        const data = await response.json();
        setQueue(data.queue || []);
      }
    } catch (error) {
      console.error('Error fetching queue:', error);
    }
  };

  // Handle visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };

    // Initial visibility state
    setIsVisible(!document.hidden);

    // Add event listener
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Persist roomId to localStorage when it changes
  useEffect(() => {
    if (roomId) {
      localStorage.setItem('roomId', roomId);
    } else {
      localStorage.removeItem('roomId');
    }
  }, [roomId]);

  // Effect for fetching current track and queue
  useEffect(() => {
    if (!isInitialized) return; // Don't start polling until initialized

    let intervalId: NodeJS.Timeout;

    const updateData = async () => {
      if (!isVisible || !session?.user?.accessToken) return;
      await Promise.all([
        fetchCurrentTrack(),
        fetchQueue()
      ]);
    };

    // Set up interval for updates
    intervalId = setInterval(updateData, 5000);

    return () => {
      clearInterval(intervalId);
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, [session, isVisible, isInitialized]);

  // Effect for search
  useEffect(() => {
    const searchTracks = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }
      
      try {
        let response;
        if (guestRoomCode) {
          // Guest search through our API
          response = await fetch(`/api/room/${guestRoomCode}/search?q=${encodeURIComponent(searchQuery)}`);
        } else if (session?.user?.accessToken) {
          // Host search directly through Spotify
          response = await fetch(
            `https://api.spotify.com/v1/search?q=${encodeURIComponent(searchQuery)}&type=track&limit=10`,
            {
              headers: {
                Authorization: `Bearer ${session.user.accessToken}`,
              },
            }
          );
        } else {
          return;
        }
        
        if (response.ok) {
          const data = await response.json();
          // Handle both response formats (guest API and Spotify API)
          setSearchResults(data.tracks?.items || data.tracks || []);
        }
      } catch (error) {
        console.error('Error searching tracks:', error);
      }
    };

    const timeoutId = setTimeout(() => {
      searchTracks();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, session, guestRoomCode]);

  // Toast style constants
  const successToastStyle = {
    duration: 3000,
    position: 'top-center' as const,
    style: {
      background: '#1DB954',
      color: '#fff',
      borderRadius: '8px',
      maxWidth: '500px',
      textAlign: 'center' as const,
      fontWeight: '500',
    },
  };

  const errorToastStyle = {
    duration: 3000,
    position: 'top-center' as const,
    style: {
      background: '#ff4444',
      color: '#fff',
      borderRadius: '8px',
      maxWidth: '500px',
      textAlign: 'center' as const,
      fontWeight: '500',
    },
  };

  const handleCreateRoom = async () => {
    if (isLoading) return;
    setIsLoading(true);
    
    try {
      // Create the room
      const createResponse = await fetch('/api/room/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (createResponse.ok) {
        const data = await createResponse.json();
        setRoomId(data.room.code);
        localStorage.setItem('roomId', data.room.code); // Also persist to localStorage
        toast.success('Room created successfully!', successToastStyle);
      } else {
        throw new Error('Failed to create room');
      }
    } catch (error) {
      console.error('Error creating room:', error);
      toast.error('Failed to create room', errorToastStyle);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDestroyRoom = async () => {
    if (isLoading) return;
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/room/destroy', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setRoomId(null);
        localStorage.removeItem('roomId'); // Remove from localStorage
        toast.success('Room destroyed successfully!', successToastStyle);
      }
    } catch (error) {
      console.error('Error destroying room:', error);
      toast.error('Failed to destroy room', errorToastStyle);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      // Clear all local storage data
      window.localStorage.clear();
      
      // Clear all session storage data
      window.sessionStorage.clear();

      // Clear all cookies for this domain
      document.cookie.split(';').forEach(cookie => {
        document.cookie = cookie
          .replace(/^ +/, '')
          .replace(/=.*/, `=;expires=${new Date(0).toUTCString()};path=/`);
      });

      // First, sign out of Spotify through our API
      await fetch('/api/auth/spotify-logout', {
        method: 'POST',
      });
      
      // Then sign out of our app with a full page reload to clear everything
      await signOut({ 
        callbackUrl: '/',
        redirect: false 
      });

      // Force a full page reload to clear any remaining state
      window.location.href = '/';
    } catch (error) {
      console.error('Error signing out:', error);
      // Still attempt to sign out and reload even if there's an error
      await signOut({ 
        callbackUrl: '/',
        redirect: false 
      });
      window.location.href = '/';
    }
  };

  const addToQueue = async (trackUri: string, trackName: string) => {
    if (addToQueueLoading === trackUri) return;
    if (!session?.user?.accessToken && !guestRoomCode) return;
    
    setAddToQueueLoading(trackUri);
    try {
      if (guestRoomCode) {
        // Guest adding to queue
        const response = await fetch(`/api/room/${guestRoomCode}/queue`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ trackUri }),
        });
        
        if (response.ok) {
          toast.success(`Added "${trackName}" to queue`, successToastStyle);
          // Queue will be updated in the next polling cycle
        } else {
          const data = await response.json();
          throw new Error(data.error || 'Failed to add to queue');
        }
      } else {
        // Host adding to queue
        const response = await fetch(`https://api.spotify.com/v1/me/player/queue?uri=${trackUri}`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session?.user?.accessToken}`,
          },
        });
        
        if (response.ok) {
          toast.success(`Added "${trackName}" to queue`, successToastStyle);
          await fetchQueue();
        } else {
          throw new Error('Failed to add to queue');
        }
      }
    } catch (error) {
      console.error('Error adding to queue:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to add song to queue', errorToastStyle);
    } finally {
      setAddToQueueLoading(null);
    }
  };

  const handleSkip = async () => {
    if (isSkipLoading) return;
    if (!session?.user?.accessToken && !guestRoomCode) return;
    
    setIsSkipLoading(true);
    try {
      if (guestRoomCode) {
        // Guest requesting skip
        const response = await fetch(`/api/room/${guestRoomCode}/skip`, {
          method: 'POST',
        });
        
        if (response.ok) {
          toast.success('Track skipped', successToastStyle);
          // Wait a bit for Spotify to update
          setTimeout(async () => {
            await fetchCurrentTrack();
            await fetchQueue();
            setIsSkipLoading(false);
          }, 500);
          return;
        } else {
          const data = await response.json();
          throw new Error(data.error || 'Failed to skip track');
        }
      } else {
        // Host skipping
        const response = await fetch('https://api.spotify.com/v1/me/player/next', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session?.user?.accessToken}`,
          },
        });
        
        if (response.ok) {
          // Wait a bit for Spotify to update
          setTimeout(async () => {
            await fetchCurrentTrack();
            await fetchQueue();
            setIsSkipLoading(false);
          }, 500);
          return;
        } else {
          throw new Error('Failed to skip track');
        }
      }
    } catch (error) {
      console.error('Error skipping track:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to skip track', errorToastStyle);
    }
    setIsSkipLoading(false);
  };

  // Effect for fetching room info - now considers visibility
  useEffect(() => {
    const fetchRoomId = async () => {
      if (!session?.user?.id) return;
      
      try {
        const response = await fetch(`/api/room?hostId=${session.user.id}`);
        
        if (response.ok) {
          const data = await response.json();
          if (data.room) {
            setRoomId(data.room.code);
          }
        }
      } catch (error) {
        console.error('Error fetching room:', error);
      }
    };

    // Initial fetch
    if (!guestRoomCode) {
      fetchRoomId();
    }

    // Set up interval for room status checks
    const intervalId = setInterval(() => {
      if (isVisible && !guestRoomCode) {
        fetchRoomId();
      }
    }, 30000); // Check room status every 30 seconds

    return () => clearInterval(intervalId);
  }, [session, guestRoomCode, isVisible]);

  // Effect for updating connected users count
  useEffect(() => {
    if (!roomId) return;

    const updateConnectedUsers = async () => {
      try {
        const response = await fetch('/api/room/join', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ roomCode: roomId }),
        });

        if (response.ok) {
          const data = await response.json();
          setHostInfo(prev => prev ? {
            ...prev,
            connectedUsers: data.room.connectedUsers,
          } : null);
        }
      } catch (error) {
        console.error('Error updating connected users:', error);
      }
    };

    // Update immediately and then every 30 seconds
    updateConnectedUsers();
    const intervalId = setInterval(updateConnectedUsers, 30000);

    return () => clearInterval(intervalId);
  }, [roomId]);

  // Effect for fetching current track and queue for guests
  useEffect(() => {
    if (!guestRoomCode || !hostInfo) return;

    const fetchGuestData = async () => {
      try {
        const response = await fetch(`/api/room/${guestRoomCode}/playback`);
        if (response.ok) {
          const data = await response.json();
          
          // Handle different status cases
          if (data.status === 'no_playback' || data.status === 'no_device' || 
              data.status === 'host_session_expired' || data.status === 'error') {
            setCurrentTrack(null);
            setQueue([]);
            setPlaybackProgress(0);
            setIsPlaying(false);
            if (progressInterval.current) {
              clearInterval(progressInterval.current);
            }
            
            // Show appropriate toast message
            toast(data.message, {
              icon: '⚠️',
              style: {
                background: '#282828',
                color: '#fff',
                borderRadius: '8px',
              },
            });
            return;
          }

          // Handle successful playback state
          setCurrentTrack(data.currentTrack);
          setQueue(data.queue);
          setPlaybackProgress(data.progress_ms);
          setIsPlaying(data.is_playing);

          // Update progress bar for guests
          if (data.is_playing && data.currentTrack) {
            if (progressInterval.current) {
              clearInterval(progressInterval.current);
            }
            progressInterval.current = setInterval(() => {
              setPlaybackProgress(prev => {
                if (prev >= data.currentTrack.duration_ms) {
                  if (progressInterval.current) {
                    clearInterval(progressInterval.current);
                  }
                  return 0;
                }
                return prev + 1000;
              });
            }, 1000);
          }
        }
      } catch (error) {
        console.error('Error fetching guest data:', error);
        toast('Failed to connect to the room. Please try again.', {
          icon: '❌',
          style: {
            background: '#ff4444',
            color: '#fff',
            borderRadius: '8px',
          },
        });
      }
    };

    fetchGuestData();
    const intervalId = setInterval(fetchGuestData, 5000);

    return () => {
      clearInterval(intervalId);
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, [guestRoomCode, hostInfo]);

  // Effect for session changes
  useEffect(() => {
    const syncTokens = async () => {
      if (!session?.user?.accessToken || !roomId) return;

      try {
        // Update room with latest tokens
        const response = await fetch(`/api/room/${roomId}/sync-tokens`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const data = await response.json();
          if (response.status === 404) {
            // Room not found or user is not host - clear roomId
            setRoomId(null);
            localStorage.removeItem('roomId');
          } else {
            console.error('Failed to sync tokens:', data.error);
          }
        }
      } catch (error) {
        console.error('Error syncing tokens:', error);
      }
    };

    syncTokens();
  }, [session?.user?.accessToken, roomId]);

  const handleLeaveRoom = async () => {
    if (isLoading) return;
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/room/leave', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ roomCode: guestRoomCode }),
      });

      if (response.ok) {
        toast.success('Left room successfully!', successToastStyle);
        router.push('/');
      } else {
        throw new Error('Failed to leave room');
      }
    } catch (error) {
      console.error('Error leaving room:', error);
      toast.error('Failed to leave room', errorToastStyle);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white">
      <Toaster
        toastOptions={{
          className: '',
          style: {
            padding: '16px',
            paddingLeft: '24px',
            paddingRight: '24px',
          },
        }}
      />
      {/* User info header */}
      <div className="bg-[#181818] px-4 sm:px-8 py-4 border-b border-[#282828]">
        <div className="flex flex-col gap-4 max-w-7xl mx-auto">
          {/* User info and room details */}
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              {/* Profile Image */}
              {(guestRoomCode && hostInfo?.hostImage) ? (
                <div className="relative w-10 h-10 flex-shrink-0">
                  <Image
                    src={hostInfo.hostImage}
                    alt={`${hostInfo.hostName}'s Profile`}
                    fill
                    className="rounded-full object-cover"
                    sizes="40px"
                  />
                </div>
              ) : (!guestRoomCode && session?.user?.image) && (
                <div className="relative w-10 h-10 flex-shrink-0">
                  <Image
                    src={session.user.image}
                    alt="Profile"
                    fill
                    className="rounded-full object-cover"
                    sizes="40px"
                  />
                </div>
              )}
              
              {/* Name and Room Info */}
              <div className="flex flex-col min-w-0">
                <span className="font-medium truncate">
                  {guestRoomCode 
                    ? `${hostInfo?.hostName}'s Room`
                    : session?.user?.name || 'Anonymous User'
                  }
                </span>
                <span className="text-sm text-[#B3B3B3] truncate">
                  {!roomId ? 'No Active Room' : (
                    <span className="flex items-center gap-2">
                      <span className="truncate">Room: {roomId}</span>
                    </span>
                  )}
                </span>
              </div>
            </div>

            {/* Mobile buttons */}
            <div className="flex items-center gap-2 sm:hidden">
              {guestRoomCode ? (
                <button
                  onClick={handleLeaveRoom}
                  disabled={isLoading}
                  className={`px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors ${
                    isLoading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isLoading ? 'Leaving...' : 'Leave'}
                </button>
              ) : (
                <button
                  onClick={roomId ? handleDestroyRoom : handleCreateRoom}
                  disabled={isLoading}
                  className={`px-3 py-2 text-white text-sm rounded-lg transition-colors ${
                    roomId 
                      ? 'bg-red-600 hover:bg-red-700' 
                      : 'bg-[#1DB954] hover:bg-[#1ed760]'
                  } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isLoading ? '...' : (roomId ? 'Destroy' : 'Create')}
                </button>
              )}
              <button
                onClick={handleSignOut}
                disabled={isLoading}
                className={`px-3 py-2 bg-[#282828] text-white text-sm rounded-lg hover:bg-[#383838] transition-colors ${
                  isLoading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                Logout
              </button>
            </div>

            {/* Desktop buttons */}
            <div className="hidden sm:flex items-center gap-4">
              {guestRoomCode ? (
                <button
                  onClick={handleLeaveRoom}
                  disabled={isLoading}
                  className={`px-4 py-2 bg-red-600 text-white text-base rounded-lg hover:bg-red-700 transition-colors ${
                    isLoading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isLoading ? 'Leaving...' : 'Leave Room'}
                </button>
              ) : (
                <button
                  onClick={roomId ? handleDestroyRoom : handleCreateRoom}
                  disabled={isLoading}
                  className={`px-4 py-2 text-white text-base rounded-lg transition-colors ${
                    roomId 
                      ? 'bg-red-600 hover:bg-red-700' 
                      : 'bg-[#1DB954] hover:bg-[#1ed760]'
                  } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isLoading ? 'Processing...' : (roomId ? 'Destroy Room' : 'Create Room')}
                </button>
              )}
              <button
                onClick={handleSignOut}
                disabled={isLoading}
                className={`px-4 py-2 bg-[#282828] text-white text-base rounded-lg hover:bg-[#383838] transition-colors ${
                  isLoading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="p-4 sm:p-8 max-w-7xl mx-auto">
        {/* Now Playing Section - Always visible for both hosts and guests */}
        <div className="mb-6 sm:mb-8">
          {currentTrack ? (
            <div className="bg-[#181818] p-4 sm:p-6 rounded-lg">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                <div className="relative w-full sm:w-32 h-32 sm:h-32">
                  <Image
                    src={currentTrack.album.images[1]?.url}
                    alt={currentTrack.album.name}
                    fill
                    className="rounded-lg object-cover"
                    sizes="(max-width: 640px) 100vw, 128px"
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold mb-2">Now Playing</h2>
                      <h3 className="text-lg sm:text-xl font-semibold">{currentTrack.name}</h3>
                      <p className="text-[#B3B3B3] text-sm sm:text-base">
                        {currentTrack.artists.map(artist => artist.name).join(', ')}
                      </p>
                      <p className="text-[#B3B3B3] text-sm sm:text-base">{currentTrack.album.name}</p>
                    </div>
                    <button
                      onClick={handleSkip}
                      disabled={isSkipLoading}
                      className={`px-4 py-2 bg-[#1DB954] text-white text-sm sm:text-base rounded-lg hover:bg-[#1ed760] transition-colors flex-shrink-0 ${
                        isSkipLoading ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {isSkipLoading ? 'Skipping...' : 'Skip'}
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Progress bar */}
              <div className="mt-4">
                <div className="relative w-full h-1 bg-[#282828] rounded-full overflow-hidden">
                  <div 
                    className="absolute left-0 top-0 h-full bg-[#1DB954] transition-all duration-1000"
                    style={{ width: `${(playbackProgress / currentTrack.duration_ms) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1 text-xs text-[#B3B3B3]">
                  <span>{formatTime(playbackProgress)}</span>
                  <span>{formatTime(currentTrack.duration_ms)}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-[#181818] p-4 sm:p-6 rounded-lg">
              <h2 className="text-xl sm:text-2xl font-bold mb-2">Now Playing</h2>
              <p>No track currently playing</p>
            </div>
          )}
        </div>
        
        <Tabs defaultValue="queue" className="w-full">
          <TabsList className="mb-6 sm:mb-8 w-full flex">
            <TabsTrigger value="queue" className="flex-1">Queue</TabsTrigger>
            <TabsTrigger value="search" className="flex-1">Search</TabsTrigger>
          </TabsList>

          <TabsContent value="queue">
            <div className="space-y-4">
              {queue.map((track) => (
                <div key={track.id} className="bg-[#181818] p-4 rounded-lg flex items-center gap-4">
                  <div className="relative w-12 h-12 flex-shrink-0">
                    <Image
                      src={track.album.images[2]?.url}
                      alt={track.album.name}
                      fill
                      className="rounded object-cover"
                      sizes="48px"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold truncate">{track.name}</h3>
                    <p className="text-sm text-[#B3B3B3] truncate">
                      {track.artists.map(artist => artist.name).join(', ')}
                    </p>
                  </div>
                </div>
              ))}
              {queue.length === 0 && <p>Queue is empty</p>}
            </div>
          </TabsContent>

          <TabsContent value="search">
            <div className="space-y-6">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Start typing to search for songs..."
                className="w-full bg-[#282828] text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1DB954] text-base sm:text-lg"
              />

              <div className="space-y-4">
                {searchResults.map((track) => (
                  <div key={track.id} className="bg-[#181818] p-4 rounded-lg flex flex-col sm:flex-row sm:items-center gap-4 sm:justify-between">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="relative w-12 h-12 flex-shrink-0">
                        <Image
                          src={track.album.images[2]?.url}
                          alt={track.album.name}
                          fill
                          className="rounded object-cover"
                          sizes="48px"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold truncate">{track.name}</h3>
                        <p className="text-sm text-[#B3B3B3] truncate">
                          {track.artists.map(artist => artist.name).join(', ')} • {track.album.name}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => addToQueue(`spotify:track:${track.id}`, track.name)}
                      disabled={addToQueueLoading === `spotify:track:${track.id}`}
                      className={`w-full sm:w-auto bg-[#1DB954] text-white px-4 py-2 rounded-lg hover:bg-[#1ed760] transition-colors text-center ${
                        addToQueueLoading === `spotify:track:${track.id}` ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {addToQueueLoading === `spotify:track:${track.id}` ? 'Adding...' : 'Add to Queue'}
                    </button>
                  </div>
                ))}
                {searchQuery && searchResults.length === 0 && (
                  <p className="text-center text-[#B3B3B3]">No songs found</p>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 