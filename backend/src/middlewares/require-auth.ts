import type { RequestHandler } from 'express';

import { prisma } from '../lib/prisma.js';
import { ApiError } from '../utils/api-error.js';
import { ACCESS_COOKIE } from '../modules/auth/auth.cookies.js';
import { verifyAccessToken } from '../modules/auth/auth.tokens.js';

export const requireAuth: RequestHandler = async (req, _res, next) => {
  const token = req.cookies?.[ACCESS_COOKIE] as string | undefined;
  const userId = token ? await verifyAccessToken(token) : null;

  if (!userId) {
    throw new ApiError(401, 'UNAUTHENTICATED', 'Silakan login terlebih dahulu');
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true, status: true },
  });

  if (!user || user.status !== 'ACTIVE') {
    throw new ApiError(401, 'UNAUTHENTICATED', 'Akun tidak aktif');
  }

  req.user = user;
  next();
};
