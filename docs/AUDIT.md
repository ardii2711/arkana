# AUDIT.md

Laporan audit kode ARKANA (frontend + backend), dilakukan 16 November 2026.
Fokus: kode mati, duplikasi & reusability, konsistensi struktur & arsitektur, konstanta & konfigurasi, clean code umum.

Dokumen ini hanya laporan. Tidak ada file yang diubah selain dokumen ini. Temuan belum diverifikasi lewat test/runtime; yang ditandai **perlu verifikasi** wajib dicek sebelum diperbaiki. Estimasi dampak: `rendah`, `sedang`, `tinggi`. Item yang sudah diselesaikan dihapus dari laporan; nomor item dipertahankan sehingga penomoran dapat memiliki celah.

Struktur laporan:

- Bagian A — Backend
- Bagian B — Frontend
- Bagian C — Rekomendasi urutan perbaikan (dibagi task kecil, satu commit per task)
- Bagian D — Pertimbangan & risiko umum
- Bagian E — Keputusan yang menunggu pengguna

---

## A. Backend

Struktur aktual: Express 5 + Prisma 7 (driver adapter `@prisma/adapter-pg`) + Zod + R2 (S3). ESM, TypeScript strict. Pola modular layered: `routes/controller/(service)/schema`. Tidak ada `.repository.ts` — semua service memanggil `prisma` langsung. `ARCHITECTURE.md` mendokumentasikan lapisan Repository, jadi ada gap antara dokumen dan implementasi (lihat A-17).

Pemeriksaan statis yang berjalan: `eslint src` hijau (termasuk `no-unused-vars`). Tidak ada TODO/FIXME di `src`.

### A.2 Pesan error menyesatkan karena angka hardcode

**Lokasi:** `src/lib/multipart.ts` (`fileTooLarge()`), `src/modules/work-logs/work-log-file.service.ts:72,78`, `src/modules/archive/archive.service.ts:341`, `src/modules/archive/archive.service.ts:185,233`.

**Masalah:** Teks seperti "Maksimal 10 file per kegiatan", "50 MB", "1 GB", "Kedalaman folder maksimal 3 level", "batas 5 MB" ditulis literal, padahal konstanta sumbernya sudah ada (`MAX_FILES_PER_WORK_LOG`, `MAX_TOTAL_BYTES_PER_WORK_LOG`, `ARCHIVE_QUOTA_BYTES`, `MAX_FOLDER_LEVEL`, `MAX_FILE_BYTES`). Dua risiko:

1. Drift: konstanta diubah, pesan lupa diubah → pengguna menerima informasi salah.
2. `fileTooLarge()` membangun pesan "batas 5 MB" padahal limit aktual adalah `Math.min(MAX_FILE_BYTES, sisaKuota)` — bisa jauh lebih kecil saat kuota arsip hampir habis. Pesan menjadi salah bagi kasus tersebut.

**Rekomendasi:** interpolasi angka ke dalam pesan dari konstanta, atau bangun pesan dari nilai `maxBytes` aktual; untuk kasus sisa kuota, gunakan pesan generik ("File melebihi batas yang diizinkan").

**Dampak:** sedang.

### A.3 Duplikasi fungsi identik / hampir identik

**A.3.1 `requoteStorageError` di dua tempat (identik).**
`work-log-file.service.ts:42-52` dan `archive.service.ts:91-101`: ApiError diteruskan apa adanya, error lain dibungkus menjadi `storageError` (502). **Rekomendasi:** satu helper `ensureStorageError`/`mapStorageError` di `lib/storage.ts`. **Dampak:** sedang.

**A.3.2 Date-only — empat salinan dengan tiga nama.**
`toDateOnly` (`work-log.service.ts:41`), `toDateOnly` (`archive.service.ts:332`), `toDbDate` (`report.service.ts:12`), `parseDate` (`report.period.ts:42`) — logika sama: ambil bagian tanggal untuk disimpan sebagai `@db.Date` (UTC midnight). **Rekomendasi:** satu helper `dateOnlyUtc(value)` di `lib/wita.ts` atau `lib/date.ts`. **Dampak:** sedang.

**A.3.3 Select profil 15-field di-duplikasi.**
Blok `select` Prisma identik di `src/middlewares/require-auth.ts:18-36` dan `profile.service.ts` (`profileSelect`), termasuk langkah strip `avatarKey` → `hasAvatar: Boolean(...)` (`require-auth.ts:41-42`, `profile.service.ts:55-58`). `ProfileRow` (`profile.service.ts:37-53`) menulis ulang 15 tipe field manual — seharusnya `Prisma.UserGetPayload<{ select: typeof profileSelect }>`. **Rekomendasi:** satu `profileSelect` + mapper (`toAuthUser`/`toProfile`) di satu modul, dipakai ulang. **Dampak:** sedang (menyentuh setiap request autentikasi).

