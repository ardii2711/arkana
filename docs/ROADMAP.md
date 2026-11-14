# ROADMAP.md

Roadmap implementasi aplikasi berdasarkan kebutuhan produk (`PROJECT.md`) dan arsitektur teknis (`ARCHITECTURE.md`).

## Prinsip Pelaksanaan

- Selesaikan seluruh pengembangan backend sebelum memulai pengembangan frontend.
- Kerjakan fase dan task secara berurutan sesuai dependensi.
- Selesaikan satu task sebelum beralih ke task berikutnya.
- Setiap task memiliki tujuan, ruang lingkup, dan kriteria penerimaan.
- Keputusan yang belum ditentukan harus disepakati sebelum implementasi terkait.
- Perubahan kebutuhan atau arsitektur harus mendapat persetujuan.
- Catat perkembangan aktual di `PROGRESS.md`.

## Phase 1 — Backend Foundation

**Tujuan:** Menyiapkan fondasi backend dan database.

### P1.1 — Inisialisasi Monorepo dan Backend

- Siapkan struktur repository.
- Inisialisasi Express.js dan TypeScript.
- Siapkan konfigurasi environment, middleware dasar, error handling, dan health check.
- Siapkan linting, formatting, dan TypeScript.

**Kriteria penerimaan:** Backend dapat dijalankan dan struktur sesuai arsitektur.

### P1.2 — Database Foundation

- Konfigurasikan Prisma dan koneksi Supabase PostgreSQL.
- Rancang model database awal sesuai kebutuhan.
- Siapkan Prisma Migrate dan mekanisme seed.
- Siapkan akun Admin awal sesuai aturan produk.

**Kriteria penerimaan:** Prisma terhubung ke database dan struktur awal siap digunakan.

### P1.3 — Infrastruktur Backend

- Siapkan konfigurasi Cloudflare R2.
- Siapkan konfigurasi email yang diperlukan.
- Siapkan logging dan konfigurasi keamanan dasar.
- Siapkan pola response API dan validasi request.

**Kriteria penerimaan:** Infrastruktur dasar backend siap digunakan modul aplikasi.

## Phase 2 — Backend Authentication & User Management

**Tujuan:** Menyelesaikan autentikasi, pengelolaan akun, dan otorisasi.

### P2.1 — Authentication

- Implementasikan login email/password.
- Implementasikan hashing Argon2id.
- Implementasikan access JWT dan refresh token.
- Implementasikan rotasi token, session, logout, dan cookie keamanan.

**Kriteria penerimaan:** Alur autentikasi dan pengelolaan sesi berjalan sesuai arsitektur.

### P2.2 — Account Management

- Implementasikan undangan akun oleh Admin.
- Implementasikan aktivasi akun melalui email.
- Implementasikan pengubahan informasi dan penonaktifan akun.
- Pastikan penonaktifan akun tidak menghapus data pengguna.

**Kriteria penerimaan:** Admin dapat mengelola akun tanpa mengakses konten pribadi User.

### P2.3 — Google OAuth & Password Recovery

- Implementasikan Google OAuth 2.0 / OpenID Connect.
- Batasi login Google pada email yang telah terdaftar dan diaktifkan.
- Implementasikan pemulihan password dengan token sekali pakai.

**Kriteria penerimaan:** Login Google dan pemulihan password mengikuti aturan akun.

### P2.4 — Authorization

- Implementasikan role-based dan ownership-based authorization.
- Terapkan perlindungan endpoint.
- Terapkan validasi akses untuk seluruh operasi data.

**Kriteria penerimaan:** User hanya mengakses data miliknya dan Admin hanya mengelola akun.

### P2.5 — Self-Service Password & Account Notifications

- Implementasikan perubahan password oleh User yang sudah login (wajib password lama, cabut sesi lain).
- Implementasikan pengiriman ulang undangan akun untuk token yang kedaluwarsa.
- Implementasikan email notifikasi status akun: aktivasi berhasil, email diubah, dan akun dinonaktifkan.

**Kriteria penerimaan:** User dapat mengganti password sendiri, undangan dapat dikirim ulang, dan perubahan status akun penting diberitahukan melalui email.

## Phase 3 — Backend Work Log & Evidence

**Tujuan:** Menyelesaikan API pencatatan pekerjaan dan bukti dukung.

### P3.1 — Work Log

- Rancang model kegiatan dan kategori.
- Implementasikan CRUD kegiatan.
- Terapkan tujuh kategori tetap (enum) sesuai kebutuhan produk.
- Terapkan aturan tanggal, kategori, kepemilikan, serta pagination, filter, dan pencarian daftar kegiatan.

**Kriteria penerimaan:** Seluruh operasi kegiatan berjalan sesuai kebutuhan produk.

### P3.2 — Evidence File Management

- Implementasikan upload melalui backend ke R2.
- Implementasikan metadata, preview, download, penggantian, dan penghapusan file.
- Terapkan batas ukuran, jumlah, total kapasitas, dan format file.
- Pastikan kompatibilitas HEIC/HEIF.
- Jaga konsistensi database dan R2.

