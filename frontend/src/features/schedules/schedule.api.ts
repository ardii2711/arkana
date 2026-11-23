import { api } from '@/lib/api';
import type { ApiSuccess } from '@/types/api';

export const SCHEDULE_STATUSES = ['NOT_STARTED', 'DONE', 'CANCELLED'] as const;

export type ScheduleStatus = (typeof SCHEDULE_STATUSES)[number];

export const SCHEDULE_STATUS_LABELS: Record<ScheduleStatus, string> = {
  NOT_STARTED: 'Belum Dimulai',
  DONE: 'Selesai',
  CANCELLED: 'Dibatalkan',
};

export const SCHEDULE_STATUS_BADGES = {
  NOT_STARTED: 'secondary',
  DONE: 'default',
  CANCELLED: 'outline',
} as const satisfies Record<ScheduleStatus, 'secondary' | 'default' | 'outline'>;

export type Schedule = {
  id: string;
  title: string;
  description: string | null;
  startAt: string;
  endAt: string | null;
  allDay: boolean;
  location: string | null;
  status: ScheduleStatus;
  createdAt: string;
  updatedAt: string;
};

export type ScheduleInput = {
  title: string;
  description: string | null;
  startAt: string;
  endAt: string | null;
  allDay: boolean;
  location: string | null;
  status?: ScheduleStatus;
};

export type ScheduleListParams = {
  page: number;
  limit: number;
  from?: string;
  to?: string;
  status?: ScheduleStatus;
  search?: string;
};

export type ScheduleList = {
  items: Schedule[];
  total: number;
  page: number;
  limit: number;
};

export async function fetchSchedules(params: ScheduleListParams): Promise<ScheduleList> {
  const { data } = await api.get<ApiSuccess<ScheduleList>>('/schedules', {
    params: {
      page: params.page,
      limit: params.limit,
      from: params.from || undefined,
      to: params.to || undefined,
      status: params.status || undefined,
      search: params.search || undefined,
    },
  });

  return data.data;
}

export async function createSchedule(input: ScheduleInput): Promise<Schedule> {
  const { data } = await api.post<ApiSuccess<{ schedule: Schedule }>>('/schedules', input);

  return data.data.schedule;
}

export async function updateSchedule(id: string, input: Partial<ScheduleInput>): Promise<Schedule> {
  const { data } = await api.patch<ApiSuccess<{ schedule: Schedule }>>(`/schedules/${id}`, input);

  return data.data.schedule;
}

export async function deleteSchedule(id: string): Promise<void> {
  await api.delete(`/schedules/${id}`);
}
