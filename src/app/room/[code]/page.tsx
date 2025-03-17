import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import CurrentTrack from '@/components/room/CurrentTrack';
import Queue from '@/components/room/Queue';
import TrackSearch from '@/components/room/TrackSearch';
import { prisma } from '@/lib/prisma';
import Button from '@/components/ui/Button';

interface RoomPageProps {
  params: {
    code: string;
  };
}

export default async function RoomPage({ params }: RoomPageProps) {
  try {
    const session = await getServerSession(authOptions);
    const { code } = params;

    // Validate room code
    if (!code || code.length !== 6) {
      redirect('/');
    }

    // Fetch room and check if it exists and is active
    const room = await prisma.room.findUnique({
      where: { 
        code,
        active: true 
      },
    });

    if (!room) {
      redirect('/');
    }

    // Check if user is host
    const isHost = session?.user?.id === room.hostId;

    // Get host name from session if user is host
    const hostName = isHost ? session?.user?.name : 'Host';

    return (
      <main className="min-h-screen bg-[#121212] py-8 px-4">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-white">Room {code}</h1>
            <div className="text-[#B3B3B3]">
              Host: <span className="text-[#1DB954]">{hostName}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Current Track and Queue */}
            <div className="lg:col-span-2 space-y-6">
              <CurrentTrack roomCode={code} isHost={isHost} />
              <Queue roomCode={code} isHost={isHost} />
            </div>

            {/* Right Column: Search */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-white">Add to Queue</h2>
              <TrackSearch roomCode={code} />
            </div>
          </div>

          <Button
            variant="ghost"
            onClick={handleLeave}
            disabled={isLeaving}
            className="w-full"
          >
            {isLeaving ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Leaving...
              </div>
            ) : (
              'Leave'
            )}
          </Button>
        </div>
      </main>
    );
  } catch (error) {
    console.error('Error loading room:', error);
    redirect('/');
  }
} 