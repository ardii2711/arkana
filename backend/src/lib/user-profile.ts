import type { Prisma } from '../generated/prisma/client.js';

export const profileSelect = {
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
  pendingEmail: true,
  updatedAt: true,
} as const;

export type ProfileRow = Prisma.UserGetPayload<{ select: typeof profileSelect }>;

export function toAuthUser(user: ProfileRow) {
  const { avatarKey, ...rest } = user;
  return { ...rest, hasAvatar: Boolean(avatarKey) };
}
