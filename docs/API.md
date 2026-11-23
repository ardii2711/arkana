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

| Method | Endpoint                  | Akses  | Keterangan                                                                                                              |
| ------ | ------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------- |
| POST   | `/auth/login`             | publik | Email + password; memasang cookie sesi                                                                                  |
| POST   | `/auth/refresh`           | cookie | Rotasi refresh token; memasang cookie sesi baru                                                                         |
| POST   | `/auth/logout`            | publik | Mencabut refresh token; `204`                                                                                           |
| GET    | `/auth/me`                | login  | Profil pengguna aktif (`id`, `name`, `email`, `role`, `status`, field profil, `hasAvatar`, `pendingEmail`, `updatedAt`) |
| GET    | `/auth/google`            | publik | Redirect ke Google (Authorization Code + PKCE)                                                                          |
| GET    | `/auth/google/callback`   | publik | Callback OAuth; sukses/gagal redirect ke `CORS_ORIGIN`                                                                  |
| GET    | `/auth/activation/:token` | publik | Info akun untuk halaman aktivasi (`name`, `email`)                                                                      |
| POST   | `/auth/activate`          | publik | Aktivasi akun: `token`, `password`                                                                                      |
| POST   | `/auth/password/forgot`   | publik | Kirim tautan reset; respons selalu `{ sent: true }`                                                                     |
| POST   | `/auth/password/reset`    | publik | Reset password: `token`, `password`                                                                                     |
| POST   | `/auth/password/change`   | login  | `currentPassword`, `newPassword`; mencabut sesi lain                                                                    |

Rate limit per IP: login 10, refresh 60, logout 30, aktivasi 10, Google 20, forgot password 5, reset password 10, change password 5 per 15 menit. Pelanggaran → `429 RATE_LIMITED`.

Kode error OAuth pada redirect ke `/login?error=`: `oauth_cancelled`, `oauth_invalid_state`, `account_not_registered`, `account_inactive`, `google_account_mismatch`, `oauth_failed`.

## 2. Profil Pengguna

Role `USER` dan `ADMIN` (self-service). `GET /auth/me` memuat field profil berikut: `titleBefore`, `titleAfter`, `nip`, `employeeStatus`, `golongan`, `position`, `unit` (semua `null`-able), `hasAvatar` (boolean), dan `updatedAt`. `avatarKey` tidak diekspos.

| Method | Endpoint                | Akses  | Keterangan                                                                                                                                                                                                                                                                 |
| ------ | ----------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PATCH  | `/profile`              | login  | Perubahan parsial (≥ 1 field): `name`, `titleBefore` (≤ 50), `titleAfter` (≤ 100), `nip` (18 digit angka, unik), `employeeStatus` (`PNS` \| `PPPK`), `golongan`, `position` (≤ 100), `unit` (≤ 150). `null` mengosongkan field. 409 `NIP_TAKEN` bila NIP dipakai akun lain |
| POST   | `/profile/email`        | login  | Ajukan perubahan email: `email`. Membuat token `EMAIL_CHANGE` (7 hari, sekali pakai) + `pendingEmail`, tautan dikirim ke email baru. 409 `EMAIL_TAKEN`, 400 `EMAIL_UNCHANGED`, 502 `EMAIL_SEND_FAILED`; dibatasi 5 permintaan / 15 menit                                   |
| POST   | `/profile/email/verify` | publik | Verifikasi token dari email: `token`. Email berubah setelah panggilan ini; notifikasi ke email lama dan baru                                                                                                                                                               |
| POST   | `/profile/avatar`       | login  | Unggah avatar (multipart field `file`): JPG/JPEG/PNG/WEBP, maks 2 MB. Mengganti avatar menghapus objek lama. 400 `AVATAR_TOO_LARGE` \| `INVALID_FILE_TYPE`                                                                                                                 |
| GET    | `/profile/avatar`       | login  | Stream avatar (inline). 404 `NOT_FOUND` bila belum ada                                                                                                                                                                                                                     |
| DELETE | `/profile/avatar`       | login  | Hapus avatar                                                                                                                                                                                                                                                               |

Nilai `golongan` — PNS: `I/a` … `IV/e`; PPPK: `Golongan I` … `Golongan XVII`.

## 3. Endpoint Admin

Role `ADMIN`. Respons daftar akun tidak memuat data pribadi User; Admin hanya dapat menampilkan foto profil User pada daftar akun, tanpa hak mengubah atau menghapusnya.

