import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';

import { requireAuth } from '../../middlewares/require-auth.js';
import { validate } from '../../middlewares/validate.js';
import { loginHandler, logoutHandler, meHandler, refreshHandler } from './auth.controller.js';
import { loginSchema } from './auth.schema.js';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({
      success: false,
      error: { code: 'RATE_LIMITED', message: 'Terlalu banyak percobaan. Coba lagi nanti.' },
    });
  },
});

export const authRouter = Router();

authRouter.post('/login', loginLimiter, validate({ body: loginSchema }), loginHandler);
authRouter.post('/refresh', refreshHandler);
authRouter.post('/logout', logoutHandler);
authRouter.get('/me', requireAuth, meHandler);
