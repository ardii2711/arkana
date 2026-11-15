'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createWorkLog,
  deleteWorkLog,
  fetchWorkLog,
  fetchWorkLogs,
  updateWorkLog,
  type WorkLog,
  type WorkLogInput,
  type WorkLogListParams,
} from './work-log.api';

const rootKey = ['work-logs'] as const;

export function useWorkLogs(params: WorkLogListParams) {
  return useQuery({
    queryKey: [...rootKey, 'list', params],
    queryFn: () => fetchWorkLogs(params),
    placeholderData: keepPreviousData,
  });
}

export function useWorkLog(id: string) {
  return useQuery({
    queryKey: [...rootKey, 'detail', id],
    queryFn: () => fetchWorkLog(id),
  });
}

export function useCreateWorkLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createWorkLog,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: rootKey }),
  });
}

export function useUpdateWorkLog(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: WorkLogInput) => updateWorkLog(id, input),
    onSuccess: (workLog: WorkLog) => {
      queryClient.setQueryData([...rootKey, 'detail', id], workLog);
      return queryClient.invalidateQueries({ queryKey: rootKey });
    },
  });
}

export function useDeleteWorkLog(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => deleteWorkLog(id),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: [...rootKey, 'detail', id] });
      return queryClient.invalidateQueries({ queryKey: rootKey });
    },
  });
}
