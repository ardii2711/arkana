# PROGRESS.md

Checkpoint singkat kondisi proyek untuk melanjutkan pekerjaan lintas sesi.

## Status

- **Tahap:** Implementasi Frontend
- **Fase aktif:** Phase 11 — Frontend Core Modules
- **Task aktif:** tidak ada — Phase 11 selesai
- **Task berikutnya:** klarifikasi pengguna — `PROGRESS.md` sebelumnya menyebut P11.9, tetapi `ROADMAP.md` tidak memiliki P11.9; fase berikutnya adalah Phase 12 (P12.1)
- **Update terakhir:** 16 November 2026

## Kesiapan Proyek

- [x] `PROJECT.md`
- [x] `ARCHITECTURE.md`
- [x] `ROADMAP.md`
- [x] `AGENTS.md`

## Task Selesai

- **P1.1 — Inisialisasi Monorepo dan Backend:** `DONE` (commit `91c1198`).
- **P1.2 — Database Foundation:** `DONE` (commit `b2db9d2`).
- **P1.3 — Infrastruktur Backend:** `DONE` (commit `875ff5c`).
- **P2.1 — Authentication:** `DONE` (commit `080bf9a`).
- **P2.2 — Account Management:** `DONE` (commit `a2d815b`).
- **P2.3 — Google OAuth & Password Recovery:** `DONE` (commit `f7c1ce1`).
- **P2.4 — Authorization:** `DONE` (commit `58e3854`).
- **P2.5 — Self-Service Password & Account Notifications:** `DONE` (commit `8dd04c7`).
- **P3.1 — Work Log:** `DONE` (commit `5ebc9e3`).
- **P3.2 — Evidence File Management:** `DONE` (commit `bf0cf66`).
- **P3.3 — Public Evidence Sharing:** `DONE` (commit `41d6ab3`).
- **P4.1 — Finalisasi Kebutuhan Arsip:** `DONE` (commit `5f3e9e2`).
- **P4.2 — Archive API:** `DONE` (commit `5f3e9e2`).
- **P5.1 — Finalisasi Format Laporan:** `DONE` (commit `93b198c`).
- **P5.2 — Report API:** `DONE` (commit `a1dcf6a`, migration `20261115042939_add_work_log_target_realisasi`).
- **P6.1 — Finalisasi Kebutuhan Agenda:** `DONE` (commit `a119635`).
- **P6.2 — Schedule API:** `DONE` (commit `1800e56`, migration `20261115054013_add_schedule`).
- **P7.1 — Finalisasi Struktur Notes:** `DONE` (commit `752e8a2`).
- **P7.2 — Notes API:** `DONE` (commit `38e4d1e`, migration `20261115054854_add_note`).
- **P8.1 — Finalisasi Dashboard:** `DONE` (commit `9cab800`).
- **P8.2 — Dashboard API:** `DONE` (commit `c645a50`).
- **P8.3 — Backend Verification:** `DONE` (commit `77c454f`).
- **P8.4 — Backend Hardening Ringan:** `DONE` (commit `0e671f8`).
- **P9.1 — Inisialisasi Frontend:** `DONE` (commit `d3ccab2`).
- **P9.2 — Frontend Infrastructure:** `DONE` (commit `c971a38`).
- **P10.1 — Authentication Interface:** `DONE` (commit `9408b58`).
- **P10.2 — Application Layout:** `DONE` (commit `fa44cec`, penyempurnaan `bb44c0b`).
- **P11.1a — Data Layer & Daftar Kegiatan:** `DONE` (commit `5d12d87`).
- **P11.1b — Form dan Penghapusan Kegiatan:** `DONE` (commit `470af90`).
- **P11.1c — Bukti Dukung Kegiatan:** `DONE` (commit `3fb3917`).
- **P11.1d — Detail Kegiatan & Halaman Publik:** `DONE` (commit `28dc27a`).
- **P11.2 — Personal Document Archive:** `DONE` (commit `62ba5c9`).
- **P11.3 — Performance Report:** `DONE` (commit `e5ce01c`).
- **P11.4 — Schedule:** `DONE` (commit `02ad063`).
- **P11.5 — Notes:** `DONE` (commit `f9add48`).
- **P11.6 — Dashboard:** `DONE` (commit `7405453`).
- **P11.7 — User Management:** `DONE` (commit `fc24f0a`).
- **P11.8a — Backend Profil Pengguna:** `DONE` (commit `0e5ef6e`, migration `20261116064315_add_profile_fields`).
- **P11.8b — Frontend Profil Pengguna:** `DONE` (commit `e4b13f0`).

## Hasil Berjalan

### P2.2 — Account Management (DONE)

- Schema: enum `AccountTokenType` (`INVITATION`, `PASSWORD_RESET`), model `AccountToken` (hash token, TTL, `usedAt`, cascade delete).
- `src/lib/tokens.ts`: token acak 32 byte + hash SHA-256; `src/middlewares/require-role.ts`: `requireRole('ADMIN')`.
- Endpoint Admin: `POST /api/users/invite`, `GET /api/users`, `PATCH /api/users/:id`; aktivasi publik `GET /api/auth/activation/:token`, `POST /api/auth/activate`.
- Penonaktifan: `INACTIVE` + hapus refresh token, data tetap. Akun `ADMIN` tidak dapat diubah lewat endpoint ini.

### P2.3 — Google OAuth & Password Recovery (DONE)

- Dependency baru: `google-auth-library` 11.3.4.
- Google: Authorization Code + PKCE (S256) + cookie `state`/verifier 10 menit (path `/api/auth/google`).
  - `GET /api/auth/google` → redirect ke Google.
  - `GET /api/auth/google/callback` → verifikasi `state`, tukar code, verifikasi ID token, set cookie sesi, redirect `${CORS_ORIGIN}/`.
  - Gagal → redirect `${CORS_ORIGIN}/login?error=<kode>` (`oauth_cancelled`, `oauth_invalid_state`, `account_not_registered`, `account_inactive`, `google_account_mismatch`, `oauth_failed`).
  - Email Google harus terdaftar dan `ACTIVE`; `googleId` di-link otomatis saat login pertama.
- Reset password: `POST /api/auth/password/forgot` (respons selalu `{ sent: true }`, rate limit 5/15 menit) dan `POST /api/auth/password/reset` (token `PASSWORD_RESET`, TTL 60 menit, sekali pakai, cabut semua refresh token).
- Tautan email reset: `${CORS_ORIGIN}/reset-password?token=...`.
- Env opsional `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`; bila kosong endpoint Google membalas 503 `GOOGLE_NOT_CONFIGURED`.
- `POST /api/auth/login` dan `POST /api/auth/refresh` memakai helper sesi bersama `createSession()`.
- Pemeriksaan statis (`typecheck`, `lint`, `format:check`, `build`): lulus.

### P2.4 — Authorization (DONE)

- Audit seluruh rute yang ada:
  - Publik: `GET /api/health`; `POST /api/auth/login`, `/refresh`, `/logout`, `/activate`, `/password/forgot`, `/password/reset`; `GET /api/auth/activation/:token`, `/google`, `/google/callback`.
  - Login: `GET /api/auth/me`.
  - Admin: `GET /api/users`, `POST /api/users/invite`, `PATCH /api/users/:id` (via `requireRole('ADMIN')`).
- Tidak ada endpoint data milik User pada tahap ini, sehingga pola ownership ditetapkan sebagai konvensi, bukan helper baru: lihat `ARCHITECTURE.md` §7.4.
- Otorisasi tidak memakai klaim role dari JWT; `requireAuth` memuat ulang user dari database dan menolak akun non-`ACTIVE`.
- Tidak ada perubahan kode; hanya `ARCHITECTURE.md` §7.4.

### P2.5 — Self-Service Password & Account Notifications (DONE)

- `POST /api/auth/password/change` (login, rate limit 5/15 menit): wajib `currentPassword`, `newPassword` minimal 8 karakter; Argon2id; mencabut seluruh refresh token kecuali sesi saat ini. Akun tanpa password (Google-only) ditolak `PASSWORD_NOT_SET` dan diarahkan ke reset password.
- `POST /api/users/:id/resend-invitation` (Admin): hanya untuk akun `INVITED`; token undangan lama yang belum terpakai dihapus, token baru berlaku 7 hari; kegagalan email membatalkan token baru dan membalas 502.
- `src/lib/account-mail.ts`: template undangan, aktivasi, perubahan email (dikirim ke email lama dan baru), dan penonaktifan akun.
- Email notifikasi aktivasi dan penonaktifan dikirim hanya saat status berubah; perubahan email hanya saat alamat benar-benar berubah. Semua notifikasi non-kritis bersifat fail-soft (kegagalan dicatat di log, operasi tetap berhasil).
- Tidak ada perubahan schema/migration.
- Pemeriksaan statis (`typecheck`, `lint`, `format:check`, `build`): lulus.

