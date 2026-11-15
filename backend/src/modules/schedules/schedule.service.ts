import type { Schedule } from '../../generated/prisma/client.js';
import { prisma } from '../../lib/prisma.js';
import { ApiError } from '../../utils/api-error.js';
import type {
  CreateScheduleInput,
  ListSchedulesQuery,
  UpdateScheduleInput,
} from './schedule.schema.js';
import { endOfDayWita, startOfDayWita } from './schedule.time.js';

function notFound(): ApiError {
  return new ApiError(404, 'NOT_FOUND', 'Agenda tidak ditemukan');
}

function toItem(schedule: Schedule) {
  return {
    ...schedule,
    startAt: schedule.startAt.toISOString(),
    endAt: schedule.endAt?.toISOString() ?? null,
  };
}

async function findOwnedSchedule(userId: string, id: string): Promise<Schedule> {
  const schedule = await prisma.schedule.findFirst({ where: { id, userId } });

  if (!schedule) {
    throw notFound();
  }

  return schedule;
}

export async function listSchedules(userId: string, query: ListSchedulesQuery) {
  const where = {
    userId,
    ...((query.from || query.to) && {
      startAt: {
        ...(query.from && { gte: startOfDayWita(query.from) }),
        ...(query.to && { lte: endOfDayWita(query.to) }),
      },
    }),
    ...(query.category && { category: query.category }),
    ...(query.status && { status: query.status }),
    ...(query.search && {
      OR: [
        { title: { contains: query.search, mode: 'insensitive' as const } },
        { description: { contains: query.search, mode: 'insensitive' as const } },
        { location: { contains: query.search, mode: 'insensitive' as const } },
      ],
    }),
  };

  const [items, total] = await prisma.$transaction([
    prisma.schedule.findMany({
      where,
      orderBy: [{ startAt: 'asc' }, { createdAt: 'asc' }],
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
    prisma.schedule.count({ where }),
  ]);

  return {
    items: items.map(toItem),
    total,
    page: query.page,
    limit: query.limit,
  };
}

export async function getSchedule(userId: string, id: string) {
  return toItem(await findOwnedSchedule(userId, id));
}

export async function createSchedule(userId: string, input: CreateScheduleInput) {
  const { startAt: startAtInput, endAt: endAtInput, ...rest } = input;

  const schedule = await prisma.schedule.create({
    data: {
      ...rest,
      userId,
      startAt: new Date(startAtInput),
      endAt: endAtInput ? new Date(endAtInput) : null,
    },
  });

  return toItem(schedule);
}

export async function updateSchedule(userId: string, id: string, input: UpdateScheduleInput) {
  const existing = await findOwnedSchedule(userId, id);
  const { startAt: startAtInput, endAt: endAtInput, ...rest } = input;

  const startAt = startAtInput ? new Date(startAtInput) : existing.startAt;
  const endAt =
    endAtInput === undefined ? existing.endAt : endAtInput ? new Date(endAtInput) : null;

  if (endAt && endAt < startAt) {
    throw new ApiError(
      400,
      'INVALID_SCHEDULE_RANGE',
      'Waktu selesai tidak boleh sebelum waktu mulai',
    );
  }

  const schedule = await prisma.schedule.update({
    where: { id: existing.id },
    data: {
      ...rest,
      ...(startAtInput && { startAt }),
      ...(endAtInput !== undefined && { endAt }),
    },
  });

  return toItem(schedule);
}

export async function deleteSchedule(userId: string, id: string): Promise<void> {
  const { count } = await prisma.schedule.deleteMany({ where: { id, userId } });

  if (count === 0) {
    throw notFound();
  }
}
