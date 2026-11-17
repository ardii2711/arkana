import { WITA_TIME_ZONE, addDaysWita, dateOnlyUtc, monthRange, todayWita } from '../../lib/wita.js';
import { ApiError } from '../../utils/api-error.js';
import type { ReportPeriod } from './report.schema.js';

const MONTHS = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

interface ReportRange {
  from: string;
  to: string;
  label: string;
}

export function formatDateLabel(value: string): string {
  const year = value.slice(0, 4);
  const month = Number(value.slice(5, 7));
  const day = Number(value.slice(8, 10));

  return `${day} ${MONTHS[month - 1]} ${year}`;
}

export function formatDateTimeWita(now: Date = new Date()): string {
  return `${formatDateLabel(todayWita(now))} ${new Intl.DateTimeFormat('en-GB', {
    timeZone: WITA_TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(now)} WITA`;
}

function rangeLabel(from: string, to: string): string {
  return `${formatDateLabel(from)} – ${formatDateLabel(to)}`;
}

export function resolveRange(input: {
  period: ReportPeriod;
  date?: string;
  from?: string;
  to?: string;
}): ReportRange {
  if (input.period === 'custom') {
    const { from, to } = input;

    if (!from || !to) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Rentang tanggal wajib diisi');
    }

    return { from, to, label: rangeLabel(from, to) };
  }

  const base = input.date ?? todayWita();
  const year = base.slice(0, 4);
  const month = base.slice(5, 7);

  switch (input.period) {
    case 'daily':
      return { from: base, to: base, label: formatDateLabel(base) };

    case 'weekly': {
      const weekDay = dateOnlyUtc(base).getUTCDay();
      const from = addDaysWita(base, -((weekDay + 6) % 7));
      const to = addDaysWita(from, 6);

      return { from, to, label: rangeLabel(from, to) };
    }

    case 'monthly': {
      const range = monthRange(base);

      return { ...range, label: `${MONTHS[Number(month) - 1]} ${year}` };
    }

    case 'yearly':
      return {
        from: `${year}-01-01`,
        to: `${year}-12-31`,
        label: year,
      };
  }
}