**A.3.4 Pola pagination list di 5 modul.**
`page`/`limit` (default 20, max 100) + `prisma.$transaction([findMany, count])` + bentuk respons `{items,total,page,limit}` di `users.service.ts`, `note.service.ts`, `work-log.service.ts`, `schedule.service.ts`, `archive.service.ts`. **Rekomendasi:** minimal selaraskan konstanta; helper `pageLimitFields` (zod) + `paginate()` jika disetujui (hati-hati over-engineering — pola 5x salinan boleh jadi memang layak diekstrak). **Dampak:** rendah–sedang.

**A.3.5 Refine "minimal satu field" di 6 schema.**
`note.schema.ts`, `users.schema.ts`, `work-log.schema.ts`, `schedule.schema.ts`, `archive.schema.ts` (message sama: "Minimal satu field harus diisi") dan `profile.schema.ts` (message berbeda: "Minimal satu field diisi") — body identik. **Rekomendasi:** satu `atLeastOneField(message?)` di helper schema bersama. **Dampak:** rendah.

**A.3.6 Rate-limit handler 429 di-duplikasi dan pesan tidak konsisten.**
429 handler identik di `auth.routes.ts:23-30`, `profile.routes.ts:16-23`, `work-log.public.routes.ts:18-24` — dengan pesan berbeda ("Terlalu banyak percobaan" vs "Terlalu banyak permintaan"). `windowMs: 15 menit` duplikat di `auth.routes.ts:38` & `profile.routes.ts:29`. Factory `limiter(n)` di `auth.routes.ts:36-43` bisa dipakai modul lain. **Rekomendasi:** `middlewares/rate-limit.ts` — `rateLimitHandler` + `createLimiter({windowMs, limit})`; samakan bahasa pesan. **Dampak:** sedang.

**A.3.7 `dateKey` (`toISOString().slice(0,10)`) di 6 tempat.**
`lib/wita.ts:21`, `dashboard.service.ts:17`, `work-log.service.ts:50`, `work-log.public.service.ts:25`, `archive.service.ts:78`, `report.service.ts:52`. **Rekomendasi:** satu `dateKey(date)` helper. **Dampak:** rendah.

**A.3.8 Logika range bulan duplikat.**
`lib/wita.ts` (`monthRange`, dipakai dashboard) vs cabang `monthly` di `report.period.ts` (hitung `lastDay` ulang inline). `addDays` di `report.period.ts` menduplikasi `addDaysWita` di `lib/wita.ts`. **Rekomendasi:** `resolveRange` memanggil `monthRange`; pakai `addDaysWita`. **Dampak:** rendah.

**A.3.9 `toBuffer()` identik.**
`lib/file-content.ts:16-24` dan `profile.service.ts:60-68` — konversi `ReadableStream` R2 → Buffer. **Rekomendasi:** satu helper di lib. **Dampak:** rendah–sedang.

**A.3.10 Strip ekstensi — tiga varian.**
`stripExtension` (`report.rows.ts:42-44`), `baseName` (`archive.service.ts:327-330`), `previewName` (`file-response.ts:17-19`, khusus `.jpg`). **Rekomendasi:** satu `stripExtension` bersama; `previewName` tetap varian `.jpg` di atasnya. **Dampak:** rendah.

**A.3.11 Pembuatan token undangan — dua jalur.**
`users.service.ts`: `inviteUser` membuat undangan (nested create, ~:74-89) sedangkan `resendInvitation` memakai helper `createInvitationToken` (:25-43) dengan logika TTL + deleteMany + create yang digandakan. **Rekomendasi:** `inviteUser` memakai jalur helper yang sama. **Dampak:** rendah.

**A.3.12 TTL dan teks kedaluwarsa tidak terikat.**
`INVITATION_TTL_MS` (`users.service.ts:13`) dan `EMAIL_CHANGE_TTL_MS` (`profile.service.ts:15`) keduanya `7 * 24 * 60 * 60 * 1000`. Teks "Tautan berlaku 7 hari" di `account-mail.ts:18-19,33-34` ditulis manual — mengubah TTL tidak mengubah email. `PASSWORD_RESET_TTL_MS` (60 menit, `auth.service.ts:14`) vs teks "Tautan berlaku 60 menit" (`auth.service.ts:212-213`) — pola yang sama. **Rekomendasi:** pusatkan TTL di satu modul; interpolasi pesan dari konstanta. **Dampak:** sedang.

**A.3.13 Ownership check + `notFound()` — pola sama di banyak modul.**
Pola `findFirst({ where: { id, userId } })` / `updateMany|deleteMany` + `count === 0 → 404` dengan helper lokal `notFound()`/`fileNotFound()`/`folderNotFound()` di `note.service.ts`, `work-log.service.ts`, `work-log-file.service.ts`, `schedule.service.ts`, `archive.service.ts`. `findOwnedWorkLog` (work-log) sudah dipakai lintas file — pola baik. **Rekomendasi (opsional, hati-hati over-engineering):** helper generik `findOwnedOrThrow(delegate, id, userId)`, atau terima per-modul dan minimal samakan bentuk `notFound(message)`. **Dampak:** sedang — namun ekstraksi generik Prisma bisa menambah kompleksitas; pertimbangkan cukup samakan bentuknya.

### A.4 Konsistensi arsitektur / layering