### P3.1 — Work Log (DONE)

- Schema: enum `WorkCategory` (7 kategori tetap) dan model `WorkLog` (`activityDate @db.Date`, `name`, `description`, `output`, `category`, `userId`, index `[userId, activityDate]`). Kategori khusus dibatalkan atas persetujuan pengguna; `PROJECT.md` dan `ROADMAP.md` disesuaikan.
- Kategori tidak punya tabel/endpoint sendiri; nilainya enum di API.
- Endpoint `requireRole('USER')`:
  - `GET /api/work-logs` — `page`, `limit` (maks 100), `category`, `from`, `to`, `search` (nama + uraian), urut tanggal terbaru.
  - `POST /api/work-logs`, `GET/PATCH/DELETE /api/work-logs/:id`.
- Validasi: `name` ≤200, `description` ≤10000, `output` ≤5000 wajib; `activityDate` opsional (default hari ini) dan tidak boleh melewati hari ini; `from <= to`.
- `activityDate` dikembalikan sebagai `YYYY-MM-DD`; disimpan UTC tengah malam.
- Ownership: query `where { id, userId }`; data pengguna lain → 404.
- Pemeriksaan statis (`typecheck`, `lint`, `format:check`, `build`): lulus.

### P3.2 — Evidence File Management (DONE)

- Dependency baru: `busboy` 1.6.0, `@aws-sdk/lib-storage` 3.1169.0, `heic-convert` 2.1.0 (+ `@types`).
- Schema: model `WorkLogFile` (`key` unik, `originalName`, `mimeType`, `size`, cascade delete, index `workLogId`).
- `src/lib/storage.ts`: `uploadObject` (multipart streaming via `Upload`), `downloadObject`, `deleteObjects`.
- `src/modules/work-logs/work-log-file.rules.ts`: whitelist ekstensi↔MIME, batas 5 MB/file, 10 file, 50 MB/kegiatan, set MIME previewable.
- Endpoint (`requireRole('USER')`, ownership):
  - `POST /api/work-logs/:id/files` — multipart field `file`, streaming langsung ke R2, metadata disimpan setelah upload; gagal simpan → objek dihapus.
  - `GET /api/work-logs/:id/files` — daftar file + `previewable`.
  - `GET /api/work-logs/:id/files/:fileId/content` — default attachment; `?inline=true` untuk gambar/PDF; HEIC/HEIF dikonversi ke JPEG saat inline.
  - `DELETE /api/work-logs/:id/files/:fileId` — hapus objek R2 dulu, lalu metadata.
- `DELETE /api/work-logs/:id` kini menghapus seluruh objek R2 file terkait sebelum record.
- Kode error: `INVALID_FILE_TYPE`, `FILE_TOO_LARGE`, `TOO_MANY_FILES`, `FILE_REQUIRED`, `INVALID_MULTIPART`, `STORAGE_ERROR` (502), `PREVIEW_UNAVAILABLE` (422).
- Pemeriksaan statis (`typecheck`, `lint`, `format:check`, `build`): lulus. `npm run check:file-rules` (assert) lulus.

### P3.3 — Public Evidence Sharing (DONE)

- Schema: `WorkLog.publicToken` unik, default DB `gen_random_uuid()` (122 bit entropi), baris lama terisi otomatis saat migration.
- Endpoint publik tanpa auth (prefix `/api/public/work-logs`, rate limit 120/menit per IP):
  - `GET /api/public/work-logs/:token` — nama kegiatan, tanggal, kategori, uraian, output, dan metadata file.
  - `GET /api/public/work-logs/:token/files/:fileId/content` — attachment default, `?inline=true` untuk gambar/PDF, HEIC/HEIF dikonversi ke JPEG.
- Token atau file tidak cocok → `404 NOT_FOUND`. Tidak ada endpoint untuk mengganti/menonaktifkan token.
- `publicToken` ikut dikembalikan pada API privat Work Log agar frontend dapat menyusun tautan.
- `src/utils/file-response.ts`: `sendFileContent` dipakai handler file privat dan publik (`Content-Disposition`, `Content-Length`, `nosniff`, `Cache-Control: private`).
- Pemeriksaan statis (`typecheck`, `lint`, `format:check`, `build`): lulus.

### P4.1 — Finalisasi Kebutuhan Arsip (DONE)

- Arsip memakai folder buatan pengguna (bukan enum kategori), maksimal 3 level.
- Folder bawaan dibuat otomatis saat arsip masih kosong: `SK & Kepegawaian`, `Pendidikan`, `Diklat & Sertifikat`, `Data Pribadi & Keluarga`, `Lainnya`.
- Satu dokumen = satu file + metadata `name`, `description` opsional, `documentDate` opsional.
- Kuota penyimpanan 1 GB per akun; batas 5 MB/file dan format file sama dengan bukti dukung.
- `PROJECT.md` §5.3 dan `ROADMAP.md` P4.1–P4.2 disesuaikan.

### P4.2 — Archive API (DONE)

- Schema: `ArchiveFolder` (`parentId` self-relation cascade, unique `[userId, parentId, name]`) dan `ArchiveFile` (`folderId` opsional cascade, metadata + key R2).
- Refactor bersama: `src/lib/file-rules.ts`, `src/lib/multipart.ts`, `src/lib/file-content.ts`, `src/utils/current-user.ts`, `storageError` di `src/lib/storage.ts`; modul Work Log memakai ulang komponen tersebut.
- Endpoint `requireRole('USER')`:
  - `GET/POST /api/archive/folders`, `PATCH/DELETE /api/archive/folders/:id` (`?recursive=true`).
  - `GET/POST /api/archive/files`, `GET/PATCH/DELETE /api/archive/files/:id`, `GET /api/archive/files/:id/content`.
- Aturan folder: kedalaman maks 3, nama unik per induk (`409 FOLDER_NAME_TAKEN`), pindah folder cegah siklus (`INVALID_FOLDER_MOVE`) dan batas kedalaman, hapus folder berisi ditolak `409 FOLDER_NOT_EMPTY` kecuali rekursif.
- Aturan file: kuota 1 GB (`STORAGE_QUOTA_EXCEEDED`), objek R2 dihapus sebelum metadata, `previewable` dihitung dari MIME, HEIC/HEIF dikonversi saat inline.
- `GET /api/archive/folders` mengembalikan `folders` + `usage { usedBytes, quotaBytes }`.
- `GET /api/archive/files` mendukung `type=image|pdf|document`, `sort=recent|name|documentDate`, dan setiap item memuat `folderName`.
- Pemeriksaan statis (`typecheck`, `lint`, `format:check`, `build`): lulus. `check:file-rules` dan `check:archive-folders` lulus.
- Migration `20261115033123_add_archive` tersedia di `backend/prisma/migrations`.

### P5.1 — Finalisasi Format Laporan (DONE)

- Satu baris rekap = satu Work Log; nama kegiatan dipakai sebagai Rencana Aksi.
- `target` dan `realisasi` berupa teks bebas opsional (bukan angka + satuan), sesuai kebutuhan e-Kinerja.
- Kolom ekspor: `No | Tanggal | Rencana Aksi | Target | Realisasi | Bukti Dukung | Link | Kategori`.
- Nama bukti dukung: tanpa file `-`; satu file tanpa ekstensi; lebih dari satu digabung `;`, dipotong 255 karakter + `; +N file lainnya`.
- Link memakai tautan publik permanen kegiatan (`WorkLog.publicToken`).
- Periode: harian, mingguan Senin–Minggu, bulanan, tahunan, dan rentang khusus; batas dihitung WITA.
- Ekspor XLSX dan PDF (A4 landscape); pengelompokan dan filter kategori didukung; baris tanpa bukti dukung tetap disertakan dan dapat disaring.
- Hanya mengubah `PROJECT.md` §5.4 dan `ROADMAP.md` P5.1–P5.2; tidak ada perubahan kode.

### P5.2 — Report API (DONE)

