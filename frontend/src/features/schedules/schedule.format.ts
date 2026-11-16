import type { Schedule } from './schedule.api';

const WITA = 'Asia/Makassar';
const OFFSET = '+08:00';

const dateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: WITA,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const timeFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: WITA,
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

const longDateFormatter = new Intl.DateTimeFormat('id-ID', {
  timeZone: WITA,
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

export function witaDatePart(value: string | Date) {
  return dateFormatter.format(new Date(value));
}

export function witaTimePart(value: string | Date) {
  return timeFormatter.format(new Date(value));
}

export function formatScheduleTitle(value: string) {
  return longDateFormatter.format(new Date(`${value}T00:00:00.000${OFFSET}`));
}

/** ISO string in WITA wall-clock time for <input type="time"> and agenda datetimes. */
export function toWitaIso(date: string, time: string) {
  return new Date(`${date}T${time}:00${OFFSET}`).toISOString();
}

export function currentWitaDate() {
  return witaDatePart(new Date());
}

const shortDateFormatter = new Intl.DateTimeFormat('id-ID', {
  timeZone: WITA,
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

export function witaShortDate(value: string | Date) {
  return shortDateFormatter.format(new Date(value));
}

export function scheduleDateLabel(schedule: Schedule) {
  if (schedule.allDay) {
    return 'Sepanjang hari';
  }

  const start = witaTimePart(schedule.startAt);

  if (!schedule.endAt) {
    return start;
  }

  return `${start} – ${witaTimePart(schedule.endAt)}`;
}

/** Daftar tanggal (WITA) yang berisi agenda, untuk indikator kalender. */
export function witaBookedDates(schedules: Schedule[]) {
  return [...new Set(schedules.map((schedule) => witaDatePart(schedule.startAt)))];
}

export function monthRangeWita(fromDate: string) {
  const year = Number(fromDate.slice(0, 4));
  const month = Number(fromDate.slice(5, 7));
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();

  return {
    from: `${fromDate.slice(0, 7)}-01`,
    to: `${fromDate.slice(0, 7)}-${String(lastDay).padStart(2, '0')}`,
  };
}

export function addDaysWita(value: string, days: number) {
  const date = new Date(`${value}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);

  return date.toISOString().slice(0, 10);
}

/** Rentang “Mendatang”: hari ini (WITA) sampai 30 hari ke depan. */
export function upcomingRangeWita(today: string) {
  return { from: today, to: addDaysWita(today, 30) };
}

export function isScheduleOnDate(schedule: Schedule, date: string) {
  return witaDatePart(schedule.startAt) === date;
}

export function sortSchedules(schedules: Schedule[]) {
  return [...schedules].sort((a, b) => a.startAt.localeCompare(b.startAt));
}
