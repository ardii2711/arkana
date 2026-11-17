import { WITA, WITA_OFFSET } from './wita';

const shortDateFormatter = new Intl.DateTimeFormat('id-ID', {
  timeZone: WITA,
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

const dateTimeFormatter = new Intl.DateTimeFormat('id-ID', {
  timeZone: WITA,
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

const longDateFormatter = new Intl.DateTimeFormat('id-ID', {
  timeZone: WITA,
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

const monthYearFormatter = new Intl.DateTimeFormat('id-ID', {
  timeZone: WITA,
  month: 'long',
  year: 'numeric',
});

/** Date-only ('YYYY-MM-DD') diperlakukan sebagai tengah malam WITA. */
function parseDate(value: string | Date) {
  if (value instanceof Date) return value;

  return new Date(
    /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00.000${WITA_OFFSET}` : value,
  );
}

/** "16 Nov 2026" */
export function formatDate(value: string | Date) {
  return shortDateFormatter.format(parseDate(value));
}

/** "16 Nov 2026, 14.30" */
export function formatDateTime(value: string | Date) {
  return dateTimeFormatter.format(parseDate(value));
}

/** "Senin, 16 November 2026" */
export function formatDateLong(value: string | Date) {
  return longDateFormatter.format(parseDate(value));
}

/** "November 2026" */
export function formatMonthYear(value: Date) {
  return monthYearFormatter.format(value);
}
