# ARCHITECTURE.md

## 1. Technology Stack

| Bagian          | Teknologi                  |
| --------------- | -------------------------- |
| Frontend        | Next.js, React, TypeScript |
| UI & Styling    | shadcn/ui, Tailwind CSS    |
| Client State    | Zustand                    |
| Server State    | TanStack Query             |
| HTTP Client     | Axios                      |
| Form            | React Hook Form            |
| Validation      | Zod                        |
| Backend         | Express.js, TypeScript     |
| ORM             | Prisma                     |
| Database        | Supabase PostgreSQL        |
| File Storage    | Cloudflare R2              |
| Package Manager | npm                        |

Gunakan versi stabil dan production-ready. Hindari versi alpha, beta, RC, canary, nightly, atau experimental. Periksa kompatibilitas antardependensi dan gunakan `package-lock.json` untuk mengunci versi.

## 2. System Architecture

### 2.1 Architecture Pattern

Aplikasi menggunakan client-server architecture dengan pemisahan frontend dan backend.

- Frontend menangani antarmuka dan interaksi pengguna.
- Backend menangani business logic, autentikasi, otorisasi, dan seluruh operasi data.
- PostgreSQL menyimpan data aplikasi.
- Cloudflare R2 menyimpan file.

Frontend hanya berkomunikasi dengan backend Express.js untuk operasi data aplikasi. Frontend tidak mengakses PostgreSQL maupun R2 secara langsung.

### 2.2 Monorepo Structure

Satu repository Git untuk frontend, backend, dan dokumentasi.

```text
project/
├── frontend/
├── backend/
├── docs/
├── package.json
├── package-lock.json
├── .gitignore
└── README.md
```

Root package digunakan untuk orkestrasi perintah proyek. Frontend dan backend memiliki `package.json` serta `package-lock.json` masing-masing dan dapat di-deploy secara independen.

### 2.3 API Architecture

- Menggunakan REST API melalui Express.js.
- Prefix endpoint: `/api`.
- Format komunikasi utama menggunakan JSON.
- Upload file menggunakan mekanisme HTTP yang sesuai.
- Backend menjadi satu-satunya pintu akses database dan file storage.
- Daftar endpoint yang siap dipakai frontend: `docs/API.md`.

## 3. Frontend Architecture

### 3.1 Rendering Strategy

- Server Components menjadi default.
- Client Components digunakan untuk bagian yang membutuhkan interaksi browser.
- Hindari menjadikan seluruh halaman sebagai Client Component tanpa kebutuhan.

### 3.2 State Management

| Kebutuhan                    | Teknologi             |
| ---------------------------- | --------------------- |
| Global client state          | Zustand               |
| Server state dan API caching | TanStack Query        |
| Local component state        | React useState        |
| URL state                    | Next.js Search Params |
| Form state                   | React Hook Form       |

Jangan menduplikasi pengelolaan server state di Zustand jika sudah ditangani TanStack Query.

### 3.3 API Communication

- Axios digunakan sebagai HTTP client terpusat untuk komunikasi dengan Express API.
- Konfigurasi API client dikelola secara terpusat.
- Integrasi dengan TanStack Query digunakan untuk caching, loading, error, mutation, dan sinkronisasi data.
- Konfigurasi request untuk lingkungan browser dan server disesuaikan dengan kebutuhan Next.js.

### 3.4 Form & Validation

- React Hook Form untuk pengelolaan form.
- Zod untuk validasi schema.
- Integrasi menggunakan pola yang sesuai dengan dokumentasi shadcn/ui.
- Validasi frontend tidak menggantikan validasi backend.

### 3.5 Folder Organization

Gunakan pendekatan feature-based dengan struktur sederhana dan file langsung di dalam folder fitur. Subfolder hanya dibuat jika memang diperlukan.

```text
frontend/
├── public/
└── src/
    ├── app/
    ├── components/
    │   ├── ui/
    │   ├── layout/
    │   └── shared/
    ├── features/
    ├── hooks/
    ├── lib/
    ├── types/
    └── config/
```