**A.4.1 Service mengakses objek HTTP `Request`.**
`profile.service.ts:195` (`uploadAvatar(userId, req: Request)`), `work-log-file.service.ts:62` (`uploadWorkLogFile(userId, id, req)`), `archive.service.ts:336` (`createArchiveFile(userId, req)`). Controller hanya `pass req` (mis. `profile.controller.ts:44-48`). **Masalah:** service — lapisan business logic — terikat pada Express; sulit diuji tanpa mock request; bertentangan dengan aturan ARCHITECTURE.md bahwa controller menangani HTTP. **Rekomendasi:** controller memanggil `receiveMultipart(req)` (atau lib multipart langsung), service menerima `{ file, fields }` yang sudah terparse. **Dampak:** sedang.

**A.4.2 Validasi zod di tengah service.**
`archive.service.ts:356` mem-parse `createFileFieldsSchema.parse(values)` di dalam service, bukan lewat middleware `validate` dengan `res.locals.input`. Berjalan (ZodError ditangkap `errorHandler` → 400), tetapi inkonsisten dengan semua endpoint lain. **Rekomendasi:** normalisasi parse multipart fields di controller/route, atau helper `validateMultipart()`. **Dampak:** rendah.

**A.4.3 Middleware mengimpor dari modul fitur.**
`middlewares/require-auth.ts:5-6` mengimpor `ACCESS_COOKIE` dari `modules/auth/auth.cookies.js` dan `verifyAccessToken` dari `modules/auth/auth.tokens.js`, lalu query Prisma per request autentikasi. Secara modular-purist ini lapisan bocor (middleware → modul); secara pragmatis wajar. **Rekomendasi (pertimbangan):** pindahkan `ACCESS_COOKIE` dan verifikasi token ke `lib/` agar middleware tidak mengimpor modul fitur; konsolidasi select via A.3.3. **Dampak:** rendah–sedang.

**A.4.4 Batas `lib/` vs `utils/` tidak konsisten.**
`utils/`: `api-error.ts` (murni, tanpa Express), `api-response.ts` (HTTP), `current-user.ts` (req), `file-response.ts` (res). `lib/`: `prisma.ts`, `storage.ts`, `mailer.ts`, `logger.ts`, `tokens.ts`, `multipart.ts` (infra) **ditambah** domain murni: `wita.ts`, `file-rules.ts`, `account-mail.ts`, `file-content.ts` (business logic: baca storage + konversi HEIC). Pasangan `file-content.ts` (lib) / `file-response.ts` (utils) seharusnya satu tempat. **Rekomendasi:** tetapkan kontrak tertulis, misal `lib = infra + domain murni lintas modul`, `utils = helper HTTP/framework`; pindahkan `api-error.ts` ke lib atau terima sebagai keputusan tertulis. **Perlu verifikasi** preferensi tim. **Dampak:** rendah.

**A.4.5 Re-implementasi 401 di auth.controller.**
`auth.controller.ts:132-135` menulis sendiri `if (!req.user) throw 401` padahal `requireAuth` sudah menjamin ada. **Rekomendasi:** pakai `currentUser(req)`. **Dampak:** rendah.

**A.4.6 `res.locals.input` tidak bertipe.**
54 pemakaian, 26+ cast inline `as CreateXInput` di controller (mis. `work-log.controller.ts:15,22`). `validate()` tidak menulis tipe ke `res.locals`. **Rekomendasi:** global declaration `namespace Express { interface Locals { input?: ... } }` atau `validate<T>()` generik. **Dampak:** rendah–sedang.

**A.4.8 Penamaan folder/file campur singular/plural.**
File: modul `users` memakai `users.controller.ts` dll., modul lain singular (`note.*`, `schedule.*`, `report.*`). Folder: `notes`, `reports`, `schedules`, `users`, `work-logs` plural; `archive`, `auth`, `dashboard`, `health`, `profile` singular. **Rekomendasi:** satu konvensi; disarankan singular file + plural folder modul (konsisten dengan `features/` frontend), atau sebaliknya — yang penting satu. **Dampak:** rendah.

### A.5 Konstanta & konfigurasi terpencar

Selain A.2 dan A.3.12: `ACCESS_TOKEN_TTL_MS`/`REFRESH_TOKEN_TTL_MS` (`auth.tokens.ts` — sudah baik), tapi: cookie OAuth `10 * 60 * 1000` (`auth.cookies.ts:26`), `express.json limit '1mb'` (`app.ts:20`), `Cache-Control max-age=300` (`file-response.ts:28`), multipart `fields: 20, fieldSize: 10_000, files: 1` (`multipart.ts:58`), limiter login(10)/refresh(60)/logout(30)/public 120 req/mnt (`auth.routes.ts`, `work-log.public.routes.ts`). **Rekomendasi (opsional):** satu `config/constants.ts` (atau perluas `config/env.ts` untuk yang env-driven). Jangan wajib — nilai yang tidak pernah berubah boleh tetap dekat pemakaiannya. **Dampak:** rendah.

### A.6 Kode mati / ekspor berlebih

Semua berikut tidak diimpor file manapun di `src` maupun `scripts/` (kecuali dicatat):

