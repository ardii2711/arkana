# ROADMAP.md

Roadmap implementasi aplikasi berdasarkan kebutuhan produk (`PROJECT.md`) dan arsitektur teknis (`ARCHITECTURE.md`).

## Prinsip Pelaksanaan

- Selesaikan seluruh pengembangan backend sebelum memulai pengembangan frontend.
- Kerjakan fase dan task secara berurutan sesuai dependensi.
- Selesaikan satu task sebelum beralih ke task berikutnya.
- Setiap task memiliki tujuan, ruang lingkup, dan kriteria penerimaan.
- Format task: `Objective`, `Scope`, `Acceptance Criteria`, dan `Dependencies`. Task yang sudah selesai sebelum normalisasi dipertahankan dalam bentuk ringkas dan tidak diubah.
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

- Tentukan struktur pengelompokan dokumen (folder), metadata, pencarian, dan filter.

**Kriteria penerimaan:** Struktur dan aturan arsip disetujui.

### P4.2 — Archive API

- Implementasikan model dan CRUD folder arsip beserta folder bawaan.
- Implementasikan CRUD dokumen, upload, preview, download, dan penghapusan.
- Terapkan batas kedalaman folder, kuota penyimpanan, validasi, dan kepemilikan data.

**Kriteria penerimaan:** API arsip berjalan dan dokumen tetap privat.

## Phase 5 — Backend Performance Report

**Tujuan:** Menyelesaikan API rekap dan laporan kinerja.

### P5.1 — Finalisasi Format Laporan

- Tetapkan periode rekap: harian, mingguan (Senin–Minggu), bulanan, tahunan, dan rentang khusus dengan batas WITA.
- Tetapkan kolom rekap mengikuti kebutuhan e-Kinerja: Rencana Aksi, Target, Realisasi, Bukti Dukung, Link, dan Kategori.
- Tetapkan field teks opsional `target` dan `realisasi` pada Work Log.
- Tetapkan aturan ringkasan nama bukti dukung dan tautan publik.
- Tetapkan format ekspor: XLSX dan PDF (A4 landscape).

**Kriteria penerimaan:** Spesifikasi laporan dan ekspor disetujui serta tercatat di `PROJECT.md`.

### P5.2 — Report API

- Tambahkan field `target` dan `realisasi` pada Work Log beserta validasi input.
- Implementasikan rekap harian, mingguan, bulanan, tahunan, dan rentang khusus.
- Implementasikan pengelompokan dan filter kategori.
- Implementasikan ekspor XLSX dan PDF sesuai kolom dan aturan yang disepakati.

**Kriteria penerimaan:** Hasil laporan sesuai data sumber, periode, dan format yang disetujui.

## Phase 6 — Backend Schedule & Reminder

**Tujuan:** Menyelesaikan API agenda. Pengingat dan notifikasi ditangguhkan ke pengembangan berikutnya.

### P6.1 — Finalisasi Kebutuhan

- Tetapkan atribut agenda: judul, deskripsi opsional, waktu mulai, waktu selesai opsional, penanda sepanjang hari, lokasi opsional, dan status (Belum Dimulai, Selesai, Dibatalkan).
- Tetapkan zona waktu WITA (Asia/Makassar).
- Pengulangan agenda dan notifikasi pengingat ditangguhkan.

**Kriteria penerimaan:** Kebutuhan agenda disetujui serta tercatat di `PROJECT.md`.

### P6.2 — Schedule API

- Implementasikan model dan CRUD agenda.
- Terapkan filter rentang tanggal, kategori, status, dan pencarian.
- Terapkan validasi serta kepemilikan data.

**Kriteria penerimaan:** API agenda berjalan sesuai kebutuhan dan hanya dapat diakses pemiliknya.

## Phase 7 — Backend Notes

**Tujuan:** Menyelesaikan API catatan pribadi.

### P7.1 — Finalisasi Struktur Notes

- Tetapkan catatan tanpa judul: satu isi teks bebas dan penanda pin.
- Tetapkan pencarian pada isi catatan dan urutan pin lalu pembaruan terbaru.
- Tetapkan bahwa tag, folder, checklist, dan lampiran tidak tersedia pada versi awal.

**Kriteria penerimaan:** Struktur Notes disetujui serta tercatat di `PROJECT.md`.

### P7.2 — Notes API

- Implementasikan model dan CRUD catatan (`content`, `pinned`).
- Terapkan pencarian, filter pin, validasi, dan kepemilikan data.

