import { witaDatePart, witaTimePart } from '@/lib/wita';

import type { Schedule } from './schedule.api';

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

export function isScheduleOnDate(schedule: Schedule, date: string) {
  return witaDatePart(schedule.startAt) === date;
}

export function sortSchedules(schedules: Schedule[]) {
  return [...schedules].sort((a, b) => a.startAt.localeCompare(b.startAt));
}
