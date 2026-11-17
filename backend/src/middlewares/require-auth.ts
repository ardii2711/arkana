import type { RequestHandler } from 'express';

import { prisma } from '../lib/prisma.js';
import { profileSelect, toAuthUser } from '../lib/user-profile.js';
import { ApiError } from '../lib/api-error.js';
import { ACCESS_COOKIE, verifyAccessToken } from '../lib/access-token.js';

export const requireAuth: RequestHandler = async (req, _res, next) => {
  const token = req.cookies?.[ACCESS_COOKIE] as string | undefined;
  const userId = token ? await verifyAccessToken(token) : null;

  if (!userId) {
    throw new ApiError(401, 'UNAUTHENTICATED', 'Silakan login terlebih dahulu');
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: profileSelect,
  });

  if (!user || user.status !== 'ACTIVE') {
    throw new ApiError(401, 'UNAUTHENTICATED', 'Akun tidak aktif');
  }

  req.user = toAuthUser(user);
  next();
};
