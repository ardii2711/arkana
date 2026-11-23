import { describe, expect, it } from 'vitest';

import { AT_LEAST_ONE_FIELD_MESSAGE } from '../../src/lib/validation';
import {
  createScheduleSchema,
  listSchedulesQuerySchema,
  updateScheduleSchema,
} from '../../src/modules/schedules/schedule.schema';

const validSchedule = {
  title: 'Rapat koordinasi',
  startAt: '2026-11-20T09:00:00+08:00',
};

describe('createScheduleSchema', () => {
  it('menerima agenda valid dan memberi default opsional', () => {
    const result = createScheduleSchema.safeParse(validSchedule);

    expect(result.success).toBe(true);
    expect(result.data?.description).toBeUndefined();
    expect(result.data?.endAt).toBeUndefined();
  });

  it('menormalkan deskripsi dan lokasi kosong menjadi null', () => {
    const result = createScheduleSchema.safeParse({
      ...validSchedule,
      description: '',
      location: '   ',
    });

    expect(result.success).toBe(true);
    expect(result.data?.description).toBeNull();
    expect(result.data?.location).toBeNull();
  });

  it('menolak waktu mulai tanpa offset zona waktu', () => {
    const result = createScheduleSchema.safeParse({
      ...validSchedule,
      startAt: '2026-11-20T09:00:00',
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(['startAt']);
  });

  it('menolak waktu selesai sebelum waktu mulai', () => {
    const result = createScheduleSchema.safeParse({
      ...validSchedule,
      endAt: '2026-11-20T08:59:00+08:00',
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(['endAt']);
  });

  it('menerima waktu selesai sama dengan waktu mulai', () => {
    const result = createScheduleSchema.safeParse({
      ...validSchedule,
      endAt: validSchedule.startAt,
    });

    expect(result.success).toBe(true);
  });

  it('mengabaikan kategori lama pada payload', () => {
    const result = createScheduleSchema.safeParse({
      ...validSchedule,
      category: 'RAPAT_KOORDINASI',
    });

    expect(result.success).toBe(true);
    expect(result.data).not.toHaveProperty('category');
  });
});

describe('updateScheduleSchema', () => {
  it('menolak patch tanpa field', () => {
    const result = updateScheduleSchema.safeParse({});

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe(AT_LEAST_ONE_FIELD_MESSAGE);
  });

  it('menerima patch satu field', () => {
    expect(updateScheduleSchema.safeParse({ status: 'DONE' }).success).toBe(true);
  });

  it('menolak rentang terbalik saat kedua waktu dikirim', () => {
    const result = updateScheduleSchema.safeParse({
      startAt: '2026-11-20T10:00:00+08:00',
      endAt: '2026-11-20T09:00:00+08:00',
    });

    expect(result.success).toBe(false);
  });
});

describe('listSchedulesQuerySchema', () => {
  it('menerima filter rentang valid', () => {
    expect(
      listSchedulesQuerySchema.safeParse({ from: '2026-11-01', to: '2026-11-30' }).success,
    ).toBe(true);
  });

  it('menolak rentang tanggal terbalik', () => {
    const result = listSchedulesQuerySchema.safeParse({ from: '2026-11-30', to: '2026-11-01' });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(['from']);
  });
});