**Kriteria penerimaan:** User dapat mengelola catatan miliknya sendiri.

## Phase 8 — Backend Dashboard & API Finalization

**Tujuan:** Menyelesaikan kebutuhan data dashboard dan memastikan seluruh API siap diintegrasikan frontend.

### P8.1 — Finalisasi Dashboard

- Tetapkan kartu ringkasan User: kegiatan bulan berjalan, kegiatan 7 hari terakhir, jumlah file bukti dukung, dan pemakaian kuota arsip.
- Tetapkan agenda hari ini, maksimal 5 agenda terdekat, dan maksimal 5 catatan disematkan.
- Tetapkan grafik kegiatan per kategori bulan berjalan serta tren 7 hari dan 30 hari terakhir.
- Tetapkan aksi cepat: catat kegiatan, tambah agenda, dan tambah catatan.
- Tetapkan dashboard Admin: jumlah akun per status dan undangan yang belum diterima beserta aksi kirim ulang, tanpa data pribadi User.
- Tetapkan perhitungan periode memakai WITA dan pembatasan data pada kepemilikan pengguna.

**Kriteria penerimaan:** Kebutuhan dashboard User dan Admin disetujui serta tercatat di `PROJECT.md`.

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

### P8.4 — Backend Hardening Ringan

- Tambahkan rate limit pada `POST /api/auth/refresh` dan `POST /api/auth/logout`.
- Samakan bahasa pesan error global (`NOT_FOUND`, `VALIDATION_ERROR`) dengan pesan error lainnya.

**Kriteria penerimaan:** Endpoint refresh/logout memiliki batas percobaan dan pesan error global konsisten berbahasa Indonesia.

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

**Tujuan:** Menyediakan antarmuka pencatatan pekerjaan beserta bukti dukung dan tautan publiknya.

Task dipecah menjadi empat sub-task yang dikerjakan berurutan.

#### P11.1a — Data Layer & Daftar Kegiatan

- Implementasikan feature `work-logs`: tipe, schema Zod, API client, dan hook TanStack Query.
- Implementasikan halaman `/kegiatan`: daftar kegiatan dengan pagination, filter kategori dan rentang tanggal, serta pencarian.

**Kriteria penerimaan:** Daftar kegiatan menampilkan data sesuai API beserta filter dan pagination yang berfungsi.

**Dependensi:** P10.2.

#### P11.1b — Form dan Penghapusan Kegiatan

- Implementasikan form tambah dan ubah kegiatan (nama, uraian, hasil/output, kategori, target, realisasi).
- Implementasikan detail kegiatan dan konfirmasi penghapusan beserta feedback hasil operasi.

**Kriteria penerimaan:** Kegiatan dapat dibuat, diubah, dilihat, dan dihapus dengan validasi yang sesuai backend.

**Dependensi:** P11.1a.

#### P11.1c — Bukti Dukung Kegiatan

- Implementasikan upload multipart beserta batas format, 5 MB per file, 10 file, dan 50 MB per kegiatan.
- Implementasikan daftar file, preview inline, unduh, dan penghapusan bukti dukung.

**Kriteria penerimaan:** Bukti dukung dapat diunggah, dipratinjau, diunduh, dan dihapus sesuai batasan produk.

**Dependensi:** P11.1b.

#### P11.1d — Detail Kegiatan & Halaman Publik

- **Objective:** Menyediakan tautan publik permanen per kegiatan dan halaman publiknya untuk pemeriksa tanpa login.
- **Scope:** Tautan publik per kegiatan beserta aksi salin tautan; halaman `/p/evidence/[token]` tanpa sesi yang memuat nama kegiatan, tanggal, kategori, uraian, output, dan seluruh bukti dukung.
- **Acceptance Criteria:** Tautan publik menampilkan kegiatan dan bukti dukung terkait tanpa login serta mengikuti rute yang dipakai backend pada laporan.
- **Dependencies:** P11.1c.

### P11.2 — Personal Document Archive

- **Objective:** Menyediakan antarmuka pengelolaan arsip dokumen pribadi yang terhubung ke Archive API.
- **Scope:** Daftar, detail, folder, dan form arsip; preview, download, dan pengelolaan dokumen.
- **Acceptance Criteria:** Pengelolaan arsip berjalan sesuai API backend.
- **Dependencies:** P10.2, P4.2.

### P11.3 — Performance Report

