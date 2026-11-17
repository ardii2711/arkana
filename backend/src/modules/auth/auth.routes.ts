import { Router } from 'express';

import { createLimiter } from '../../middlewares/rate-limit.js';
import { requireAuth } from '../../middlewares/require-auth.js';
import { validate } from '../../middlewares/validate.js';
import {
  activateAccountHandler,
  activationInfoHandler,
  changePasswordHandler,
  forgotPasswordHandler,
  googleCallbackHandler,
  googleStartHandler,
  loginHandler,
  logoutHandler,
  meHandler,
  refreshHandler,
  resetPasswordHandler,
} from './auth.controller.js';
import {
  activateAccountSchema,
  activationTokenSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
} from './auth.schema.js';

const loginLimiter = createLimiter(10);
const refreshLimiter = createLimiter(60);
const logoutLimiter = createLimiter(30);
const activateLimiter = createLimiter(10);
const googleLimiter = createLimiter(20);
const forgotPasswordLimiter = createLimiter(5);
const resetPasswordLimiter = createLimiter(10);
const changePasswordLimiter = createLimiter(5);

export const authRouter = Router();

authRouter.post('/login', loginLimiter, validate({ body: loginSchema }), loginHandler);
authRouter.post('/refresh', refreshLimiter, refreshHandler);
authRouter.post('/logout', logoutLimiter, logoutHandler);
authRouter.get('/me', requireAuth, meHandler);
authRouter.get('/google', googleLimiter, googleStartHandler);
authRouter.get('/google/callback', googleLimiter, googleCallbackHandler);
authRouter.get(
  '/activation/:token',
  activateLimiter,
  validate({ params: activationTokenSchema }),
  activationInfoHandler,
);
authRouter.post(
  '/activate',
  activateLimiter,
  validate({ body: activateAccountSchema }),
  activateAccountHandler,
);
authRouter.post(
  '/password/forgot',
  forgotPasswordLimiter,
  validate({ body: forgotPasswordSchema }),
  forgotPasswordHandler,
);
authRouter.post(
  '/password/reset',
  resetPasswordLimiter,
  validate({ body: resetPasswordSchema }),
  resetPasswordHandler,
);
authRouter.post(
  '/password/change',
  requireAuth,
  changePasswordLimiter,
  validate({ body: changePasswordSchema }),
  changePasswordHandler,
);
