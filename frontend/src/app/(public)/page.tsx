import {
  ArchiveIcon,
  CalendarDaysIcon,
  ClipboardListIcon,
  FileTextIcon,
  ImageIcon,
  LinkIcon,
  LockIcon,
  MailIcon,
  PaperclipIcon,
  ShieldCheckIcon,
  StickyNoteIcon,
  type LucideIcon,
} from 'lucide-react';
import type { Metadata } from 'next';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { env } from '@/config/env';
import { siteDescription, siteName, siteUrl } from '@/config/site';

export const metadata: Metadata = {
  title: { absolute: 'ARKANA — Arsip, Rekam Kinerja, dan Agenda' },
  description: siteDescription,
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    url: '/',
    siteName,
    title: 'ARKANA — Arsip, Rekam Kinerja, dan Agenda',
    description: siteDescription,
    images: [{ url: '/brand/og-image.png', width: 1200, height: 630, alt: 'ARKANA' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ARKANA — Arsip, Rekam Kinerja, dan Agenda',
    description: siteDescription,
    images: ['/brand/og-image.png'],
  },
};

const modules: { title: string; description: string; icon: LucideIcon }[] = [
  {
    title: 'Kegiatan',
    description:
      'Catat aktivitas harian lengkap dengan uraian, hasil, target, realisasi, dan satu kategori.',
    icon: ClipboardListIcon,
  },
  {
    title: 'Bukti Dukung',
    description:
      'Lampirkan hingga 10 file per kegiatan (maks. 5 MB per file) dan bagikan lewat tautan permanen untuk pemeriksa.',
    icon: PaperclipIcon,
  },
  {
    title: 'Arsip Pribadi',
    description:
      'Simpan SK, sertifikat, dan dokumen pribadi dalam folder hingga tiga level. Kuota 1 GB per akun.',
    icon: ArchiveIcon,
  },
  {
    title: 'Laporan Kinerja',
    description: 'Rekap harian, mingguan, bulanan, dan tahunan. Ekspor XLSX dan PDF siap pakai.',
    icon: FileTextIcon,
  },
  {
    title: 'Agenda',
    description: 'Kelola jadwal, tenggat waktu, lokasi, dan status kegiatan dalam satu kalender.',
    icon: CalendarDaysIcon,
  },
  {
    title: 'Catatan',
    description:
      'Tangkapan cepat tanpa judul. Sematkan catatan penting agar selalu tampil lebih dulu.',
    icon: StickyNoteIcon,
  },
];

const steps: { title: string; description: string }[] = [
  {
    title: 'Terima undangan',
    description:
      'Admin mengundang melalui email. Buka tautan aktivasi, tetapkan password, lalu masuk.',
  },
  {
    title: 'Catat dan unggah bukti',
    description:
      'Satu kegiatan, satu catatan: uraian, hasil, kategori, dan bukti pendukung — semua terpusat.',
  },
  {
    title: 'Ekspor laporan',
    description:
      'Rekap harian hingga tahunan mengikuti format e-Kinerja. Unduh sebagai XLSX atau PDF.',
  },
];

const guarantees: { title: string; description: string; icon: LucideIcon }[] = [
  {
    title: 'Privat secara default',
    description: 'Kegiatan, arsip, agenda, dan catatan hanya dapat diakses pemilik akun.',
    icon: LockIcon,
  },
  {
    title: 'Admin tanpa akses konten',
    description:
      'Admin hanya mengelola akun dan undangan. Konten pribadi tidak dapat dibuka atau diubah.',
    icon: ShieldCheckIcon,
  },
  {
    title: 'Tautan bukti dukung terkendali',
    description:
      'Tautan permanen hanya membuka satu kegiatan beserta bukti dukungnya, bukan seluruh arsip Anda.',
    icon: LinkIcon,
  },
];

const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${siteUrl}/#organization`,
      name: siteName,
      url: siteUrl,
      logo: `${siteUrl}/brand/icon-512.png`,
    },
    {
      '@type': 'WebSite',
      '@id': `${siteUrl}/#website`,
      url: siteUrl,
      name: siteName,
      inLanguage: 'id-ID',
      publisher: { '@id': `${siteUrl}/#organization` },
    },
    {
      '@type': 'WebApplication',
      name: siteName,
      url: siteUrl,
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      inLanguage: 'id-ID',
      description: siteDescription,
      publisher: { '@id': `${siteUrl}/#organization` },
    },
  ],
};

