import { PrismaClient } from '@prisma/client';

// Global declaration to maintain a single PrismaClient across imports and reloads
declare global {
  // eslint-disable-next-line no-var
  var __vynexa_prisma_singleton__: PrismaClient | undefined;
}

const isProduction = process.env.NODE_ENV === 'production';

export const prisma =
  globalThis.__vynexa_prisma_singleton__ ??
  new PrismaClient({
    log: isProduction ? ['error'] : ['warn', 'error']
  });

if (!isProduction) {
  globalThis.__vynexa_prisma_singleton__ = prisma;
}

/**
 * Validates database reachability for health probes.
 */
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (_err) {
    return false;
  }
}