| Item                              | Lokasi                                                                      | Aksi           |
| --------------------------------- | --------------------------------------------------------------------------- | -------------- |
| `StoredFile`                      | `lib/file-content.ts:9`                                                     | hapus `export` |
| `PREVIEWABLE_MIME_TYPES`          | `lib/file-rules.ts:18` (internal `isPreviewable`)                           | hapus `export` |
| `MailOptions`                     | `lib/mailer.ts:12`                                                          | hapus `export` |
| `ReceivedFile`, `MultipartResult` | `lib/multipart.ts:9,14`                                                     | hapus `export` |
| `AuthResult`                      | `modules/auth/auth.service.ts:16`                                           | hapus `export` |
| `createSession`                   | `modules/auth/auth.service.ts:48` (hanya internal modul)                    | hapus `export` |
| `PNS_GOLONGAN`, `PPPK_GOLONGAN`   | `modules/profile/profile.schema.ts:3,23` (hanya internal `GOLONGAN_VALUES`) | hapus `export` |
| `ReportRange`                     | `modules/reports/report.period.ts:19`                                       | hapus `export` |

Catatan: `formatDateLabel` **tetap** di-export — dipakai `scripts/check-report-format.ts:5`.

**A.6.1 Dependensi ganda `pg`.** `pg@8.23.1` ada di `dependencies` tetapi tidak pernah di-import langsung (hanya lewat `@prisma/adapter-pg`, yang sendiri depend `pg@^8.16.3`); `@types/pg` di devDependencies juga mubazir. **Bisa jadi pin disengaja** — **perlu verifikasi** sebelum dihapus. **Dampak:** rendah.

**A.6.2 Shim re-export.** `modules/work-logs/work-log-file.rules.ts:1-11` hanya re-export `lib/file-rules.js` + 2 konstanta; dikonsumsi `work-log-file.service.ts` dan `scripts/check-work-log-file-rules.ts`. Boleh disederhanakan agar script import langsung dari sumbernya. **Dampak:** rendah (opsional).

### A.7 Clean code

**A.7.1 Non-null assertion berdasarkan refiner eksternal.** `report.period.ts:64-65` — `const from = input.from!` aman hanya karena `superRefine` memanggilnya lebih dulu; rapuh terhadap refactor. **Rekomendasi:** guard eksplisit `if (!input.from || !input.to) throw …` atau discriminated union. **Dampak:** rendah.

**A.7.2 Fungsi paling kompleks.** `summarizeEvidence` (`report.rows.ts:47-72`) ~30 baris nested dengan dua branch sisa-file — terdokumentasi (aturan e-Kinerja 255 karakter), tidak harus dipecah, tapi paling rawan bug. Pastikan `scripts/check-report-format.ts` mencakup skenario "+N file lainnya" (cakupan script **perlu verifikasi**). **Dampak:** rendah.

**A.7.3 Nama kurang jelas.** `requoteStorageError` (maksudnya "rethrow, ApiError diteruskan apa adanya") → `ensureStorageError` / `mapStorageError`. Tiga nama berbeda untuk date-only (lihat A.3.2). `ProfileRow` interface manual menulis ulang payload (lihat A.3.3). **Dampak:** rendah.

**Bersih:** tidak ada TODO/FIXME/HACK; tidak ada fungsi raksasa yang melanggar kewajaran (terbesar ~`archive.service.ts` 470 baris tetapi fungsi-fungsinya kecil terpisah); pola delete 204 konsisten; error-handler terpusat OK; `health` tanpa layer adalah exception wajar; `res.locals.input` konsisten; pesan user-facing berbahasa Indonesia.

---

## B. Frontend

Struktur aktual: Next.js 16 App Router + React 19 + Tailwind 4 + shadcn/ui (radix/nova). 9 feature di `src/features/` mengikuti pola `*.api.ts` → `use-*.ts` → `*.schemas.ts` → `*-view.tsx` + dialog. Routes tipis, semua logic di feature. `components/ui` (shadcn) + `components/shared` (8 file) + `components/layout` (2 file).

### B.1 Kode mati

**B.1.1 `components/shared/module-placeholder.tsx`** — nol pemakaian sejak placeholder digantikan halaman nyata. **Hapus.** Dampak rendah.

**B.1.2 `zustand`** — di `dependencies`, tidak diimpor di mana pun (keputusan P9.2: store dibuat saat dibutuhkan, belum dibutuhkan sampai sekarang). **Hapus dari dependencies** — saat benar-benar dibutuhkan tinggal install lagi. Dampak rendah.

**B.1.3 `shadcn` (CLI)** — masuk `dependencies`, tidak diimpor kode. **Pindah ke devDependencies** (atau hapus jika tidak dipakai sebagai tool lokal). Dampak rendah.

**B.1.4 Export tidak dipakai / lokal-only:** `addDaysWita` (`schedule.format.ts:76`, hanya internal), `USER_STATUSES` (`users.api.ts:3`, hanya internal), `ALLOWED_FILE_EXTENSIONS` (`lib/file-format.ts:3`, hanya internal) → hapus keyword `export`. `FieldContent` (`ui/field.tsx`) diekspor tanpa pemakaian luar. `label.tsx` dan `separator.tsx` hanya dipakai internal shadcn (`field.tsx`, `sidebar.tsx`) — pertimbangkan biarkan (pola shadcn wajar) atau catat sebagai keputusan. Dampak rendah.

