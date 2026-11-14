# PROGRESS.md

Checkpoint singkat kondisi proyek untuk melanjutkan pekerjaan lintas sesi.

## Status

- **Tahap:** Implementasi Backend
- **Fase aktif:** Phase 2 — Backend Authentication & User Management
- **Task aktif:** P2.5 — Self-Service Password & Account Notifications (`IN_PROGRESS`, menunggu commit)
- **Task berikutnya:** P3.1 — Work Log
- **Update terakhir:** 14 November 2026

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

### P2.4 — Authorization (menunggu commit)

- Audit seluruh rute yang ada:
  - Publik: `GET /api/health`; `POST /api/auth/login`, `/refresh`, `/logout`, `/activate`, `/password/forgot`, `/password/reset`; `GET /api/auth/activation/:token`, `/google`, `/google/callback`.
  - Login: `GET /api/auth/me`.
  - Admin: `GET /api/users`, `POST /api/users/invite`, `PATCH /api/users/:id` (via `requireRole('ADMIN')`).
- Tidak ada endpoint data milik User pada tahap ini, sehingga pola ownership ditetapkan sebagai konvensi, bukan helper baru: lihat `ARCHITECTURE.md` §7.4.
- Otorisasi tidak memakai klaim role dari JWT; `requireAuth` memuat ulang user dari database dan menolak akun non-`ACTIVE`.
- Tidak ada perubahan kode; hanya `ARCHITECTURE.md` §7.4.

### P2.5 — Self-Service Password & Account Notifications (menunggu commit)

- `POST /api/auth/password/change` (login, rate limit 5/15 menit): wajib `currentPassword`, `newPassword` minimal 8 karakter; Argon2id; mencabut seluruh refresh token kecuali sesi saat ini. Akun tanpa password (Google-only) ditolak `PASSWORD_NOT_SET` dan diarahkan ke reset password.
- `POST /api/users/:id/resend-invitation` (Admin): hanya untuk akun `INVITED`; token undangan lama yang belum terpakai dihapus, token baru berlaku 7 hari; kegagalan email membatalkan token baru dan membalas 502.
- `src/lib/account-mail.ts`: template undangan, aktivasi, perubahan email (dikirim ke email lama dan baru), dan penonaktifan akun.
- Email notifikasi aktivasi dan penonaktifan dikirim hanya saat status berubah; perubahan email hanya saat alamat benar-benar berubah. Semua notifikasi non-kritis bersifat fail-soft (kegagalan dicatat di log, operasi tetap berhasil).
- Tidak ada perubahan schema/migration.
- Pemeriksaan statis (`typecheck`, `lint`, `format:check`, `build`): lulus.

### Temuan Di Luar Scope

- Access token masih berupa JWT stateless: setelah ganti password atau penonaktifan, access token lama tetap valid maksimal 15 menit. Bila perlu pencabutan instan, tambahkan penanda versi sesi pada `User` dan periksa di `requireAuth`.
- Akun yang hanya login lewat Google belum dapat menetapkan password sendiri; harus lewat alur reset password.
- Cookie sesi memakai `sameSite=lax`. Pada deployment frontend dan backend beda site (Vercel ↔ Render), cookie tidak terkirim pada request XHR lintas site. Perlu keputusan `sameSite=none` + `secure` atau domain induk bersama sebelum P12.

## Keputusan Teknis Kumulatif

- Prisma 7.10.1 (stable; `latest` 8.0.0-rc dihindari), driver adapter `@prisma/adapter-pg`.
- TypeScript 6.0.3 (typescript-eslint belum mendukung TS 7).
- Migration memakai session pooler Supabase; runtime memakai transaction pooler.
- Auth: access JWT 15 menit di cookie HTTP-only, refresh token opaque 30 hari (hash di DB, rotasi), `sameSite=lax`, `secure` di production.
- Logger meredaksi `cookie`, `authorization`, dan `set-cookie`.
- Env wajib fail-fast via Zod; `JWT_ACCESS_SECRET` minimal 32 karakter.

## Urutan Pengembangan

1. **Backend:** fondasi, database, autentikasi, seluruh modul, dan verifikasi API.
2. **Frontend:** fondasi, autentikasi, layout, seluruh modul, dan integrasi API.
3. **Finalisasi:** pengujian menyeluruh, keamanan, deployment, backup, dan recovery.

**Aturan utama:** Pengembangan frontend hanya dimulai setelah seluruh backend selesai dan diverifikasi.

## Pekerjaan Berikutnya

1. Commit P2.5.
2. Lanjut Phase 3 — P3.1 Work Log.

## Aturan Pembaruan

- Perbarui status ketika task dimulai, selesai, atau terblokir.
- Catat hanya progres aktual, blocker, dan langkah berikutnya.
- Tandai task `DONE` setelah kriteria penerimaan terpenuhi dan pengguna mengonfirmasi commit.
- Detail kebutuhan dan arsitektur tetap merujuk ke `PROJECT.md` dan `ARCHITECTURE.md`.
- Jangan menyalin riwayat percakapan atau isi dokumen lain.
