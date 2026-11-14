import type { RequestHandler } from 'express';

import type { Role } from '../generated/prisma/enums.js';
import { ApiError } from '../utils/api-error.js';
import { requireAuth } from './require-auth.js';

export const requireRole = (...roles: Role[]): RequestHandler[] => [
  requireAuth,
  (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new ApiError(403, 'FORBIDDEN', 'Akses ditolak');
    }
    next();
  },
];
