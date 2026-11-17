export const WORK_CATEGORIES = [
  'PELAKSANAAN_TUGAS',
  'PENGEMBANGAN_PERBAIKAN',
  'KOORDINASI_RAPAT',
  'PELAYANAN_PENDAMPINGAN',
  'ADMINISTRASI_PELAPORAN',
  'PENGEMBANGAN_KOMPETENSI',
  'PERJALANAN_DINAS',
] as const;

export type WorkCategory = (typeof WORK_CATEGORIES)[number];

export const WORK_CATEGORY_LABELS: Record<WorkCategory, string> = {
  PELAKSANAAN_TUGAS: 'Pelaksanaan Tugas',
  PENGEMBANGAN_PERBAIKAN: 'Pengembangan dan Perbaikan',
  KOORDINASI_RAPAT: 'Koordinasi dan Rapat',
  PELAYANAN_PENDAMPINGAN: 'Pelayanan dan Pendampingan',
  ADMINISTRASI_PELAPORAN: 'Administrasi dan Pelaporan',
  PENGEMBANGAN_KOMPETENSI: 'Pengembangan Kompetensi',
  PERJALANAN_DINAS: 'Perjalanan Dinas dan Kegiatan Lapangan',
};
