export const WITA_TIME_ZONE = 'Asia/Makassar';

const WITA_OFFSET = '+08:00';

export function todayWita(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: WITA_TIME_ZONE }).format(now);
}

export function startOfDayWita(value: string): Date {
  return new Date(`${value}T00:00:00.000${WITA_OFFSET}`);
}

export function endOfDayWita(value: string): Date {
  return new Date(`${value}T23:59:59.999${WITA_OFFSET}`);
}

export function addDaysWita(value: string, days: number): string {
  const date = new Date(`${value}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);

  return date.toISOString().slice(0, 10);
}

export function monthRange(day: string): { from: string; to: string } {
  const year = Number(day.slice(0, 4));
  const month = Number(day.slice(5, 7));
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();

  return {
    from: `${day.slice(0, 7)}-01`,
    to: `${day.slice(0, 7)}-${String(lastDay).padStart(2, '0')}`,
  };
}

export function dateRangeEndingAt(day: string, days: number): string[] {
  return Array.from({ length: days }, (_, index) => addDaysWita(day, index - (days - 1)));
}
