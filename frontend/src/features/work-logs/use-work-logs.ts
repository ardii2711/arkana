'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { fetchWorkLogs, type WorkLogListParams } from './work-log.api';

export function useWorkLogs(params: WorkLogListParams) {
  return useQuery({
    queryKey: ['work-logs', params],
    queryFn: () => fetchWorkLogs(params),
    placeholderData: keepPreviousData,
  });
}