`app/` menangani routing dan komposisi halaman. Logic dan komponen khusus fitur ditempatkan di `features/`.

## 4. Backend Architecture

### 4.1 Architecture Pattern

Backend menggunakan Modular Layered Architecture. Modul dikelompokkan berdasarkan fitur dan lapisan dipisahkan berdasarkan tanggung jawab.

Contoh:

```text
modules/
└── work-logs/
    ├── work-log.routes.ts
    ├── work-log.controller.ts
    ├── work-log.service.ts
    ├── work-log.schema.ts
    └── work-log.types.ts
```

Tanggung jawab:

| Lapisan    | Tanggung jawab                                   |
| ---------- | ------------------------------------------------ |
| Routes     | Endpoint dan middleware                          |
| Controller | Request dan response HTTP                        |
| Service    | Business logic dan akses database melalui Prisma |
| Schema     | Validasi request menggunakan Zod                 |
| Types      | Tipe TypeScript jika diperlukan                  |

Tidak semua modul wajib memiliki seluruh lapisan. Terapkan sesuai kompleksitas fitur dan hindari abstraksi yang tidak diperlukan.

Akses database dilakukan langsung melalui Prisma di lapisan service. Lapisan repository tidak diwajibkan. Tambahkan `*.repository.ts` pada sebuah modul hanya bila salah satu terpenuhi:

1. Query yang sama dipakai lebih dari satu modul.
2. Service didominasi query hingga business logic sulit dibaca.
3. Dibutuhkan unit test service tanpa database.
4. Muncul sumber data kedua (ORM, cache, atau API eksternal).
5. Query kompleks (raw SQL, agregasi berat) perlu diisolasi dan diberi nama.

### 4.2 Folder Organization

```text
backend/
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
└── src/
    ├── config/
    ├── middlewares/
    ├── modules/
    ├── routes/
    ├── lib/
    ├── utils/
    ├── types/
    ├── app.ts
    └── server.ts
```

## 5. Database Architecture

- Database utama menggunakan Supabase PostgreSQL.
- Prisma menjadi satu-satunya ORM.
- Prisma Migrate digunakan untuk versioning dan migrasi struktur database.
- `backend/prisma/schema.prisma` menjadi satu-satunya sumber kebenaran model, field, relasi, dan constraint.
- Backend menjadi satu-satunya pihak yang mengakses database.
- Pertimbangkan connection pooling yang sesuai dengan lingkungan deployment Render.

Dokumentasi arsitektur tidak menduplikasi definisi tabel atau model dari `schema.prisma`.

## 6. File Storage Architecture

### 6.1 Storage Design

- Cloudflare R2 digunakan untuk menyimpan file.
- Supabase PostgreSQL menyimpan metadata dan relasi file.
- Bucket R2 bersifat private.
- Seluruh operasi file dilakukan melalui backend Express.js.
- Frontend tidak mengakses R2 secara langsung.

### 6.2 Upload & Retrieval

Alur upload:

1. Frontend mengirim file ke backend.
2. Backend memvalidasi file dan hak akses pengguna.
3. Backend meneruskan file ke Cloudflare R2.
4. Metadata file disimpan di PostgreSQL.
5. Backend mengirim hasil operasi kepada frontend.

Backend menggunakan streaming untuk mengurangi kebutuhan memuat seluruh file ke memori.

Download dan preview file juga dilayani melalui backend setelah pemeriksaan otorisasi.

### 6.3 File Constraints

Mengikuti batasan produk:

- Maksimal 5 MB per file.
- Maksimal 10 file per kegiatan.
- Maksimal 50 MB total per kegiatan.
- Format yang didukung: JPG, JPEG, PNG, WEBP, HEIC, HEIF, PDF, DOC, DOCX, XLS, XLSX.
- HEIC/HEIF harus dapat ditampilkan secara kompatibel.
- Optimasi gambar harus mempertahankan kualitas yang memadai untuk verifikasi.