**B.1.5 Jalur `cn` ganda.** `lib/utils.ts` re-export `cn`, tetapi 21 file `components/ui` mengimpor `cn` langsung dari `'cn'`; hanya 2 file memakai `@/lib/utils`. Alias `components.json` menunjuk ke `@/lib/utils` — jadikan itu satu-satunya jalur agar konsisten dengan konfigurasi shadcn dan tidak membingungkan pembaca. Dampak rendah–sedang.

### B.2 Duplikasi UI — kandidat ekstraksi shared (kurangi ~400–500 baris)

**B.2.1 Pagination (4 file).** `PAGE_SIZE = 20` dan kalkulasi `totalPages`/`firstItem`/`lastItem` identik di `archive-files.tsx:61,96-98`, `work-log-list.tsx:29,47-49`, `note-view.tsx:28,46`, `users-view.tsx:41,85`. Ada dua varian UI: (a) range "Menampilkan X–Y dari N" + tombol Sebelumnya/Berikutnya; (b) "Halaman X dari Y" + ikon. **Rekomendasi:** `hooks/use-pagination` atau `PaginationBar` di `components/shared` + `DEFAULT_PAGE_SIZE` di `lib`. Pratinjau: pilih satu varian (disarankan (a), lebih informatif) atau dukung keduanya via prop bila keduanya memang diinginkan. **Dampak:** sedang.

**B.2.2 Empty state (~7 file, 2 varian).** Dashed `Card` + ikon + judul + subteks (`archive-files.tsx`, `work-log-list.tsx`) vs plain flex-col tanpa Card (`note-view`, `users-view`, `report-table`, `schedule-list`, `work-log-evidence`). **Rekomendasi:** `EmptyState` shared (props: `icon`, `title`, `description`, `action?`). **Dampak:** sedang.

**B.2.3 Error query + tombol "Coba lagi" (~12 file, 2 varian).** Pola `<Alert destructive><TriangleAlertIcon/><AlertDescription>{getErrorMessage(err)}</AlertDescription></Alert>` + tombol ulangi di `archive-view`, `archive-files`, `work-log-list`, `work-log-evidence`, `work-log-detail`, `work-log-public-view`, `users-view`, `admin-dashboard`, `user-dashboard`, `report-view`, `app-shell`, `archive-folder-panel`. Dua varian: `Button variant="outline"` vs inline `<button className="underline">` (`note-view`, `schedule-list`, `users-view`). **Rekomendasi:** `QueryError` shared (icon + pesan + tombol retry opsional); samakan varian tombol. **Dampak:** sedang–tinggi (terbanyak dan paling terlihat).

**B.2.4 Form-error alert di dalam dialog (~15 file).** Baris `{err ? <Alert variant="destructive">…</Alert> : null}` identik di `archive-file-upload-dialog`, `archive-file-edit-dialog`, `archive-folder-dialog`, `work-log-form-dialog`, `note-editor-dialog`, `schedule-form-dialog`, `user-edit-dialog`, `user-invite-dialog`, `profile-view` (3x), `login-form`, `activate-form`, `reset-password-form`, `forgot-password-form`, `verify-email-form`. **Rekomendasi:** `FormErrorAlert` shared (props: `message`). **Dampak:** sedang.

**B.2.5 Blob preview + `revokeObjectURL` (4 file).** `useMemo(URL.createObjectURL)` + cleanup revoke identik di `archive-file-detail.tsx:27-37`, `work-log-evidence.tsx:78-92`, `work-log-public-view.tsx`, `user-avatar.tsx:24-34`. Iframe/img preview markup juga terduplikasi. **Rekomendasi:** hook `useObjectUrl(blob)` di `hooks/` atau `lib/`. **Dampak:** sedang.

**B.2.6 Validasi upload + UI progres (2 fitur).** `isAllowedFile` + `MAX_FILE_BYTES` + `onUploadProgress` axios di `archive.api.ts:81-91` vs `work-log-file.api.ts:31-46`; validasi ukuran client + toast duplikat; UI `<Progress>` + persen di `archive-file-upload-dialog` vs `work-log-evidence`. **Rekomendasi:** konstanta/helper upload di `lib/file-format.ts`; pertimbangkan `UploadProgressDialog` shared (hanya jika benar-benar seragam — perilaku modal non-dismissible saat unggah harus dipertahankan). **Dampak:** sedang.

**B.2.7 Folder Select ber-indent (4 file, fitur archive).** `flattenFolders(buildFolderTree(folders))` + option `repeat` indent di `archive-files`, `archive-file-upload-dialog`, `archive-file-edit-dialog`, `archive-folder-dialog`. **Rekomendasi:** `FolderSelect` internal feature (`features/archive/folder-select.tsx`) atau helper `folderOptions(folders)`. **Dampak:** sedang.

