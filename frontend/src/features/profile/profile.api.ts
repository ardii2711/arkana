import { api } from '@/lib/api';
import type { ApiSuccess } from '@/types/api';
import type { SessionUser } from '@/features/auth/auth.api';

export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
export const AVATAR_ACCEPT = 'image/jpeg,image/png,image/webp';
export const AVATAR_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'] as const;

export type UpdateProfileInput = {
  name?: string;
  titleBefore?: string | null;
  titleAfter?: string | null;
  nip?: string | null;
  employeeStatus?: 'PNS' | 'PPPK' | null;
  golongan?: string | null;
  position?: string | null;
  unit?: string | null;
};

export async function updateProfile(input: UpdateProfileInput): Promise<SessionUser> {
  const { data } = await api.patch<ApiSuccess<{ user: SessionUser }>>('/profile', input);
  return data.data.user;
}

export async function requestEmailChange(email: string): Promise<void> {
  await api.post('/profile/email', { email });
}

export async function verifyEmailChange(token: string): Promise<void> {
  await api.post('/profile/email/verify', { token });
}

export async function uploadAvatar(file: File): Promise<void> {
  const formData = new FormData();
  formData.append('file', file);
  await api.post('/profile/avatar', formData);
}

export async function deleteAvatar(): Promise<void> {
  await api.delete('/profile/avatar');
}

export async function fetchAvatar(): Promise<Blob> {
  const { data } = await api.get<Blob>('/profile/avatar', { responseType: 'blob' });
  return data;
}