- **Objective:** Menyediakan antarmuka penyusunan dan ekspor rekap kinerja.
- **Scope:** Pemilihan periode dan tampilan rekap; penyusunan dan ekspor laporan.
- **Acceptance Criteria:** Laporan dapat dilihat dan diekspor sesuai ketentuan.
- **Dependencies:** P11.1d (tautan publik kegiatan), P5.2.

### P11.4 — Schedule

- **Objective:** Menyediakan antarmuka pengelolaan agenda.
- **Scope:** Daftar agenda (hari ini dan mendatang), pencarian, filter status, dan form agenda. Kalender tidak dipakai; pengingat dan notifikasi tidak termasuk dalam task ini (ditangguhkan).
- **Acceptance Criteria:** Agenda dapat dikelola melalui antarmuka sesuai API backend.
- **Dependencies:** P6.2.

### P11.5 — Notes

- **Objective:** Menyediakan antarmuka pengelolaan catatan pribadi.
- **Scope:** Daftar, detail, dan form catatan.
- **Acceptance Criteria:** Notes dapat dikelola melalui antarmuka.
- **Dependencies:** P7.2.

### P11.6 — Dashboard

- **Objective:** Menyediakan antarmuka ringkasan aktivitas bagi User dan Admin.
- **Scope:** Ringkasan, statistik, dan informasi aktivitas; integrasi dengan Dashboard API.
- **Acceptance Criteria:** Dashboard menampilkan data sesuai backend.
- **Dependencies:** P8.2, P11.1d, P11.4, P11.5.

### P11.7 — User Management

- **Objective:** Menyediakan antarmuka pengelolaan akun bagi Admin.
- **Scope:** Undangan, perubahan informasi, dan penonaktifan akun.
- **Acceptance Criteria:** Admin dapat mengelola akun tanpa akses ke konten pribadi User.
- **Dependencies:** P2.2, P2.5, P8.2.

### P11.8a — Backend Profil Pengguna

- **Objective:** Menyediakan endpoint pembaruan profil milik sendiri beserta verifikasi email baru.
- **Scope:** `PATCH /profile` (data kepegawaian), `POST /profile/email` + verifikasi token, unggah/hapus avatar, perluasan `GET /auth/me`.
- **Acceptance Criteria:** User dapat mengubah profil dan emailnya dengan verifikasi, avatar dapat diunggah/dihapus, dan sesi aktif memuat data terbaru.
- **Dependencies:** P10.2.

### P11.8b — Frontend Profil Pengguna

- **Objective:** Menyediakan antarmuka pengelolaan profil pada `/profil`.
- **Scope:** Form kelengkapan profil, kelola avatar, perubahan email beserta halaman verifikasi, dan ganti password.
- **Acceptance Criteria:** User dapat mengubah profilnya sendiri dan perubahan terekam pada sesi yang aktif.
- **Dependencies:** P11.8a.

### P11.9a — Restrukturisasi Route Dashboard

- **Objective:** Memindahkan dashboard ke `/dashboard` dan membebaskan `/` untuk halaman publik tanpa mengubah perilaku modul lain.
- **Scope:** Pindahkan route dashboard, sesuaikan navigasi sidebar dan logo, redirect login email/password serta Google OAuth, dan tautan internal menuju dashboard.
- **Acceptance Criteria:** `/` tidak memerlukan sesi; `/dashboard` menampilkan dashboard dan mengalihkan ke `/login` tanpa sesi; login berakhir di `/dashboard`; build memuat route `/` dan `/dashboard`.
- **Dependencies:** P11.8b.

### P11.9b — Halaman Publik `/`

- **Objective:** Menyediakan halaman publik di `/` yang menjelaskan ARKANA dan mengarahkan pengunjung ke login.
- **Scope:** Header dan footer publik, hero, daftar modul, penjelasan privasi, CTA sesuai status sesi, serta metadata halaman. Tanpa data pengguna dan tanpa endpoint baru.
- **Acceptance Criteria:** Halaman dapat dibuka tanpa sesi tanpa memuat data privat, responsif, CTA menampilkan "Buka Dashboard" untuk sesi aktif dan "Masuk" untuk tamu, serta metadata terisi.
- **Dependencies:** P11.9a.

### P11.10a — Backend Admin Accounts