**B.2.8 StatCard & resend-invitation.** `StatCard` hampir identik di `admin-dashboard.tsx` & `user-dashboard.tsx`. Handler resend + state `resendingId` duplikat di `admin-dashboard.tsx` & `users-view.tsx`. Baris agenda (`witaShortDate` + badge status) terduplikasi di `user-dashboard.tsx` & `schedule-list.tsx`. **Rekomendasi:** `StatCard` shared; satu `useResendInvitation` dipakai keduanya (sudah ada di `features/users`); helper baris agenda atau komponen `ScheduleRow`. **Dampak:** rendah–sedang.

### B.3 Struktur — import lintas fitur (dampak tertinggi)

**B.3.1** `users-view.tsx`, `admin-dashboard.tsx`, `user-dashboard.tsx` mengimpor `witaShortDate` dari `@/features/schedules/schedule.format` — util WITA generik tinggal di feature schedules. **Pindah ke `lib/wita.ts`** (satu modul WITA + formatter).

**B.3.2** `reports/*` dan `dashboard.api.ts` mengimpor `WORK_CATEGORIES`, `WORK_CATEGORY_LABELS`, `WorkCategory`, `formatActivityDate` dari `@/features/work-logs/*` — konstanta domain kerja dipakai lintas fitur. **Pindah ke `lib/work-category.ts`** (+ `formatActivityDate` ke `lib/date.ts`).

**B.3.3** `components/shared/user-avatar.tsx` **mengimpor `@/features/profile/profile.api`** (`fetchAvatar`) dan memanggil `queryKey` inline — layer shared bergantung pada fitur (inversi dependensi). **Rekomendasi:** pindahkan fetch + query key ke `features/profile/use-avatar.ts` (hook `useAvatarUrl`), atau terima blob via props. **Dampak:** sedang.

**B.3.4** `admin-dashboard.tsx` mengimpor `useResendInvitation` dari `@/features/users/use-users` — ini wajar (lintas fitur tapi sengaja), namun lebih rapi lewat `features/users/index` atau terima sebagai shared hook; keputusan: dokumentasikan bahwa `features/users` diekspor untuk dashboard. **Dampak:** rendah (dapat diterima).

**B.3.5** `features/profile/*` mengimpor `use-auth`, `auth.api`, `sessionQueryKey` dari `@/features/auth/*` — wajar (profile memang membutuhkan sesi), tapi `sessionQueryKey` layak jadi export resmi dari `features/auth/index` atau `lib`. **Dampak:** rendah.

**B.3.6** `report-filter-bar.tsx` dan `work-log-filter-bar.tsx` hampir identik (DateRangePicker + Select kategori) — kandidat `CategoryFilter`/komponen gabungan. **Dampak:** rendah–sedang.

**Ringkasan aturan:** fitur boleh diekspor untuk dipakai fitur lain **secara sadar** (auth, users); util generik (tanggal/WITA, kategori, format) dan komponen presentasi harus hidup di `lib/` atau `components/shared/`.

### B.4 Konstanta & konfigurasi tersebar

**B.4.1 Timezone `'Asia/Makassar'` tersebar** di `schedule.format.ts:3` (konstanta `WITA`), `user-dashboard.tsx:33` (duplikat `const WITA`), `schedule-view.tsx:56` (inline), `note.format.ts:2`. `work-log.format.ts` justru tidak menyebut timezone (aman untuk date-only, tapi inkonsisten pendekatan). **Rekomendasi:** satu `WITA` di `lib/wita.ts`. **Dampak:** sedang.

**B.4.2 Limit & maxLength tersebar:** `MAX_TOTAL_BYTES_PER_WORK_LOG = 50MB` & `MAX_FILES_PER_WORK_LOG = 10` (di `work-log-file.api.ts`) vs string "5 MB"/"50 MB" hardcode di `work-log-evidence.tsx:118,132,167` dan `archive-file-upload-dialog.tsx:127` (risiko drift); `MAX_LENGTH = 20_000` lokal di `note-editor-dialog.tsx:24`; `5000` (deskripsi arsip) diduplikasi di 3 file; `100` (maxLength nama/search) di ≥10 file; `200` (nama dokumen) di 4 file; `PAGE_SIZE = 20` ×4 (B.2.1); `AVATAR_MAX_BYTES = 2MB` di `profile.api.ts`; kuota 1 GB di frontend **tidak ada** — `archive-view` memakai `usage.quotaBytes` dari server (benar). **Rekomendasi:** `lib/limits.ts` untuk batas lintas fitur; string pesan dibangun dari konstanta; angka yang dipakai sekali tetap dekat pemakaiannya. **Dampak:** sedang.

### B.5 Konsistensi

**B.5.1 Notes tanpa schema.** Semua feature memakai RHF + zodResolver + `*.schemas.ts`, kecuali `notes` (validasi manual `useState` + `trim` + `MAX_LENGTH`) dan `archive-file-upload-dialog.tsx` (form manual, padahal `archive-file-edit-dialog.tsx` di feature yang sama pakai RHF+zod — inkonsisten dalam satu feature). **Rekomendasi:** selaraskan ke pola RHF+zod (atau dokumentasikan pengecualian notes dengan alasan: satu field). **Dampak:** sedang.

