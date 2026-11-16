import type { Request } from 'express';

import { notifyEmailChanged, sendEmailChangeLink } from '../../lib/account-mail.js';
import { canonicalMimeType, extensionOf } from '../../lib/file-rules.js';
import { logger } from '../../lib/logger.js';
import { receiveMultipart } from '../../lib/multipart.js';
import { prisma } from '../../lib/prisma.js';
import { deleteObjects, downloadObject } from '../../lib/storage.js';
import { createToken, hashToken } from '../../lib/tokens.js';
import { ApiError } from '../../utils/api-error.js';
import type { FileContent } from '../../utils/file-response.js';
import { Prisma } from '../../generated/prisma/client.js';
import type { UpdateProfileInput } from './profile.schema.js';

const EMAIL_CHANGE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
const AVATAR_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp']);

const profileSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  status: true,
  titleBefore: true,
  titleAfter: true,
  nip: true,
  employeeStatus: true,
  golongan: true,
  position: true,
  unit: true,
  avatarKey: true,
  updatedAt: true,
} as const;

interface ProfileRow {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'USER';
  status: 'INVITED' | 'ACTIVE' | 'INACTIVE';
  titleBefore: string | null;
  titleAfter: string | null;
  nip: string | null;
  employeeStatus: string | null;
  golongan: string | null;
  position: string | null;
  unit: string | null;
  avatarKey: string | null;
  updatedAt: Date;
}

function toProfile(user: ProfileRow) {
  const { avatarKey, ...rest } = user;
  return { ...rest, hasAvatar: Boolean(avatarKey) };
}

async function toBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
  const chunks: Buffer[] = [];

  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk as Buffer));
  }

  return Buffer.concat(chunks);
}

function isUniqueViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}

export async function updateProfile(userId: string, input: UpdateProfileInput) {
  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { ...input },
      select: profileSelect,
    });

    return toProfile(user);
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new ApiError(409, 'NIP_TAKEN', 'NIP sudah digunakan akun lain');
    }

    throw error;
  }
}

export async function requestEmailChange(userId: string, newEmail: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new ApiError(401, 'UNAUTHENTICATED', 'Silakan login terlebih dahulu');
  }

  if (user.email.toLowerCase() === newEmail.toLowerCase()) {
    throw new ApiError(400, 'EMAIL_UNCHANGED', 'Email baru sama dengan email saat ini');
  }

  const existing = await prisma.user.findUnique({ where: { email: newEmail } });

  if (existing) {
    throw new ApiError(409, 'EMAIL_TAKEN', 'Email sudah digunakan akun lain');
  }

  const token = createToken();
  const tokenHash = hashToken(token);

  await prisma.$transaction([
    prisma.accountToken.deleteMany({ where: { userId, type: 'EMAIL_CHANGE', usedAt: null } }),
    prisma.accountToken.create({
      data: {
        userId,
        type: 'EMAIL_CHANGE',
        tokenHash,
        expiresAt: new Date(Date.now() + EMAIL_CHANGE_TTL_MS),
      },
    }),
    prisma.user.update({ where: { id: userId }, data: { pendingEmail: newEmail } }),
  ]);

  try {
    await sendEmailChangeLink(user.name, newEmail, token);
  } catch (error) {
    await prisma.$transaction([
      prisma.accountToken.deleteMany({ where: { tokenHash } }),
      prisma.user.update({ where: { id: userId }, data: { pendingEmail: null } }),
    ]);
    logger.error({ err: error, userId }, 'Gagal mengirim email verifikasi perubahan email');
    throw new ApiError(
      502,
      'EMAIL_SEND_FAILED',
      'Gagal mengirim email verifikasi. Coba lagi nanti.',
    );
  }
}

