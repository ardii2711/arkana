import { describe, expect, it } from 'vitest';

import { ApiError } from '../../src/lib/api-error';
import {
  formatDateLabel,
  formatDateTimeWita,
  resolveRange,
} from '../../src/modules/reports/report.period';

describe('resolveRange', () => {
  it('harian memakai tanggal acuan', () => {
    expect(resolveRange({ period: 'daily', date: '2026-11-20' })).toEqual({
      from: '2026-11-20',
      to: '2026-11-20',
      label: '20 November 2026',
    });
  });

  it('mingguan memakai Senin sampai Minggu', () => {
    expect(resolveRange({ period: 'weekly', date: '2026-11-18' })).toEqual({
      from: '2026-11-16',
      to: '2026-11-22',
      label: '16 November 2026 – 22 November 2026',
    });
  });

  it('mingguan menyeberang batas tahun', () => {
    expect(resolveRange({ period: 'weekly', date: '2027-01-01' })).toEqual({
      from: '2026-12-28',
      to: '2027-01-03',
      label: '28 Desember 2026 – 3 Januari 2027',
    });
  });

  it('bulanan memakai batas kalender', () => {
    expect(resolveRange({ period: 'monthly', date: '2028-02-10' })).toEqual({
      from: '2028-02-01',
      to: '2028-02-29',
      label: 'Februari 2028',
    });
  });

  it('tahunan memakai awal dan akhir tahun', () => {
    expect(resolveRange({ period: 'yearly', date: '2026-06-15' })).toEqual({
      from: '2026-01-01',
      to: '2026-12-31',
      label: '2026',
    });
  });

  it('rentang khusus memakai from dan to apa adanya', () => {
    expect(resolveRange({ period: 'custom', from: '2026-11-01', to: '2026-11-15' })).toEqual({
      from: '2026-11-01',
      to: '2026-11-15',
      label: '1 November 2026 – 15 November 2026',
    });
  });

  it('rentang khusus tanpa batas ditolak', () => {
    const error = (() => {
      try {
        resolveRange({ period: 'custom' });
        return null;
      } catch (caught) {
        return caught;
      }
    })();

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(400);
    expect((error as ApiError).code).toBe('VALIDATION_ERROR');
  });

  it('memakai tanggal hari ini WITA bila tanggal acuan tidak dikirim', () => {
    const result = resolveRange({ period: 'daily' });

    expect(result.from).toBe(result.to);
    expect(result.from).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('label tanggal', () => {
  it('memformat tanggal Indonesia tanpa nol di depan', () => {
    expect(formatDateLabel('2026-01-05')).toBe('5 Januari 2026');
    expect(formatDateLabel('2026-12-31')).toBe('31 Desember 2026');
  });

  it('memformat waktu WITA', () => {
    expect(formatDateTimeWita(new Date('2026-11-19T16:30:00Z'))).toBe(
      '20 November 2026 00:30 WITA',
    );
  });
});
