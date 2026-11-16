import { api } from '@/lib/api';
import type { ApiSuccess } from '@/types/api';

export const USER_STATUSES = ['ACTIVE', 'INVITED', 'INACTIVE'] as const;

export type UserStatus = (typeof USER_STATUSES)[number];

export const USER_STATUS_LABELS: Record<UserStatus, string> = {
  ACTIVE: 'Aktif',
  INVITED: 'Diundang',
  INACTIVE: 'Nonaktif',
};

export const USER_STATUS_BADGES = {
  ACTIVE: 'default',
  INVITED: 'secondary',
  INACTIVE: 'outline',
} as const satisfies Record<UserStatus, 'default' | 'secondary' | 'outline'>;

export type AdminAccount = {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'USER';
  status: UserStatus;
  activatedAt: string | null;
  createdAt: string;
};

export type UserListParams = {
  page: number;
  limit: number;
  search?: string;
};

export type UserList = {
  items: AdminAccount[];
  total: number;
  page: number;
  limit: number;
};

export type InviteUserInput = {
  name: string;
  email: string;
};

export type UpdateUserInput = {
  name?: string;
  email?: string;
  status?: 'ACTIVE' | 'INACTIVE';
};

export async function fetchUsers(params: UserListParams): Promise<UserList> {
  const { data } = await api.get<ApiSuccess<UserList>>('/users', {
    params: {
      page: params.page,
      limit: params.limit,
      search: params.search || undefined,
    },
  });

  return data.data;
}

export async function inviteUser(input: InviteUserInput): Promise<AdminAccount> {
  const { data } = await api.post<ApiSuccess<{ user: AdminAccount }>>('/users/invite', input);

  return data.data.user;
}

export async function updateUser(id: string, input: UpdateUserInput): Promise<AdminAccount> {
  const { data } = await api.patch<ApiSuccess<{ user: AdminAccount }>>(`/users/${id}`, input);

  return data.data.user;
}

export async function resendInvitation(id: string): Promise<void> {
  await api.post(`/users/${id}/resend-invitation`);
}
