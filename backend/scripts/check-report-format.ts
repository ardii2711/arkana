import assert from 'node:assert/strict';

import { createReportPdf } from '../src/modules/reports/report.pdf.js';
import { formatDateLabel, resolveRange, todayWib } from '../src/modules/reports/report.period.js';
import { summarizeEvidence, type ReportData } from '../src/modules/reports/report.rows.js';
import { buildReportXlsx } from '../src/modules/reports/report.xlsx.js';

import { reportExportQuerySchema } from '../src/modules/reports/report.schema.js';

// Validasi query: custom wajib from+to, non-custom menolak from/to
assert.equal(
  reportExportQuerySchema.safeParse({ period: 'custom', from: '2026-11-01' }).success,
  false,
);
assert.equal(
  reportExportQuerySchema.safeParse({ period: 'monthly', from: '2026-11-01', to: '2026-11-30' })
    .success,
  false,
);
assert.equal(
  reportExportQuerySchema.safeParse({ period: 'monthly', date: '2026-11-15' }).success,
  true,
);

// Ringkasan bukti dukung
assert.equal(summarizeEvidence([]), '-');
assert.equal(summarizeEvidence(['Surat Tugas.pdf']), 'Surat Tugas');
assert.equal(summarizeEvidence(['a.pdf', 'b.jpg']), 'a; b');

const manyFiles = Array.from({ length: 20 }, (_, index) => `Dokumen bukti dukung ${index + 1}.pdf`);
const summary = summarizeEvidence(manyFiles);
assert.ok(summary.length <= 255, `ringkasan ${summary.length} karakter`);
assert.match(summary, /; \+\d+ file lainnya$/);

const longName = summarizeEvidence([`${'x'.repeat(400)}.pdf`]);
assert.ok(longName.length <= 255, `nama panjang ${longName.length} karakter`);

// Periode (WIB, minggu Senin–Minggu)
assert.equal(todayWib(new Date('2026-11-14T18:00:00.000Z')), '2026-11-15');
assert.equal(formatDateLabel('2026-11-09'), '9 November 2026');

assert.deepEqual(resolveRange({ period: 'daily', date: '2026-11-15' }), {
  from: '2026-11-15',
  to: '2026-11-15',
  label: '15 November 2026',
});
assert.deepEqual(resolveRange({ period: 'weekly', date: '2026-11-15' }), {
  from: '2026-11-09',
  to: '2026-11-15',
  label: '9 November 2026 – 15 November 2026',
});
assert.equal(resolveRange({ period: 'weekly', date: '2026-11-09' }).from, '2026-11-09');
assert.deepEqual(resolveRange({ period: 'monthly', date: '2026-02-10' }), {
  from: '2026-02-01',
  to: '2026-02-28',
  label: 'Februari 2026',
});
assert.equal(resolveRange({ period: 'monthly', date: '2028-02-10' }).to, '2028-02-29');
assert.equal(resolveRange({ period: 'yearly', date: '2026-11-15' }).label, '2026');
assert.deepEqual(resolveRange({ period: 'custom', from: '2026-01-05', to: '2026-01-10' }), {
  from: '2026-01-05',
  to: '2026-01-10',
  label: '5 Januari 2026 – 10 Januari 2026',
});

// Builder XLSX (sekaligus memastikan import exceljs berjalan di ESM)
const report: ReportData = {
  title: 'Rekap Kinerja',
  userName: 'Pengguna Uji',
  periodLabel: '9 November 2026 – 15 November 2026',
  from: '2026-11-09',
  to: '2026-11-15',
  generatedAt: '15 November 2026 20:00 WIB',
  rows: [
    {
      no: 1,
      date: '2026-11-10',
      actionPlan: 'Contoh kegiatan',
      target: '1 laporan',
      realisasi: '1 laporan',
      evidence: 'Surat Tugas',
      link: 'https://arkana.example.com/p/evidence/00000000-0000-0000-0000-000000000000',
      category: 'Pelaksanaan Tugas',
    },
  ],
};

const buffer = await buildReportXlsx(report);
assert.equal(buffer.subarray(0, 2).toString(), 'PK');
assert.ok(buffer.length > 1_000);

// Builder PDF: dokumen harus menghasilkan header PDF yang valid
const pdf = createReportPdf(report);
const chunks: Buffer[] = [];
pdf.on('data', (chunk: Buffer) => chunks.push(chunk));
await new Promise<void>((resolve, reject) => {
  pdf.on('end', resolve);
  pdf.on('error', reject);
  pdf.end();
});
const pdfBuffer = Buffer.concat(chunks);
assert.equal(pdfBuffer.subarray(0, 5).toString(), '%PDF-');
assert.ok(pdfBuffer.length > 1_000);

console.log('report format: OK');
