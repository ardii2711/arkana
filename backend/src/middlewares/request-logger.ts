import type { IncomingMessage } from 'node:http';

import { pinoHttp, stdSerializers } from 'pino-http';

import { logger } from '../lib/logger.js';

const TOKEN_PATH = /^\/api\/(?:public\/work-logs|auth\/activation)\/[^/?]+/;

/** Token bearer di URL dan query tidak boleh masuk log. */
export function sanitizeRequestUrl(url: string): string {
  const path = url.split('?')[0] ?? '';

  return path.replace(
    TOKEN_PATH,
    (match) => `${match.slice(0, match.lastIndexOf('/') + 1)}[token]`,
  );
}

export const requestLogger = pinoHttp({
  logger,
  // Self-ping dan probe platform tidak perlu memenuhi log.
  autoLogging: { ignore: (request) => request.url === '/api/health' },
  serializers: {
    req(request: IncomingMessage) {
      return { ...stdSerializers.req(request), url: sanitizeRequestUrl(request.url ?? '') };
    },
  },
});
