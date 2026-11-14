import type { WorkLog } from '../../generated/prisma/client.js';
import { prisma } from '../../lib/prisma.js';
import { ApiError } from '../../utils/api-error.js';
import type {
  CreateWorkLogInput,
  ListWorkLogsQuery,
  UpdateWorkLogInput,
} from './work-log.schema.js';

type WorkLogRow = Pick<
  WorkLog,
  'id' | 'activityDate' | 'name' | 'description' | 'output' | 'category' | 'createdAt' | 'updatedAt'
>;

const workLogSelect = {
  id: true,
  activityDate: true,
  name: true,
  description: true,
  output: true,
  category: true,
  createdAt: true,
  updatedAt: true,
} as const;

function toDateOnly(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

function today(): Date {
  return toDateOnly(new Date().toISOString().slice(0, 10));
}

function toItem(row: WorkLogRow) {
  return { ...row, activityDate: row.activityDate.toISOString().slice(0, 10) };
}

function notFound(): ApiError {
  return new ApiError(404, 'NOT_FOUND', 'Catatan pekerjaan tidak ditemukan');
}

async function findOwned(userId: string, id: string): Promise<WorkLogRow> {
  const workLog = await prisma.workLog.findFirst({
    where: { id, userId },
    select: workLogSelect,
  });

  if (!workLog) {
    throw notFound();
  }

  return workLog;
}

export async function listWorkLogs(userId: string, query: ListWorkLogsQuery) {
  const where = {
    userId,
    ...(query.category && { category: query.category }),
    ...((query.from || query.to) && {
      activityDate: {
        ...(query.from && { gte: toDateOnly(query.from) }),
        ...(query.to && { lte: toDateOnly(query.to) }),
      },
    }),
    ...(query.search && {
      OR: [
        { name: { contains: query.search, mode: 'insensitive' as const } },
        { description: { contains: query.search, mode: 'insensitive' as const } },
      ],
    }),
  };

  const [items, total] = await prisma.$transaction([
    prisma.workLog.findMany({
      where,
      select: workLogSelect,
      orderBy: [{ activityDate: 'desc' }, { createdAt: 'desc' }],
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
    prisma.workLog.count({ where }),
  ]);

  return {
    items: items.map(toItem),
    total,
    page: query.page,
    limit: query.limit,
  };
}

export async function getWorkLog(userId: string, id: string) {
  return toItem(await findOwned(userId, id));
}

export async function createWorkLog(userId: string, input: CreateWorkLogInput) {
  const { activityDate, ...rest } = input;

  const workLog = await prisma.workLog.create({
    data: {
      ...rest,
      userId,
      activityDate: activityDate ? toDateOnly(activityDate) : today(),
    },
    select: workLogSelect,
  });

  return toItem(workLog);
}

export async function updateWorkLog(userId: string, id: string, input: UpdateWorkLogInput) {
  await findOwned(userId, id);

  const { activityDate, ...rest } = input;

  const workLog = await prisma.workLog.update({
    where: { id },
    data: {
      ...rest,
      ...(activityDate && { activityDate: toDateOnly(activityDate) }),
    },
    select: workLogSelect,
  });

  return toItem(workLog);
}

export async function deleteWorkLog(userId: string, id: string): Promise<void> {
  const { count } = await prisma.workLog.deleteMany({ where: { id, userId } });

  if (count === 0) {
    throw notFound();
  }
}
