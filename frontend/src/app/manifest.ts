import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'ARKANA — Arsip, Rekam Kinerja, dan Agenda',
    short_name: 'ARKANA',
    description:
      'ARKANA membantu ASN mencatat pekerjaan, mengelola bukti dukung dan arsip pribadi, menyusun laporan kinerja, serta mengatur agenda dan catatan dalam satu tempat.',
    lang: 'id',
    start_url: '/',
    display: 'standalone',
    theme_color: '#0F172A',
    background_color: '#FFFFFF',
    icons: [
      { src: '/brand/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/brand/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  };
}
