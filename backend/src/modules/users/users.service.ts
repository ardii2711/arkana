import {
  notifyAccountActivated,
  notifyAccountDeactivated,
  notifyEmailChanged,
  sendInvitationEmail,
} from '../../lib/account-mail.js';
import { logger } from '../../lib/logger.js';
import { prisma } from '../../lib/prisma.js';
import { isUniqueViolation } from '../../lib/prisma-error.js';
import { TOKEN_TTL_MS } from '../../lib/token-ttl.js';
import { createToken, hashToken } from '../../lib/tokens.js';
import { ApiError } from '../../utils/api-error.js';
import type { InviteUserInput, ListUsersQuery, UpdateUserInput } from './users.schema.js';

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  status: true,
  activatedAt: true,
  createdAt: true,
} as const;

/** Token undangan baru + data pembuatan token, dipakai jalur invite dan resend agar tidak berbeda. */
function invitationTokenData() {
  const token = createToken();

  return {
    token,
    data: {
      type: 'INVITATION' as const,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + TOKEN_TTL_MS.INVITATION),
    },
  };
}

async function createInvitationToken(userId: string): Promise<string> {
  const { token, data } = invitationTokenData();

  await prisma.$transaction([
    prisma.accountToken.deleteMany({
      where: { userId, type: 'INVITATION', usedAt: null },
    }),
    prisma.accountToken.create({
      data: { userId, ...data },
    }),
  ]);

  return token;
}

export async function listUsers({ page, limit, search }: ListUsersQuery) {
  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { email: { contains: search, mode: 'insensitive' as const } },
        ],
      }
    : {};

  const [items, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      select: userSelect,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  return { items, total, page, limit };
}

export async function inviteUser({ name, email }: InviteUserInput) {
  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    throw new ApiError(409, 'EMAIL_TAKEN', 'Email sudah terdaftar');
  }

  const { token, data } = invitationTokenData();

  const user = await prisma.user
    .create({
      data: {
        name,
        email,
        role: 'USER',
        status: 'INVITED',
        accountTokens: {
          create: data,
        },
      },
      select: userSelect,
    })
    .catch((error: unknown) => {
      if (isUniqueViolation(error)) {
        throw new ApiError(409, 'EMAIL_TAKEN', 'Email sudah terdaftar');
      }

      throw error;
    });

  try {
    await sendInvitationEmail(name, email, token);
  } catch {
    await prisma.user.delete({ where: { id: user.id } }).catch(() => undefined);
    throw new ApiError(502, 'EMAIL_FAILED', 'Gagal mengirim email undangan');
  }

  return user;
}

export async function resendInvitation(id: string) {
  const user = await prisma.user.findUnique({ where: { id } });

  if (!user) {
    throw new ApiError(404, 'NOT_FOUND', 'Akun tidak ditemukan');
  }

  if (user.role === 'ADMIN') {
    throw new ApiError(403, 'FORBIDDEN', 'Akun Admin tidak dapat diundang');
  }

  if (user.status !== 'INVITED') {
    throw new ApiError(400, 'INVALID_STATUS', 'Undangan hanya untuk akun yang belum diaktivasi');
  }

  const token = await createInvitationToken(user.id);

  try {
    await sendInvitationEmail(user.name, user.email, token);
  } catch {
    await prisma.accountToken.deleteMany({ where: { tokenHash: hashToken(token) } });
    throw new ApiError(502, 'EMAIL_FAILED', 'Gagal mengirim email undangan');
  }
}

export async function updateUser(id: string, input: UpdateUserInput) {
  const user = await prisma.user.findUnique({ where: { id } });

  if (!user) {
    throw new ApiError(404, 'NOT_FOUND', 'Akun tidak ditemukan');
  }

  if (user.role === 'ADMIN') {
    throw new ApiError(403, 'FORBIDDEN', 'Akun Admin tidak dapat diubah');
  }

  if (input.email && input.email !== user.email) {
    const taken = await prisma.user.findUnique({ where: { email: input.email } });

    if (taken) {
      throw new ApiError(409, 'EMAIL_TAKEN', 'Email sudah terdaftar');
    }
  }

  if (input.status === 'ACTIVE' && !user.passwordHash) {
    throw new ApiError(400, 'ACCOUNT_NOT_ACTIVATED', 'Akun belum diaktivasi oleh pengguna');
  }

  const updated = await prisma.user
    .update({
      where: { id },
      data: input,
      select: userSelect,
    })
    .catch((error: unknown) => {
      if (isUniqueViolation(error)) {
        throw new ApiError(409, 'EMAIL_TAKEN', 'Email sudah terdaftar');
      }

      throw error;
    });

  if (input.status === 'INACTIVE' && user.status !== 'INACTIVE') {
    await prisma.refreshToken.deleteMany({ where: { userId: id } });
    await notifyAccountDeactivated(user.name, user.email).catch((error) =>
      logger.error({ err: error }, 'Gagal mengirim email penonaktifan akun'),
    );
  } else if (input.status === 'ACTIVE' && user.status !== 'ACTIVE') {
    await notifyAccountActivated(updated.name, updated.email).catch((error) =>
      logger.error({ err: error }, 'Gagal mengirim email aktivasi akun'),
    );
  }

  if (input.email && input.email !== user.email) {
    await notifyEmailChanged(user.name, user.email, updated.email).catch((error) =>
      logger.error({ err: error }, 'Gagal mengirim email perubahan alamat'),
    );
  }

  return updated;
}
