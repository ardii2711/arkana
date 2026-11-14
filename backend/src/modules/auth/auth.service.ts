import argon2 from 'argon2';

import { prisma } from '../../lib/prisma.js';
import type { AuthUser } from '../../types/auth.js';
import { ApiError } from '../../utils/api-error.js';
import {
  REFRESH_TOKEN_TTL_MS,
  createRefreshToken,
  hashToken,
  signAccessToken,
} from './auth.tokens.js';

export interface AuthResult {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

function toAuthUser(user: {
  id: string;
  name: string;
  email: string;
  role: AuthUser['role'];
  status: AuthUser['status'];
}): AuthUser {
  return { id: user.id, name: user.name, email: user.email, role: user.role, status: user.status };
}

async function issueTokens(userId: string): Promise<{ accessToken: string; refreshToken: string }> {
  const refreshToken = createRefreshToken();

  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash: hashToken(refreshToken),
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    },
  });

  return { accessToken: await signAccessToken(userId), refreshToken };
}

export async function login(email: string, password: string): Promise<AuthResult> {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user?.passwordHash || user.status !== 'ACTIVE') {
    throw new ApiError(401, 'INVALID_CREDENTIALS', 'Email atau password salah');
  }

  const passwordValid = await argon2.verify(user.passwordHash, password);

  if (!passwordValid) {
    throw new ApiError(401, 'INVALID_CREDENTIALS', 'Email atau password salah');
  }

  return { user: toAuthUser(user), ...(await issueTokens(user.id)) };
}

export async function rotateSession(refreshToken: string): Promise<AuthResult> {
  const tokenHash = hashToken(refreshToken);
  const stored = await prisma.refreshToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!stored || stored.expiresAt.getTime() <= Date.now()) {
    if (stored) {
      await prisma.refreshToken.deleteMany({ where: { id: stored.id } });
    }
    throw new ApiError(401, 'SESSION_EXPIRED', 'Sesi berakhir, silakan login kembali');
  }

  await prisma.refreshToken.deleteMany({ where: { id: stored.id } });

  if (stored.user.status !== 'ACTIVE') {
    throw new ApiError(401, 'INVALID_CREDENTIALS', 'Akun tidak aktif');
  }

  return { user: toAuthUser(stored.user), ...(await issueTokens(stored.userId)) };
}

export async function logout(refreshToken: string | undefined): Promise<void> {
  if (!refreshToken) {
    return;
  }

  await prisma.refreshToken.deleteMany({ where: { tokenHash: hashToken(refreshToken) } });
}
