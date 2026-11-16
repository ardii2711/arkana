'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { fetchAdminDashboard, fetchUserDashboard, resendInvitation } from './dashboard.api';

const rootKey = ['dashboard'] as const;

export function useUserDashboard() {
  return useQuery({
    queryKey: [...rootKey, 'me'] as const,
    queryFn: fetchUserDashboard,
  });
}

export function useAdminDashboard() {
  return useQuery({
    queryKey: [...rootKey, 'admin'] as const,
    queryFn: fetchAdminDashboard,
  });
}

export function useResendInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => resendInvitation(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: rootKey }),
  });
}