- **Objective:** Mendukung filter status, foto profil pada daftar akun, dan penghapusan akun User beserta file R2.
- **Scope:** Query `status` pada daftar akun; `hasAvatar`/`updatedAt` pada respons; endpoint avatar Admin; endpoint hapus akun dengan pembersihan objek R2 dan cascade database.
- **Acceptance Criteria:** Filter status dan pencarian dapat digabung; avatar akun User dapat ditampilkan tanpa mengekspos `avatarKey`; penghapusan akun User menghapus seluruh data dan file terkait, sedangkan akun Admin ditolak.
- **Dependencies:** P11.9b.

### P11.10b — Frontend Halaman Akun Admin

- **Objective:** Menyediakan aksi akun berbasis dropdown, pencarian realtime, filter status, avatar, dan konfirmasi hapus permanen.
- **Scope:** Sembunyikan menu Profil untuk Admin; pencarian realtime; filter status; dropdown kirim ulang/ubah/hapus; dialog konfirmasi ketik email; avatar akun pada daftar.
- **Acceptance Criteria:** Pencarian dan filter berjalan tanpa tombol submit; aksi hanya tersedia untuk akun User; penghapusan hanya dapat dijalankan setelah email diketik persis; foto profil tampil bila tersedia.
- **Dependencies:** P11.10a.

### P11.11 — UI Polish Halaman

- **Objective:** Menyempurnakan tampilan dan interaksi halaman aplikasi tanpa mengubah kebutuhan produk yang telah disepakati.
- **Scope:** Perbaikan per halaman secara berurutan: Kegiatan (daftar, detail, bukti dukung), Dashboard, Arsip, Laporan, Agenda, Catatan, Profil dan Akun, autentikasi dan halaman publik, serta halaman publik bukti dukung. Informasi yang dibutuhkan tampilan boleh ditambah melalui perubahan API kecil bila belum tersedia.
- **Acceptance Criteria:** Setiap halaman memakai pola informasi, filter, dan aksi yang konsisten; pemeriksaan statis lulus; perilaku diverifikasi pengguna.
- **Dependencies:** P11.10b.

**Status (23 November 2026):** Seluruh halaman dalam scope selesai dipoles. Halaman Agenda (`8b576ec`) dan Catatan (`bc710f6`) dikerjakan terakhir.

### P11.12a — Brand Assets & Penempatan Logo

- **Objective:** Menerapkan identitas merek ARKANA (logo, favicon, Open Graph, manifest) pada antarmuka.
- **Scope:** Aset logo SVG disalin ke `public/brand` (termasuk wordmark `ARKANA` + "Arsip, Rekam Kinerja, dan Agenda" versi terang/gelap, di-crop presisi dari lockup resmi pack); favicon (SVG light/dark + PNG), apple touch icon, ikon PWA, banner Open Graph, `app/manifest.ts`, metadata root (title template, `metadataBase`, icons, `openGraph`, `twitter`); lockup ikon + wordmark pada sidebar, header publik, header aplikasi, layout autentikasi (panel brand desktop `tone="dark"`), dan halaman publik bukti dukung; aset PNG digenerate oleh `scripts/generate-brand-assets.mjs`.
- **Acceptance Criteria:** Favicon dan logo tampil sesuai tema terang/gelap; sidebar dan halaman autentikasi memakai logo resmi; build memuat asset dan route `manifest.webmanifest`; pemeriksaan statis lulus.
- **Dependencies:** P11.10b.

### P11.12b — Palet Tema & Dark Mode

- **Objective:** Menyelaraskan tema antarmuka dengan palet merek ARKANA dan menyediakan mode gelap.
- **Scope:** Token `:root`/`.dark` `globals.css` memakai palet brand (navy `#0B2D52`, biru `#1E6BB8`, teal `#14BBA6`, background `#F8FAFC`/`#071E3A`, surface `#0B2D52`, `#E2E8F0`); `next-themes` dengan `defaultTheme="system"`; toggle langsung Terang/Gelap (tanpa opsi Sistem di UI) pada header aplikasi (kanan), header publik, dan layout autentikasi; `Toaster` mengikuti tema; sidebar/header: logo lockup (ikon + wordmark) selalu horizontal `items-center`, header aplikasi menampilkan ikon buka/tutup sidebar saat terbuka dan lockup saat tertutup; sidebar collapsed menampilkan logo ikon dengan hover `PanelLeftOpenIcon` + tooltip "Buka sidebar".
- **Acceptance Criteria:** Seluruh antarmuka mengikuti tema terang/gelap dengan konsisten dan mengikuti preferensi sistem; toggle tersedia pada lokasi yang disepakati; pemeriksaan statis lulus.
- **Dependencies:** P11.12a.

