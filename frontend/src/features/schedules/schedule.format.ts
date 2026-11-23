import { formatDate } from '@/lib/date';
import { witaDatePart, witaTimePart } from '@/lib/wita';

import type { Schedule } from './schedule.api';

/** Label waktu ringkas; menyebut tanggal akhir bila agenda mencakup beberapa hari. */
export function scheduleTimeLabel(schedule: Schedule) {
  const startDate = witaDatePart(schedule.startAt);
  const endDate = schedule.endAt ? witaDatePart(schedule.endAt) : null;
  const multiDay = endDate !== null && endDate !== startDate;

  if (schedule.allDay) {
    return multiDay ? `Sepanjang hari · s.d. ${formatDate(schedule.endAt!)}` : 'Sepanjang hari';
  }

  const start = witaTimePart(schedule.startAt);

  if (!schedule.endAt) {
    return start;
  }

  if (multiDay) {
    return `${start} · s.d. ${formatDate(schedule.endAt)} ${witaTimePart(schedule.endAt)}`;
  }

  return `${start} – ${witaTimePart(schedule.endAt)}`;
}
