import { describe, expect, it } from 'vitest';

import {
  addDaysWita,
  dateKey,
  dateOnlyUtc,
  dateRangeEndingAt,
  endOfDayWita,
  monthRange,
  startOfDayWita,
  todayWita,
} from '../../src/lib/wita';

describe('todayWita', () => {
  it('memakai tanggal WITA, bukan UTC', () => {
    expect(todayWita(new Date('2026-11-19T16:30:00Z'))).toBe('2026-11-20');
    expect(todayWita(new Date('2026-11-19T15:59:59Z'))).toBe('2026-11-19');
  });
});

describe('batas hari WITA', () => {
  it('startOfDayWita memakai offset +08:00', () => {
    expect(startOfDayWita('2026-11-20').toISOString()).toBe('2026-11-19T16:00:00.000Z');
  });

  it('endOfDayWita memakai akhir hari +08:00', () => {
    expect(endOfDayWita('2026-11-20').toISOString()).toBe('2026-11-20T15:59:59.999Z');
  });
});

describe('aritmetika tanggal', () => {
  it('dateOnlyUtc menormalkan tanggal ke tengah malam UTC', () => {
    expect(dateOnlyUtc('2026-11-20').toISOString()).toBe('2026-11-20T00:00:00.000Z');
  });

  it('addDaysWita melewati batas bulan dan tahun', () => {
    expect(addDaysWita('2026-11-30', 1)).toBe('2026-12-01');
    expect(addDaysWita('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDaysWita('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('dateKey memotong hasil ISO menjadi tanggal', () => {
    expect(dateKey(new Date('2026-11-20T15:59:59.999Z'))).toBe('2026-11-20');
  });
});

describe('monthRange', () => {
  it('menghitung hari terakhir Februari pada tahun kabisat', () => {
    expect(monthRange('2028-02-15')).toEqual({ from: '2028-02-01', to: '2028-02-29' });
    expect(monthRange('2026-02-15')).toEqual({ from: '2026-02-01', to: '2026-02-28' });
  });

  it('memakai batas kalender bulan berjalan', () => {
    expect(monthRange('2026-12-31')).toEqual({ from: '2026-12-01', to: '2026-12-31' });
  });
});

describe('dateRangeEndingAt', () => {
  it('menghasilkan tanggal berurutan dan berakhir pada tanggal acuan', () => {
    const range = dateRangeEndingAt('2026-11-20', 7);

    expect(range).toHaveLength(7);
    expect(range[0]).toBe('2026-11-14');
    expect(range.at(-1)).toBe('2026-11-20');
  });
});
