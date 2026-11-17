import argon2 from 'argon2';

import { env } from '../../config/env.js';
import { notifyAccountActivated } from '../../lib/account-mail.js';
import { logger } from '../../lib/logger.js';
import { sendMail } from '../../lib/mailer.js';
import { prisma } from '../../lib/prisma.js';
import { TOKEN_TTL_MS, ttlLabel } from '../../lib/token-ttl.js';
import { createToken, hashToken } from '../../lib/tokens.js';
import type { AuthUser } from '../../types/auth.js';
import { ApiError } from '../../lib/api-error.js';
import type { GoogleProfile } from './auth.google.js';
import { REFRESH_TOKEN_TTL_MS, signAccessToken } from '../../lib/access-token.js';

interface AuthResult {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: AuthUser['role'];
  status: AuthUser['status'];
};

function toAuthUser(user: SessionUser): AuthUser {
  return { id: user.id, name: user.name, email: user.email, role: user.role, status: user.status };
}

async function issueTokens(userId: string): Promise<{ accessToken: string; refreshToken: string }> {
  const refreshToken = createToken();

  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash: hashToken(refreshToken),
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    },
  });

  return { accessToken: await signAccessToken(userId), refreshToken };
}

async function createSession(user: SessionUser): Promise<AuthResult> {
  return { user: toAuthUser(user), ...(await issueTokens(user.id)) };
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

  return createSession(user);
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

  return createSession(stored.user);
}

export async function logout(refreshToken: string | undefined): Promise<void> {
  if (!refreshToken) {
    return;
  }

  await prisma.refreshToken.deleteMany({ where: { tokenHash: hashToken(refreshToken) } });
}

async function findInvitation(token: string) {
  const record = await prisma.accountToken.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  });

  if (
    !record ||
    record.type !== 'INVITATION' ||
    record.usedAt ||
    record.expiresAt.getTime() <= Date.now() ||
    record.user.status !== 'INVITED'
  ) {
    throw new ApiError(400, 'INVALID_TOKEN', 'Tautan aktivasi tidak valid atau kedaluwarsa');
  }

  return record;
}

export async function getActivationInfo(token: string): Promise<{ name: string; email: string }> {
  const record = await findInvitation(token);
  return { name: record.user.name, email: record.user.email };
}

export async function activateAccount(token: string, password: string): Promise<void> {
  const record = await findInvitation(token);
  const passwordHash = await argon2.hash(password, { type: argon2.argon2id });

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash, status: 'ACTIVE', activatedAt: new Date() },
    }),
    prisma.accountToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
  ]);

  await notifyAccountActivated(record.user.name, record.user.email).catch((error) =>
    logger.error({ err: error }, 'Gagal mengirim email aktivasi akun'),
  );
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
  currentRefreshToken: string | undefined,
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true },
  });

  if (!user) {
    throw new ApiError(404, 'NOT_FOUND', 'Akun tidak ditemukan');
  }

  if (!user.passwordHash) {
    throw new ApiError(
      400,
      'PASSWORD_NOT_SET',
      'Akun ini belum memiliki password. Gunakan reset password melalui email',
    );
  }

  const passwordValid = await argon2.verify(user.passwordHash, currentPassword);

  if (!passwordValid) {
    throw new ApiError(400, 'INVALID_PASSWORD', 'Password lama salah');
  }

  const passwordHash = await argon2.hash(newPassword, { type: argon2.argon2id });

  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { passwordHash } }),
    prisma.refreshToken.deleteMany({
      where: {
        userId,
        ...(currentRefreshToken && { tokenHash: { not: hashToken(currentRefreshToken) } }),
      },
    }),
  ]);
}

export async function loginWithGoogle({ googleId, email }: GoogleProfile): Promise<AuthResult> {
  const user = await prisma.user.findFirst({
    where: { OR: [{ googleId }, { email }] },
  });

  if (!user) {
    throw new ApiError(403, 'ACCOUNT_NOT_REGISTERED', 'Email belum terdaftar');
  }

  if (user.status !== 'ACTIVE') {
    throw new ApiError(403, 'ACCOUNT_INACTIVE', 'Akun tidak aktif');
  }

  if (user.googleId && user.googleId !== googleId) {
    throw new ApiError(403, 'GOOGLE_ACCOUNT_MISMATCH', 'Akun Google tidak sesuai');
  }

  if (!user.googleId) {
    await prisma.user.update({ where: { id: user.id }, data: { googleId } });
  }

  return createSession(user);
}

async function sendPasswordResetEmail(name: string, email: string, token: string): Promise<void> {
  const link = `${env.CORS_ORIGIN}/reset-password?token=${token}`;
  const ttl = ttlLabel(TOKEN_TTL_MS.PASSWORD_RESET);

  await sendMail({
    to: email,
    subject: 'Reset password ARKANA',
    text: `Halo ${name},\n\nKami menerima permintaan reset password akun ARKANA Anda. Atur password baru melalui tautan berikut:\n${link}\n\nTautan berlaku ${ttl}. Abaikan email ini jika Anda tidak meminta reset password.`,
    html: `<p>Halo ${name},</p><p>Kami menerima permintaan reset password akun ARKANA Anda. Atur password baru melalui tautan berikut:</p><p><a href="${link}">Atur password baru</a></p><p>Tautan berlaku ${ttl}. Abaikan email ini jika Anda tidak meminta reset password.</p>`,
  });
}

export async function requestPasswordReset(email: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || user.status !== 'ACTIVE') {
    return;
  }

  const token = createToken();
  const tokenHash = hashToken(token);

  await prisma.$transaction([
    prisma.accountToken.deleteMany({
      where: { userId: user.id, type: 'PASSWORD_RESET', usedAt: null },
    }),
    prisma.accountToken.create({
      data: {
        userId: user.id,
        type: 'PASSWORD_RESET',
        tokenHash,
        expiresAt: new Date(Date.now() + TOKEN_TTL_MS.PASSWORD_RESET),
      },
    }),
  ]);

  try {
    await sendPasswordResetEmail(user.name, user.email, token);
  } catch (error) {
    await prisma.accountToken.deleteMany({ where: { tokenHash } });
    logger.error({ err: error }, 'Gagal mengirim email reset password');
  }
}

export async function resetPassword(token: string, password: string): Promise<void> {
  const record = await prisma.accountToken.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  });

  if (
    !record ||
    record.type !== 'PASSWORD_RESET' ||
    record.usedAt ||
    record.expiresAt.getTime() <= Date.now() ||
    record.user.status !== 'ACTIVE'
  ) {
    throw new ApiError(400, 'INVALID_TOKEN', 'Tautan reset password tidak valid atau kedaluwarsa');
  }

  const passwordHash = await argon2.hash(password, { type: argon2.argon2id });

  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
    prisma.accountToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    prisma.accountToken.deleteMany({
      where: { userId: record.userId, type: 'PASSWORD_RESET', usedAt: null },
    }),
    prisma.refreshToken.deleteMany({ where: { userId: record.userId } }),
  ]);
}
