import { describe, it, expect, vi } from 'vitest';
import { prisma, checkDatabaseConnection } from '../../src/config/prisma.js';

describe('Prisma Singleton Configuration (unit)', () => {
  it('should export an active singleton instance of PrismaClient', () => {
    expect(prisma).toBeDefined();
    expect(typeof prisma.$connect).toBe('function');
  });

  it('should verify database reachability via checkDatabaseConnection', async () => {
    const isConnected = await checkDatabaseConnection();
    expect(typeof isConnected).toBe('boolean');
  });

  it('should return false if queryRaw throws during checkDatabaseConnection', async () => {
    const queryRawSpy = vi.spyOn(prisma, '$queryRaw').mockRejectedValueOnce(new Error('Connection lost'));
    const isConnected = await checkDatabaseConnection();
    expect(isConnected).toBe(false);
    queryRawSpy.mockRestore();
  });
});
