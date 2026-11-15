# API.md

Referensi REST API backend ARKANA. Prefix seluruh endpoint: `/api`.

- Format data: JSON, kecuali upload multipart dan endpoint konten file.
- Envelope sukses: `{ "success": true, "data": ... }`.
- Envelope gagal: `{ "success": false, "error": { "code", "message", "details?" } }`.
- Respons `204` tidak memiliki body.
- Endpoint konten file mengalirkan berkas langsung dengan `Content-Disposition`, `Content-Length`, `Cache-Control: private`, dan `X-Content-Type-Options: nosniff`.

Definisi field, batas panjang, dan enum mengikuti skema Zod di `backend/src/modules/**/*.schema.ts` serta enum di `backend/prisma/schema.prisma`.

## 1. Autentikasi dan Sesi

Cookie sesi: `arkana_access` (path `/`, 15 menit) dan `arkana_refresh` (path `/api/auth`, 30 hari). Keduanya `httpOnly`, `sameSite=lax`, dan `secure` pada produksi.

| Method | Endpoint                  | Akses  | Keterangan                                                      |
| ------ | ------------------------- | ------ | --------------------------------------------------------------- |
| POST   | `/auth/login`             | publik | Email + password; memasang cookie sesi                          |
| POST   | `/auth/refresh`           | cookie | Rotasi refresh token; memasang cookie sesi baru                 |
| POST   | `/auth/logout`            | publik | Mencabut refresh token; `204`                                   |
| GET    | `/auth/me`                | login  | Profil pengguna aktif (`id`, `name`, `email`, `role`, `status`) |
| GET    | `/auth/google`            | publik | Redirect ke Google (Authorization Code + PKCE)                  |
| GET    | `/auth/google/callback`   | publik | Callback OAuth; sukses/gagal redirect ke `CORS_ORIGIN`          |
| GET    | `/auth/activation/:token` | publik | Info akun untuk halaman aktivasi (`name`, `email`)              |
| POST   | `/auth/activate`          | publik | Aktivasi akun: `token`, `password`                              |
| POST   | `/auth/password/forgot`   | publik | Kirim tautan reset; respons selalu `{ sent: true }`             |
| POST   | `/auth/password/reset`    | publik | Reset password: `token`, `password`                             |
| POST   | `/auth/password/change`   | login  | `currentPassword`, `newPassword`; mencabut sesi lain            |

Rate limit per IP: login 10, aktivasi 10, Google 20, forgot password 5, reset password 10, change password 5 per 15 menit. Pelanggaran → `429 RATE_LIMITED`.

Kode error OAuth pada redirect ke `/login?error=`: `oauth_cancelled`, `oauth_invalid_state`, `account_not_registered`, `account_inactive`, `google_account_mismatch`, `oauth_failed`.

## 2. Endpoint Admin

Role `ADMIN`. Respons daftar akun tidak memuat data pribadi User.

| Method | Endpoint                       | Keterangan                                                     |
| ------ | ------------------------------ | -------------------------------------------------------------- |
| GET    | `/users`                       | `page`, `limit` (maks 100), `search` (nama/email)              |
| POST   | `/users/invite`                | Undang akun: `name`, `email`; `201`                            |
| POST   | `/users/:id/resend-invitation` | Kirim ulang undangan untuk akun `INVITED`                      |
| PATCH  | `/users/:id`                   | Ubah `name`, `email`, dan/atau `status`                        |
| GET    | `/dashboard/admin`             | `accounts { active, invited, inactive }`, `pendingInvitations` |

## 3. Dashboard User

Role `USER`. Seluruh data dibatasi pada kepemilikan pengguna; periode memakai WITA.

| Method | Endpoint     | Keterangan                                                                                                                                                                                                         |
| ------ | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| GET    | `/dashboard` | `summary { monthWorkLogs, weekWorkLogs, evidenceFiles, archive { usedBytes, quotaBytes } }`, `todaySchedules`, `upcomingSchedules` (maks 5), `pinnedNotes` (maks 5), `workLogCategories`, `workLogTrend` (30 hari) |

## 4. Work Log dan Bukti Dukung

Role `USER`, ownership wajib. Tanggal kegiatan memakai WITA dan tidak boleh melewati hari ini.

| Method | Endpoint                               | Keterangan                                                                            |
| ------ | -------------------------------------- | ------------------------------------------------------------------------------------- |
| GET    | `/work-logs`                           | `page`, `limit` (maks 100), `category`, `from`, `to`, `search`                        |
| POST   | `/work-logs`                           | `name`, `description`, `output`, `category`, `target?`, `realisasi?`, `activityDate?` |
| GET    | `/work-logs/:id`                       | Detail kegiatan beserta `publicToken`                                                 |
| PATCH  | `/work-logs/:id`                       | Ubah sebagian field                                                                   |
| DELETE | `/work-logs/:id`                       | Hapus kegiatan beserta objek R2 terkait; `204`                                        |
| GET    | `/work-logs/:id/files`                 | Daftar file bukti dukung + `previewable`                                              |
| POST   | `/work-logs/:id/files`                 | Multipart field `file`; `201`                                                         |
| GET    | `/work-logs/:id/files/:fileId/content` | `inline=true` untuk gambar/PDF; default attachment                                    |
| DELETE | `/work-logs/:id/files/:fileId`         | Hapus objek R2 lalu metadata; `204`                                                   |