- Schema: `WorkLog.target` dan `WorkLog.realisasi` (`String?`, maks 100 karakter, teks bebas sesuai e-Kinerja).
- API Work Log menerima `target` dan `realisasi` pada create/update; string kosong dinormalisasi menjadi `null`; keduanya ikut dikembalikan pada respons.
- Env baru `PUBLIC_WEB_URL` (opsional, default `CORS_ORIGIN`) untuk menyusun tautan bukti dukung pada laporan.
- Dependency baru: `exceljs` 4.4.0 (XLSX), `pdfkit` 0.20.2 + `@types/pdfkit` 0.17.7 (PDF). `tsconfig` menambahkan `esModuleInterop` agar default import paket CommonJS valid.
- Endpoint `GET /api/reports/work-logs/export` (`requireRole('USER')`, filter `userId`):
  - Query: `format=xlsx|pdf` (default `xlsx`), `period=daily|weekly|monthly|yearly|custom`, `date`, `from`+`to` (wajib dan hanya untuk `custom`), `category`, `groupBy=category`, `onlyWithEvidence=true`.
  - Periode dihitung WITA (`Asia/Makassar`); minggu Senin–Minggu; bulanan/tahunan memakai batas kalender.
  - Response stream dengan `Content-Disposition: attachment` dan nama `rekap-kinerja-<from>[_<to>].<ext>`.
- `report.rows.ts`: label kategori Indonesia, ringkasan bukti dukung (0 file `-`, 1 file tanpa ekstensi, lebih dari satu digabung `;`, maks 255 karakter + `; +N file lainnya`).
- `report.period.ts`: resolusi rentang periode + label tanggal Indonesia.
- `report.xlsx.ts`: sheet `Rekap Kinerja`, blok judul/periode, header ber-filter, kolom wrap text, link sebagai hyperlink, panel beku.
- `report.pdf.ts`: A4 landscape, tabel dengan pengukuran tinggi baris, header berulang tiap halaman.
- Error pembuatan XLSX → `500 EXPORT_FAILED`; kegagalan stream PDF memutus respons dan dicatat di log.
- Pemeriksaan statis (`typecheck`, `lint`, `format:check`, `build`): lulus. `check:report-format`, `check:file-rules`, `check:archive-folders` lulus.
- Migration `20261115042939_add_work_log_target_realisasi` sudah dijalankan dan di-commit.

### P6.1 — Finalisasi Kebutuhan Agenda (DONE)

- Field agenda: `title` (wajib), `description` opsional, `startAt`, `endAt` opsional, `allDay` (default `false`), `location` opsional, `category`, `status` (default `NOT_STARTED`).
- Kategori enum: Rapat dan Koordinasi, Pekerjaan dan Tugas, Pelatihan dan Pengembangan Kompetensi, Perjalanan Dinas, Kegiatan Pribadi, Tenggat Waktu (Deadline), Lainnya.
- Status enum: Belum Dimulai (`NOT_STARTED`), Selesai (`DONE`), Dibatalkan (`CANCELLED`).
- Zona waktu acuan WITA (`Asia/Makassar`).
- Tanpa pengulangan agenda; tanpa pengingat/notifikasi (ditangguhkan).
- Hanya mengubah `PROJECT.md` §5.5 dan §8 serta `ROADMAP.md` P6.1–P6.2; tidak ada perubahan kode.

### P6.2 — Schedule API (DONE)

- Schema: enum `ScheduleCategory` (7 nilai), enum `ScheduleStatus` (`NOT_STARTED`, `DONE`, `CANCELLED`), model `Schedule` (`title`, `description?`, `startAt`, `endAt?`, `allDay`, `location?`, `category`, `status`, `userId`, index `[userId, startAt]`).
- Endpoint `requireRole('USER')`:
  - `GET /api/schedules` — `page`, `limit` (maks 100), `from`, `to` (tanggal WITA), `category`, `status`, `search` (judul, deskripsi, lokasi); urut `startAt` terdekat.
  - `POST /api/schedules`, `GET/PATCH/DELETE /api/schedules/:id`.
- Validasi: `title` ≤200 wajib; `description` ≤2000 dan `location` ≤200 opsional (string kosong → `null`); `startAt` wajib berupa ISO 8601 dengan offset; `endAt` opsional dan tidak boleh sebelum `startAt`; `category` wajib; `status` default `NOT_STARTED`.
- `PATCH` memvalidasi ulang `endAt` terhadap `startAt` tersimpan → `400 INVALID_SCHEDULE_RANGE`.
- Waktu disimpan UTC dan dikembalikan sebagai ISO 8601; filter rentang `from`/`to` dihitung sebagai hari penuh WITA (`+08:00`, `schedule.time.ts`).
- Ownership: query `where { id, userId }`; data pengguna lain → `404 NOT_FOUND`.
- Pemeriksaan statis (`typecheck`, `lint`, `format:check`, `build`): lulus. `check:schedule-rules` lulus.
- Migration `20261115054013_add_schedule` sudah dijalankan dan di-commit.

### P7.1 — Finalisasi Struktur Notes (DONE)

- Catatan tanpa judul: hanya `content` (teks bebas) dan `pinned`.
- Pencarian pada isi; urutan `pinned` lalu `updatedAt` terbaru.
- Tanpa tag, folder, checklist, dan lampiran pada versi awal.
- Hanya mengubah `PROJECT.md` §5.6 dan `ROADMAP.md` P7.1–P7.2; tidak ada perubahan kode.

### P7.2 — Notes API (DONE)

- Schema: model `Note` (`content`, `pinned` default `false`, timestamps, index `[userId, pinned, updatedAt]`).
- Endpoint `requireRole('USER')`:
  - `GET /api/notes` — `page`, `limit` (maks 100), `search` (isi), `pinned=true|false`; urut `pinned` lalu `updatedAt` terbaru.
  - `POST /api/notes`, `PATCH /api/notes/:id`, `DELETE /api/notes/:id`. Tanpa endpoint detail karena daftar sudah membawa `content`.
- Validasi: `content` wajib, maks 20.000 karakter; `pinned` boolean; PATCH minimal satu field.
- Ownership: `updateMany`/`deleteMany` dengan `where { id, userId }`; data pengguna lain → `404 NOT_FOUND`.
- Pemeriksaan statis (`typecheck`, `lint`, `format:check`, `build`): lulus.
- Migration `20261115054854_add_note` sudah dijalankan, di-commit, dan terverifikasi (`prisma migrate status`: database up to date).

### P8.1 — Finalisasi Dashboard (DONE)

- Dashboard User: kartu kegiatan bulan berjalan, kegiatan 7 hari terakhir, jumlah file bukti dukung, pemakaian kuota arsip; agenda hari ini dan maksimal 5 agenda terdekat; maksimal 5 catatan disematkan; grafik kegiatan per kategori bulan berjalan serta tren 7 dan 30 hari; aksi cepat.
- Dashboard Admin: jumlah akun per status dan undangan yang belum diterima beserta aksi kirim ulang; tanpa data pribadi User.
- Perhitungan periode memakai WITA; data User dibatasi pada kepemilikan.
- Hanya mengubah `PROJECT.md` §5.7, §6, §8 dan `ROADMAP.md` P8.1; tidak ada perubahan kode.

### P8.2 — Dashboard API (DONE)

- Endpoint `GET /api/dashboard` (`requireRole('USER')`): `summary { monthWorkLogs, weekWorkLogs, evidenceFiles, archive { usedBytes, quotaBytes } }`, `todaySchedules`, `upcomingSchedules` (maks 5, bukan `CANCELLED`, mulai hari esok), `pinnedNotes` (maks 5), `workLogCategories` (bulan berjalan), `workLogTrend` (30 hari terakhir, hari tanpa kegiatan bernilai 0).
- Endpoint `GET /api/dashboard/admin` (`requireRole('ADMIN')`): `accounts { active, invited, inactive }` untuk role `USER` dan `pendingInvitations` (akun `INVITED`, terbaru dulu).
- Refactor WITA: `src/lib/wita.ts` berisi `todayWita`, `startOfDayWita`, `endOfDayWita`, `addDaysWita`, `monthRange`, `dateRangeEndingAt`; `schedule.time.ts` dihapus dan `report.period.ts` memakai helper bersama.
- `ARCHIVE_QUOTA_BYTES` dipindah ke `lib/file-rules.ts` dan dipakai ulang dashboard.
- Tanpa perubahan schema/migration.
- Pemeriksaan statis (`typecheck`, `lint`, `format:check`, `build`): lulus. `check:dashboard`, `check:schedule-rules`, `check:report-format`, `check:file-rules`, `check:archive-folders` lulus.

### P8.3 — Backend Verification (DONE)

- Audit seluruh rute: publik (health, auth, aktivasi, reset password, Google, bukti dukung publik), login (`/auth/me`, change password), Admin (`/users`, `/dashboard/admin`), User (dashboard, work log, arsip, laporan, agenda, notes).
- Konsistensi terverifikasi: envelope `{ success, data }` / `{ success, error }`, `204` tanpa body, ownership `where { id, userId }` pada seluruh data pribadi, `404 NOT_FOUND` untuk resource pengguna lain, validasi Zod di semua endpoint ber-body/query/params.
- Perbaikan: validasi tanggal kegiatan Work Log memakai `todayWita()` (sebelumnya tanggal UTC, sehingga tanggal hari ini ditolak pada 00:00–07:59 WITA).
- Dokumentasi API baru: `docs/API.md` (endpoint, akses, query, batas unggahan, kode error, rate limit). `AGENTS.md` dan `ARCHITECTURE.md` §2.3 merujuk dokumen tersebut.
- Tanpa perubahan schema/migration.
- Pemeriksaan statis (`typecheck`, `lint`, `format:check`, `build`): lulus. `check:dashboard`, `check:schedule-rules`, `check:report-format`, `check:file-rules`, `check:archive-folders` lulus.

