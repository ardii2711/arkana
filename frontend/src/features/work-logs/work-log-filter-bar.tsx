'use client';

import { SearchIcon, XIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group';
import { TITLE_MAX_LENGTH } from '@/lib/limits';
import { currentWitaDate, monthRangeWita, weekRangeWita } from '@/lib/wita';
import type { WorkLogListParams } from './work-log.api';

export const WORK_LOG_PAGE_SIZE = 20;

export const WORK_LOG_PERIODS = ['today', 'week', 'month', 'all'] as const;

export type WorkLogPeriod = (typeof WORK_LOG_PERIODS)[number];

export const WORK_LOG_PERIOD_LABELS: Record<WorkLogPeriod, string> = {
  today: 'Hari ini',
  week: 'Minggu ini',
  month: 'Bulan ini',
  all: 'Semua',
};

export type WorkLogFilters = {
  period: WorkLogPeriod;
  search: string;
};

export const DEFAULT_WORK_LOG_FILTERS: WorkLogFilters = {
  period: 'today',
  search: '',
};

function periodRange(period: WorkLogPeriod) {
  if (period === 'all') {
    return {};
  }

  const today = currentWitaDate();

  if (period === 'today') {
    return { from: today, to: today };
  }

  return period === 'week' ? weekRangeWita(today) : monthRangeWita(today);
}

export function parseWorkLogFilters(params: URLSearchParams): WorkLogFilters {
  return {
    period: WORK_LOG_PERIODS.find((period) => period === params.get('periode')) ?? 'today',
    search: params.get('q') ?? '',
  };
}

export function parseWorkLogPage(params: URLSearchParams) {
  const page = Number(params.get('page') ?? '1');

  return Number.isInteger(page) && page > 0 ? page : 1;
}

export function toWorkLogParams(filters: WorkLogFilters, page: number): WorkLogListParams {
  // Pencarian berlaku lintas tanggal agar data lama tidak terkesan hilang.
  const range = filters.search ? {} : periodRange(filters.period);

  return {
    ...range,
    page,
    limit: WORK_LOG_PAGE_SIZE,
    search: filters.search || undefined,
  };
}

export function toWorkLogSearch(filters: WorkLogFilters, page = 1) {
  const params = new URLSearchParams();

  if (filters.period !== DEFAULT_WORK_LOG_FILTERS.period) params.set('periode', filters.period);
  if (filters.search) params.set('q', filters.search);
  if (page > 1) params.set('page', String(page));

  const query = params.toString();

  return query ? `/kegiatan?${query}` : '/kegiatan';
}

type WorkLogFilterBarProps = {
  value: WorkLogFilters;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onPeriodChange: (period: WorkLogPeriod) => void;
};

export function WorkLogFilterBar({
  value,
  searchValue,
  onSearchChange,
  onPeriodChange,
}: WorkLogFilterBarProps) {
  const searching = searchValue.trim() !== '';

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div
        role="group"
        aria-label="Periode kegiatan"
        className="flex flex-wrap items-center gap-1.5"
      >
        {WORK_LOG_PERIODS.map((period) => (
          <Button
            key={period}
            type="button"
            size="sm"
            variant={value.period === period && !searching ? 'default' : 'outline'}
            aria-pressed={value.period === period}
            disabled={searching}
            onClick={() => onPeriodChange(period)}
          >
            {WORK_LOG_PERIOD_LABELS[period]}
          </Button>
        ))}
      </div>

      <div className="w-full lg:max-w-sm">
        <label htmlFor="work-log-search" className="sr-only">
          Cari kegiatan
        </label>
        <InputGroup>
          <InputGroupAddon align="inline-start">
            <SearchIcon aria-hidden="true" />
          </InputGroupAddon>
          <InputGroupInput
            id="work-log-search"
            value={searchValue}
            maxLength={TITLE_MAX_LENGTH}
            placeholder={searching ? 'Mencari di semua tanggal' : 'Cari nama atau uraian kegiatan'}
            onChange={(event) => onSearchChange(event.target.value)}
          />
          {searchValue ? (
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                type="button"
                size="icon-xs"
                aria-label="Hapus pencarian"
                onClick={() => onSearchChange('')}
              >
                <XIcon />
              </InputGroupButton>
            </InputGroupAddon>
          ) : null}
        </InputGroup>
      </div>
    </div>
  );
}
