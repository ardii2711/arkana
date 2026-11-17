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

Struktur aktual: Express 5 + Prisma 7 (driver adapter `@prisma/adapter-pg`) + Zod + R2 (S3). ESM, TypeScript strict. Pola modular layered: `routes/controller/(service)/schema`. Tidak ada `.repository.ts` — semua service memanggil `prisma` langsung; keputusan dan kriteria penambahannya tercatat di `ARCHITECTURE.md` §4.1.

Pemeriksaan statis yang berjalan: `eslint src` hijau (termasuk `no-unused-vars`). Tidak ada TODO/FIXME di `src`.

### A.4 Konsistensi arsitektur / layering

**A.4.8 Penamaan folder/file campur singular/plural.**
File: modul `users` memakai `users.controller.ts` dll., modul lain singular (`note.*`, `schedule.*`, `report.*`). Folder: `notes`, `reports`, `schedules`, `users`, `work-logs` plural; `archive`, `auth`, `dashboard`, `health`, `profile` singular. **Rekomendasi:** satu konvensi; disarankan singular file + plural folder modul (konsisten dengan `features/` frontend), atau sebaliknya — yang penting satu. **Dampak:** rendah.

### A.5 Konstanta & konfigurasi terpencar

**Diputuskan (17 Nov 2026): tidak dikerjakan** — opsional dan YAGNI; nilainya nyaris tidak pernah berubah, memusatkannya tidak memberi manfaat nyata.

`ACCESS_TOKEN_TTL_MS`/`REFRESH_TOKEN_TTL_MS` (`lib/access-token.ts` — sudah baik), tapi: cookie OAuth `10 * 60 * 1000` (`auth.cookies.ts:26`), `express.json limit '1mb'` (`app.ts:20`), `Cache-Control max-age=300` (`file-response.ts:28`), multipart `fields: 20, fieldSize: 10_000, files: 1` (`multipart.ts:58`), limiter login(10)/refresh(60)/logout(30)/public 120 req/mnt (`auth.routes.ts`, `work-log.public.routes.ts`). **Rekomendasi (opsional):** satu `config/constants.ts` (atau perluas `config/env.ts` untuk yang env-driven). Jangan wajib — nilai yang tidak pernah berubah boleh tetap dekat pemakaiannya. **Dampak:** rendah.

### A.7 Clean code

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

**B.3.4** `admin-dashboard.tsx` mengimpor `useResendInvitation` dari `@/features/users/use-users` — ini wajar (lintas fitur tapi sengaja), namun lebih rapi lewat `features/users/index` atau terima sebagai shared hook; keputusan: dokumentasikan bahwa `features/users` diekspor untuk dashboard. **Dampak:** rendah (dapat diterima).

**B.3.5** `features/profile/*` mengimpor `use-auth`, `auth.api`, `sessionQueryKey` dari `@/features/auth/*` — wajar (profile memang membutuhkan sesi), tapi `sessionQueryKey` layak jadi export resmi dari `features/auth/index` atau `lib`. **Dampak:** rendah.

**B.3.6** `report-filter-bar.tsx` dan `work-log-filter-bar.tsx` hampir identik (DateRangePicker + Select kategori) — kandidat `CategoryFilter`/komponen gabungan. **Dampak:** rendah–sedang.

**Ringkasan aturan:** fitur boleh diekspor untuk dipakai fitur lain **secara sadar** (auth, users); util generik (tanggal/WITA, kategori, format) dan komponen presentasi harus hidup di `lib/` atau `components/shared/`.

### B.5 Konsistensi

**B.5.1 Notes tanpa schema.** Semua feature memakai RHF + zodResolver + `*.schemas.ts`, kecuali `notes` (validasi manual `useState` + `trim` + `MAX_LENGTH`) dan `archive-file-upload-dialog.tsx` (form manual, padahal `archive-file-edit-dialog.tsx` di feature yang sama pakai RHF+zod — inkonsisten dalam satu feature). **Rekomendasi:** selaraskan ke pola RHF+zod (atau dokumentasikan pengecualian notes dengan alasan: satu field). **Dampak:** sedang.

**B.5.2 Penamaan campur singular/plural.** Mayoritas singular (`note-view.tsx`, `work-log-list.tsx`, `schedule-view.tsx`); `users/` plural (`users-view.tsx`, `users.api.ts`, …). Backend juga campur (A.4.8) — selaraskan keduanya. Helper tanggal: `archive.util.ts` vs `schedule.format.ts` vs `note.format.ts` vs `work-log.format.ts` — dua istilah (`util`/`format`) untuk hal sama. **Dampak:** rendah.

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
| F   | Shared components frontend: `PaginationBar`, `EmptyState`, `QueryError`, `FormErrorAlert`, `useObjectUrl`, `FolderSelect`, `StatCard`/`ScheduleRow`                    | B.2                    | Sedang        | Hapus ~400–500 baris duplikasi; ekstraksi bertahap per komponen                                      |
| G   | Mati & konsistensi frontend: hapus `module-placeholder`, `zustand`, pindah `shadcn`; notes schemas; penyeragaman `cn`, error message, B.5.4–B.5.6                      | B.1, B.5               | Rendah        | Penyeragaman penamaan singular/plural tidak dikerjakan (diterima sebagai keputusan)                   |
| H   | Pecah komponen besar: `profile-view.tsx` per card; `users-view.tsx` blok desktop/mobile                                                                                | B.6                    | Sedang        | Perubahan presentasi saja; jaga perilaku identik                                                     |

**Saran minimum bila hanya ingin "bersih dasar":** Task G (mati + konsistensi kecil).
**Saran penuh:** F → G → H.

Setelah setiap task: typecheck + lint + build (frontend & backend sesuai task), pengguna commit, baru lanjut.

---

## D. Pertimbangan & risiko umum

1. **Ekstraksi berlebihan = abstraksi baru.** Helper generik Prisma (`findOwnedOrThrow`) dan `paginate()` tergoda di-abstraksi; bila hanya 5 modul memakai pola serupa dengan perbedaan kecil, biarkan — samakan bentuknya saja. Utamakan duplikasi yang identik penuh.
2. **Perubahan perilaku harus nol.** Task F/H (shared component, pecah komponen) wajib mempertahankan tampilan & perilaku piksel-sempurna/flow yang sama; review visual oleh pengguna.
3. **Kontrak publik tidak berubah.** Semua task di atas tidak mengubah bentuk API, envelope respons, atau rute frontend — aman tanpa koordinasi backend↔frontend, kecuali penamaan file internal (bebas).
4. **Verifikasi akhir.** Setelah task selesai seluruhnya, jalankan ulang audit terarah (bukan penuh) untuk memastikan tidak ada regresi duplikasi.

## E. Keputusan yang menunggu pengguna

Tidak ada. Keputusan `pg` diselesaikan: dipendensi langsung dihapus (adapter `@prisma/adapter-pg` tetap membawa `pg`).
