import app from './app.js';
import { env } from './config/env.js';
import { prisma } from './config/prisma.js';
import { logger } from './utils/logger.js';

const PORT = env.PORT;

const server = app.listen(PORT, () => {
  logger.info(`Vynexa CRM Backend API running on http://localhost:${PORT}`, {
    port: PORT,
    environment: env.NODE_ENV
  });
  logger.info(`Health check available at http://localhost:${PORT}/api/health`);
});

let isShuttingDown = false;

async function handleGracefulShutdown(signal: string) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  logger.info(`Received ${signal}. Initiating graceful shutdown...`);

  // Forced shutdown fallback timer in case keep-alive sockets linger
  const forceExitTimer = setTimeout(() => {
    logger.error('Graceful shutdown timeout exceeded (10s). Forcing process exit.');
    process.exit(1);
  }, 10000);

  if (forceExitTimer.unref) {
    forceExitTimer.unref();
  }

  server.close(async (err) => {
    if (err) {
      logger.error('Error closing HTTP server:', err);
      process.exit(1);
    }

    try {
      logger.info('Closing database connections...');
      await prisma.$disconnect();
      logger.info('Graceful shutdown completed successfully.');
      process.exit(0);
    } catch (dbErr) {
      logger.error('Error during database disconnect:', dbErr);
      process.exit(1);
    }
  });
}

process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'));
process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));
