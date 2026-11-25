import { env } from '@/config/env';

const fallbackSiteUrl = 'http://localhost:3000';

export const siteUrl = (env.NEXT_PUBLIC_SITE_URL ?? fallbackSiteUrl).replace(/\/$/, '');
export const siteName = 'ARKANA';
export const siteDescription =
  'ARKANA membantu ASN mencatat pekerjaan, mengelola bukti dukung dan arsip pribadi, menyusun laporan kinerja, serta mengatur agenda dan catatan dalam satu tempat.';
