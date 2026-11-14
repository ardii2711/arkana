import type { RequestHandler } from 'express';

import { ApiError } from '../../utils/api-error.js';
import { sendSuccess } from '../../utils/api-response.js';
import { REFRESH_COOKIE, clearAuthCookies, setAuthCookies } from './auth.cookies.js';
import type { ActivateAccountInput, LoginInput } from './auth.schema.js';
import {
  activateAccount,
  getActivationInfo,
  login,
  logout,
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