## Phase 12 — Final Integration & Production Release

**Tujuan:** Memastikan seluruh aplikasi siap digunakan.

### P12.1 — Functional & Integration Testing

- **Objective:** Memastikan seluruh alur aplikasi berjalan terintegrasi antara frontend, backend, database, email, dan R2.
- **Scope:** Uji seluruh alur utama frontend dan backend; integrasi database, email, dan R2; autentikasi, otorisasi, dan kepemilikan data; upload, preview, download, dan tautan publik; seluruh modul dan alur lintas fitur.
- **Acceptance Criteria:** Seluruh alur utama berjalan dan tidak ada kegagalan kritis.
- **Dependencies:** Seluruh task implementasi P1.1–P11.12b.

Pendekatan: pengujian otomatis backend dengan Vitest + `@vitest/coverage-v8` (tanpa `supertest`; HTTP in-process lewat `app.listen(0)` dan `fetch` native Node), lalu checklist UI manual. Task dikerjakan berurutan.

**Status (23 November 2026):** P12.1 ditutup atas keputusan pengguna. P12.1a–P12.1c selesai; P12.1d–P12.1h dilewati dan tidak ditandai `DONE`.

#### P12.1a — Test Infrastructure & Fixture

- **Objective:** Menyediakan kerangka pengujian otomatis backend beserta isolasi data uji dan helper bersama.
- **Scope:** `backend/vitest.config.ts` (environment node, setup, coverage v8 dengan laporan `text`/`html`/`lcov`), `backend/tests/setup.ts`, helper `server.ts` (listen port 0), `client.ts` (fetch + cookie jar + assert), `fixtures.ts` (Admin dari env, dua akun User uji untuk kepemilikan silang, pembersihan melalui `DELETE /users/:id`), guard env uji wajib, script `test`/`test:coverage`/`test:watch`, `coverage/` pada `.gitignore`.
- **Acceptance Criteria:** Suite kosong berjalan tanpa error; suite menolak jalan bila `DATABASE_URL` tidak menunjuk database uji; akun dan data uji terbuat serta terhapus otomatis.
- **Dependencies:** P11.12b.

#### P12.1b — Unit Test Domain Murni

- **Objective:** Menguji logika domain yang tidak membutuhkan database maupun R2.
- **Scope:** Unit test untuk `lib/wita.ts`, `lib/file-rules.ts`, `report.period.ts`, `report.rows.ts`, aturan kedalaman/siklus folder arsip, dan validasi rentang agenda.
- **Acceptance Criteria:** Seluruh unit test lulus tanpa koneksi eksternal.
- **Dependencies:** P12.1a.

#### P12.1c — Integration Test Auth, Profil, Akun, Otorisasi

- **Objective:** Memverifikasi autentikasi, pengelolaan akun, dan penegakan otorisasi terhadap server dan database nyata.
- **Scope:** Login, `/auth/me`, refresh + rotasi, logout, rate limit; aktivasi, reset password, dan verifikasi email baru (otomatis bila tersedia sink email uji, selain itu manual); `PATCH /profile`, NIP unik, avatar, perubahan email; daftar akun Admin dengan filter status/pencarian, avatar User, hapus User, penolakan hapus Admin; matriks negatif User→endpoint Admin `403`, Admin→endpoint data `403`, User A→resource User B `404`.
- **Acceptance Criteria:** Seluruh kasus pada matriks lulus dan tidak ada kebocoran data lintas pengguna.
- **Dependencies:** P12.1a.

#### P12.1d — Integration Test Work Log, Bukti Dukung, Tautan Publik

- **Objective:** Memverifikasi pencatatan kegiatan, pengelolaan file bukti dukung, dan halaman publik beserta batasannya.
- **Scope:** CRUD kegiatan, filter kategori/tanggal/pencarian, pagination, `target`/`realisasi`, aturan tanggal WITA; upload PNG/PDF, preview inline, unduh, hapus, penolakan tipe dan ukuran, konsistensi metadata; tautan publik tanpa sesi, file inline/attachment, token salah `404`, file kegiatan lain `404`.
- **Acceptance Criteria:** Alur kegiatan dan bukti dukung lulus termasuk seluruh kasus batas file dan otorisasi.
- **Dependencies:** P12.1c.

