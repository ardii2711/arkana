import type { Request, Response } from 'express';
import { rateLimit } from 'express-rate-limit';

const DEFAULT_WINDOW_MS = 15 * 60 * 1000;

function rateLimitHandler(_req: Request, res: Response) {
  res.status(429).json({
    success: false,
    error: { code: 'RATE_LIMITED', message: 'Terlalu banyak permintaan. Coba lagi nanti.' },
  });
}

export function createLimiter(limit: number, windowMs = DEFAULT_WINDOW_MS) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: rateLimitHandler,
  });
}
