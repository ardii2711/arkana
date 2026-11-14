import { createHash, randomBytes } from 'node:crypto';

import { SignJWT, jwtVerify } from 'jose';

import { env } from '../../config/env.js';

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

export function createRefreshToken(): string {
  return randomBytes(32).toString('hex');
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
