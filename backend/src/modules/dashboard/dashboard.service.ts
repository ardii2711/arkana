import { ARCHIVE_QUOTA_BYTES } from '../../lib/file-rules.js';
import { prisma } from '../../lib/prisma.js';
import { scheduleRangeFilter } from '../../lib/schedule-range.js';
import {
  addDaysWita,
  dateRangeEndingAt,
  endOfDayWita,
  monthRange,
  startOfDayWita,
  todayWita,
} from '../../lib/wita.js';

const TREND_DAYS = 30;
const UPCOMING_LIMIT = 5;
const PINNED_NOTE_LIMIT = 5;

import { dateKey } from '../../lib/wita.js';

export async function getDashboard(userId: string, now: Date = new Date()) {
  const today = todayWita(now);
  const month = monthRange(today);
  const trend = dateRangeEndingAt(today, TREND_DAYS);
  const trendFrom = addDaysWita(today, -(TREND_DAYS - 1));
  const weekFrom = addDaysWita(today, -6);

  const [
    monthWorkLogs,
    weekWorkLogs,
    evidenceFiles,
    archiveUsed,
    todaySchedules,
    upcomingSchedules,
    pinnedNotes,
    categoryRows,
    trendRows,
  ] = await Promise.all([
    prisma.workLog.count({
      where: {
        userId,
        activityDate: { gte: startOfDayWita(month.from), lte: endOfDayWita(month.to) },
      },
    }),
    prisma.workLog.count({
      where: { userId, activityDate: { gte: startOfDayWita(weekFrom), lte: endOfDayWita(today) } },
    }),
    prisma.workLogFile.count({ where: { workLog: { userId } } }),
    prisma.archiveFile.aggregate({ where: { userId }, _sum: { size: true } }),
    prisma.schedule.findMany({
      where: { userId, ...scheduleRangeFilter(today, today) },
      orderBy: { startAt: 'asc' },
    }),
    prisma.schedule.findMany({
      where: {
        userId,
        status: { not: 'CANCELLED' },
        startAt: { gte: startOfDayWita(addDaysWita(today, 1)) },
      },
      orderBy: { startAt: 'asc' },
      take: UPCOMING_LIMIT,
    }),
    prisma.note.findMany({
      where: { userId, pinned: true },
      orderBy: { updatedAt: 'desc' },
      take: PINNED_NOTE_LIMIT,
      select: { id: true, content: true, pinned: true, updatedAt: true },
    }),
    prisma.workLog.groupBy({
      by: ['category'],
      where: {
        userId,
        activityDate: { gte: startOfDayWita(month.from), lte: endOfDayWita(month.to) },
      },
      _count: { _all: true },
    }),
    prisma.workLog.groupBy({
      by: ['activityDate'],
      where: {
        userId,
        activityDate: { gte: startOfDayWita(trendFrom), lte: endOfDayWita(today) },
      },
      _count: { _all: true },
    }),
  ]);

  const trendCounts = new Map(
    trendRows.map((row) => [dateKey(row.activityDate), row._count._all] as const),
  );

  return {
    summary: {
      monthWorkLogs,
      weekWorkLogs,
      evidenceFiles,
      archive: { usedBytes: archiveUsed._sum.size ?? 0, quotaBytes: ARCHIVE_QUOTA_BYTES },
    },
    todaySchedules,
    upcomingSchedules,
    pinnedNotes,
    workLogCategories: categoryRows
      .map((row) => ({ category: row.category, count: row._count._all }))
      .sort((a, b) => b.count - a.count),
    workLogTrend: trend.map((date) => ({ date, count: trendCounts.get(date) ?? 0 })),
  };
}

export async function getAdminDashboard() {
  const [active, invited, inactive, pendingInvitations] = await Promise.all([
    prisma.user.count({ where: { role: 'USER', status: 'ACTIVE' } }),
    prisma.user.count({ where: { role: 'USER', status: 'INVITED' } }),
    prisma.user.count({ where: { role: 'USER', status: 'INACTIVE' } }),
    prisma.user.findMany({
      where: { role: 'USER', status: 'INVITED' },
      select: { id: true, name: true, email: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return { accounts: { active, invited, inactive }, pendingInvitations };
}
