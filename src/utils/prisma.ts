/**
 * Prisma Client Utility
 * Singleton instance of Prisma Client
 */

import { PrismaClient } from '@prisma/client';
import logger from './logger';

// PrismaClient is attached to the `global` object in development to prevent
// exhausting database connection limit during hot reloading in development
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

/**
 * Connect to database
 */
export const connectPrisma = async (): Promise<void> => {
  try {
    await prisma.$connect();
    logger.info('Connected to database via Prisma');
  } catch (error) {
    logger.error('Failed to connect to database:', error);
    throw error;
  }
};

/**
 * Disconnect from database
 */
export const disconnectPrisma = async (): Promise<void> => {
  try {
    await prisma.$disconnect();
    logger.info('Disconnected from database');
  } catch (error) {
    logger.error('Failed to disconnect from database:', error);
    throw error;
  }
};

export default prisma;