### P8.4 — Backend Hardening Ringan (DONE)

- `POST /api/auth/refresh` dibatasi 60 permintaan/15 menit per IP dan `POST /api/auth/logout` 30 permintaan/15 menit per IP (`429 RATE_LIMITED`).
- Pesan global `NOT_FOUND` menjadi "Endpoint tidak ditemukan" dan `VALIDATION_ERROR` menjadi "Permintaan tidak valid".
- `docs/API.md` diperbarui pada bagian rate limit.
- Tanpa perubahan schema/migration.

### P9.1 — Inisialisasi Frontend (DONE)

- Scaffold `frontend/` memakai `create-next-app` 16.4.6: App Router, TypeScript, Tailwind CSS 4.3.3, ESLint, folder `src/`, alias `@/*`, template kosong (`--empty`), Cache Components dan React Compiler dimatikan.
- TypeScript dipin `6.0.3` agar konsisten dengan backend.
- shadcn/ui 4.23.0 diinisialisasi dengan base `radix` dan preset `nova`: `components.json`, `src/lib/utils.ts`, token CSS di `src/app/globals.css`, komponen `button` sebagai uji.
- Prettier 3.10.1 + `eslint-config-prettier`; konfigurasi sama dengan backend (`singleQuote`, `printWidth 100`, `trailingComma all`, `endOfLine lf`); script `format`, `format:check`, dan `typecheck` ditambahkan.
- Halaman awal: `lang="id"`, metadata `ARKANA`, halaman beranda memakai komponen `Button` shadcn.
- `next.config.ts`: `turbopack.root` diarahkan ke folder `frontend` agar peringatan multi lockfile hilang.
- Root `package.json`: script `dev:frontend`, `build:frontend`, `lint:frontend`, `typecheck:frontend`, `format:check:frontend`; `.gitignore` menambahkan `.next/`; `README.md` menambahkan struktur dan cara menjalankan frontend.
- Prasyarat environment: npm 12.2.2 (npm 11.19.1 menolak flag `--allow-scripts` yang dipakai `create-next-app` dan shadcn CLI).
- Pemeriksaan statis (`lint`, `typecheck`, `format:check`, `build`) di frontend: lulus. Build menghasilkan route statis `/` dan `/_not-found`.

### P9.2 — Frontend Infrastructure (DONE)

- Dependency baru: `axios` 1.21.1, `@tanstack/react-query` 5.107.1, `zustand` 5.1.0, `react-hook-form` 7.92.0, `@hookform/resolvers` 7.0.6, `zod` 4.6.7 (sama dengan backend).
- `src/config/env.ts`: `NEXT_PUBLIC_API_URL` divalidasi Zod (URL absolut), gagal → error jelas saat modul dimuat.
- `src/lib/api.ts`: instance Axios terpusat (`baseURL` env, `withCredentials: true`). Interceptor 401 → `POST /auth/refresh` sekali dengan single-flight (request lain menunggu promise yang sama), lalu retry request asli satu kali (`_retry`). Refresh dilewati untuk `/auth/login`, `/auth/refresh`, `/auth/logout`, dan request yang sudah di-retry; bila refresh gagal, error 401 asli dilempar.
- `src/lib/api-error.ts`: `ApiError` (`code`, `message`, `status`, `details`) + `toApiError` yang menormalkan envelope backend, kegagalan jaringan (`NETWORK_ERROR`/`TIMEOUT`), dan error tak dikenal.
- `src/types/api.ts`: tipe `ApiSuccess<T>` dan `ApiFailure`.
- `src/components/shared/query-provider.tsx`: `QueryClient` di `useState`, `retry: 1`, `staleTime: 30s`, `refetchOnWindowFocus: false`; `app/layout.tsx` membungkus children dengan provider.
- `frontend/.env.example` + `README.md` (cara menyalin ke `.env.local`); `.gitignore` frontend menambahkan `!.env.example` agar file contoh tetap ter-commit.
- Zustand hanya di-install; store pertama dibuat saat P10.2 membutuhkan state UI, agar tidak ada kode tanpa konsumen.
- Belum ada check runner otomatis untuk frontend; logika interceptor diverifikasi lewat `typecheck`, `lint`, dan `build`, lalu pengujian fungsional P12.1.
- Pemeriksaan statis (`lint`, `typecheck`, `format:check`, `build`) di frontend: lulus.

### P10.1 — Authentication Interface (DONE)

- Halaman di route group `(auth)` dengan layout terpusat: `/login`, `/activate`, `/lupa-password`, `/reset-password`. Route `/activate` mengikuti tautan undangan backend (`/activate?token=...`).
- `src/features/auth/`: `auth.api.ts` (login, me, logout, activation info, activate, forgot, reset), `auth.schemas.ts` (Zod), `use-auth.ts` (`useSession`, `useLogin`, `useLogout`, `useActivationInfo`, `useActivateAccount`, `useRequestPasswordReset`, `useResetPassword`), `auth-card.tsx`, dan empat form.
- Form memakai pola resmi shadcn/ui: `useForm` + `zodResolver` + `Controller` + `Field`/`FieldLabel`/`FieldError`/`FieldDescription`/`FieldGroup`, `aria-invalid` pada input dan `data-invalid` pada `Field`; bukan komponen `Form` legacy.
- Komponen shadcn ditambah: `field`, `input`, `card`, `alert`, `input-group` (+ `textarea` sebagai dependensi), `label`, `separator`.
- Validasi form hanya dipicu saat submit (mode default React Hook Form, `reValidateMode: onChange`); blur atau klik di luar field tidak memunculkan error.
- Komponen bersama: `src/components/shared/password-input.tsx` (ikon gembok, tombol tampil/sembunyikan dengan `aria-label` + `aria-pressed`) dan `src/components/shared/google-icon.tsx` (SVG logo Google inline, tanpa dependency baru).
- UI auth: kartu `max-w-md`, latar grid halus dengan glow, input berikon (`MailIcon`), link "Lupa password?" sebaris label password, tombol submit dengan spinner, tombol Google berlogo, alert dengan ikon status. Semua `<button>` non-disabled memakai `cursor-pointer` (aturan di `globals.css`).
- Placeholder password di semua form (login, aktivasi, reset). Field input dan tombol submit di-disable saat submit berjalan (flag pending mutation yang sama, termasuk `info.isPending` di aktivasi); tombol Google dibiarkan (redirect penuh).
- `/login`: email+password, tombol Google mengarah ke `${NEXT_PUBLIC_API_URL}/auth/google`, pemetaan kode error OAuth, tautan lupa password; pengguna dengan sesi aktif diarahkan ke `/`.
- `/activate`: memuat info akun dari token, form password + konfirmasi, status sukses, dan penanganan token tidak valid/kedaluwarsa.
- `/lupa-password`: respons selalu dinetralkan ("jika email terdaftar…").
- `/reset-password`: token dari query, password + konfirmasi, status sukses.
- Sesi tetap di TanStack Query (`/auth/me`, 401 → `null`); login mengisi cache, logout membersihkan cache lalu redirect `/login`. Tidak ada duplikasi di Zustand.
- Halaman beranda sementara menampilkan sesi aktif (nama, email, role) + tombol keluar, dan mengarahkan ke `/login` bila tanpa sesi; digantikan pada P10.2.
- Halaman yang memakai `useSearchParams` dibungkus `<Suspense>` sesuai Next 16.
- Pemeriksaan statis (`lint`, `typecheck`, `format:check`, `build`) di frontend: lulus; build menghasilkan route `/`, `/login`, `/activate`, `/lupa-password`, `/reset-password`.
- Pengujian UI alur auth dilakukan pengguna; agent hanya menjalankan pemeriksaan statis.

### P10.2 — Application Layout (DONE, commit `fa44cec` + `bb44c0b`)