Penghapusan file harus memperhatikan konsistensi antara metadata database dan objek di R2.

## 7. Authentication & Authorization

### 7.1 Authentication

- Password di-hash menggunakan Argon2id.
- Google login menggunakan Google OAuth 2.0 / OpenID Connect.
- Login Google hanya diizinkan untuk email yang sudah terdaftar dan diaktifkan Admin.
- Access token menggunakan JWT dengan masa berlaku pendek.
- Refresh token memiliki masa berlaku lebih panjang, disimpan dalam HTTP-only cookie, di-hash dalam database, dan menggunakan mekanisme rotasi.
- Password reset menggunakan token sekali pakai melalui email.

### 7.2 Session Security

- Cookie autentikasi menggunakan HTTP-only dan Secure pada lingkungan HTTPS.
- Pengaturan SameSite dan domain cookie disesuaikan dengan konfigurasi deployment.
- Terapkan perlindungan CSRF.
- Terapkan konfigurasi CORS yang ketat.
- Hindari menyimpan token autentikasi di localStorage.

### 7.3 Authorization

- Otorisasi menggunakan role-based dan ownership-based access control.
- User hanya dapat mengakses dan mengelola data miliknya sendiri.
- Admin hanya mengelola akun pengguna dan tidak memiliki akses ke isi data pribadi User.
- Pemeriksaan otorisasi wajib dilakukan di backend pada setiap operasi yang membutuhkan perlindungan data.

### 7.4 Authorization Pattern

- Router modul data pribadi memasang `requireAuth` dan `requireRole('USER')`.
- Setiap query atau mutasi data User wajib menyertakan kepemilikan: `where: { id, userId: req.user.id }` atau filter setara pada `updateMany`/`deleteMany`.
- Resource milik pengguna lain dijawab `404 NOT_FOUND`, bukan `403`, agar keberadaan data tidak terbocorkan.
- Admin tidak memiliki endpoint untuk membaca atau mengubah data pribadi User; pembatasan ditegakkan di lapisan rute, bukan hanya di antarmuka.
- Role dan status akun dimuat ulang dari database pada setiap request melalui `requireAuth`; klaim JWT tidak dijadikan sumber otorisasi.

## 8. Public Evidence Sharing

Setiap catatan kegiatan memiliki satu tautan publik permanen.

Ketentuan:

- Menggunakan token acak dengan tingkat kesulitan tebakan yang tinggi.
- Tidak memerlukan login untuk dibuka.
- Hanya menampilkan informasi kegiatan dan seluruh bukti dukung milik kegiatan tersebut.
- File tetap disimpan di private bucket R2 dan disajikan melalui backend.
- Penambahan, penggantian, atau penghapusan bukti dukung memperbarui halaman pada tautan yang sama.
- Tautan tetap aktif selama aplikasi dan data terkait tersedia.

Tautan bersifat bearer link. Siapa pun yang memilikinya dapat mengakses halaman bukti dukung terkait. Token harus dijaga kerahasiaannya dan tidak diekspos melalui log atau respons yang tidak diperlukan.

## 9. Deployment & Infrastructure

| Komponen     | Platform            |
| ------------ | ------------------- |
| Frontend     | Vercel              |
| Backend      | Render              |
| Database     | Supabase PostgreSQL |
| File Storage | Cloudflare R2       |
| Domain & DNS | Cloudflare          |

Prinsip deployment:

- Frontend dan backend dapat di-deploy secara independen.
- Seluruh komunikasi menggunakan HTTPS.
- Rahasia dan konfigurasi dikelola melalui environment variables.
- Database dan R2 hanya diakses backend.
- CORS dibatasi untuk domain frontend yang diizinkan.
- Backend menyediakan health-check endpoint.
- Logging dan error handling tidak membocorkan informasi sensitif.
- Backup database dan strategi pemulihan data perlu disiapkan.

Perhatikan konfigurasi koneksi PostgreSQL, cookie lintas domain, CORS, CSRF, custom domain, dan HTTPS pada lingkungan produksi.
