import { WorkCategory } from '../../generated/prisma/enums.js';
import { stripExtension } from '../../lib/file-name.js';

export const CATEGORY_LABELS = {
  [WorkCategory.PELAKSANAAN_TUGAS]: 'Pelaksanaan Tugas',
  [WorkCategory.PENGEMBANGAN_PERBAIKAN]: 'Pengembangan dan Perbaikan',
  [WorkCategory.KOORDINASI_RAPAT]: 'Koordinasi dan Rapat',
  [WorkCategory.PELAYANAN_PENDAMPINGAN]: 'Pelayanan dan Pendampingan',
  [WorkCategory.ADMINISTRASI_PELAPORAN]: 'Administrasi dan Pelaporan',
  [WorkCategory.PENGEMBANGAN_KOMPETENSI]: 'Pengembangan Kompetensi',
  [WorkCategory.PERJALANAN_DINAS]: 'Perjalanan Dinas dan Kegiatan Lapangan',
} as const satisfies Record<WorkCategory, string>;

const EVIDENCE_MAX_LENGTH = 255;

export interface ReportRow {
  no: number;
  date: string;
  actionPlan: string;
  target: string | null;
  realisasi: string | null;
  evidence: string;
  link: string;
  category: string;
}

export interface ReportData {
  title: string;
  userName: string;
  periodLabel: string;
  from: string;
  to: string;
  generatedAt: string;
  rows: ReportRow[];
}

/** Ringkasan nama bukti dukung agar muat satu sel laporan e-Kinerja (maks 255 karakter). */
export function summarizeEvidence(fileNames: string[]): string {
  if (fileNames.length === 0) {
    return '-';
  }

  const names = fileNames.map(stripExtension);
  const full = names.join('; ');

  if (full.length <= EVIDENCE_MAX_LENGTH) {
    return full;
  }

  const kept: string[] = [];
  let length = 0;

  for (let index = 0; index < names.length; index += 1) {
    const name = names[index]!;
    const suffix = `; +${names.length - index} file lainnya`;
    const candidate = kept.length === 0 ? name.length : length + 2 + name.length;

    if (candidate + suffix.length > EVIDENCE_MAX_LENGTH) {
      break;
    }

    kept.push(name);
    length = candidate;
  }

  const remaining = names.length - kept.length;

  if (kept.length === 0) {
    const suffix = `…+${remaining} file lainnya`;
    return `${names[0]!.slice(0, EVIDENCE_MAX_LENGTH - suffix.length)}${suffix}`;
  }

  return `${kept.join('; ')}; +${remaining} file lainnya`;
}
