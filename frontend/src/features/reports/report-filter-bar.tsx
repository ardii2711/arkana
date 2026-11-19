'use client';

import { Button } from '@/components/ui/button';
import {
  REPORT_PERIODS,
  REPORT_PERIOD_LABELS,
  type ReportParams,
  type ReportPeriod,
} from './report.api';

export const REPORT_PAGE_SIZE = 20;

export type ReportFilters = {
  period: ReportPeriod;
};

const DEFAULT_PERIOD: ReportPeriod = 'monthly';

export function parseReportFilters(params: URLSearchParams): ReportFilters {
  return {
    period: REPORT_PERIODS.find((period) => period === params.get('period')) ?? DEFAULT_PERIOD,
  };
}

export function parseReportPage(params: URLSearchParams) {
  const page = Number(params.get('page') ?? '1');

  return Number.isInteger(page) && page > 0 ? page : 1;
}

export function toReportParams(filters: ReportFilters): ReportParams {
  return { period: filters.period };
}

export function toReportSearch(filters: ReportFilters, page = 1) {
  const params = new URLSearchParams({ period: filters.period });

  if (page > 1) params.set('page', String(page));

  return `/laporan?${params.toString()}`;
}

type ReportFilterBarProps = {
  value: ReportFilters;
  onChange: (patch: Partial<ReportFilters>) => void;
};

export function ReportFilterBar({ value, onChange }: ReportFilterBarProps) {
  return (
    <div role="group" aria-label="Periode laporan" className="flex flex-wrap items-center gap-1.5">
      {REPORT_PERIODS.map((period) => (
        <Button
          key={period}
          type="button"
          size="sm"
          variant={value.period === period ? 'default' : 'outline'}
          aria-pressed={value.period === period}
          onClick={() => onChange({ period })}
        >
          {REPORT_PERIOD_LABELS[period]}
        </Button>
      ))}
    </div>
  );
}
