import { api } from '@/lib/api';
import type { WorkCategory } from '@/lib/work-category';
import type { ApiSuccess } from '@/types/api';

export type WorkLog = {
  id: string;
  publicToken: string;
  activityDate: string;
  name: string;
  description: string;
  output: string;
  category: WorkCategory;
  target: string | null;
  realisasi: string | null;
  fileCount: number;
  createdAt: string;
  updatedAt: string;
};

export type WorkLogListParams = {
  page: number;
  limit: number;
  from?: string;
  to?: string;
  search?: string;
};

export type WorkLogList = {
  items: WorkLog[];
  total: number;
  page: number;
  limit: number;
};

export async function fetchWorkLogs(params: WorkLogListParams): Promise<WorkLogList> {
  const { data } = await api.get<ApiSuccess<WorkLogList>>('/work-logs', {
    params: {
      page: params.page,
      limit: params.limit,
      from: params.from || undefined,
      to: params.to || undefined,
      search: params.search || undefined,
    },
  });

  return data.data;
}

export type WorkLogInput = {
  name: string;
  description: string;
  output: string;
  category: WorkCategory;
  target: string | null;
  realisasi: string | null;
};

export async function fetchWorkLog(id: string): Promise<WorkLog> {
  const { data } = await api.get<ApiSuccess<{ workLog: WorkLog }>>(`/work-logs/${id}`);
  return data.data.workLog;
}

export async function createWorkLog(input: WorkLogInput): Promise<WorkLog> {
  const { data } = await api.post<ApiSuccess<{ workLog: WorkLog }>>('/work-logs', input);
  return data.data.workLog;
}

export async function updateWorkLog(id: string, input: WorkLogInput): Promise<WorkLog> {
  const { data } = await api.patch<ApiSuccess<{ workLog: WorkLog }>>(`/work-logs/${id}`, input);
  return data.data.workLog;
}

export async function deleteWorkLog(id: string): Promise<void> {
  await api.delete(`/work-logs/${id}`);
}
