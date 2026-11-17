import { prisma } from '../../lib/prisma.js';
import { ApiError } from '../../lib/api-error.js';
import type { CreateNoteInput, ListNotesQuery, UpdateNoteInput } from './note.schema.js';

function notFound(): ApiError {
  return new ApiError(404, 'NOT_FOUND', 'Catatan tidak ditemukan');
}

export async function listNotes(userId: string, query: ListNotesQuery) {
  const where = {
    userId,
    ...(query.search && { content: { contains: query.search, mode: 'insensitive' as const } }),
    ...(query.pinned && { pinned: query.pinned === 'true' }),
  };

  const [items, total] = await prisma.$transaction([
    prisma.note.findMany({
      where,
      orderBy: [{ pinned: 'desc' }, { updatedAt: 'desc' }],
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
    prisma.note.count({ where }),
  ]);

  return { items, total, page: query.page, limit: query.limit };
}

export async function createNote(userId: string, input: CreateNoteInput) {
  return prisma.note.create({ data: { ...input, userId } });
}

export async function updateNote(userId: string, id: string, input: UpdateNoteInput) {
  const { count } = await prisma.note.updateMany({ where: { id, userId }, data: input });

  if (count === 0) {
    throw notFound();
  }

  const note = await prisma.note.findFirst({ where: { id, userId } });

  if (!note) {
    throw notFound();
  }

  return note;
}

export async function deleteNote(userId: string, id: string): Promise<void> {
  const { count } = await prisma.note.deleteMany({ where: { id, userId } });

  if (count === 0) {
    throw notFound();
  }
}
