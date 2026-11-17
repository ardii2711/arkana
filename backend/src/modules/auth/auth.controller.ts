import type { RequestHandler } from 'express';

import { env } from '../../config/env.js';
import { logger } from '../../lib/logger.js';
import { ApiError } from '../../utils/api-error.js';
import { sendSuccess } from '../../utils/api-response.js';
import { currentUser } from '../../utils/current-user.js';
import {
  OAUTH_STATE_COOKIE,
  OAUTH_VERIFIER_COOKIE,
  REFRESH_COOKIE,
  clearAuthCookies,
  clearOAuthCookies,
  setAuthCookies,
  setOAuthCookies,
} from './auth.cookies.js';
import { createGoogleAuthRequest, exchangeGoogleCode } from './auth.google.js';
import type {
  ActivateAccountInput,
  ChangePasswordInput,
  ForgotPasswordInput,
  LoginInput,
  ResetPasswordInput,
} from './auth.schema.js';
import {
  activateAccount,
  changePassword,
  getActivationInfo,
  login,
  loginWithGoogle,
  logout,
  requestPasswordReset,
  resetPassword,
  rotateSession,
} from './auth.service.js';

export const loginHandler: RequestHandler = async (req, res) => {
  const { email, password } = res.locals.input.body as LoginInput;
  const result = await login(email, password);

  setAuthCookies(res, result.accessToken, result.refreshToken);
  sendSuccess(res, { user: result.user });
};

export const refreshHandler: RequestHandler = async (req, res) => {
  const refreshToken = req.cookies?.[REFRESH_COOKIE] as string | undefined;

  if (!refreshToken) {
    throw new ApiError(401, 'SESSION_EXPIRED', 'Sesi berakhir, silakan login kembali');
  }

  const result = await rotateSession(refreshToken);

  setAuthCookies(res, result.accessToken, result.refreshToken);
  sendSuccess(res, { user: result.user });
};

export const logoutHandler: RequestHandler = async (req, res) => {
  await logout(req.cookies?.[REFRESH_COOKIE] as string | undefined);
  clearAuthCookies(res);
  res.status(204).end();
};

export const meHandler: RequestHandler = (req, res) => {
  sendSuccess(res, { user: req.user });
};

export const activationInfoHandler: RequestHandler = async (_req, res) => {
  const { token } = res.locals.input.params as { token: string };
  sendSuccess(res, await getActivationInfo(token));
};

export const activateAccountHandler: RequestHandler = async (_req, res) => {
  const { token, password } = res.locals.input.body as ActivateAccountInput;
  await activateAccount(token, password);
  sendSuccess(res, { activated: true });
};

export const googleStartHandler: RequestHandler = (_req, res) => {
  const { url, state, verifier } = createGoogleAuthRequest();

  setOAuthCookies(res, state, verifier);
  res.redirect(url);
};

export const googleCallbackHandler: RequestHandler = async (req, res) => {
  const fail = (error: string) => res.redirect(`${env.CORS_ORIGIN}/login?error=${error}`);
  const { code, state, error } = req.query;
  const storedState = req.cookies?.[OAUTH_STATE_COOKIE] as string | undefined;
  const verifier = req.cookies?.[OAUTH_VERIFIER_COOKIE] as string | undefined;

  clearOAuthCookies(res);

  if (typeof error === 'string' || typeof code !== 'string' || typeof state !== 'string') {
    return fail('oauth_cancelled');
  }

  if (!storedState || !verifier || state !== storedState) {
    return fail('oauth_invalid_state');
  }

  try {
    const result = await loginWithGoogle(await exchangeGoogleCode(code, verifier));

    setAuthCookies(res, result.accessToken, result.refreshToken);
    return res.redirect(env.CORS_ORIGIN);
  } catch (err) {
    if (err instanceof ApiError) {
      logger.warn({ code: err.code }, 'Login Google ditolak');
      return fail(err.code.toLowerCase());
    }

    logger.error({ err }, 'Login Google gagal');
    return fail('oauth_failed');
  }
};

export const forgotPasswordHandler: RequestHandler = async (_req, res) => {
  const { email } = res.locals.input.body as ForgotPasswordInput;

  await requestPasswordReset(email);
  sendSuccess(res, { sent: true });
};

export const resetPasswordHandler: RequestHandler = async (_req, res) => {
  const { token, password } = res.locals.input.body as ResetPasswordInput;

  await resetPassword(token, password);
  sendSuccess(res, { reset: true });
};

export const changePasswordHandler: RequestHandler = async (req, res) => {
  const { currentPassword, newPassword } = res.locals.input.body as ChangePasswordInput;
  const userId = currentUser(req).id;
  const refreshToken = req.cookies?.[REFRESH_COOKIE] as string | undefined;

  await changePassword(userId, currentPassword, newPassword, refreshToken);
  sendSuccess(res, { changed: true });
};
