import assert from 'node:assert/strict';

import {
  createScheduleSchema,
  listSchedulesQuerySchema,
  updateScheduleSchema,
} from '../src/modules/schedules/schedule.schema.js';
import { endOfDayWita, startOfDayWita } from '../src/lib/wita.js';
import { scheduleRangeFilter } from '../src/lib/schedule-range.js';

// Batas hari WITA (UTC+8)
assert.equal(startOfDayWita('2026-11-15').toISOString(), '2026-11-14T16:00:00.000Z');
assert.equal(endOfDayWita('2026-11-15').toISOString(), '2026-11-15T15:59:59.999Z');

const base = {
  title: 'Rapat koordinasi',
  startAt: '2026-11-15T09:00:00+08:00',
};

// Create: valid, default status, deskripsi kosong jadi null
const created = createScheduleSchema.parse({ ...base, description: '   ' });
assert.equal(created.description, null);
assert.equal(created.status, undefined);
assert.equal(new Date(created.startAt).toISOString(), '2026-11-15T01:00:00.000Z');

// Create: waktu selesai sebelum mulai ditolak
assert.equal(
  createScheduleSchema.safeParse({ ...base, endAt: '2026-11-15T08:00:00+08:00' }).success,
  false,
);
assert.equal(
  createScheduleSchema.safeParse({ ...base, endAt: '2026-11-15T10:00:00+08:00' }).success,
  true,
);

// Status di luar enum ditolak
assert.equal(createScheduleSchema.safeParse({ ...base, status: 'BERLANGSUNG' }).success, false);

// Update: body kosong ditolak, endAt null valid (menghapus waktu selesai)
assert.equal(updateScheduleSchema.safeParse({}).success, false);
assert.equal(updateScheduleSchema.safeParse({ endAt: null }).success, true);

// Filter rentang tanggal
assert.equal(
  listSchedulesQuerySchema.safeParse({ from: '2026-11-15', to: '2026-11-01' }).success,
  false,
);
assert.equal(
  listSchedulesQuerySchema.safeParse({ from: '2026-11-01', to: '2026-11-15' }).success,
  true,
);

// Kategori tidak lagi bagian dari agenda (field lama diabaikan)
assert.equal(
  'category' in createScheduleSchema.parse({ ...base, category: 'RAPAT_KOORDINASI' }),
  false,
);

// Rentang beririsan: agenda multi-hari ikut terambil pada tanggal setelah mulai
const range = scheduleRangeFilter('2026-11-21', '2026-11-21');
assert.deepEqual(range.startAt, { lte: endOfDayWita('2026-11-21') });
assert.deepEqual(range.OR?.[0], { endAt: { gte: startOfDayWita('2026-11-21') } });
assert.deepEqual(range.OR?.[1], { endAt: null, startAt: { gte: startOfDayWita('2026-11-21') } });
assert.deepEqual(scheduleRangeFilter(), {});

console.log('schedule rules: OK');
