# PROGRESS.md

Checkpoint singkat kondisi proyek untuk melanjutkan pekerjaan lintas sesi.

## Status

- **Tahap:** Implementasi Backend
- **Fase aktif:** Phase 1 — Backend Foundation
- **Task aktif:** P1.1 — Inisialisasi Monorepo dan Backend (`IN_PROGRESS`, menunggu commit)
- **Task berikutnya:** P1.2 — Database Foundation
- **Update terakhir:** 14 November 2026

## Kesiapan Proyek

- [x] `PROJECT.md`
- [x] `ARCHITECTURE.md`
- [x] `ROADMAP.md`
- [x] `AGENTS.md`

## Hasil Terakhir — P1.1

- Git repository diinisialisasi di root.
- Struktur monorepo tanpa npm workspaces: root `package.json` (script orkestrasi `--prefix backend`), `backend/`, `docs/`.
- Backend Express 5 + TypeScript ESM (NodeNext), Node 24.
- Konfigurasi: `tsconfig.json`, ESLint flat config (`typescript-eslint` + Prettier), Prettier di `backend/package.json`.
- Env divalidasi Zod di `backend/src/config/env.ts`; memakai `--env-file-if-exists` bawaan Node (tanpa `dotenv`).
- Logger Pino + `pino-http` (redaksi header `authorization`/`cookie`, `pino-pretty` hanya dev).
- Pola response `{ success, data }` / `{ success:false, error:{ code, message } }`, `ApiError`, error handler terpusat, 404 handler, helmet, CORS ketat, graceful shutdown.
- Endpoint `GET /api/health` aktif.
- Pemeriksaan: `typecheck`, `lint`, dan `build` lulus; server jalan dan health check merespons 200, route tidak dikenal 404.

### Keputusan Teknis

- TypeScript dipin ke 6.0.3, bukan 7.0.2 (`latest`), karena `typescript-eslint@8.x` belum mendukung TS 7.
- Tidak memakai `dotenv`; Node 24 menyediakan `--env-file-if-exists`.

## Urutan Pengembangan

1. **Backend:** fondasi, database, autentikasi, seluruh modul, dan verifikasi API.
2. **Frontend:** fondasi, autentikasi, layout, seluruh modul, dan integrasi API.
3. **Finalisasi:** pengujian menyeluruh, keamanan, deployment, backup, dan recovery.

**Aturan utama:** Pengembangan frontend hanya dimulai setelah seluruh backend selesai dan diverifikasi.

## Pekerjaan Berikutnya

1. Pengguna melakukan commit P1.1.
2. Mulai P1.2 — Database Foundation (Prisma, koneksi Supabase PostgreSQL, model awal, seed, akun Admin).

## Aturan Pembaruan

- Perbarui status ketika task dimulai, selesai, atau terblokir.
- Catat hanya progres aktual, blocker, dan langkah berikutnya.
- Tandai task `DONE` setelah kriteria penerimaan terpenuhi dan pengguna mengonfirmasi commit.
- Detail kebutuhan dan arsitektur tetap merujuk ke `PROJECT.md` dan `ARCHITECTURE.md`.
- Jangan menyalin riwayat percakapan atau isi dokumen lain.
