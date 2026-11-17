'use client';

import { DatePicker } from '@/components/shared/date-picker';
import { DateRangePicker } from '@/components/shared/date-range-picker';
import { Field, FieldLabel } from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { WORK_CATEGORIES, WORK_CATEGORY_LABELS, type WorkCategory } from '@/lib/work-category';
import {
  REPORT_PERIODS,
  REPORT_PERIOD_LABELS,
  type ReportParams,
  type ReportPeriod,
} from './report.api';

export type ReportFilters = {
  period: ReportPeriod;
  date: string;
  from: string;
  to: string;
  category: WorkCategory | 'ALL';
  groupBy: boolean;
  onlyWithEvidence: boolean;
};

export const DEFAULT_REPORT_FILTERS: ReportFilters = {
  period: 'monthly',
  date: '',
  from: '',
  to: '',
  category: 'ALL',
  groupBy: false,
  onlyWithEvidence: false,
};

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function readDate(value: string | null) {
  return value && DATE_PATTERN.test(value) ? value : '';
}

export function parseReportFilters(params: URLSearchParams): ReportFilters {
  return {
    period: REPORT_PERIODS.find((period) => period === params.get('period')) ?? 'monthly',
    date: readDate(params.get('date')),
    from: readDate(params.get('from')),
    to: readDate(params.get('to')),
    category: WORK_CATEGORIES.find((category) => category === params.get('category')) ?? 'ALL',
    groupBy: params.get('groupBy') === 'category',
    onlyWithEvidence: params.get('onlyWithEvidence') === 'true',
  };
}

export function isReportReady(filters: ReportFilters) {
  if (filters.period !== 'custom') {
    return true;
  }

  return filters.from !== '' && filters.to !== '' && filters.from <= filters.to;
}

export function toReportParams(filters: ReportFilters): ReportParams {
  const custom = filters.period === 'custom';

  return {
    period: filters.period,
    date: custom ? undefined : filters.date || undefined,
    from: custom ? filters.from : undefined,
    to: custom ? filters.to : undefined,
    category: filters.category === 'ALL' ? undefined : filters.category,
    groupBy: filters.groupBy ? 'category' : undefined,
    onlyWithEvidence: filters.onlyWithEvidence || undefined,
  };
}

export function toReportSearch(filters: ReportFilters) {
  const params = new URLSearchParams({ period: filters.period });

  if (filters.period === 'custom') {
    if (filters.from) params.set('from', filters.from);
    if (filters.to) params.set('to', filters.to);
  } else if (filters.date) {
    params.set('date', filters.date);
  }

  if (filters.category !== 'ALL') params.set('category', filters.category);
  if (filters.groupBy) params.set('groupBy', 'category');
  if (filters.onlyWithEvidence) params.set('onlyWithEvidence', 'true');

  return `/laporan?${params.toString()}`;
}

type ReportFilterBarProps = {
  value: ReportFilters;
  onChange: (patch: Partial<ReportFilters>) => void;
};

export function ReportFilterBar({ value, onChange }: ReportFilterBarProps) {
  const custom = value.period === 'custom';

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      <Field>
        <FieldLabel htmlFor="report-period">Periode</FieldLabel>
        <Select
          value={value.period}
          onValueChange={(next) => {
            const period = next as ReportPeriod;
            onChange({
              period,
              date: period === 'custom' ? '' : value.date,
              from: period === 'custom' ? value.from : '',
              to: period === 'custom' ? value.to : '',
            });
          }}
        >
          <SelectTrigger id="report-period" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {REPORT_PERIODS.map((period) => (
              <SelectItem key={period} value={period}>
                {REPORT_PERIOD_LABELS[period]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      {custom ? (
        <Field>
          <FieldLabel htmlFor="report-range">Rentang tanggal</FieldLabel>
          <DateRangePicker
            id="report-range"
            value={{ from: value.from, to: value.to }}
            onChange={(range) => onChange({ from: range.from, to: range.to })}
          />
        </Field>
      ) : (
        <Field>
          <FieldLabel htmlFor="report-date">Tanggal acuan</FieldLabel>
          <DatePicker
            id="report-date"
            value={value.date}
            clearable
            placeholder="Hari ini"
            onChange={(date) => onChange({ date })}
          />
        </Field>
      )}

      <Field>
        <FieldLabel htmlFor="report-category">Kategori</FieldLabel>
        <Select
          value={value.category}
          onValueChange={(next) => onChange({ category: next as WorkCategory | 'ALL' })}
        >
          <SelectTrigger id="report-category" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Semua kategori</SelectItem>
            {WORK_CATEGORIES.map((category) => (
              <SelectItem key={category} value={category}>
                {WORK_CATEGORY_LABELS[category]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field>
        <FieldLabel htmlFor="report-group">Pengelompokan</FieldLabel>
        <Select
          value={value.groupBy ? 'category' : 'none'}
          onValueChange={(next) => onChange({ groupBy: next === 'category' })}
        >
          <SelectTrigger id="report-group" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Urut tanggal</SelectItem>
            <SelectItem value="category">Kelompok kategori</SelectItem>
          </SelectContent>
        </Select>
      </Field>

      <Field>
        <FieldLabel htmlFor="report-evidence">Bukti dukung</FieldLabel>
        <Select
          value={value.onlyWithEvidence ? 'only' : 'all'}
          onValueChange={(next) => onChange({ onlyWithEvidence: next === 'only' })}
        >
          <SelectTrigger id="report-evidence" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua kegiatan</SelectItem>
            <SelectItem value="only">Hanya dengan bukti</SelectItem>
          </SelectContent>
        </Select>
      </Field>
    </div>
  );
}