- Route group `(app)` dengan `AppShell`: memuat sesi `/auth/me`, redirect ke `/login` bila tanpa sesi, serta state loading dan error dengan aksi coba lagi.
- Sidebar memakai komponen shadcn/ui varian Radix (`sidebar`, `sheet`, `tooltip`, `skeleton`, `hooks/use-mobile.ts`) dengan `SidebarProvider`, `SidebarInset`, `SidebarTrigger`, `SidebarRail`, dan `TooltipProvider`.
- Header atas hanya menampilkan `SidebarTrigger`; teks ARKANA dan `Separator` vertikal di header dihapus.
- Footer sidebar memakai `Avatar` bulat + nama + email; klik membuka `DropdownMenu` berisi ringkasan profil dan tombol keluar. Komponen shadcn baru: `avatar`, `dropdown-menu`.
- Sesi belum menyediakan URL foto profil; `Avatar` memakai inisial nama sebagai fallback.
- Navigasi berdasarkan role:
  - User: Dashboard, Kegiatan, Arsip, Laporan, Agenda, Catatan.
  - Admin: Dashboard, Akun.
- Menu aktif dihitung dari `usePathname`; klik menu di mobile menutup sheet; profil dan tombol keluar berada di `SidebarFooter`.
- Placeholder route memakai `ModulePlaceholder`: `/`, `/kegiatan`, `/arsip`, `/laporan`, `/agenda`, `/catatan`, `/akun`. Halaman sementara `src/app/page.tsx` dihapus.
- `use-mobile` diubah ke `useSyncExternalStore` agar sesuai aturan ESLint React 19 (`set-state-in-effect`).
- Tidak menambah store Zustand; state buka/tutup sidebar ditangani `SidebarProvider`.
- Penyempurnaan pasca-commit: dropdown profil dibuka ke atas (`side="top"`) dan konten halaman dibuat rata kiri tanpa pembungkus `mx-auto`/`max-w-5xl`.
- Menu `Profil` ditambahkan sebelum tombol `Keluar` pada dropdown akun; route `/profil` menampilkan avatar, nama, email, role, dan status dari sesi.
- Tombol `Edit profil` masih nonaktif sampai endpoint pembaruan profil tersedia.
- `getInitials` dipindahkan ke `src/lib/initials.ts` dan dipakai bersama sidebar serta halaman profil.
- Pemeriksaan statis (`lint`, `typecheck`, `format:check`, `build`) di frontend: lulus setelah penyempurnaan. Build mencakup route `(app)`, `(auth)`, dan `/profil`.
- Pengujian UI layout dilakukan pengguna; agent tidak menjalankan UI test.

### Penyelerasan Roadmap Phase 11 (DONE, tanpa kode)

- P11.1 dipecah menjadi P11.1a (data layer dan daftar kegiatan), P11.1b (form dan penghapusan), P11.1c (bukti dukung), P11.1d (detail kegiatan dan halaman publik `/p/evidence/[token]`) dengan dependensi berurutan.
- P11.2 memakai istilah folder (bukan kategori) sesuai implementasi arsip.
- P11.4 menjadi Schedule; pengingat dan notifikasi tetap ditangguhkan.
- Task baru P11.8 — Profil Pengguna (backend endpoint profil sendiri + form `/profil`), menunggu keputusan field yang boleh diubah.
- P10.2 ditandai final setelah penyempurnaan ter-commit pada `bb44c0b`.

### P11.1a — Data Layer & Daftar Kegiatan (DONE, commit `5d12d87`)

- Feature `frontend/src/features/work-logs/`: `work-log.api.ts` (tipe `WorkLog`, `WorkCategory`, label kategori Indonesia, `fetchWorkLogs`), `use-work-logs.ts` (`useWorkLogs` dengan `keepPreviousData`), `work-log-filter-bar.tsx`, `work-log-list.tsx`.
- Halaman `/kegiatan` memakai `WorkLogList`; placeholder `ModulePlaceholder` dihapus dari route ini.
- Daftar kegiatan: tanggal, nama, kategori (`Badge`), ringkasan uraian; urutan mengikuti API (tanggal terbaru).
- Filter: pencarian nama/uraian (submit Enter atau tombol cari), kategori, dan rentang tanggal memakai `DateRangePicker` shadcn/ui (`Popover` + `Calendar` mode `range`, 2 bulan di desktop dan 1 bulan di mobile, locale `id`), serta reset filter.
- Pagination 20 per halaman dengan tombol sebelumnya/berikutnya serta ringkasan "Menampilkan X–Y dari N".
- State filter ada di komponen halaman; server state di TanStack Query. Belum ada form, detail, bukti dukung, atau tautan publik (P11.1b–d).
- Komponen shadcn baru: `badge`, `select`, `calendar`, `popover`. Dependency baru: `date-fns` 4.4.0, `react-day-picker` 10.0.2. Komponen bersama: `src/components/shared/date-range-picker.tsx` (nilai `from`/`to` berupa `YYYY-MM-DD`).
- Pemeriksaan statis (`lint`, `typecheck`, `format:check`, `build`) di frontend: lulus. Pengujian UI dilakukan pengguna.

### P11.1b — Form dan Penghapusan Kegiatan (DONE, commit `470af90`)

- API client menambah `fetchWorkLog`, `createWorkLog`, `updateWorkLog`, `deleteWorkLog`, dan tipe `WorkLogInput`.
- Hook: `useWorkLog` (detail), `useCreateWorkLog`, `useUpdateWorkLog` (memperbarui cache detail + invalidasi daftar), `useDeleteWorkLog` (menghapus cache detail + invalidasi daftar).
- `work-log.schemas.ts`: schema Zod form sesuai batas backend; `target`/`realisasi` kosong dikirim sebagai `null`.
- `work-log-form-dialog.tsx`: dialog tambah/ubah memakai RHF + `zodResolver` + `Controller` + `Field`; kategori memakai `Select`; error server tampil pada `Alert`; sukses memunculkan toast dan menutup dialog.
- `work-log-detail.tsx` + route `/kegiatan/[id]`: menampilkan kategori, tanggal, uraian, output, target, dan realisasi; aksi ubah (dialog) dan hapus (konfirmasi `AlertDialog`) dengan toast lalu kembali ke daftar.
- Daftar kegiatan: tombol `Catat kegiatan` membuka dialog, dan setiap baris menjadi tautan ke halaman detail.
- `activityDate` tidak diubah dari UI sesuai keputusan backend (tanggal hari ini saat dibuat).
- Komponen shadcn baru: `dialog`, `alert-dialog`, `sonner` (+ dependency `sonner`). `Toaster` dipasang di root layout; `next-themes` tidak dipakai sehingga `sonner.tsx` tidak memanggil `useTheme`.
- Script frontend `typecheck` menjadi `next typegen && tsc --noEmit` agar tipe route baru tersedia sebelum `tsc`.
- Pemeriksaan statis (`lint`, `typecheck`, `format:check`, `build`) di frontend: lulus; build menghasilkan route `/kegiatan` dan `/kegiatan/[id]`. Pengujian UI dilakukan pengguna.

### P11.1c — Bukti Dukung Kegiatan (DONE, commit `3fb3917`)

- `work-log-file.api.ts`: tipe `WorkLogFile`, batas klien (5 MB/file, 10 file, 50 MB total), daftar ekstensi, `fileExtension`, `formatFileSize`, `isAllowedFile`, `fetchWorkLogFiles`, `uploadWorkLogFile` (multipart field `file`), `deleteWorkLogFile`, dan `workLogFileContentUrl` (opsi `inline=true`).
- `use-work-log-files.ts`: query daftar file serta mutation unggah/hapus yang memperbarui cache daftar.
- `work-log-evidence.tsx` pada halaman detail: ringkasan jumlah file dan pemakaian byte, unggah beberapa file sekaligus (validasi format, ukuran, slot, dan total sebelum kirim; unggahan berurutan), daftar file dengan format dan ukuran, pratinjau gambar/PDF dalam dialog, unduh, serta hapus dengan konfirmasi.
- Unggahan menampilkan modal progres per file (`Progress`, persen dari `onUploadProgress` Axios) dengan status Menunggu/Mengunggah/Selesai/Gagal; modal tidak dapat ditutup selama unggahan berjalan.
- Pratinjau dan unduh mengambil konten sebagai blob melalui Axios (`responseType: 'blob'`, cookie sesi ikut) lalu memakai object URL. URL konten backend langsung tidak dipakai karena ditolak browser pada pratinjau/iframe. HEIC/HEIF tampil sebagai JPEG hasil konversi server.
- Tanpa pengaturan ulang batas di klien; angka batas hanya untuk validasi awal, keputusan akhir tetap di backend.
- Komponen shadcn baru: `progress`.
- Pemeriksaan statis (`lint`, `typecheck`, `format:check`, `build`) di frontend: lulus. Pengujian UI dan unggah file nyata ke R2 dilakukan pengguna.

### P11.1d — Detail Kegiatan & Halaman Publik (DONE, commit `28dc27a`)