**B.5.2 Penamaan campur singular/plural.** Mayoritas singular (`note-view.tsx`, `work-log-list.tsx`, `schedule-view.tsx`); `users/` plural (`users-view.tsx`, `users.api.ts`, …). Backend juga campur (A.4.8) — selaraskan keduanya. Helper tanggal: `archive.util.ts` vs `schedule.format.ts` vs `note.format.ts` vs `work-log.format.ts` — dua istilah (`util`/`format`) untuk hal sama. **Dampak:** rendah.

**B.5.3 Date library campur.** `date-fns` (`date-picker.tsx`, `archive.util.ts`, format `'d MMM yyyy'` tanpa timezone) vs `Intl.DateTimeFormat` + `Asia/Makassar` (`schedule.format.ts`, `note.format.ts`) vs hardcoded locale `'en-CA'`/`'en-GB'` (`schedule.format.ts:7,14`). Tampilan tanggal tidak seragam antar fitur ("16 Nov 2026" vs "16 November 2026" vs time included/excluded). **Rekomendasi:** satu `lib/date.ts` sebagai satu-satunya sumber formatter tanggal/waktu WITA + format dokumen; tentukan satu format tampilan. **Dampak:** rendah–sedang.

**B.5.4 Badge/status label terduplikasi.** Pola `*_LABELS` + `*_BADGES satisfies Record<…, 'default'|'secondary'|'outline'>` di `users.api.ts` dan `schedule.api.ts`; `profile-view.tsx:72-77` mendefinisikan **ulang** `STATUS_LABELS` (ACTIVE/INVITED/INACTIVE) — duplikat persis `USER_STATUS_LABELS`; `ROLE_LABELS` lokal di `profile-view.tsx` belum ada di shared. **Rekomendasi:** satu `lib/user-status.ts` (atau ekspor resmi `features/users/users.api`); profile mengimpor dari sana. **Dampak:** rendah–sedang.

**B.5.5 Error handling konsisten, 2 deviasi.** `getErrorMessage` dipakai konsisten di ~47 call site. Deviasi: `app-shell.tsx:33` dan `dashboard-view.tsx:24` memakai pesan hardcoded ("Tidak dapat memuat sesi…") alih-alih `getErrorMessage(session.error)` — kehilangan detail error dari backend. **Rekomendasi:** pakai `getErrorMessage`. **Dampak:** rendah.

**B.5.6 `Intl.DateTimeFormat` dibuat ulang di render.** `schedule-view.tsx:56-63` membuat formatter baru setiap render untuk label tab; `folderOptions` di `archive-files.tsx` & dialog archive recompute `flatten+build` setiap render. **Rekomendasi:** angkat formatter ke module scope; `useMemo` untuk folderOptions (kecil, dampak peforma minimal). **Dampak:** rendah.

**B.5.7 Skeleton `aria-busy` dobel pola.** 3 file memakai `<ul aria-busy="true">`, 3 lainnya `Array.from({length:n}).map` polos tanpa aria. **Rekomendasi:** `ListSkeleton` shared dengan aria konsisten (digabung dengan B.2). **Dampak:** rendah.

**B.5.8 Pola `pinned: 'true'|'false'` string-boolean.** `use-notes.ts`/`note.api.ts` dan `onlyWithEvidence` di reports — mengikuti kontrak query backend; bukan error. Jika ada `lib/params.ts` di kemudian hari, rapikan sekalian. **Dampak:** rendah (catat saja).

### B.6 Clean code — komponen terlalu besar

| File                                          | Baris | Catatan                                                                                                                                                                               |
| --------------------------------------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `features/profile/profile-view.tsx`           | 688   | 5 komponen + logic golongan PNS/PPPK (~60 baris handler `onValueChange`); pecah per card (`ProfileIdentityCard`, `ProfileKepegawaianCard`, `ProfileEmailCard`, `ProfileSecurityCard`) |
| `features/archive/archive-files.tsx`          | 402   | daftar + filter + pagination + empty/loading/error dalam satu file                                                                                                                    |
| `features/work-logs/work-log-evidence.tsx`    | 399   | upload + list + preview + delete; `usedBytes` reduce tiap render                                                                                                                      |
| `features/users/users-view.tsx`               | 357   | blok tombol resend/edit terduplikasi antara tabel desktop dan kartu mobile; `items = query.data?.items ?? []` OK                                                                      |
| `features/reports/report-table.tsx`           | ~     | duplikasi desktop/mobile                                                                                                                                                              |
| `features/dashboard/user-dashboard.tsx`       | 290   | StatCard + agenda row duplikat (B.2.8)                                                                                                                                                |
| `features/schedules/schedule-form-dialog.tsx` | 291   | form besar tapi masih wajar; magic limit 20/100 ber-alasan (`// ponytail:`)                                                                                                           |

**B.6.1 Prop drilling ringan.** `archive-view` → `ArchiveFiles` → `ArchiveFileDetail/EditDialog` (`folders` di-drill 2–3 level — masih wajar); `ScheduleList` menerima 10 props (kandidat split, masih OK). `UsersView`/`UsersAdmin` split sudah benar (menghindari conditional hooks). **Dampak:** rendah — catat, jangan diutak-atik tanpa kebutuhan.

