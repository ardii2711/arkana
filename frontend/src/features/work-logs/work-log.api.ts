import { api } from '@/lib/api';
import type { ApiSuccess } from '@/types/api';

export const WORK_CATEGORIES = [
  'PELAKSANAAN_TUGAS',
  'PENGEMBANGAN_PERBAIKAN',
  'KOORDINASI_RAPAT',
  'PELAYANAN_PENDAMPINGAN',
  'ADMINISTRASI_PELAPORAN',
  'PENGEMBANGAN_KOMPETENSI',
  'PERJALANAN_DINAS',
] as const;

export type WorkCategory = (typeof WORK_CATEGORIES)[number];

export const WORK_CATEGORY_LABELS: Record<WorkCategory, string> = {
  PELAKSANAAN_TUGAS: 'Pelaksanaan Tugas',
  PENGEMBANGAN_PERBAIKAN: 'Pengembangan dan Perbaikan',
  KOORDINASI_RAPAT: 'Koordinasi dan Rapat',
  PELAYANAN_PENDAMPINGAN: 'Pelayanan dan Pendampingan',
  ADMINISTRASI_PELAPORAN: 'Administrasi dan Pelaporan',
  PENGEMBANGAN_KOMPETENSI: 'Pengembangan Kompetensi',
  PERJALANAN_DINAS: 'Perjalanan Dinas dan Kegiatan Lapangan',
};

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
  createdAt: string;
  updatedAt: string;
};

export type WorkLogListParams = {
  page: number;
  limit: number;
  category?: WorkCategory;
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
      category: params.category || undefined,
      from: params.from || undefined,
      to: params.to || undefined,
      search: params.search || undefined,
    },
  });

  return data.data;
}