- `work-log-public.api.ts`: tipe `PublicWorkLog` (tanpa `id`/`publicToken`), `fetchPublicWorkLog(token)`, dan `publicFileUrl(token, fileId, inline)` untuk URL konten langsung.
- `use-work-log-public.ts`: `usePublicWorkLog` dengan `retry: false`.
- Route publik `src/app/p/evidence/[token]/page.tsx` di luar route group `(app)`, metadata `robots: { index: false, follow: false }` agar tautan bearer tidak diindeks.
- `work-log-public-view.tsx`: tampilan read-only (nama, tanggal, kategori, uraian, output, daftar file dengan format dan ukuran), tanpa identitas pemilik.
- Pratinjau dan unduh memakai blob melalui Axios (`responseType: 'blob'`, `?inline=true` untuk pratinjau) lalu object URL. URL konten langsung tidak bisa dipakai: `helmet()` mengirim `Cross-Origin-Resource-Policy: same-origin` dan `X-Frame-Options: SAMEORIGIN`, sehingga browser memblokir `localhost:4000` dari halaman `localhost:3000`. Perilaku ini sama dengan halaman privat.
- Helper `downloadBlob` diekstrak ke `work-log-file.api.ts` dan dipakai halaman privat serta publik.
- Dialog pratinjau diperbesar: `sm:max-w-5xl`, area pratinjau `60vh` di mobile dan `75vh` di desktop (berlaku juga pada halaman detail privat).
- Halaman detail privat: tombol `Salin tautan` menyalin `${origin}/p/evidence/{publicToken}` ke clipboard beserta toast berhasil/gagal.
- `work-log-file-icon.tsx`: `FileTypeIcon` dipindah dari `work-log-evidence.tsx` dan dipakai kedua tampilan.
- Tanpa perubahan backend, schema, migration, env, atau dependency baru.
- Pemeriksaan statis (`lint`, `typecheck`, `format:check`, `build`) di frontend: lulus; build menghasilkan route `/p/evidence/[token]`. Pengujian UI dan tautan nyata dilakukan pengguna.

### P11.2 — Personal Document Archive (DONE)

- Feature `frontend/src/features/archive/`: `archive.api.ts`, `archive.schemas.ts`, `archive.util.ts`, `use-archive.ts`, `archive-view.tsx`, `archive-folder-panel.tsx`, `archive-folder-dialog.tsx`, `archive-files.tsx`, `archive-file-upload-dialog.tsx`, `archive-file-edit-dialog.tsx`, `archive-file-detail.tsx`. Route `/arsip` memakai `ArchiveView`.
- Layout dua kolom di desktop (`lg:grid-cols-[17rem_minmax(0,1fr)]`): panel folder di kiri, daftar dokumen di kanan. Di mobile panel folder dibuka lewat `Sheet` (tombol `Folder`) dan ada select folder pada filter.
- Folder: pohon maksimal 3 level dengan jumlah file, tambah/ubah (pilihan folder induk dibatasi kedalaman), hapus (otomatis rekursif bila berisi, dengan peringatan), validasi nama unik dari backend ditampilkan di dialog.
- Dokumen: pencarian nama/deskripsi, filter jenis (gambar/PDF/dokumen), urutan (terbaru/nama/tanggal dokumen), pagination 20, dan ringkasan folder + tanggal dokumen per baris.
- Unggah: multipart satu file, nama opsional (default nama file), deskripsi, tanggal dokumen, folder; validasi format, 5 MB, dan sisa kuota; progres unggah dari `onUploadProgress`; dialog tidak dapat ditutup saat mengunggah.
- Ubah metadata dan pindah folder melalui PATCH; hapus dengan konfirmasi; nomor halaman turun bila halaman terakhir menjadi kosong.
- Detail dokumen: metadata lengkap (jenis, ukuran, folder, tanggal dokumen, deskripsi) untuk semua file, pratinjau blob untuk gambar/PDF, dan unduh.
- Kuota 1 GB ditampilkan dengan `Progress`; tombol unggah nonaktif saat kuota habis.
- Shared dipindah/ditambah: `src/lib/file-format.ts` (batas, ekstensi, `fileExtension`, `formatFileSize`, `isAllowedFile`), `src/lib/download.ts` (`downloadBlob`), `src/components/shared/file-type-icon.tsx`, `src/components/shared/date-picker.tsx`. `features/work-logs/work-log-file-icon.tsx` dihapus.
- Tanpa perubahan backend, schema, migration, env, atau dependency baru.
- Pemeriksaan statis (`lint`, `typecheck`, `format:check`, `build`) di frontend: lulus; build menghasilkan route `/arsip`. Pengujian UI dilakukan pengguna.

### P11.3 — Performance Report (DONE)

- Backend: `GET /api/reports/work-logs` membalas rekap JSON dan memakai ulang `buildReport()`; `reportQuerySchema` dipisah dari `reportExportQuerySchema` agar query pratinjau dan ekspor identik. Tanpa migration, schema database, atau dependency baru.
- `docs/API.md` §6: endpoint pratinjau ditambahkan.
- Feature `frontend/src/features/reports/`: `report.api.ts`, `use-report.ts`, `report-filter-bar.tsx`, `report-table.tsx`, `report-view.tsx`; route `/laporan` menggantikan placeholder.
- Filter disimpan pada URL search params (`period`, `date`, `from`, `to`, `category`, `groupBy`, `onlyWithEvidence`); `/laporan` memakai `Suspense` karena `useSearchParams`.
- Pratinjau memakai tabel di desktop dan kartu bertumpuk di mobile; kolom mengikuti kebutuhan e-Kinerja; tautan bukti dukung membuka halaman publik di tab baru.
- Ekspor XLSX/PDF memakai filter aktif dan `downloadBlob`; nama berkas diambil dari rentang laporan. Periode rentang khusus menunggu `from` dan `to` yang valid.
- Pemeriksaan statis backend (`lint`, `typecheck`, `format:check`, `build`) dan frontend (`lint`, `typecheck`, `format:check`, `build`): lulus; build menghasilkan route `/laporan`. Pengujian UI dan ekspor nyata dilakukan pengguna.

### Bugfix — Work Log tanggal default WITA (DONE, commit `8e8e67a`)

- `work-log.service.ts` `today()` sebelumnya memakai tanggal UTC (`toISOString().slice(0, 10)`), sehingga kegiatan yang dibuat 00:00–07:59 WITA tersimpan ke tanggal sebelumnya.
- Sekarang memakai `todayWita()` sesuai aturan WITA proyek. Tanpa migration, env, atau dependency baru.
- Baris lama yang terlanjur salah tanggal perlu dikoreksi manual.
- Pemeriksaan statis (`lint`, `typecheck`, `format:check`, `build`): lulus.

### P11.4 — Schedule (DONE, commit `02ad063`)

- Feature `frontend/src/features/schedules/`: `schedule.api.ts`, `schedule.schemas.ts`, `schedule.format.ts`, `use-schedules.ts`, `schedule-calendar.tsx`, `schedule-list.tsx`, `schedule-form-dialog.tsx`, `schedule-view.tsx`; route `/agenda` menggantikan placeholder.
- Layout desktop dua kolom: kalender bulan (`ui/calendar`, locale `id`) di kiri, daftar agenda di kanan; mobile bertumpuk. Bulan aktif memuat rentang `from`/`to` (WITA, limit 100); hari yang berisi agenda diberi aksen tebal.
- Panel daftar memakai tab: `Mendatang` (hari ini +30 hari, limit 20, default; tiap item menampilkan tanggal) dan hari terpilih. Klik tanggal di kalender berpindah ke tab hari terpilih. Setelah agenda disimpan, panel lompat ke tanggal agenda.
- Form: judul, deskripsi opsional, sepanjang hari (waktu disembunyikan), tanggal dan jam mulai, tanggal dan jam selesai opsional (`selesai >= mulai` divalidasi di client dan backend), tempat, kategori, status. Waktu dikirim sebagai ISO WITA dan ditampilkan dengan `Intl` zona `Asia/Makassar`.
- Hapus memakai `AlertDialog`; aksi tambah/ubah memakai dialog yang sama (mode lintas edit/create).
- Pemeriksaan statis (`lint`, `typecheck`, `format:check`, `build`): lulus; build menghasilkan route `/agenda`. Pengujian UI dilakukan pengguna. Status P11.3 dan bugfix WITA ikut commit ini.

### P11.5 — Notes (DONE, commit `f9add48`)

