import type { CookieOptions, Response } from 'express';

import { env } from '../../config/env.js';
import {
  ACCESS_COOKIE,
  ACCESS_TOKEN_TTL_MS,
  REFRESH_TOKEN_TTL_MS,
} from '../../lib/access-token.js';

export const REFRESH_COOKIE = 'arkana_refresh';
export const OAUTH_STATE_COOKIE = 'arkana_oauth_state';
export const OAUTH_VERIFIER_COOKIE = 'arkana_oauth_verifier';

const baseOptions: CookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax',
};

const accessOptions: CookieOptions = { ...baseOptions, path: '/', maxAge: ACCESS_TOKEN_TTL_MS };
const refreshOptions: CookieOptions = {
  ...baseOptions,
  path: '/api/auth',
  maxAge: REFRESH_TOKEN_TTL_MS,
};
const oauthOptions: CookieOptions = {
  ...baseOptions,
  path: '/api/auth/google',
  maxAge: 10 * 60 * 1000,
};

export function setAuthCookies(res: Response, accessToken: string, refreshToken: string): void {
  res.cookie(ACCESS_COOKIE, accessToken, accessOptions);
  res.cookie(REFRESH_COOKIE, refreshToken, refreshOptions);
}

export function clearAuthCookies(res: Response): void {
  res.clearCookie(ACCESS_COOKIE, accessOptions);
  res.clearCookie(REFRESH_COOKIE, refreshOptions);
}

export function setOAuthCookies(res: Response, state: string, verifier: string): void {
  res.cookie(OAUTH_STATE_COOKIE, state, oauthOptions);
  res.cookie(OAUTH_VERIFIER_COOKIE, verifier, oauthOptions);
}

export function clearOAuthCookies(res: Response): void {
  res.clearCookie(OAUTH_STATE_COOKIE, oauthOptions);
  res.clearCookie(OAUTH_VERIFIER_COOKIE, oauthOptions);
}
