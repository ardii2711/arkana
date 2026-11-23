'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createSchedule,
  deleteSchedule,
  fetchSchedules,
  updateSchedule,
  type ScheduleInput,
  type ScheduleListParams,
  type ScheduleStatus,
} from './schedule.api';

const rootKey = ['schedules'] as const;

export function useSchedules(params: ScheduleListParams, enabled = true) {
  return useQuery({
    queryKey: [...rootKey, 'list', params],
    queryFn: () => fetchSchedules(params),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useCreateSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ScheduleInput) => createSchedule(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: rootKey }),
  });
}

export function useUpdateSchedule(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: Partial<ScheduleInput>) => updateSchedule(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: rootKey }),
  });
}

export function useUpdateScheduleStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: ScheduleStatus }) =>
      updateSchedule(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: rootKey }),
  });
}

export function useDeleteSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteSchedule(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: rootKey }),
  });
}
