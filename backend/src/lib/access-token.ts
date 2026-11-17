import { SignJWT, jwtVerify } from 'jose';

import { env } from '../config/env.js';

// Cookie HTTP-only pengangkut access JWT; middleware dan modul auth sama-sama membutuhkannya.
export const ACCESS_COOKIE = 'arkana_access';

const secret = new TextEncoder().encode(env.JWT_ACCESS_SECRET);

export const ACCESS_TOKEN_TTL_MS = 15 * 60 * 1000;
export const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export async function signAccessToken(userId: string): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(Math.floor((Date.now() + ACCESS_TOKEN_TTL_MS) / 1000))
    .sign(secret);
}

export async function verifyAccessToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, secret, { algorithms: ['HS256'] });
    return payload.sub ?? null;
  } catch {
    return null;
  }
}