**Kriteria penerimaan:** File dapat dikelola secara aman sesuai batasan produk.

### P3.3 — Public Evidence Sharing

- Implementasikan token publik permanen per kegiatan.
- Implementasikan endpoint dan halaman data publik untuk pemeriksa.
- Pastikan tautan tidak memerlukan login dan tidak dapat dinonaktifkan pengguna.
- Pastikan perubahan bukti dukung memperbarui konten tautan yang sama.

**Kriteria penerimaan:** Tautan publik hanya menampilkan kegiatan dan bukti dukung terkait.

## Phase 4 — Backend Personal Document Archive

**Tujuan:** Menyelesaikan pengelolaan arsip dokumen pribadi.

### P4.1 — Finalisasi Kebutuhan Arsip

- Tentukan kategori dan pengelompokan dokumen.
- Tentukan metadata, pencarian, dan filter.

**Kriteria penerimaan:** Struktur dan aturan arsip disetujui.

### P4.2 — Archive API

- Implementasikan model dan CRUD arsip.
- Implementasikan upload, preview, download, dan penghapusan.
- Terapkan validasi dan kepemilikan data.

**Kriteria penerimaan:** API arsip berjalan dan dokumen tetap privat.

## Phase 5 — Backend Performance Report

**Tujuan:** Menyelesaikan API rekap dan laporan kinerja.

### P5.1 — Finalisasi Format Laporan

- Tentukan struktur, isi, periode, dan format ekspor.

**Kriteria penerimaan:** Format dan aturan laporan disetujui.

### P5.2 — Report API

- Implementasikan rekap harian, mingguan, bulanan, tahunan, dan rentang khusus.
- Implementasikan pengelompokan berdasarkan kategori.
- Implementasikan penyusunan Rencana Aksi, target, dan realisasi berdasarkan data pekerjaan.
- Implementasikan ekspor sesuai format yang disepakati.

**Kriteria penerimaan:** Hasil laporan sesuai data sumber, periode, dan format yang disetujui.

## Phase 6 — Backend Schedule & Reminder

**Tujuan:** Menyelesaikan API agenda dan pengingat.

### P6.1 — Finalisasi Kebutuhan

- Tentukan jenis agenda, pengulangan, waktu, dan mekanisme notifikasi.

**Kriteria penerimaan:** Kebutuhan agenda dan notifikasi disetujui.

### P6.2 — Schedule API

- Implementasikan model dan CRUD agenda.
- Implementasikan pengelolaan pengingat.
- Implementasikan mekanisme notifikasi sesuai keputusan.

**Kriteria penerimaan:** API agenda dan pengingat berjalan sesuai kebutuhan.

## Phase 7 — Backend Notes

**Tujuan:** Menyelesaikan API catatan pribadi.

### P7.1 — Finalisasi Struktur Notes

- Tentukan atribut, kategori, dan pengelompokan jika diperlukan.

**Kriteria penerimaan:** Struktur Notes disetujui.

### P7.2 — Notes API

- Implementasikan model dan CRUD catatan.
- Terapkan validasi dan kepemilikan data.

**Kriteria penerimaan:** User dapat mengelola catatan miliknya sendiri.

## Phase 8 — Backend Dashboard & API Finalization

**Tujuan:** Menyelesaikan kebutuhan data dashboard dan memastikan seluruh API siap diintegrasikan frontend.

### P8.1 — Finalisasi Dashboard

- Tentukan ringkasan, statistik, dan informasi yang ditampilkan.

**Kriteria penerimaan:** Kebutuhan dashboard disetujui.

### P8.2 — Dashboard API

- Implementasikan endpoint ringkasan dan statistik.
- Integrasikan data dari modul yang telah selesai.

**Kriteria penerimaan:** Data dashboard sesuai data aktual dan kepemilikan pengguna.

### P8.3 — Backend Verification

- Periksa konsistensi seluruh endpoint dan format response.
- Periksa autentikasi, otorisasi, validasi, dan error handling.
- Periksa integrasi database, email, dan R2.
- Dokumentasikan API yang siap digunakan frontend.

**Kriteria penerimaan:** Seluruh API backend siap diintegrasikan dan tidak memiliki masalah kritis yang diketahui.

## Phase 9 — Frontend Foundation

**Tujuan:** Menyiapkan aplikasi frontend setelah backend selesai.

### P9.1 — Inisialisasi Frontend

- Inisialisasi Next.js, React, dan TypeScript.
- Konfigurasikan Tailwind CSS dan shadcn/ui.
- Siapkan struktur App Router dan feature-based architecture.
- Siapkan linting, formatting, dan TypeScript.

**Kriteria penerimaan:** Frontend dapat dijalankan dengan struktur sesuai arsitektur.

### P9.2 — Frontend Infrastructure

