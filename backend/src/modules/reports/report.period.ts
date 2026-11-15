import type { ReportPeriod } from './report.schema.js';

const WITA_TIME_ZONE = 'Asia/Makassar';
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

export interface ReportRange {
  from: string;
  to: string;
  label: string;
}

export function todayWita(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: WITA_TIME_ZONE }).format(now);
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

function parseDate(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

function addDays(value: string, days: number): string {
  const date = parseDate(value);
  date.setUTCDate(date.getUTCDate() + days);

  return date.toISOString().slice(0, 10);
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
    const from = input.from!;
    const to = input.to!;

    return { from, to, label: rangeLabel(from, to) };
  }

  const base = input.date ?? todayWita();
  const year = base.slice(0, 4);
  const month = base.slice(5, 7);

  switch (input.period) {
    case 'daily':
      return { from: base, to: base, label: formatDateLabel(base) };

    case 'weekly': {
      const weekDay = parseDate(base).getUTCDay();
      const from = addDays(base, -((weekDay + 6) % 7));
      const to = addDays(from, 6);

      return { from, to, label: rangeLabel(from, to) };
    }

    case 'monthly': {
      const lastDay = new Date(Date.UTC(Number(year), Number(month), 0)).getUTCDate();
      const to = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;

      return {
        from: `${year}-${month}-01`,
        to,
        label: `${MONTHS[Number(month) - 1]} ${year}`,
      };
    }

    case 'yearly':
      return {
        from: `${year}-01-01`,
        to: `${year}-12-31`,
        label: year,
      };
  }
}