| Method | Endpoint                       | Keterangan                                                                                                                             |
| ------ | ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| GET    | `/users`                       | `page`, `limit` (maks 100), `search` (nama/email), `status` (`ACTIVE`\|`INVITED`\|`INACTIVE`). Item memuat `hasAvatar` dan `updatedAt` |
| POST   | `/users/invite`                | Undang akun: `name`, `email`; `201`                                                                                                    |
| POST   | `/users/:id/resend-invitation` | Kirim ulang undangan untuk akun `INVITED`                                                                                              |
| PATCH  | `/users/:id`                   | Ubah `name`, `email`, dan/atau `status`                                                                                                |
| GET    | `/users/:id/avatar`            | Stream foto profil akun `USER`; 404 `NOT_FOUND` bila belum ada atau target Admin                                                       |
| DELETE | `/users/:id`                   | Hapus akun `USER` beserta seluruh data dan objek R2-nya; `204`. 403 `FORBIDDEN` untuk akun Admin                                       |
| GET    | `/dashboard/admin`             | `accounts { active, invited, inactive }`, `pendingInvitations`                                                                         |

## 4. Dashboard User

Role `USER`. Seluruh data dibatasi pada kepemilikan pengguna; periode memakai WITA.

| Method | Endpoint     | Keterangan                                                                                                                                                                                                         |
| ------ | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| GET    | `/dashboard` | `summary { monthWorkLogs, weekWorkLogs, evidenceFiles, archive { usedBytes, quotaBytes } }`, `todaySchedules`, `upcomingSchedules` (maks 5), `pinnedNotes` (maks 5), `workLogCategories`, `workLogTrend` (30 hari) |

## 5. Work Log dan Bukti Dukung

Role `USER`, ownership wajib. Tanggal kegiatan memakai WITA dan tidak boleh melewati hari ini.

| Method | Endpoint                               | Keterangan                                                                              |
| ------ | -------------------------------------- | --------------------------------------------------------------------------------------- |
| GET    | `/work-logs`                           | `page`, `limit` (maks 100), `category`, `from`, `to`, `search`; item memuat `fileCount` |
| POST   | `/work-logs`                           | `name`, `description`, `output`, `category`, `target?`, `realisasi?`, `activityDate?`   |
| GET    | `/work-logs/:id`                       | Detail kegiatan beserta `publicToken` dan `fileCount`                                   |
| PATCH  | `/work-logs/:id`                       | Ubah sebagian field                                                                     |
| DELETE | `/work-logs/:id`                       | Hapus kegiatan beserta objek R2 terkait; `204`                                          |
| GET    | `/work-logs/:id/files`                 | Daftar file bukti dukung + `previewable`                                                |
| POST   | `/work-logs/:id/files`                 | Multipart field `file`; `201`                                                           |
| GET    | `/work-logs/:id/files/:fileId/content` | `inline=true` untuk gambar/PDF; default attachment                                      |
| DELETE | `/work-logs/:id/files/:fileId`         | Hapus objek R2 lalu metadata; `204`                                                     |

Batas: 5 MB per file, 10 file per kegiatan, 50 MB total per kegiatan. Format: JPG, JPEG, PNG, WEBP, HEIC, HEIF, PDF, DOC, DOCX, XLS, XLSX.

## 6. Arsip Pribadi

Role `USER`. Privat, tanpa tautan publik. Kuota 1 GB per akun.

| Method | Endpoint                     | Keterangan                                                                                   |
| ------ | ---------------------------- | -------------------------------------------------------------------------------------------- |
| GET    | `/archive/folders`           | Daftar folder + `usage { usedBytes, quotaBytes }`; `fileCount` mencakup seluruh subfolder     |
| POST   | `/archive/folders`           | `name`, `parentId?`; maksimal 3 level                                                        |
| PATCH  | `/archive/folders/:id`       | Ubah `name` dan/atau `parentId`                                                              |
| DELETE | `/archive/folders/:id`       | `recursive=true` untuk hapus isi; `204`                                                      |
| GET    | `/archive/files`             | `folderId` (uuid, ikut subfolder), `search`, `type`, `sort`, `page`, `limit`                  |
| POST   | `/archive/files`             | Multipart `file` + `folderId?` (kosong = arsip utama), `name?`, `description?`, `documentDate?` |
| GET    | `/archive/files/:id`         | Detail dokumen                                                                               |
| PATCH  | `/archive/files/:id`         | Ubah metadata dan/atau pindah folder (`null` = arsip utama)                                  |
| DELETE | `/archive/files/:id`         | Hapus objek R2 lalu metadata; `204`                                                          |
| GET    | `/archive/files/:id/content` | `inline=true` untuk gambar/PDF                                                               |