**Verdict:** tidak ada monster function yang melanggar kewajaran; yang terbesar adalah `archive.service.ts` (backend, fungsi-fungsi kecil terpisah) dan `profile-view.tsx` (frontend). Prioritas pemecahan: `profile-view.tsx`.

---

## C. Rekomendasi urutan perbaikan

Dibagi task kecil — **satu task satu commit**. Urut = prioritas. Semua task bersifat opsional; pilih yang diperlukan. Jangan dikerjakan sekaligus.

| #   | Task                                                                                                                                                                   | Temuan                 | Risiko        | Catatan                                                                                              |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- | ------------- | ---------------------------------------------------------------------------------------------------- |
| A   | Correctness backend: P2002 → 409 (invite/update user, folder), verifikasi unique index NULL, perbaiki pesan limit/kuota                                                | A.2, E.2               | Sedang        | Correctness; bila unique index diubah perlu migration — migration disiapkan, **dijalankan pengguna** |
| B   | Duplikasi backend: helper storage error, `dateOnlyUtc`, `dateKey`, `monthRange`, `profileSelect` + mapper, `createLimiter`, TTL terpusat, `stripExtension`, `toBuffer` | A.3.1–A.3.12           | Rendah–sedang | Mayoritas mekanik; paling sering disentuh, dampak terasa                                             |
| C   | Layering backend: service terima `{file, fields}` bukan `Request`; parse multipart di controller; tipe `res.locals.input`; `currentUser` konsisten                     | A.4.1–A.4.6            | Sedang        | Sentuh auth/upload — hati-hati; ada wiring controller                                                |
| D   | Kode mati & konstanta backend: hapus export tak dipakai, verifikasi `pg` pin, rapikan `config/constants.ts`, rename `requoteStorageError`, penamaan singular/plural    | A.5, A.6, A.7.3, A.4.8 | Rendah        | Aman; murni kebersihan                                                                               |
| E   | Ekstraksi lib frontend: `lib/wita.ts`, `lib/work-category.ts`, `lib/date.ts`, `lib/limits.ts`, fix layering `user-avatar`                                              | B.3, B.4, B.5.3        | Sedang        | Menghilangkan import lintas fitur — dampak struktural tertinggi                                      |
| F   | Shared components frontend: `PaginationBar`, `EmptyState`, `QueryError`, `FormErrorAlert`, `useObjectUrl`, `FolderSelect`, `StatCard`/`ScheduleRow`                    | B.2                    | Sedang        | Hapus ~400–500 baris duplikasi; ekstraksi bertahap per komponen                                      |
| G   | Mati & konsistensi frontend: hapus `module-placeholder`, `zustand`, pindah `shadcn`; notes schemas; penyeragaman penamaan, `cn`, error message, B.5.4–B.5.6            | B.1, B.5               | Rendah        | Aman                                                                                                 |
| H   | Pecah komponen besar: `profile-view.tsx` per card; `users-view.tsx` blok desktop/mobile                                                                                | B.6                    | Sedang        | Perubahan presentasi saja; jaga perilaku identik                                                     |

**Saran minimum bila hanya ingin "bersih dasar":** Task A + D + G (correctness + mati + konsistensi kecil) — risiko terendah, hasil terlihat.
**Saran penuh:** A → B → C → E → F → D → G → H.

Setelah setiap task: typecheck + lint + build (frontend & backend sesuai task), pengguna commit, baru lanjut.

---

## D. Pertimbangan & risiko umum

1. **Ekstraksi berlebihan = abstraksi baru.** Helper generik Prisma (`findOwnedOrThrow`) dan `paginate()` tergoda di-abstraksi; bila hanya 5 modul memakai pola serupa dengan perbedaan kecil, biarkan — samakan bentuknya saja. Utamakan duplikasi yang identik penuh.
2. **Perubahan perilaku harus nol.** Task F/H (shared component, pecah komponen) wajib mempertahankan tampilan & perilaku piksel-sempurna/flow yang sama; review visual oleh pengguna.
3. **Migration.** Task A berpotensi butuh migration (unique index `NULLS NOT DISTINCT`). Agent tidak menjalankan migration; perintah disiapkan, pengguna yang menjalankan, dan commit migration terpisah.
4. **Kontrak publik tidak berubah.** Semua task di atas tidak mengubah bentuk API, envelope respons, atau rute frontend — aman tanpa koordinasi backend↔frontend, kecuali penamaan file internal (bebas).
5. **Pesan error user-facing** tetap berbahasa Indonesia; samakan istilah ("percobaan" vs "permintaan" dipilih satu).
6. **Verifikasi akhir.** Setelah task selesai seluruhnya, jalankan ulang audit terarah (bukan penuh) untuk memastikan tidak ada regresi duplikasi.

## E. Keputusan yang menunggu pengguna

1. `pg` pin di backend: sengaja dipertahankan, atau dihapus?
2. Unique index folder root (`parentId IS NULL`): **disetujui** (17 Nov 2026) — terapkan unique index; dikerjakan pada Task A.3.
