import type { ApiSuccess } from '@/types/api';

import type { Schedule } from '@/features/schedules/schedule.api';
import type { WorkCategory } from '@/features/work-logs/work-log.api';
import { api } from '@/lib/api';

export type PinnedNote = {
  id: string;
  content: string;
  pinned: boolean;
  updatedAt: string;
};

export type UserDashboard = {
  summary: {
    monthWorkLogs: number;
    weekWorkLogs: number;
    evidenceFiles: number;
    archive: { usedBytes: number; quotaBytes: number };
  };
  todaySchedules: Schedule[];
  upcomingSchedules: Schedule[];
  pinnedNotes: PinnedNote[];
  workLogCategories: { category: WorkCategory; count: number }[];
  workLogTrend: { date: string; count: number }[];
};

export type AdminDashboard = {
  accounts: { active: number; invited: number; inactive: number };
  pendingInvitations: { id: string; name: string; email: string; createdAt: string }[];
};

export async function fetchUserDashboard(): Promise<UserDashboard> {
  const { data } = await api.get<ApiSuccess<UserDashboard>>('/dashboard');

  return data.data;
}

export async function fetchAdminDashboard(): Promise<AdminDashboard> {
  const { data } = await api.get<ApiSuccess<AdminDashboard>>('/dashboard/admin');

  return data.data;
}
