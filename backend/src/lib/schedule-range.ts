import type { Prisma } from '../generated/prisma/client.js';
import { endOfDayWita, startOfDayWita } from './wita.js';

/**
 * Filter agenda yang rentangnya beririsan dengan `[from, to]` (tanggal WITA).
 * Agenda multi-hari tetap muncul pada tanggal setelah `startAt`.
 */
export function scheduleRangeFilter(from?: string, to?: string): Prisma.ScheduleWhereInput {
  const filter: Prisma.ScheduleWhereInput = {};

  if (to) {
    filter.startAt = { lte: endOfDayWita(to) };
  }

  if (from) {
    const start = startOfDayWita(from);

    filter.OR = [{ endAt: { gte: start } }, { endAt: null, startAt: { gte: start } }];
  }

  return filter;
}
