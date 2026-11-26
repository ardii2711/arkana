import { env } from '../config/env.js';
import { logger } from './logger.js';
import { prisma } from './prisma.js';

const SELF_PING_INTERVAL_MS = 7 * 60 * 1000;
const SELF_PING_TIMEOUT_MS = 10_000;
const DB_KEEP_ALIVE_INTERVAL_MS = 12 * 60 * 60 * 1000;

/**
 * Menjaga instance Render free tetap bangun (self-ping) dan mencegah Supabase
 * free project pause (query ringan berkala). Hanya aktif di produksi.
 *
 * ponytail: self-ping tidak bisa membangunkan instance yang sudah tidur; timer
 * ikut mati bersama proses. Monitor eksternal tetap diperlukan untuk itu.
 */
export function startKeepAlive(): () => void {
  if (env.NODE_ENV !== 'production') {
    return () => {};
  }

  const timers: NodeJS.Timeout[] = [];
  const hostname = env.RENDER_EXTERNAL_HOSTNAME;

  if (hostname) {
    const url = `https://${hostname}/api/health`;
    logger.info({ url, intervalMs: SELF_PING_INTERVAL_MS }, 'Self-ping Render aktif');

    timers.push(
      setInterval(() => {
        void fetch(url, { signal: AbortSignal.timeout(SELF_PING_TIMEOUT_MS) })
          .then((response) => {
            if (response.ok) {
              logger.info('Self-ping Render sukses');
            } else {
              logger.warn({ status: response.status }, 'Self-ping Render gagal');
            }
          })
          .catch((err: unknown) => {
            logger.warn({ err }, 'Self-ping Render error');
          });
      }, SELF_PING_INTERVAL_MS).unref(),
    );
  }

  logger.info({ intervalMs: DB_KEEP_ALIVE_INTERVAL_MS }, 'DB keep-alive aktif');

  timers.push(
    setInterval(() => {
      void prisma.$queryRaw`SELECT 1`
        .then(() => logger.info('DB keep-alive sukses'))
        .catch((err: unknown) => logger.warn({ err }, 'DB keep-alive gagal'));
    }, DB_KEEP_ALIVE_INTERVAL_MS).unref(),
  );

  return () => {
    for (const timer of timers) {
      clearInterval(timer);
    }
  };
}
