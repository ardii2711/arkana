import { ApiError } from './api-error.js';
import type { FileContent } from './file-content.js';
import { canonicalMimeType, extensionOf } from './file-rules.js';
import { prisma } from './prisma.js';
import { downloadObject } from './storage.js';
import { streamToBuffer } from './stream.js';

/** Avatar satu akun; dipakai modul profile (diri sendiri) dan users (Admin). */
export async function getAvatar(userId: string): Promise<FileContent> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { avatarKey: true },
  });

  if (!user?.avatarKey) {
    throw new ApiError(404, 'NOT_FOUND', 'Avatar belum diunggah');
  }

  const body = await streamToBuffer(await downloadObject(user.avatarKey));
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
