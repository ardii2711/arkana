# PROGRESS.md

Checkpoint singkat kondisi proyek untuk melanjutkan pekerjaan lintas sesi.

## Status

- **Tahap:** Implementasi Backend
- **Fase aktif:** Phase 2 — Backend Authentication & User Management
- **Task aktif:** P2.2 — Account Management (`IN_PROGRESS`, menunggu commit)
- **Task berikutnya:** P2.3 — Google OAuth & Password Recovery
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

## Hasil Berjalan — P2.2

- Schema: enum `AccountTokenType` (`INVITATION`, `PASSWORD_RESET`) dan model `AccountToken` (hash token, TTL, `usedAt`, cascade delete).
- `src/lib/tokens.ts`: token acak 32 byte + hash SHA-256, dipakai bersama auth dan users.
- `src/middlewares/require-role.ts`: `requireRole('ADMIN')`, akan dipakai ulang di P2.4.
- Endpoint Admin: `POST /api/users/invite`, `GET /api/users` (page/limit/search), `PATCH /api/users/:id`.
- Undangan: User `INVITED`, token 7 hari, email Resend berisi `${CORS_ORIGIN}/activate?token=...`; bila pengiriman gagal, user dihapus kembali.
- Aktivasi publik: `GET /api/auth/activation/:token`, `POST /api/auth/activate` (Argon2id, token sekali pakai, rate limit).
- Penonaktifan: `INACTIVE` + hapus semua refresh token; data user tetap. Akun `ADMIN` tidak dapat diubah lewat endpoint ini. Aktivasi manual tanpa password ditolak.
- Pemeriksaan statis (`typecheck`, `lint`, `format:check`, `build`): lulus.
- Smoke end-to-end (data uji dihapus setelahnya): invite 201 (`INVITED`), list 200, activation info 200, activate 200, replay token 400, login user 200, deactivate 200 (`INACTIVE`), login setelah nonaktif 401, patch Admin 403, invite duplikat 409, list tanpa auth 401.

### Temuan Di Luar Scope

- Endpoint ubah password user, kirim ulang undangan, dan email notifikasi status akun dipindahkan ke task baru **P2.5** yang sudah disetujui.

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

1. Commit P2.2.
2. Lanjut P2.3 — Google OAuth & Password Recovery (`AccountToken` tipe `PASSWORD_RESET` sudah tersedia).
3. P2.4 — Authorization, lalu P2.5 — Self-Service Password & Account Notifications (task baru disetujui).

## Aturan Pembaruan

- Perbarui status ketika task dimulai, selesai, atau terblokir.
- Catat hanya progres aktual, blocker, dan langkah berikutnya.
- Tandai task `DONE` setelah kriteria penerimaan terpenuhi dan pengguna mengonfirmasi commit.
- Detail kebutuhan dan arsitektur tetap merujuk ke `PROJECT.md` dan `ARCHITECTURE.md`.
- Jangan menyalin riwayat percakapan atau isi dokumen lain.
