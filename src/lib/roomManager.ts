import { PrismaClient } from '@prisma/client';

interface HostInfo {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

const prisma = new PrismaClient();

export async function createRoom(roomCode: string, hostInfo: HostInfo) {
  await prisma.room.create({
    data: {
      code: roomCode,
      active: true,
      hostAccessToken: hostInfo.accessToken,
      hostRefreshToken: hostInfo.refreshToken,
      hostTokenExpiresAt: new Date(hostInfo.expiresAt),
    },
  });
}

export async function getHostInfo(roomCode: string): Promise<HostInfo | undefined> {
  const room = await prisma.room.findUnique({
    where: { code: roomCode, active: true },
  });

  if (!room) return undefined;

  return {
    accessToken: room.hostAccessToken,
    refreshToken: room.hostRefreshToken,
    expiresAt: room.hostTokenExpiresAt.getTime(),
  };
}

export async function updateHostInfo(roomCode: string, hostInfo: HostInfo) {
  await prisma.room.update({
    where: { code: roomCode },
    data: {
      hostAccessToken: hostInfo.accessToken,
      hostRefreshToken: hostInfo.refreshToken,
      hostTokenExpiresAt: new Date(hostInfo.expiresAt),
    },
  });
}

export async function removeRoom(roomCode: string) {
  await prisma.room.update({
    where: { code: roomCode },
    data: { active: false },
  });
}

export async function isRoomActive(roomCode: string): Promise<boolean> {
  const room = await prisma.room.findUnique({
    where: { code: roomCode, active: true },
  });
  return !!room;
} 