export async function verifyEmailChange(token: string) {
  const record = await prisma.accountToken.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  });

  if (
    !record ||
    record.type !== 'EMAIL_CHANGE' ||
    record.usedAt ||
    record.expiresAt.getTime() <= Date.now()
  ) {
    throw new ApiError(400, 'INVALID_TOKEN', 'Tautan verifikasi tidak valid atau kedaluwarsa');
  }

  const newEmail = record.user.pendingEmail;

  if (!newEmail) {
    throw new ApiError(400, 'INVALID_TOKEN', 'Tidak ada perubahan email yang menunggu verifikasi');
  }

  const existing = await prisma.user.findUnique({ where: { email: newEmail } });

  if (existing && existing.id !== record.userId) {
    throw new ApiError(409, 'EMAIL_TAKEN', 'Email sudah digunakan akun lain');
  }

  const oldEmail = record.user.email;

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { email: newEmail, pendingEmail: null },
    }),
    prisma.accountToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
  ]);

  await notifyEmailChanged(record.user.name, oldEmail, newEmail).catch((error) =>
    logger.error({ err: error, userId: record.userId }, 'Gagal mengirim notifikasi email diubah'),
  );
}

function avatarFileError(error: unknown): ApiError {
  if (error instanceof ApiError && error.code === 'FILE_TOO_LARGE') {
    return new ApiError(400, 'AVATAR_TOO_LARGE', 'Ukuran avatar maksimal 2 MB');
  }

  if (error instanceof ApiError && error.code === 'INVALID_FILE_TYPE') {
    return new ApiError(400, 'INVALID_FILE_TYPE', 'Format avatar harus JPG, JPEG, PNG, atau WEBP');
  }

  return error as ApiError;
}

export async function uploadAvatar(userId: string, req: Request) {
  let file;

  try {
    const received = await receiveMultipart(req, {
      maxBytes: AVATAR_MAX_BYTES,
      prefix: `avatars/${userId}`,
      fileRequired: true,
    });
    file = received.file;
  } catch (error) {
    throw avatarFileError(error);
  }

  if (!file) {
    throw new ApiError(400, 'FILE_REQUIRED', 'File avatar wajib diunggah');
  }

  const extension = extensionOf(file.originalName) ?? '';

  if (!AVATAR_EXTENSIONS.has(extension)) {
    await deleteObjects([file.key]).catch((error: unknown) =>
      logger.error({ err: error, key: file.key }, 'Gagal menghapus avatar yang ditolak'),
    );
    throw new ApiError(400, 'INVALID_FILE_TYPE', 'Format avatar harus JPG, JPEG, PNG, atau WEBP');
  }

  const previous = await prisma.user.findUnique({
    where: { id: userId },
    select: { avatarKey: true },
  });

  await prisma.user.update({ where: { id: userId }, data: { avatarKey: file.key } });

  if (previous?.avatarKey && previous.avatarKey !== file.key) {
    await deleteObjects([previous.avatarKey]).catch((error: unknown) =>
      logger.error({ err: error, key: previous.avatarKey }, 'Gagal menghapus avatar lama'),
    );
  }

  return { hasAvatar: true };
}

export async function getAvatar(userId: string): Promise<FileContent> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { avatarKey: true },
  });

  if (!user?.avatarKey) {
    throw new ApiError(404, 'NOT_FOUND', 'Avatar belum diunggah');
  }

  const body = await toBuffer(await downloadObject(user.avatarKey));
  const extension = extensionOf(user.avatarKey) ?? 'jpg';
  const contentType = canonicalMimeType(extension) ?? 'image/jpeg';

  return {
    body,
    contentType,
    size: body.length,
    originalName: `avatar.${extension}`,
    inline: true,
    converted: false,
  };
}

export async function deleteAvatar(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { avatarKey: true },
  });

  if (!user?.avatarKey) {
    return;
  }

  await prisma.user.update({ where: { id: userId }, data: { avatarKey: null } });
  await deleteObjects([user.avatarKey]).catch((error: unknown) =>
    logger.error({ err: error, key: user.avatarKey }, 'Gagal menghapus objek avatar'),
  );
}