Catatan: `folderId` berupa uuid menampilkan dokumen pada folder tersebut beserta seluruh turunannya (maksimal 3 level). `folderId=root` menampilkan dokumen pada arsip utama (tanpa folder) dan tidak dipakai UI.

## 7. Laporan Kinerja

| Method | Endpoint                    | Keterangan             |
| ------ | --------------------------- | ---------------------- |
| GET    | `/reports/work-logs`        | Pratinjau rekap (JSON) |
| GET    | `/reports/work-logs/export` | Unduh XLSX/PDF         |

Query: `period` wajib (`daily|weekly|monthly|yearly|custom`), `date` opsional untuk periode non-custom (default hari ini), `from`+`to` wajib untuk `custom`, `category`, `groupBy=category`, `onlyWithEvidence=true`; `format=xlsx|pdf` (default `xlsx`) hanya untuk endpoint export. Periode dihitung WITA; minggu Senin–Minggu.

## 8. Agenda

Role `USER`. Waktu disimpan UTC, filter tanggal memakai WITA. Filter `from`/`to` memakai rentang beririsan, sehingga agenda multi-hari ikut tampil pada tanggal setelah `startAt`.

| Method | Endpoint         | Keterangan                                                                                    |
| ------ | ---------------- | --------------------------------------------------------------------------------------------- |
| GET    | `/schedules`     | `page`, `limit`, `from`, `to`, `status`, `search`                                             |
| POST   | `/schedules`     | `title` dan `startAt` wajib; `description`, `endAt`, `allDay`, `location`, `status` opsional  |
| GET    | `/schedules/:id` | Detail agenda                                                                                 |
| PATCH  | `/schedules/:id` | Ubah sebagian field                                                                           |
| DELETE | `/schedules/:id` | Hapus agenda; `204`                                                                           |

## 9. Catatan

Role `USER`.

| Method | Endpoint     | Keterangan                                            |
| ------ | ------------ | ----------------------------------------------------- |
| GET    | `/notes`     | `page`, `limit`, `search` (isi), `pinned=true\|false` |
| POST   | `/notes`     | `content` wajib, `pinned` opsional                    |
| PATCH  | `/notes/:id` | Ubah `content` dan/atau `pinned`                      |
| DELETE | `/notes/:id` | Hapus catatan; `204`                                  |

Tidak ada endpoint detail; daftar sudah memuat `content`. Urutan: `pinned` lalu `updatedAt` terbaru.

## 10. Bukti Dukung Publik

Tanpa autentikasi, rate limit 120 permintaan/menit per IP. Token permanen, tidak dapat dinonaktifkan pengguna.

| Method | Endpoint                                         | Keterangan                                                          |
| ------ | ------------------------------------------------ | ------------------------------------------------------------------- |
| GET    | `/public/work-logs/:token`                       | Nama kegiatan, tanggal, kategori, uraian, output, dan metadata file |
| GET    | `/public/work-logs/:token/files/:fileId/content` | Konten file; `inline=true` untuk gambar/PDF                         |

Tautan yang dipakai laporan dan aplikasi: `${PUBLIC_WEB_URL}/p/evidence/{publicToken}`.

## 11. Health Check

| Method | Endpoint  | Keterangan                      |
| ------ | --------- | ------------------------------- |
| GET    | `/health` | `status`, `uptime`, `timestamp` |

## 12. Aturan Umum

- Sumber kebenaran role dan status akun adalah database pada setiap request; klaim JWT tidak dipakai untuk otorisasi.
- Resource milik pengguna lain dijawab `404 NOT_FOUND`.
- `requireRole('USER')` melindungi seluruh modul data pribadi; `requireRole('ADMIN')` melindungi modul akun.
- Validasi request memakai Zod; kegagalan → `400 VALIDATION_ERROR` dengan `details[].path` dan `details[].message`.
- Error tak terduga → `500 INTERNAL_SERVER_ERROR`; detail hanya ditampilkan di luar produksi.
