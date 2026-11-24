import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { WorkCategory } from '../../src/generated/prisma/enums';
import { prisma } from '../../src/lib/prisma';
import { ApiClient } from '../helpers/client';
import { cleanupTestUsers, createTestUser, type TestUser } from '../helpers/fixtures';
import { startServer, stopServer } from '../helpers/server';

const RUNS = 20;
const WORK_LOGS = 500;
const FILES_PER_WORK_LOG = 2;
const ARCHIVE_FILES = 300;
const SCHEDULES = 100;
const NOTES = 100;

const CATEGORIES = Object.values(WorkCategory);

interface Row {
  endpoint: string;
  p50: string;
  p95: string;
  'respons (KB)': string;
}

function daysAgo(days: number): Date {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() - days);

  return date;
}

function percentile(sorted: number[], value: number): number {
  // Nearest-rank: p95 dari 20 sampel = sampel ke-19, bukan maksimum.
  return sorted[Math.max(0, Math.ceil(value * sorted.length) - 1)] ?? 0;
}

async function seed(userId: string): Promise<void> {
  await prisma.workLog.createMany({
    data: Array.from({ length: WORK_LOGS }, (_, index) => ({
      userId,
      activityDate: daysAgo(index % 30),
      name: `Kegiatan uji ${index}`,
      description: `Uraian kegiatan uji ${index}. `.repeat(5),
      output: `Output kegiatan uji ${index}`,
      category: CATEGORIES[index % CATEGORIES.length] ?? WorkCategory.PELAKSANAAN_TUGAS,
      target: '1 dokumen',
      realisasi: '1 dokumen',
    })),
  });

  const workLogs = await prisma.workLog.findMany({ where: { userId }, select: { id: true } });

  await prisma.workLogFile.createMany({
    data: workLogs.flatMap((workLog, index) =>
      Array.from({ length: FILES_PER_WORK_LOG }, (_, fileIndex) => ({
        workLogId: workLog.id,
        key: `work-logs/${userId}/${workLog.id}/perf-${fileIndex}.pdf`,
        originalName: `bukti-${index}-${fileIndex}.pdf`,
        mimeType: 'application/pdf',
        size: 1024,
      })),
    ),
  });

  await prisma.archiveFile.createMany({
    data: Array.from({ length: ARCHIVE_FILES }, (_, index) => ({
      userId,
      name: `Dokumen uji ${index}`,
      description: `Deskripsi dokumen uji ${index}`,
      key: `archive/${userId}/perf-${index}.pdf`,
      originalName: `dokumen-${index}.pdf`,
      mimeType: 'application/pdf',
      size: 2048,
    })),
  });

  const now = Date.now();

  await prisma.schedule.createMany({
    data: Array.from({ length: SCHEDULES }, (_, index) => ({
      userId,
      title: `Agenda uji ${index}`,
      startAt: new Date(now + index * 3_600_000),
      location: 'Ruang uji',
    })),
  });

  await prisma.note.createMany({
    data: Array.from({ length: NOTES }, (_, index) => ({
      userId,
      content: `Catatan uji ${index}`,
      pinned: index % 10 === 0,
    })),
  });
}

async function measure(client: ApiClient, endpoint: string, path: string): Promise<Row> {
  expect((await client.request(path)).status, `${endpoint} warm-up`).toBe(200);

  const samples: number[] = [];
  let bytes = 0;

  for (let run = 0; run < RUNS; run += 1) {
    const startedAt = performance.now();
    const result = await client.request(path);
    samples.push(performance.now() - startedAt);
    expect(result.status, `${endpoint} run ${run + 1}`).toBe(200);
    bytes = Buffer.byteLength(result.text);
  }

  samples.sort((a, b) => a - b);

  return {
    endpoint,
    p50: `${Math.round(percentile(samples, 0.5))} ms`,
    p95: `${Math.round(percentile(samples, 0.95))} ms`,
    'respons (KB)': (bytes / 1024).toFixed(1),
  };
}

describe('baseline performa endpoint berat', () => {
  let user: TestUser;

  beforeAll(async () => {
    await startServer();
    await cleanupTestUsers();
    user = await createTestUser('perf');
    await seed(user.id);
  });

  afterAll(async () => {
    await cleanupTestUsers();
    await stopServer();
  });

  it('mencatat p50/p95 dan ukuran respons', async () => {
    const endpoints: [string, string][] = [
      ['GET /api/work-logs', '/work-logs?limit=100'],
      ['GET /api/archive/files', '/archive/files?limit=100'],
      ['GET /api/reports/work-logs', '/reports/work-logs?period=yearly'],
      ['GET /api/dashboard', '/dashboard'],
      ['GET /api/schedules', '/schedules?limit=100'],
      ['GET /api/notes', '/notes?limit=100'],
      ['GET /api/health/ready', '/health/ready'],
    ];

    const rows: Row[] = [];

    for (const [endpoint, path] of endpoints) {
      rows.push(await measure(user.client, endpoint, path));
    }

    // process.stdout.write agar tidak tertelan capture console Vitest.
    process.stdout.write(
      `\nBaseline: ${WORK_LOGS} kegiatan, ${WORK_LOGS * FILES_PER_WORK_LOG} file bukti, ` +
        `${ARCHIVE_FILES} arsip, ${SCHEDULES} agenda, ${NOTES} catatan (${RUNS} run/endpoint)\n` +
        `${JSON.stringify(rows, null, 2)}\n`,
    );
  }, 300_000);
});
