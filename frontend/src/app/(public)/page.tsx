import {
  ArchiveIcon,
  CalendarDaysIcon,
  ClipboardListIcon,
  FileTextIcon,
  LinkIcon,
  LockIcon,
  PaperclipIcon,
  ShieldCheckIcon,
  StickyNoteIcon,
  type LucideIcon,
} from 'lucide-react';
import type { Metadata } from 'next';

import { PublicSessionCta } from './public-session-cta';

export const metadata: Metadata = {
  title: 'ARKANA — Arsip, Rekam Kinerja, dan Agenda',
  description:
    'ARKANA membantu ASN mencatat pekerjaan, mengelola bukti dukung dan arsip pribadi, menyusun laporan kinerja, serta mengatur agenda dan catatan dalam satu tempat.',
};

const modules: { title: string; description: string; icon: LucideIcon }[] = [
  {
    title: 'Kegiatan',
    description:
      'Catat aktivitas harian lengkap dengan uraian, hasil, dan satu kategori tetap sesuai kebutuhan ASN.',
    icon: ClipboardListIcon,
  },
  {
    title: 'Bukti Dukung',
    description:
      'Lampirkan hingga 10 file per kegiatan dan bagikan melalui tautan permanen untuk pemeriksa.',
    icon: PaperclipIcon,
  },
  {
    title: 'Arsip Pribadi',
    description:
      'Simpan SK, sertifikat, dan dokumen pribadi dalam folder hingga tiga level dengan kuota 1 GB.',
    icon: ArchiveIcon,
  },
  {
    title: 'Laporan Kinerja',
    description:
      'Rekap harian, mingguan, bulanan, tahunan, atau rentang khusus dengan ekspor XLSX dan PDF.',
    icon: FileTextIcon,
  },
  {
    title: 'Agenda',
    description: 'Kelola jadwal, tenggat waktu, lokasi, dan status kegiatan dalam satu kalender.',
    icon: CalendarDaysIcon,
  },
  {
    title: 'Catatan',
    description: 'Simpan catatan cepat dan sematkan yang penting agar selalu tampil lebih dahulu.',
    icon: StickyNoteIcon,
  },
];

const guarantees: { title: string; description: string; icon: LucideIcon }[] = [
  {
    title: 'Privat secara default',
    description:
      'Kegiatan, arsip, agenda, dan catatan hanya dapat diakses oleh pemilik akun yang sedang login.',
    icon: LockIcon,
  },
  {
    title: 'Admin tanpa akses konten',
    description:
      'Admin hanya mengelola akun dan undangan. Konten pribadi pengguna tidak dapat dibaca atau diubah.',
    icon: ShieldCheckIcon,
  },
  {
    title: 'Tautan bukti dukung terkendali',
    description:
      'Tautan publik hanya membuka satu kegiatan beserta bukti dukungnya, bukan seluruh penyimpanan.',
    icon: LinkIcon,
  },
];

export default function PublicHomePage() {
  return (
    <>
      <section className="relative overflow-hidden border-b">
        <div
          aria-hidden="true"
          className="[background-image:linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] pointer-events-none absolute inset-0 [background-size:56px_56px] opacity-50 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]"
        />
        <div
          aria-hidden="true"
          className="bg-primary/5 pointer-events-none absolute -top-48 left-1/2 size-[32rem] -translate-x-1/2 rounded-full blur-3xl"
        />

        <div className="relative mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <p className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
            Untuk ASN
          </p>
          <h1 className="font-heading mt-4 max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            Catat pekerjaan, rapikan bukti dukung, susun laporan kinerja.
          </h1>
          <p className="text-muted-foreground mt-5 max-w-2xl text-lg text-pretty">
            ARKANA — Arsip, Rekam Kinerja, dan Agenda — memusatkan pencatatan kegiatan, bukti
            dukung, arsip pribadi, laporan, jadwal, dan catatan dalam satu tempat.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <PublicSessionCta size="lg" />
            <span className="text-muted-foreground text-sm">
              Akun dibuat oleh Admin melalui undangan email.
            </span>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
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
      </section>

      <section className="bg-muted/30 border-y">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
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
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-16 text-center sm:px-6">
        <h2 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
          Siap merapikan rekam kinerja Anda?
        </h2>
        <p className="text-muted-foreground mx-auto mt-3 max-w-xl">
          Masuk dengan akun yang sudah diundang Admin, atau hubungi Admin untuk mendapatkan
          undangan.
        </p>
        <div className="mt-6 flex justify-center">
          <PublicSessionCta size="lg" />
        </div>
      </section>
    </>
  );
}