- Feature `frontend/src/features/notes/`: `note.api.ts`, `note.format.ts`, `use-notes.ts`, `note-editor-dialog.tsx`, `note-card.tsx`, `note-view.tsx`; route `/catatan` menggantikan placeholder.
- Daftar grid kartu 1/2/3 kolom, `line-clamp-5`, urut backend (pinned lalu `updatedAt`); klik isi kartu membuka editor, tombol pin toggle (`PATCH { pinned }`), hapus via `AlertDialog`; footer menampilkan `updatedAt` (WITA).
- Toolbar: pencarian (draft + submit, pola Kegiatan) dan toggle `Disematkan` dengan reset; kosong/halaman melebihi tersedia menampilkan tombol kembali.
- Pagination 20; catatan baru dan ubah memakai dialog yang sama (RHF tidak dipakai, form sederhana; validasi manual dengan `MAX_LENGTH` 20.000 dan pesan error).
- Tanpa dependency, migration, atau env baru. Pemeriksaan statis (`lint`, `typecheck`, `format:check`, `build`) lulus; build menghasilkan route `/catatan`. Pengujian UI dilakukan pengguna.

### P11.6 — Dashboard (DONE, commit `7405453`)

- Feature `frontend/src/features/dashboard/`: `dashboard.api.ts`, `use-dashboard.ts`, `dashboard-view.tsx` (switch role via `useSession`), `user-dashboard.tsx`, `admin-dashboard.tsx`; route `/` menggantikan placeholder. Fungsi `resendInvitation` (`POST /users/:id/resend-invitation`) termasuk di file ini.
- Dashboard USER: 4 kartu ringkasan (kegiatan bulan berjalan, 7 hari terakhir, file bukti dukung, pemakaian kuota arsip via `Progress`); agenda hari ini; 5 agenda terdekat (bukan `CANCELLED`, dari backend); 5 catatan disematkan; aksi cepat berupa `Link` ke `/kegiatan`, `/agenda`, `/catatan`. Tanpa grafik — data `workLogCategories`/`workLogTrend` dari API dibiarkan (tipe tetap akurat), tidak dirender.
- Dashboard ADMIN: 3 kartu (akun aktif/diundang/nonaktif, khusus role `USER` di backend); daftar undangan belum diterima + tombol `Kirim ulang` (`{ sent: true }` → toast sukses; error → `getErrorMessage`).
- Tanpa dependency, migration, atau env baru. `ROADMAP.md` tidak diubah. Pemeriksaan statis (`lint`, `typecheck`, `format:check`, `build`) lulus; build tetap menghasilkan route `/`. Pengujian UI dilakukan pengguna.

### P11.7 — User Management (DONE, commit `fc24f0a`)

- `resendInvitation` dipindah dari `features/dashboard/dashboard.api.ts` ke `features/users/users.api.ts` (tanpa duplikasi); `admin-dashboard.tsx` kini memakai `useResendInvitation` dari `features/users/use-users`; mutasi user meng-`invalidateQueries` `['users']` dan `['dashboard']`.
- Feature `frontend/src/features/users/`: `users.api.ts`, `users.schemas.ts`, `use-users.ts`, `user-invite-dialog.tsx`, `user-edit-dialog.tsx`, `users-view.tsx`; route `/akun` menggantikan placeholder.
- Daftar akun: tabel (≥`md`) dan kartu (mobile) — kolom Pengguna (avatar initials + badge `Admin` untuk role `ADMIN`) · Status (`Aktif`/`Diundang`/`Nonaktif`) · Terdaftar (WITA) · Aksi; pagination 20; pencarian nama/email (submit); kosong/halaman di luar tersedia menampilkan tombol kembali.
- Guard halaman: selain `ADMIN` melihat layar "Akses ditolak" + tautan ke `/`; baris `role: 'ADMIN'` tanpa aksi (backend `403` untuk ubah/undang Admin).
- Undangan (`POST /users/invite`) via dialog RHF + Zod; error 409 `EMAIL_TAKEN` tampil di dialog. Edit (`PATCH /users/:id`): ubah `name`/`email`/`status` (`ACTIVE`/`INACTIVE`); select status dinonaktifkan untuk akun `INVITED` dan `status` tidak dikirim saat itu (backend menolak `ACTIVE` sebelum aktivasi).
- Kirim ulang undangan (`INVITED`) dan ubah memakai pola admin dashboard (toast `sonner`, `getErrorMessage`).
- Tanpa dependency, migration, atau env baru. `ROADMAP.md` tidak diubah. Pemeriksaan statis (`lint`, `typecheck`, `format:check`, `build`) lulus; build tetap menghasilkan route `/akun`. Pengujian UI dilakukan pengguna.

### P11.8a — Backend Profil Pengguna (DONE, commit `0e5ef6e`, migration `20261116064315_add_profile_fields`)

- Schema: `User` + `titleBefore`, `titleAfter`, `nip` (`@unique`), `employeeStatus` (`PNS`|`PPPK`), `golongan`, `position`, `unit`, `avatarKey`, `pendingEmail`; enum `AccountTokenType` + `EMAIL_CHANGE`. Kolom kepegawaian `String?` + validasi Zod di boundary (bukan enum DB).
- Module `src/modules/profile/` (route `/api/profile`, role `USER` dan `ADMIN`):
  - `PATCH /profile` — parsial (≥ 1 field), `null` mengosongkan; NIP 18 digit angka; `employeeStatus` `PNS`|`PPPK`; `golongan` PNS `I/a`–`IV/e` (17 nilai) atau PPPK `Golongan I`–`XVII` (17 nilai); NIP dipakai akun lain → 409 `NIP_TAKEN`.
  - `POST /profile/email` — rate limit 5/15 menit; membuat token `EMAIL_CHANGE` (7 hari) + `pendingEmail`; tautan dikirim ke email **baru**; 409 `EMAIL_TAKEN`, 400 `EMAIL_UNCHANGED`, 502 `EMAIL_SEND_FAILED`.
  - `POST /profile/email/verify` — publik (token = bukti kepemilikan inbox, pola reset password); set `email = pendingEmail`, kosongkan `pendingEmail`, token `usedAt`; notifikasi ke email lama dan baru.
  - `POST /profile/avatar` — multipart (field `file`), JPG/JPEG/PNG/WEBP maks 2 MB; key lama dihapus setelah ganti; error infra `FILE_TOO_LARGE`/`INVALID_FILE_TYPE` diterjemahkan ke pesan avatar.
  - `GET /profile/avatar` — stream inline; 404 bila belum ada. `DELETE /profile/avatar` — hapus objek R2 + `avatarKey = null`.
- `requireAuth` memuat ulang field profil + `avatarKey`; `avatarKey` tidak diekspos — diganti `hasAvatar`. `GET /auth/me` memuat field profil + `hasAvatar` + `updatedAt`.
- `account-mail.ts` + `sendEmailChangeLink` (link `/verifikasi-email?token=…`); `notifyEmailChanged` dipakai ulang.
- Dokumentasi API diperbarui di `docs/API.md` §2 (bagian lama dirujuk sebagai §3–§12).
- Pemeriksaan statis backend (`typecheck`, `lint`, `format:check`, `build`): lulus. Daftar gol. PNS diimplementasikan 17 nilai (4+4+4+5) sesuai daftar resmi; catatan awal "19 nilai" keliru.
- Migration `20261116064315_add_profile_fields` dijalankan pengguna; commit `0e5ef6e`.

### P11.8b — Frontend Profil Pengguna (DONE, commit `e4b13f0`)

- Backend (bagian dari task ini, disetujui): `GET /auth/me` dan respons `PATCH /profile` memuat `pendingEmail`; tidak ada endpoint baru.
- Feature `frontend/src/features/profile/`: `profile.api.ts`, `profile.schemas.ts`, `use-profile.ts`, `profile-view.tsx` (ditulis ulang), `verify-email-form.tsx`; shared `src/components/shared/user-avatar.tsx` dan `src/lib/display-name.ts`.
- `/profil` menggantikan placeholder; kartu:
  - **Identitas**: avatar (blob, fallback initials), display name (gelar + nama), email, badge role/status; ubah foto (jpg/jpeg/png/webp ≤ 2 MB, validasi client) dan hapus (AlertDialog).
  - **Kelengkapan Profil** (form RHF + Zod): nama, gelar depan/belakang, NIP (18 digit), status kepegawaian (PNS/PPPK), pangkat/golongan (optgroup PNS `I/a`–`IV/e` dan PPPK `Golongan I`–`XVII`; direset saat status berubah), jabatan, unit kerja; pratinjau "Nama tampilan" langsung; kosong = hapus.
  - **Email**: menampilkan email sekarang; banner "Menunggu verifikasi" bila `pendingEmail` di sesi; form kirim tautan (rate limit 5/15 menit backend; error 409 `EMAIL_TAKEN` / 400 `EMAIL_UNCHANGED` / 429 tampil inline).
  - **Keamanan**: ganti password via `POST /auth/password/change` (RHF + Zod, sesi lain dicabut).