function HeroVisual() {
  return (
    <div aria-hidden="true" className="relative mx-auto w-full max-w-md">
      {/* Panel Detail Kegiatan */}
      <div className="bg-card overflow-hidden rounded-2xl border shadow-xl">
        <div className="flex items-center justify-between gap-3 border-b px-5 py-3">
          <span className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
            Detail Kegiatan
          </span>
          <Badge variant="secondary" className="text-[10px] font-normal">
            Koordinasi dan Rapat
          </Badge>
        </div>

        <div className="p-5">
          <p className="text-[15px] leading-snug font-semibold">
            Rapat koordinasi penyusunan laporan kinerja
          </p>
          <p className="text-muted-foreground mt-1 text-[11px]">Hari ini · 09.00 WITA</p>

          <div className="mt-4 space-y-3 text-xs">
            <div>
              <p className="text-muted-foreground text-[10px] font-semibold tracking-wide uppercase">
                Uraian
              </p>
              <p className="mt-0.5 leading-relaxed">
                Menyusun rekap kinerja bulan berjalan dan menyiapkan bahan rapat koordinasi lintas
                bidang.
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-[10px] font-semibold tracking-wide uppercase">
                Hasil
              </p>
              <p className="mt-0.5 leading-relaxed">
                Rekap tersusun; notulen dan foto kegiatan terlampir.
              </p>
            </div>
          </div>

          <div className="bg-muted/50 mt-4 space-y-1.5 rounded-xl p-3 text-xs">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
              <PaperclipIcon className="size-3.5" /> 2 file bukti dukung
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-background px-2.5 py-1.5">
              <FileTextIcon className="text-muted-foreground size-4 shrink-0" />
              <span className="min-w-0 flex-1 truncate">notulen-rapat.pdf</span>
              <span className="text-muted-foreground shrink-0 text-[10px]">1,2 MB</span>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-background px-2.5 py-1.5">
              <ImageIcon className="text-muted-foreground size-4 shrink-0" />
              <span className="min-w-0 flex-1 truncate">foto-kegiatan.jpg</span>
              <span className="text-muted-foreground shrink-0 text-[10px]">2,4 MB</span>
            </div>
          </div>

          <div className="border-primary/40 bg-primary/5 mt-4 flex items-center gap-2 rounded-lg border px-3 py-2">
            <LinkIcon className="text-primary size-4 shrink-0" />
            <span className="min-w-0 flex-1 truncate font-mono text-[11px]">
              arkana.mateng.my.id/p/evidence/9f3a…c21b
            </span>
            <span className="text-primary shrink-0 text-[10px] font-medium uppercase">Salin</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PublicHomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <section className="relative overflow-hidden border-b">
        <div
          aria-hidden="true"
          className="bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] pointer-events-none absolute inset-0 bg-size-[56px_56px] opacity-50 mask-[radial-gradient(ellipse_at_center,black,transparent_70%)]"
        />
        <div
          aria-hidden="true"
          className="bg-primary/5 pointer-events-none absolute -top-48 left-1/2 size-128 -translate-x-1/2 rounded-full blur-3xl"
        />

        <div className="relative mx-auto grid w-full max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-2">
          <div>
            <h1 className="font-heading max-w-xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
              Catat pekerjaan, rapikan bukti dukung, susun laporan kinerja.
            </h1>
            <p className="text-muted-foreground mt-5 max-w-lg text-lg text-pretty">
              ARKANA memusatkan pencatatan kegiatan, bukti dukung, arsip pribadi, laporan, agenda,
              dan catatan dalam satu tempat.
            </p>
          </div>
          <HeroVisual />
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
        <h2 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
          Cara kerjanya
        </h2>
        <div className="mt-8 grid gap-8 sm:grid-cols-3">
          {steps.map((step, index) => (
            <div key={step.title} className="border-t pt-5">
              <span className="text-muted-foreground text-xs font-semibold tracking-[0.2em]">
                0{index + 1}
              </span>
              <h3 className="font-heading mt-2 font-semibold">{step.title}</h3>
              <p className="text-muted-foreground mt-1 text-sm">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="modul" className="bg-muted/30 scroll-mt-20 border-y">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <h2 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
            Satu tempat untuk seluruh pekerjaan harian
          </h2>
          <p className="text-muted-foreground mt-3 max-w-2xl">
            Enam modul yang saling terhubung, dari pencatatan hingga pelaporan.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {modules.map((item) => (
              <div key={item.title} className="bg-card rounded-xl border p-5">
                <item.icon aria-hidden="true" className="text-primary size-5" />
                <h3 className="font-heading mt-3 font-semibold">{item.title}</h3>
                <p className="text-muted-foreground mt-1 text-sm">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <h2 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
          Data pribadi tetap milik Anda
        </h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          {guarantees.map((item) => (
            <div key={item.title}>
              <item.icon aria-hidden="true" className="text-primary size-5" />
              <h3 className="font-heading mt-3 font-semibold">{item.title}</h3>
              <p className="text-muted-foreground mt-1 text-sm">{item.description}</p>
            </div>
          ))}
        </div>
        <p className="text-muted-foreground mt-8 text-sm">
          ARKANA tidak pernah menampilkan data pribadi Anda secara publik.
        </p>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6">
        <div className="bg-primary/5 flex flex-col items-start gap-5 rounded-2xl border p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div className="flex items-start gap-4">
            <div className="bg-primary/10 text-primary flex size-11 shrink-0 items-center justify-center rounded-xl">
              <MailIcon className="size-5" />
            </div>
            <div>
              <h2 className="font-heading text-xl font-semibold tracking-tight">
                Butuh akun atau ada kendala?
              </h2>
              <p className="text-muted-foreground mt-1 max-w-md text-sm">
                Hubungi Admin melalui email dan sertakan nama serta keperluan Anda agar penanganan
                lebih cepat.
              </p>
            </div>
          </div>
          <Button asChild size="lg" className="shrink-0">
            <a href={`mailto:${env.NEXT_PUBLIC_CONTACT_EMAIL}`}>{env.NEXT_PUBLIC_CONTACT_EMAIL}</a>
          </Button>
        </div>
      </section>
    </>
  );
}
