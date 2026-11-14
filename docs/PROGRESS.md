# PROGRESS.md

Checkpoint singkat kondisi proyek untuk melanjutkan pekerjaan lintas sesi.

## Status

- **Tahap:** Implementasi Backend
- **Fase aktif:** Phase 1 — Backend Foundation
- **Task aktif:** P2.1 — Authentication (`IN_PROGRESS`, menunggu commit)
- **Task berikutnya:** P2.2 — Account Management
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

## Hasil Terakhir — P1.2

- Prisma 7.10.1 + `@prisma/adapter-pg` + `pg`; `argon2` untuk hash password seed.
- `backend/prisma/schema.prisma`: enum `Role`, `UserStatus`, model `User` (fondasi akun).
- `backend/prisma.config.ts`: schema path, `migrations.path`, `prisma db seed`, datasource `DIRECT_URL`, `SHADOW_DATABASE_URL` opsional, env dimuat via `process.loadEnvFile()`.
- `backend/prisma/seed.ts`: Admin idempoten (upsert by email), Argon2id, menolak Admin kedua.
- `backend/src/lib/prisma.ts`: singleton PrismaClient + adapter dari `DATABASE_URL`; disconnect saat shutdown.
- Script: `postinstall`/`db:generate`/`db:migrate`/`db:seed`; kode generated di `src/generated/prisma` (gitignored).
- `.env.example` memuat `DATABASE_URL` (transaction pooler 6543), `DIRECT_URL` (session pooler 5432), `ADMIN_EMAIL`, `ADMIN_PASSWORD`.

### Keputusan Teknis

- Prisma dipin 7.10.1; `latest` 8.0.0-rc belum stabil.
- Migration memakai session pooler karena direct connection Supabase IPv6-only.
- TypeScript tetap 6.0.3 (typescript-eslint belum mendukung TS 7).
- Model token/invitation belum dibuat; menyusul di P2.1–P2.3.

## Hasil Berjalan — P1.3

- `@aws-sdk/client-s3` 3.1169.0 (R2) dan `nodemailer` 10.5.0 (SMTP) ditambahkan.
- `src/lib/storage.ts`: `S3Client` R2 (region `auto`, endpoint dari `R2_ENDPOINT` atau diturunkan dari `R2_ACCOUNT_ID`).
- `src/lib/mailer.ts`: transport SMTP + `sendMail()`.
- `src/middlewares/validate.ts`: validasi Zod `body`/`query`/`params`, hasil terparse di `res.locals.input`.
- `error-handler.ts`: `ZodError` → 400 `VALIDATION_ERROR` dengan daftar `details`.
- Env baru: `R2_*`, `SMTP_*`, `MAIL_FROM` (wajib, fail fast).
- Verifikasi R2 `HeadBucket` dengan kredensial aktual: **berhasil**.
- Verifikasi SMTP Resend (`transport.verify()`): **berhasil** (`smtp.resend.com:465`, domain sender terverifikasi).
- Smoke test: server start dengan env lengkap, `GET /api/health` 200.

## Hasil Berjalan — P2.1

- Dependensi: `jose` 6.2.17 (JWT HS256), `cookie-parser`, `express-rate-limit` 8.7.4.
- Schema: model `RefreshToken` (hash token, `expiresAt`, relasi `User`, cascade delete, index `userId`).
- `src/modules/auth/`: routes, controller, service, schema Zod, token helper, cookie helper.
- `src/middlewares/require-auth.ts`: verifikasi access cookie, muat user, wajib `ACTIVE`.
- Endpoint: `POST /api/auth/login` (rate limit 10/15 menit per IP), `POST /api/auth/refresh`, `POST /api/auth/logout`, `GET /api/auth/me`.
- Cookie HTTP-only `arkana_access` (path `/`, 15 menit) dan `arkana_refresh` (path `/api/auth`, 30 hari), `secure` di production, `sameSite=lax`; `trust proxy` aktif di production.
- Logger meredaksi `req.headers.cookie`, `req.headers.authorization`, dan `res.headers["set-cookie"]` (token tidak pernah masuk log).
- Rotasi sesi: token lama dihapus, token baru diterbitkan; token kedaluwarsa dibersihkan saat refresh.
- Env baru: `JWT_ACCESS_SECRET` (minimal 32 karakter).
- Pemeriksaan statis (`typecheck`, `lint`, `format:check`, `build`): lulus.
- Smoke end-to-end dengan akun Admin: login 200, `/me` 200, refresh 200 + token rotasi, replay refresh lama 401, logout 204, refresh setelah logout 401, password salah 401.
- Catatan: access token bersifat stateless, tetap valid sampai kedaluwarsa setelah logout (sesuai desain).

## Pemeriksaan P1.2

- `prisma validate`, `prisma generate`, `typecheck`, `lint`, `format:check`, `build`: lulus.
- Smoke import Prisma Client via tsx: OK; server start + `GET /api/health` 200.
- `prisma migrate status`: migration `init` sudah applied, schema up to date.
- Seed terverifikasi: 1 user, 1 Admin di database.

## Urutan Pengembangan

1. **Backend:** fondasi, database, autentikasi, seluruh modul, dan verifikasi API.
2. **Frontend:** fondasi, autentikasi, layout, seluruh modul, dan integrasi API.
3. **Finalisasi:** pengujian menyeluruh, keamanan, deployment, backup, dan recovery.

**Aturan utama:** Pengembangan frontend hanya dimulai setelah seluruh backend selesai dan diverifikasi.

## Pekerjaan Berikutnya

1. Commit P2.1.
2. Lanjut P2.2 — Account Management.

## Aturan Pembaruan

- Perbarui status ketika task dimulai, selesai, atau terblokir.
- Catat hanya progres aktual, blocker, dan langkah berikutnya.
- Tandai task `DONE` setelah kriteria penerimaan terpenuhi dan pengguna mengonfirmasi commit.
- Detail kebutuhan dan arsitektur tetap merujuk ke `PROJECT.md` dan `ARCHITECTURE.md`.
- Jangan menyalin riwayat percakapan atau isi dokumen lain.
