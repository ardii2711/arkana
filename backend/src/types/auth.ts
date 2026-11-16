import type { Role, UserStatus } from '../generated/prisma/enums.js';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: UserStatus;
  titleBefore?: string | null;
  titleAfter?: string | null;
  nip?: string | null;
  employeeStatus?: string | null;
  golongan?: string | null;
  position?: string | null;
  unit?: string | null;
  hasAvatar?: boolean;
  pendingEmail?: string | null;
  updatedAt?: Date;
}
