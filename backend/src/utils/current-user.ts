import type { Request } from 'express';

import type { AuthUser } from '../types/auth.js';
import { ApiError } from '../lib/api-error.js';

export function currentUser(req: Request): AuthUser {
  if (!req.user) {
    throw new ApiError(401, 'UNAUTHENTICATED', 'Silakan login terlebih dahulu');
  }

  return req.user;
}
