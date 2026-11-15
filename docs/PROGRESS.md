# PROGRESS.md

Checkpoint singkat kondisi proyek untuk melanjutkan pekerjaan lintas sesi.

## Status

- **Tahap:** Implementasi Backend
- **Fase aktif:** Phase 6 — Backend Schedule & Reminder
- **Task aktif:** P6.1 — Finalisasi Kebutuhan Agenda (`IN_PROGRESS`, dokumen, menunggu commit)
- **Task berikutnya:** P6.2 — Schedule API
- **Update terakhir:** 15 November 2026

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

### P6.1 — Finalisasi Kebutuhan Agenda (menunggu commit)

- Field agenda: `title` (wajib), `description` opsional, `startAt`, `endAt` opsional, `allDay` (default `false`), `location` opsional, `category`, `status` (default `NOT_STARTED`).
- Kategori enum: Rapat dan Koordinasi, Pekerjaan dan Tugas, Pelatihan dan Pengembangan Kompetensi, Perjalanan Dinas, Kegiatan Pribadi, Tenggat Waktu (Deadline), Lainnya.
- Status enum: Belum Dimulai (`NOT_STARTED`), Selesai (`DONE`), Dibatalkan (`CANCELLED`).
- Zona waktu acuan WITA (`Asia/Makassar`).
- Tanpa pengulangan agenda; tanpa pengingat/notifikasi (ditangguhkan).
- Hanya mengubah `PROJECT.md` §5.5 dan §8 serta `ROADMAP.md` P6.1–P6.2; tidak ada perubahan kode.

### Temuan Di Luar Scope

- Access token masih berupa JWT stateless: setelah ganti password atau penonaktifan, access token lama tetap valid maksimal 15 menit. Bila perlu pencabutan instan, tambahkan penanda versi sesi pada `User` dan periksa di `requireAuth`.
- Akun yang hanya login lewat Google belum dapat menetapkan password sendiri; harus lewat alur reset password.
- Cookie sesi memakai `sameSite=lax`. Pada deployment frontend dan backend beda site (Vercel ↔ Render), cookie tidak terkirim pada request XHR lintas site. Perlu keputusan `sameSite=none` + `secure` atau domain induk bersama sebelum P12.
- `busboy` mendekode nama file multipart sebagai latin1; nama file non-ASCII berpotensi tampil tidak sesuai. Perlu normalisasi bila diperlukan.
- Pengingat dan notifikasi agenda ditangguhkan: perlu keputusan kanal (email/in-app), mekanisme penjadwalan, dan penanganan multi-instance sebelum dijadwalkan sebagai task roadmap baru.

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

## Urutan Pengembangan

1. **Backend:** fondasi, database, autentikasi, seluruh modul, dan verifikasi API.
2. **Frontend:** fondasi, autentikasi, layout, seluruh modul, dan integrasi API.
3. **Finalisasi:** pengujian menyeluruh, keamanan, deployment, backup, dan recovery.

**Aturan utama:** Pengembangan frontend hanya dimulai setelah seluruh backend selesai dan diverifikasi.

## Pekerjaan Berikutnya

1. Commit P6.1 (perubahan dokumen).
2. Lanjut P6.2 — Schedule API: model `Schedule` + enum kategori/status, CRUD, filter rentang tanggal/kategori/status/pencarian.
3. Isi kredensial Google dan `SMTP_*` di `backend/.env` untuk uji manual fitur auth.

## Aturan Pembaruan

- Perbarui status ketika task dimulai, selesai, atau terblokir.
- Catat hanya progres aktual, blocker, dan langkah berikutnya.
- Tandai task `DONE` setelah kriteria penerimaan terpenuhi dan pengguna mengonfirmasi commit.
- Detail kebutuhan dan arsitektur tetap merujuk ke `PROJECT.md` dan `ARCHITECTURE.md`.
- Jangan menyalin riwayat percakapan atau isi dokumen lain.
