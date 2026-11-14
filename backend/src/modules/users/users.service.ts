import { env } from '../../config/env.js';
import { sendMail } from '../../lib/mailer.js';
import { prisma } from '../../lib/prisma.js';
import { createToken, hashToken } from '../../lib/tokens.js';
import { ApiError } from '../../utils/api-error.js';
import type { InviteUserInput, ListUsersQuery, UpdateUserInput } from './users.schema.js';

const INVITATION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  status: true,
  activatedAt: true,
  createdAt: true,
} as const;

async function sendInvitationEmail(name: string, email: string, token: string): Promise<void> {
  const link = `${env.CORS_ORIGIN}/activate?token=${token}`;

  await sendMail({
    to: email,
    subject: 'Undangan akun ARKANA',
    text: `Halo ${name},\n\nAkun ARKANA Anda telah dibuat. Aktifkan akun dan atur password melalui tautan berikut:\n${link}\n\nTautan berlaku 7 hari.`,
    html: `<p>Halo ${name},</p><p>Akun ARKANA Anda telah dibuat. Aktifkan akun dan atur password melalui tautan berikut:</p><p><a href="${link}">Aktifkan akun</a></p><p>Tautan berlaku 7 hari.</p>`,
  });
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

  const token = createToken();

  const user = await prisma.user.create({
    data: {
      name,
      email,
      role: 'USER',
      status: 'INVITED',
      accountTokens: {
        create: {
          type: 'INVITATION',
          tokenHash: hashToken(token),
          expiresAt: new Date(Date.now() + INVITATION_TTL_MS),
        },
      },
    },
    select: userSelect,
  });

  try {
    await sendInvitationEmail(name, email, token);
  } catch {
    await prisma.user.delete({ where: { id: user.id } }).catch(() => undefined);
    throw new ApiError(502, 'EMAIL_FAILED', 'Gagal mengirim email undangan');
  }

  return user;
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

  const updated = await prisma.user.update({
    where: { id },
    data: input,
    select: userSelect,
  });

  if (input.status === 'INACTIVE') {
    await prisma.refreshToken.deleteMany({ where: { userId: id } });
  }

  return updated;
}