- Konfigurasikan Axios dan integrasi TanStack Query.
- Siapkan Zustand dan pengelolaan state.
- Siapkan React Hook Form dan Zod.
- Siapkan konfigurasi autentikasi dan komunikasi API.

**Kriteria penerimaan:** Infrastruktur frontend siap mengonsumsi API backend.

## Phase 10 — Frontend Authentication & Layout

**Tujuan:** Membangun antarmuka autentikasi dan kerangka aplikasi.

### P10.1 — Authentication Interface

- Implementasikan login email/password.
- Implementasikan Google login.
- Implementasikan aktivasi akun dan reset password.
- Implementasikan pengelolaan sesi di frontend.

**Kriteria penerimaan:** Alur autentikasi terintegrasi dengan backend.

### P10.2 — Application Layout

- Implementasikan layout utama, navigasi, dan struktur halaman.
- Implementasikan pembatasan tampilan berdasarkan role.
- Implementasikan komponen bersama dan feedback interaksi.

**Kriteria penerimaan:** Struktur aplikasi siap digunakan seluruh modul.

## Phase 11 — Frontend Core Modules

**Tujuan:** Membangun antarmuka fitur utama dan mengintegrasikannya dengan backend.

### P11.1 — Work Log & Evidence

- Implementasikan daftar, detail, form, pencarian, dan filter kegiatan.
- Implementasikan upload dan pengelolaan bukti dukung.
- Implementasikan tampilan tautan publik.

**Kriteria penerimaan:** Seluruh alur pencatatan pekerjaan dan bukti dukung berjalan.

### P11.2 — Personal Document Archive

- Implementasikan daftar, detail, kategori, dan form arsip.
- Implementasikan preview, download, dan pengelolaan dokumen.

**Kriteria penerimaan:** Pengelolaan arsip berjalan sesuai API backend.

### P11.3 — Performance Report

- Implementasikan pemilihan periode dan tampilan rekap.
- Implementasikan penyusunan dan ekspor laporan.

**Kriteria penerimaan:** Laporan dapat dilihat dan diekspor sesuai ketentuan.

### P11.4 — Schedule & Reminder

- Implementasikan kalender, daftar agenda, dan form.
- Implementasikan tampilan serta feedback pengingat.

**Kriteria penerimaan:** Agenda dan pengingat dapat dikelola melalui antarmuka.

### P11.5 — Notes

- Implementasikan daftar, detail, dan form catatan.

**Kriteria penerimaan:** Notes dapat dikelola melalui antarmuka.

### P11.6 — Dashboard

- Implementasikan ringkasan, statistik, dan informasi aktivitas.
- Integrasikan dengan Dashboard API.

**Kriteria penerimaan:** Dashboard menampilkan data sesuai backend.

### P11.7 — User Management

- Implementasikan antarmuka pengelolaan akun untuk Admin.
- Implementasikan undangan, perubahan informasi, dan penonaktifan akun.

**Kriteria penerimaan:** Admin dapat mengelola akun tanpa akses ke konten pribadi User.

## Phase 12 — Final Integration & Production Release

**Tujuan:** Memastikan seluruh aplikasi siap digunakan.

### P12.1 — Functional & Integration Testing

- Uji seluruh alur utama frontend dan backend.
- Uji integrasi database, email, dan R2.
- Uji autentikasi, otorisasi, dan kepemilikan data.
- Uji upload, preview, download, dan tautan publik.
- Uji seluruh modul dan alur lintas fitur.

**Kriteria penerimaan:** Seluruh alur utama berjalan dan tidak ada kegagalan kritis.

### P12.2 — Security & Performance Verification

- Periksa keamanan autentikasi dan akses data.
- Periksa validasi, penanganan error, dan kebocoran informasi.
- Periksa performa aplikasi dan penggunaan sumber daya.

**Kriteria penerimaan:** Tidak ditemukan masalah keamanan kritis dan performa memadai.

### P12.3 — Production Deployment

- Siapkan environment produksi.
- Konfigurasikan domain, HTTPS, cookie, CORS, database, dan R2.
- Deploy frontend dan backend.
- Verifikasi fungsi aplikasi di produksi.

**Kriteria penerimaan:** Aplikasi berjalan dan dapat digunakan di lingkungan produksi.

### P12.4 — Backup & Recovery

- Finalisasi strategi backup database dan file.
- Dokumentasikan prosedur pemulihan.
- Verifikasi proses recovery sesuai cakupan yang disetujui.

**Kriteria penerimaan:** Prosedur backup dan recovery tersedia dan terverifikasi.

## Roadmap Governance

- Status task: `NOT_STARTED`, `IN_PROGRESS`, `BLOCKED`, `DONE`.
- Task hanya berstatus `DONE` setelah kriteria penerimaan terpenuhi dan workflow proyek dipenuhi.
- Perubahan roadmap harus mendapat persetujuan.
- Task tambahan dicatat menggunakan ID baru.
- `ROADMAP.md` menjadi acuan ruang lingkup dan urutan rencana.
- `PROGRESS.md` menjadi acuan kondisi aktual proyek.
