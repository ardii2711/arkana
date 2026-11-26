import { app } from './app.js';
import { env } from './config/env.js';
import { startKeepAlive } from './lib/keep-alive.js';
import { logger } from './lib/logger.js';
import { prisma } from './lib/prisma.js';

const server = app.listen(env.PORT, () => {
  logger.info(`ARKANA API listening on port ${env.PORT}`);
});

const stopKeepAlive = startKeepAlive();

function shutdown(signal: NodeJS.Signals): void {
  logger.info({ signal }, 'Shutting down');
  stopKeepAlive();

  server.close((err) => {
    if (err) {
      logger.error({ err }, 'Failed to close server');
      process.exit(1);
    }

    prisma.$disconnect().finally(() => process.exit(0));
  });

  // Jangan menggantung bila ada request macet.
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
