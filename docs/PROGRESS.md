# PROGRESS.md

Checkpoint singkat kondisi proyek untuk melanjutkan pekerjaan lintas sesi.

## Status

- **Tahap:** Implementasi Backend
- **Fase aktif:** Phase 2 — Backend Authentication & User Management
- **Task aktif:** P2.3 — Google OAuth & Password Recovery (`IN_PROGRESS`, menunggu commit)
- **Task berikutnya:** P2.4 — Authorization
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

## Hasil Berjalan

### P2.2 — Account Management (menunggu commit)

- Schema: enum `AccountTokenType` (`INVITATION`, `PASSWORD_RESET`), model `AccountToken` (hash token, TTL, `usedAt`, cascade delete).
- `src/lib/tokens.ts`: token acak 32 byte + hash SHA-256; `src/middlewares/require-role.ts`: `requireRole('ADMIN')`.
- Endpoint Admin: `POST /api/users/invite`, `GET /api/users`, `PATCH /api/users/:id`; aktivasi publik `GET /api/auth/activation/:token`, `POST /api/auth/activate`.
- Penonaktifan: `INACTIVE` + hapus refresh token, data tetap. Akun `ADMIN` tidak dapat diubah lewat endpoint ini.

### P2.3 — Google OAuth & Password Recovery (menunggu commit)

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

### Temuan Di Luar Scope

- Endpoint ubah password user, kirim ulang undangan, dan email notifikasi status akun dipindahkan ke task baru **P2.5** yang sudah disetujui.
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

1. Commit P2.2 dan P2.3.
2. Isi kredensial Google di `backend/.env` (client ID/secret + redirect URI yang terdaftar di Google Cloud Console) dan `SMTP_*` untuk uji email reset.
3. Lanjut P2.4 — Authorization.
4. P2.5 — Self-Service Password & Account Notifications.

## Aturan Pembaruan

- Perbarui status ketika task dimulai, selesai, atau terblokir.
- Catat hanya progres aktual, blocker, dan langkah berikutnya.
- Tandai task `DONE` setelah kriteria penerimaan terpenuhi dan pengguna mengonfirmasi commit.
- Detail kebutuhan dan arsitektur tetap merujuk ke `PROJECT.md` dan `ARCHITECTURE.md`.
- Jangan menyalin riwayat percakapan atau isi dokumen lain.
