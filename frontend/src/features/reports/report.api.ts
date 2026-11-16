import type { WorkCategory } from '@/features/work-logs/work-log.api';
import { api } from '@/lib/api';
import type { ApiSuccess } from '@/types/api';

export const REPORT_PERIODS = ['daily', 'weekly', 'monthly', 'yearly', 'custom'] as const;

export type ReportPeriod = (typeof REPORT_PERIODS)[number];

export const REPORT_PERIOD_LABELS: Record<ReportPeriod, string> = {
  daily: 'Harian',
  weekly: 'Mingguan',
  monthly: 'Bulanan',
  yearly: 'Tahunan',
  custom: 'Rentang khusus',
};

export type ReportFormat = 'xlsx' | 'pdf';

export type ReportParams = {
  period: ReportPeriod;
  date?: string;
  from?: string;
  to?: string;
  category?: WorkCategory;
  groupBy?: 'category';
  onlyWithEvidence?: boolean;
};

export type ReportRow = {
  no: number;
  date: string;
  actionPlan: string;
  target: string | null;
  realisasi: string | null;
  evidence: string;
  link: string;
  category: string;
};

export type ReportData = {
  title: string;
  userName: string;
  periodLabel: string;
  from: string;
  to: string;
  generatedAt: string;
  rows: ReportRow[];
};

function toQuery(params: ReportParams) {
  return {
    period: params.period,
    date: params.date || undefined,
    from: params.from || undefined,
    to: params.to || undefined,
    category: params.category || undefined,
    groupBy: params.groupBy,
    onlyWithEvidence: params.onlyWithEvidence ? 'true' : undefined,
  };
}

export async function fetchReport(params: ReportParams): Promise<ReportData> {
  const { data } = await api.get<ApiSuccess<ReportData>>('/reports/work-logs', {
    params: toQuery(params),
  });

  return data.data;
}

export async function fetchReportExport(params: ReportParams, format: ReportFormat): Promise<Blob> {
  const { data } = await api.get<Blob>('/reports/work-logs/export', {
    params: { ...toQuery(params), format },
    responseType: 'blob',
  });

  return data;
}

export function reportFileName(report: ReportData, format: ReportFormat) {
  const range = report.from === report.to ? report.from : `${report.from}_${report.to}`;

  return `rekap-kinerja-${range}.${format}`;
}
