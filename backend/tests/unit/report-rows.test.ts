import { describe, expect, it } from 'vitest';

import { summarizeEvidence } from '../../src/modules/reports/report.rows';

const MAX_LENGTH = 255;

describe('summarizeEvidence', () => {
  it('menampilkan tanda hubung bila tidak ada file', () => {
    expect(summarizeEvidence([])).toBe('-');
  });

  it('membuang ekstensi untuk satu file', () => {
    expect(summarizeEvidence(['Surat Tugas.pdf'])).toBe('Surat Tugas');
  });

  it('menggabungkan beberapa file dengan pemisah titik koma', () => {
    expect(summarizeEvidence(['Undangan.pdf', 'Daftar Hadir.xlsx', 'Foto.jpg'])).toBe(
      'Undangan; Daftar Hadir; Foto',
    );
  });

  it('mempertahankan teks penuh bila masih dalam batas 255 karakter', () => {
    const names = ['a.png', 'b.png'];
    const result = summarizeEvidence(names);

    expect(result).toBe('a; b');
    expect(result.length).toBeLessThanOrEqual(MAX_LENGTH);
  });

  it('memotong dan menyebut jumlah file tersisa bila melebihi 255 karakter', () => {
    const names = Array.from({ length: 30 }, (_, index) => `Bukti dukung nomor ${index}.pdf`);
    const result = summarizeEvidence(names);

    expect(result.length).toBeLessThanOrEqual(MAX_LENGTH);
    expect(result).toMatch(/; \+\d+ file lainnya$/);
    expect(result.startsWith('Bukti dukung nomor 0')).toBe(true);
  });

  it('memotong nama file tunggal yang terlalu panjang', () => {
    const result = summarizeEvidence([`${'x'.repeat(400)}.pdf`]);

    expect(result.length).toBeLessThanOrEqual(MAX_LENGTH);
    expect(result).toMatch(/^x+…\+\d+ file lainnya$/);
  });
});