- Halaman publik `/verifikasi-email?token=` (route group `(auth)`): verifikasi otomatis sekali (ref guard), status memuat/sukses/gagal; sukses → link ke `/profil`.
- Sidebar & dropdown akun: display name + avatar (`UserAvatar`, query key `['profile','avatar', user.id, user.updatedAt]`, `staleTime: Infinity`), menggantikan inisial nama biasa.
- Sesi tetap bersumber dari `/auth/me`; mutasi meng-`invalidateQueries`/`setQueryData` `['auth','me']`.
- Tanpa dependency, migration, atau env baru. `ROADMAP.md` tidak diubah.
- Pemeriksaan statis backend dan frontend (`typecheck`, `lint`, `format:check`, `build`): lulus; route `/verifikasi-email` dan `/profil` tersedia di build.

### Temuan Di Luar Scope

- Access token masih berupa JWT stateless: setelah ganti password atau penonaktifan, access token lama tetap valid maksimal 15 menit. Bila perlu pencabutan instan, tambahkan penanda versi sesi pada `User` dan periksa di `requireAuth`.
- Akun yang hanya login lewat Google belum dapat menetapkan password sendiri; harus lewat alur reset password.
- Edit profil sendiri tersedia end-to-end sejak P11.8a (backend) dan P11.8b (frontend).
- ~~Cookie sesi memakai `sameSite=lax`; pada deployment beda site cookie tidak terkirim.~~ Diputuskan: frontend dan backend memakai subdomain pada satu domain induk (same site), sehingga `sameSite=lax` tetap dipakai.
- `busboy` mendekode nama file multipart sebagai latin1; nama file non-ASCII berpotensi tampil tidak sesuai. Perlu normalisasi bila diperlukan.
- Pengingat dan notifikasi agenda ditangguhkan: perlu keputusan kanal (email/in-app), mekanisme penjadwalan, dan penanganan multi-instance sebelum dijadwalkan sebagai task roadmap baru.
- ~~Perlindungan CSRF belum diimplementasikan.~~ Mitigasi saat ini `sameSite=lax` dan topologi same-site (subdomain satu domain induk); token CSRF belum diperlukan selama topologi ini dipakai.
- Health check belum memeriksa koneksi database maupun R2; relevan untuk verifikasi deployment di P12.

## Keputusan Teknis Kumulatif

- Prisma 7.10.1 (stable; `latest` 8.0.0-rc dihindari), driver adapter `@prisma/adapter-pg`.
- TypeScript 6.0.3 (typescript-eslint belum mendukung TS 7).
- Migration memakai session pooler Supabase; runtime memakai transaction pooler.
- Auth: access JWT 15 menit di cookie HTTP-only, refresh token opaque 30 hari (hash di DB, rotasi), `sameSite=lax`, `secure` di production.
- Logger meredaksi `cookie`, `authorization`, dan `set-cookie`.
- Env wajib fail-fast via Zod; `JWT_ACCESS_SECRET` minimal 32 karakter.
- Kategori Work Log memakai enum tetap 7 nilai; kategori khusus dibatalkan.
- Form Work Log tidak menampilkan `activityDate`; backend memakai tanggal hari ini dan menolak tanggal setelah hari ini.
- File bukti dukung: multipart streaming (`busboy` + `@aws-sdk/lib-storage`) langsung ke R2, object key `work-logs/{userId}/{workLogId}/{uuid}.{ext}`, MIME disimpan dari whitelist ekstensi (bukan dari klien).
- Penghapusan file dan kegiatan selalu menghapus objek R2 lebih dulu; kegagalan R2 → 502 dan metadata dipertahankan.
- HEIC/HEIF dikonversi ke JPEG saat preview inline (`heic-convert`), file asli tidak diubah.
- Tautan publik memakai `WorkLog.publicToken` (UUID v4, unik, permanen, tanpa endpoint penonaktifan); halaman publik tidak menampilkan identitas pemilik.
- Arsip memakai folder user-created maksimal 3 level, folder bawaan saat arsip kosong, satu file per dokumen, kuota 1 GB per akun.
- Rekap kinerja memakai satu baris per Work Log; `target` dan `realisasi` berupa teks bebas opsional, bukan angka + satuan.
- Ekspor laporan: `exceljs` untuk XLSX dan `pdfkit` (A4 landscape) untuk PDF; tanpa headless browser.
- Tautan bukti dukung pada laporan memakai `PUBLIC_WEB_URL` (fallback `CORS_ORIGIN`) + `/p/evidence/{publicToken}`.
- Zona waktu acuan proyek: WITA (`Asia/Makassar`, UTC+8) untuk rekap laporan dan agenda.
- Agenda: waktu disimpan UTC, batas hari/filter memakai offset `+08:00`; status default `NOT_STARTED`; tanpa pengulangan dan tanpa pengingat.
- Frontend: Next.js 16.4.6, React 19.3.0, Tailwind CSS 4.3.3, shadcn/ui 4.23.0 (base `radix`, preset `nova`), TypeScript 6.0.3, npm 12.2.2.
- Cache Components dan React Compiler dimatikan pada versi awal; data server ditangani TanStack Query, bukan cache server Next.js.
- API client frontend: satu instance Axios terpusat dengan `withCredentials` dan interceptor refresh single-flight; server state hanya di TanStack Query, Zustand untuk state UI saat dibutuhkan.
- Env publik frontend `NEXT_PUBLIC_API_URL` wajib dan divalidasi Zod; `.env.local` tidak di-commit, hanya `.env.example`.
- Form shadcn/ui memakai `Field` + `Controller` + `zodResolver`; komponen `Form` legacy tidak dipakai.
- Validasi form frontend hanya berjalan saat submit; error tidak muncul saat field ditinggalkan.
- Ikon di dalam input memakai `InputGroup` + `InputGroupAddon` (addon diletakkan setelah input sesuai dokumentasi shadcn), bukan absolute icon manual.
- Sesi frontend bersumber tunggal dari `/auth/me` melalui TanStack Query; login/logout hanya mengubah cache, bukan state terpisah.
- Route frontend mengikuti tautan email backend: `/activate?token=...`, `/reset-password?token=...`, `/login`.
- Topologi domain: satu domain induk dengan subdomain terpisah untuk frontend dan backend (opsi A). Cookie `sameSite=lax` dipertahankan; token CSRF tidak diperlukan selama topologi ini dipakai.
- Backend tidak memakai lapisan repository; akses database langsung melalui Prisma di service. Repository hanya ditambahkan bila memenuhi kriteria di `ARCHITECTURE.md` §4.1 (query lintas modul, service didominasi query, butuh unit test tanpa DB, ada sumber data kedua, atau query kompleks). Alasan: satu ORM, YAGNI, dan retrofit murah.

## Urutan Pengembangan

1. **Backend:** fondasi, database, autentikasi, seluruh modul, dan verifikasi API.
2. **Frontend:** fondasi, autentikasi, layout, seluruh modul, dan integrasi API.
3. **Finalisasi:** pengujian menyeluruh, keamanan, deployment, backup, dan recovery.

**Aturan utama:** Pengembangan frontend hanya dimulai setelah seluruh backend selesai dan diverifikasi.

## Pekerjaan Berikutnya

Catatan: `ROADMAP.md` dinormalisasi ke format task kanonik (`Objective`, `Scope`, `Acceptance Criteria`, `Dependencies`) pada 16 November 2026 tanpa perubahan ruang lingkup dan urutan.

1. Phase 11 selesai — P11.8b sudah ter-commit pada `e4b13f0`.
2. `PROGRESS.md` sebelumnya menyebut P11.9 sebagai task berikutnya, tetapi `ROADMAP.md` tidak memiliki P11.9. Fase berikutnya sesuai roadmap adalah Phase 12 (P12.1 Functional & Integration Testing). Menunggu keputusan pengguna sebelum melanjutkan.
3. Perbaikan hasil audit kode 16 November 2026 dikerjakan bertahap dengan urutan A → B → C → E → F → D → G → H, satu commit per item. Item E.1, A.1, A.2, migration unique index folder root, B.1–B.6 selesai; item B.7 (helper `dateKey`) berikutnya.

## Aturan Pembaruan

- Perbarui status ketika task dimulai, selesai, atau terblokir.
- Catat hanya progres aktual, blocker, dan langkah berikutnya.
- Tandai task `DONE` setelah kriteria penerimaan terpenuhi dan pengguna mengonfirmasi commit.
- Detail kebutuhan dan arsitektur tetap merujuk ke `PROJECT.md` dan `ARCHITECTURE.md`.
- Jangan menyalin riwayat percakapan atau isi dokumen lain.
