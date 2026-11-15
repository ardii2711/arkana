import { api } from '@/lib/api';
import type { ApiSuccess } from '@/types/api';

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'USER';
  status: 'INVITED' | 'ACTIVE' | 'INACTIVE';
};

export type ActivationInfo = {
  name: string;
  email: string;
};

export async function login(input: { email: string; password: string }): Promise<SessionUser> {
  const { data } = await api.post<ApiSuccess<{ user: SessionUser }>>('/auth/login', input);
  return data.data.user;
}

export async function fetchSession(): Promise<SessionUser> {
  const { data } = await api.get<ApiSuccess<{ user: SessionUser }>>('/auth/me');
  return data.data.user;
}

export async function logout(): Promise<void> {
  await api.post('/auth/logout');
}

export async function fetchActivationInfo(token: string): Promise<ActivationInfo> {
  const { data } = await api.get<ApiSuccess<ActivationInfo>>(
    `/auth/activation/${encodeURIComponent(token)}`,
  );
  return data.data;
}

export async function activateAccount(input: { token: string; password: string }): Promise<void> {
  await api.post('/auth/activate', input);
}

export async function requestPasswordReset(email: string): Promise<void> {
  await api.post('/auth/password/forgot', { email });
}

export async function resetPassword(input: { token: string; password: string }): Promise<void> {
  await api.post('/auth/password/reset', input);
}
