# PROGRESS.md

Checkpoint singkat kondisi proyek untuk melanjutkan pekerjaan lintas sesi.

## Status

- **Tahap:** Implementasi Backend
- **Fase aktif:** Phase 1 — Backend Foundation
- **Task aktif:** P1.2 — Database Foundation (`IN_PROGRESS`, menunggu migration manual dan commit)
- **Task berikutnya:** P1.3 — Infrastruktur Backend
- **Update terakhir:** 14 November 2026

## Kesiapan Proyek

- [x] `PROJECT.md`
- [x] `ARCHITECTURE.md`
- [x] `ROADMAP.md`
- [x] `AGENTS.md`

## Task Selesai

- **P1.1 — Inisialisasi Monorepo dan Backend:** `DONE` (commit `91c1198`).
- **P1.2 — Database Foundation:** implementasi selesai, menunggu migration manual + seed + commit.

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

## Pemeriksaan P1.2

- `prisma validate`, `prisma generate`, `typecheck`, `lint`, `format:check`, `build`: lulus.
- Smoke import Prisma Client via tsx: OK; server start + `GET /api/health` 200.
- `prisma migrate status`: koneksi database berhasil, belum ada migration.
- Tindakan manual tertunda: `npm --prefix backend exec prisma migrate dev --name init`, lalu `npm --prefix backend run db:seed`.

## Urutan Pengembangan

1. **Backend:** fondasi, database, autentikasi, seluruh modul, dan verifikasi API.
2. **Frontend:** fondasi, autentikasi, layout, seluruh modul, dan integrasi API.
3. **Finalisasi:** pengujian menyeluruh, keamanan, deployment, backup, dan recovery.

**Aturan utama:** Pengembangan frontend hanya dimulai setelah seluruh backend selesai dan diverifikasi.

## Pekerjaan Berikutnya

1. Jalankan migration dan seed (manual oleh pengguna), konfirmasi hasilnya.
2. Commit P1.2.
3. Mulai P1.3 — Infrastruktur Backend (R2, email, logging/keamanan dasar, pola response + validasi request).

## Aturan Pembaruan

- Perbarui status ketika task dimulai, selesai, atau terblokir.
- Catat hanya progres aktual, blocker, dan langkah berikutnya.
- Tandai task `DONE` setelah kriteria penerimaan terpenuhi dan pengguna mengonfirmasi commit.
- Detail kebutuhan dan arsitektur tetap merujuk ke `PROJECT.md` dan `ARCHITECTURE.md`.
- Jangan menyalin riwayat percakapan atau isi dokumen lain.
