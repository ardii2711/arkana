'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

import { ApiError } from '@/lib/api-error';
import {
  activateAccount,
  fetchActivationInfo,
  fetchSession,
  login,
  logout,
  requestPasswordReset,
  resetPassword,
  type SessionUser,
} from './auth.api';

export const sessionQueryKey = ['auth', 'me'] as const;

export function useSession() {
  return useQuery<SessionUser | null>({
    queryKey: sessionQueryKey,
    queryFn: async () => {
      try {
        return await fetchSession();
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) return null;
        throw error;
      }
    },
  });
}

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: login,
    onSuccess: (user) => {
      queryClient.setQueryData(sessionQueryKey, user);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: logout,
    onSettled: () => {
      queryClient.clear();
      router.replace('/login');
    },
  });
}

export function useActivationInfo(token: string | null) {
  return useQuery({
    queryKey: ['auth', 'activation', token],
    queryFn: () => fetchActivationInfo(token as string),
    enabled: Boolean(token),
    retry: false,
  });
}

export function useActivateAccount() {
  return useMutation({ mutationFn: activateAccount });
}

export function useRequestPasswordReset() {
  return useMutation({ mutationFn: requestPasswordReset });
}

export function useResetPassword() {
  return useMutation({ mutationFn: resetPassword });
}