Batas: 5 MB per file, 10 file per kegiatan, 50 MB total per kegiatan. Format: JPG, JPEG, PNG, WEBP, HEIC, HEIF, PDF, DOC, DOCX, XLS, XLSX.

## 5. Arsip Pribadi

Role `USER`. Privat, tanpa tautan publik. Kuota 1 GB per akun.

| Method | Endpoint                     | Keterangan                                                               |
| ------ | ---------------------------- | ------------------------------------------------------------------------ |
| GET    | `/archive/folders`           | Daftar folder + `usage { usedBytes, quotaBytes }`                        |
| POST   | `/archive/folders`           | `name`, `parentId?`; maksimal 3 level                                    |
| PATCH  | `/archive/folders/:id`       | Ubah `name` dan/atau `parentId`                                          |
| DELETE | `/archive/folders/:id`       | `recursive=true` untuk hapus isi; `204`                                  |
| GET    | `/archive/files`             | `folderId` (`root`/uuid), `search`, `type`, `sort`, `page`, `limit`      |
| POST   | `/archive/files`             | Multipart `file` + `folderId?`, `name?`, `description?`, `documentDate?` |
| GET    | `/archive/files/:id`         | Detail dokumen                                                           |
| PATCH  | `/archive/files/:id`         | Ubah metadata dan/atau pindah folder                                     |
| DELETE | `/archive/files/:id`         | Hapus objek R2 lalu metadata; `204`                                      |
| GET    | `/archive/files/:id/content` | `inline=true` untuk gambar/PDF                                           |

## 6. Laporan Kinerja

| Method | Endpoint                    | Keterangan     |
| ------ | --------------------------- | -------------- |
| GET    | `/reports/work-logs/export` | Unduh XLSX/PDF |

Query: `format=xlsx|pdf` (default `xlsx`), `period=daily|weekly|monthly|yearly|custom`, `date` (opsional untuk periode non-custom), `from`+`to` (wajib untuk `custom`), `category`, `groupBy=category`, `onlyWithEvidence=true`. Periode dihitung WITA; minggu Senin–Minggu.

## 7. Agenda

Role `USER`. Waktu disimpan UTC, filter tanggal memakai WITA.

| Method | Endpoint         | Keterangan                                                                                            |
| ------ | ---------------- | ----------------------------------------------------------------------------------------------------- |
| GET    | `/schedules`     | `page`, `limit`, `from`, `to`, `category`, `status`, `search`                                         |
| POST   | `/schedules`     | `title`, `startAt`, `category` wajib; `description`, `endAt`, `allDay`, `location`, `status` opsional |
| GET    | `/schedules/:id` | Detail agenda                                                                                         |
| PATCH  | `/schedules/:id` | Ubah sebagian field                                                                                   |
| DELETE | `/schedules/:id` | Hapus agenda; `204`                                                                                   |

## 8. Catatan

Role `USER`.

| Method | Endpoint     | Keterangan                                            |
| ------ | ------------ | ----------------------------------------------------- |
| GET    | `/notes`     | `page`, `limit`, `search` (isi), `pinned=true\|false` |
| POST   | `/notes`     | `content` wajib, `pinned` opsional                    |
| PATCH  | `/notes/:id` | Ubah `content` dan/atau `pinned`                      |
| DELETE | `/notes/:id` | Hapus catatan; `204`                                  |

Tidak ada endpoint detail; daftar sudah memuat `content`. Urutan: `pinned` lalu `updatedAt` terbaru.

## 9. Bukti Dukung Publik

Tanpa autentikasi, rate limit 120 permintaan/menit per IP. Token permanen, tidak dapat dinonaktifkan pengguna.

| Method | Endpoint                                         | Keterangan                                                          |
| ------ | ------------------------------------------------ | ------------------------------------------------------------------- |
| GET    | `/public/work-logs/:token`                       | Nama kegiatan, tanggal, kategori, uraian, output, dan metadata file |
| GET    | `/public/work-logs/:token/files/:fileId/content` | Konten file; `inline=true` untuk gambar/PDF                         |

Tautan yang dipakai laporan dan aplikasi: `${PUBLIC_WEB_URL}/p/evidence/{publicToken}`.

## 10. Health Check

| Method | Endpoint  | Keterangan                      |
| ------ | --------- | ------------------------------- |
| GET    | `/health` | `status`, `uptime`, `timestamp` |

## 11. Aturan Umum

- Sumber kebenaran role dan status akun adalah database pada setiap request; klaim JWT tidak dipakai untuk otorisasi.
- Resource milik pengguna lain dijawab `404 NOT_FOUND`.
- `requireRole('USER')` melindungi seluruh modul data pribadi; `requireRole('ADMIN')` melindungi modul akun.
- Validasi request memakai Zod; kegagalan → `400 VALIDATION_ERROR` dengan `details[].path` dan `details[].message`.
- Error tak terduga → `500 INTERNAL_SERVER_ERROR`; detail hanya ditampilkan di luar produksi.
