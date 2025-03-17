import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: ['error'],
    datasources: {
      db: {
        url: process.env.POSTGRES_PRISMA_URL,
      },
    },
  });
};

// In development, use a global variable to prevent multiple instances
// In production, create a new instance for each request
export const prisma = process.env.NODE_ENV === 'production' 
  ? prismaClientSingleton()
  : (globalThis.prisma ?? prismaClientSingleton());

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
} 