'use client';

import { useQuery } from '@tanstack/react-query';

import { fetchAdminDashboard, fetchUserDashboard } from './dashboard.api';

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