#### P12.1e — Integration Test Arsip, Laporan, Agenda, Notes, Dashboard

- **Objective:** Memverifikasi modul data pribadi lainnya dan konsistensi data dashboard.
- **Scope:** Folder arsip maksimal 3 level, nama duplikat `409`, hapus folder berisi, pencegahan siklus, dokumen CRUD, kuota, tampilan subtree; rekap laporan dan ekspor XLSX/PDF beserta header respons; agenda CRUD, rentang waktu, filter WITA; notes CRUD, pin, pencarian; ringkasan dashboard sesuai data uji.
- **Acceptance Criteria:** Seluruh modul lulus dan angka dashboard konsisten dengan data yang dibuat pengujian.
- **Dependencies:** P12.1d.

#### P12.1f — Coverage Baseline & Threshold

- **Objective:** Mengukur cakupan pengujian dan menetapkan ambang minimal yang wajar.
- **Scope:** Jalankan `test:coverage`, dokumentasikan baseline per direktori (`src/lib`, `src/modules`), tetapkan threshold pada `vitest.config.ts` beserta pengecualian bootstrap (`app.ts`, `server.ts`, `config/env.ts`).
- **Acceptance Criteria:** Baseline tercatat dan suite gagal bila cakupan turun di bawah threshold yang disetujui.
- **Dependencies:** P12.1b–P12.1e.

#### P12.1g — Checklist UI Manual

- **Objective:** Memverifikasi antarmuka end-to-end pada browser.
- **Scope:** Login dan Google OAuth, aktivasi, reset password, profil, kegiatan beserta unggah/preview/unduh/hapus, salin tautan publik, arsip, laporan beserta ekspor, agenda, catatan, dashboard, akun Admin, halaman publik `/` dan `/p/evidence/[token]`; desktop dan mobile, tema terang dan gelap.
- **Acceptance Criteria:** Seluruh butir checklist dijalankan pengguna dan hasilnya dicatat.
- **Dependencies:** P12.1c–P12.1e.

#### P12.1h — Bugfix & Dokumentasi Hasil Uji

- **Objective:** Menutup kegagalan yang ditemukan pengujian dan mencatat hasilnya.
- **Scope:** Perbaikan bug dengan commit terpisah per perbaikan; pencatatan hasil, coverage baseline, dan temuan sisa di `PROGRESS.md`.
- **Acceptance Criteria:** Tidak ada kegagalan kritis tersisa dan hasil pengujian terdokumentasi.
- **Dependencies:** P12.1a–P12.1g.

### P12.2 — Security & Performance Verification

- **Objective:** Memastikan keamanan akses data dan performa aplikasi memadai sebelum rilis.
- **Scope:** Pemeriksaan keamanan autentikasi dan akses data; validasi, penanganan error, dan kebocoran informasi; performa aplikasi dan penggunaan sumber daya.
- **Acceptance Criteria:** Tidak ditemukan masalah keamanan kritis dan performa memadai.
- **Dependencies:** P12.1.

### P12.3 — Production Deployment

- **Objective:** Menjalankan aplikasi di lingkungan produksi.
- **Scope:** Penyiapan environment produksi; konfigurasi domain, HTTPS, cookie, CORS, database, dan R2; deploy frontend dan backend; verifikasi fungsi di produksi.
- **Acceptance Criteria:** Aplikasi berjalan dan dapat digunakan di lingkungan produksi.
- **Dependencies:** P12.1, P12.2.

### P12.4 — Backup & Recovery

- **Objective:** Menyediakan prosedur backup dan pemulihan data yang terverifikasi.
- **Scope:** Finalisasi strategi backup database dan file; dokumentasi prosedur pemulihan; verifikasi proses recovery sesuai cakupan yang disetujui.
- **Acceptance Criteria:** Prosedur backup dan recovery tersedia dan terverifikasi.
- **Dependencies:** P12.3.

## Roadmap Governance

- Status task: `NOT_STARTED`, `IN_PROGRESS`, `BLOCKED`, `DONE`.
- Task hanya berstatus `DONE` setelah kriteria penerimaan terpenuhi dan workflow proyek dipenuhi.
- Perubahan roadmap harus mendapat persetujuan.
- Task tambahan dicatat menggunakan ID baru.
- `ROADMAP.md` menjadi acuan ruang lingkup dan urutan rencana.
- `PROGRESS.md` menjadi acuan kondisi aktual proyek.
