'use client';

import { useQuery } from '@tanstack/react-query';

import { fetchPublicWorkLog, fetchPublicWorkLogFileBlob } from './work-log-public.api';

export function usePublicWorkLog(token: string) {
  return useQuery({
    queryKey: ['public-work-logs', token],
    queryFn: () => fetchPublicWorkLog(token),
    retry: false,
  });
}

export function usePublicWorkLogFileBlob(token: string, fileId: string, enabled: boolean) {
  return useQuery({
    queryKey: ['public-work-logs', token, 'blob', fileId],
    queryFn: () => fetchPublicWorkLogFileBlob(token, fileId, true),
    enabled: enabled && fileId !== '',
    staleTime: Infinity,
    retry: false,
  });
}
