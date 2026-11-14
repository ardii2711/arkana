import type { CookieOptions, Response } from 'express';

import { env } from '../../config/env.js';
import { ACCESS_TOKEN_TTL_MS, REFRESH_TOKEN_TTL_MS } from './auth.tokens.js';

export const ACCESS_COOKIE = 'arkana_access';
export const REFRESH_COOKIE = 'arkana_refresh';

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

export function setAuthCookies(res: Response, accessToken: string, refreshToken: string): void {
  res.cookie(ACCESS_COOKIE, accessToken, accessOptions);
  res.cookie(REFRESH_COOKIE, refreshToken, refreshOptions);
}

export function clearAuthCookies(res: Response): void {
  res.clearCookie(ACCESS_COOKIE, accessOptions);
  res.clearCookie(REFRESH_COOKIE, refreshOptions);
}
