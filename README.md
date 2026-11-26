# ARKANA

Arsip, Rekam Kinerja, dan Agenda — aplikasi pengelolaan catatan pekerjaan, bukti dukung, arsip pribadi, laporan kinerja, jadwal, dan catatan.

## Prasyarat

- Node.js 24 LTS
- npm 12

## Struktur

```text
arkana/
├── backend/   # Express.js + TypeScript API
├── frontend/  # Next.js + TypeScript
├── docs/      # Dokumentasi proyek
└── package.json
```

## Menjalankan Backend

```bash
npm install
npm --prefix backend install
npm run dev
```

Backend berjalan di `http://localhost:4000`. Cek kesehatan: `GET /api/health`.

Salin `backend/.env.example` menjadi `backend/.env` bila perlu mengubah konfigurasi.

## Menjalankan Frontend

```bash
npm --prefix frontend install
npm run dev:frontend
```

Frontend berjalan di `http://localhost:3000` dan memanggil API backend di `http://localhost:4000`.

Salin `frontend/.env.example` menjadi `frontend/.env.local`, lalu sesuaikan `NEXT_PUBLIC_API_URL` bila alamat API berbeda.

## Perintah Root

| Perintah                        | Fungsi                          |
| ------------------------------- | ------------------------------- |
| `npm run dev`                   | Jalankan backend (watch mode)   |
| `npm run dev:frontend`          | Jalankan frontend (Next.js dev) |
| `npm run build`                 | Build backend ke `backend/dist` |
| `npm run build:frontend`        | Build frontend                  |
| `npm start`                     | Jalankan backend hasil build    |
| `npm run typecheck`             | Pemeriksaan TypeScript backend  |
| `npm run typecheck:frontend`    | Pemeriksaan TypeScript frontend |
| `npm run lint`                  | ESLint backend                  |
| `npm run lint:frontend`         | ESLint frontend                 |
| `npm run format`                | Prettier backend (tulis)        |
| `npm run format:check`          | Prettier backend (cek)          |
| `npm run format:check:frontend` | Prettier frontend (cek)         |

## Pengujian Backend

Test memakai Vitest dan berjalan in-process terhadap database serta R2 yang dikonfigurasi di `backend/.env.test`.

1. Salin `backend/.env.test.example` menjadi `backend/.env.test`, lalu isi nilainya. `TEST_DATABASE_URL` diisi nilai `DATABASE_URL` dari `backend/.env`.
2. Jalankan Mailpit (`mailpit`) agar alur email dapat diuji. UI di `http://localhost:8025`, SMTP di port `1025`.
3. Jalankan test:

```bash
npm run test
npm run test:coverage
```

Test membuat akun dengan domain `@e2e.arkana.test` lalu menghapusnya di akhir. Karena memakai database aplikasi, jangan jalankan saat aplikasi sedang dipakai orang lain.

## Deployment Produksi

Topologi: frontend di Vercel (`<frontend-domain>`), backend di Render (`<api-domain>`), database Supabase, file di Cloudflare R2, DNS di Cloudflare. Frontend dan backend memakai subdomain dari satu domain induk agar cookie sesi `SameSite=Lax` tetap berlaku.

### 1. Database dan akun awal (dijalankan manual)

```bash
cd backend
npx prisma migrate deploy   # memakai DIRECT_URL (session pooler 5432)
npm run db:seed             # memakai ADMIN_EMAIL dan ADMIN_PASSWORD dari .env
```

### 2. Backend (Render)

- Root directory: `backend`; region: samakan dengan region Supabase (mis. Singapore).
- Build: `npm ci --include=dev && npm run build` — `--include=dev` wajib karena `prisma` dan `typescript` ada di `devDependencies`.
- Start: `npm start`.
- Health check path: `/api/health` (liveness). Jangan `/health/ready`: probe yang bergantung pada database bisa memicu restart loop.
- Instance: 1 (connection pool Prisma per instance).
- Node mengikuti `engines` di `backend/package.json` (`24.x`).

Environment wajib:

| Variabel                                                                      | Nilai                                                              |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `NODE_ENV`                                                                    | `production`                                                       |
| `CORS_ORIGIN`                                                                 | `https://<frontend-domain>` (tanpa trailing slash)                 |
| `PUBLIC_WEB_URL`                                                              | `https://<frontend-domain>`                                        |
| `DATABASE_URL`                                                                | Supabase transaction pooler `:6543` + `?pgbouncer=true`            |
| `DIRECT_URL`                                                                  | Supabase session pooler `:5432` (migration/seed)                   |
| `JWT_ACCESS_SECRET`                                                           | minimal 32 karakter, khusus produksi                               |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME` | bucket produksi                                                    |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`               | SMTP produksi (port 465 memakai TLS implisit)                      |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`             | opsional; redirect `https://<api-domain>/api/auth/google/callback` |

### 3. Frontend (Vercel)

- Root directory: `frontend`; framework Next.js.
- `NEXT_PUBLIC_*` di-inline saat build: set environment variable sebelum deploy pertama, lalu deploy ulang setiap kali nilainya berubah.

| Variabel                    | Nilai                       |
| --------------------------- | --------------------------- |
| `NEXT_PUBLIC_API_URL`       | `https://<api-domain>/api`  |
| `NEXT_PUBLIC_SITE_URL`      | `https://<frontend-domain>` |
| `NEXT_PUBLIC_CONTACT_EMAIL` | email Admin                 |

- `NEXT_PUBLIC_SITE_URL` wajib pada build produksi; nilainya dipakai untuk canonical, sitemap, dan JSON-LD. Build produksi gagal bila kosong.

### 4. Domain dan DNS

- `arkana` → CNAME `cname.vercel-dns.com`.
- `api` → CNAME hostname Render (`<service>.onrender.com`).
  Dua topologi yang didukung, sesuaikan `trust proxy` di `backend/src/app.ts`:
  - **Cloudflare proxy aktif (orange cloud, default):** klien → edge Cloudflare → proxy Render → app = 2 hop. Pakai `app.set('trust proxy', 2)`.
  - **DNS only (grey cloud):** klien → proxy Render → app = 1 hop. Turunkan ke `1`.
    Bila `trust proxy` tidak sesuai jumlah hop, `req.ip` (rate limit, log, audit) berisi IP proxy, bukan IP klien.

### 5. Verifikasi setelah deploy

1. `GET https://<api-domain>/api/health` → `200`.
2. `GET https://<api-domain>/api/health/ready` → `200` dengan `database` dan `storage` bernilai `ok`.
3. Login di frontend → cookie `arkana_access`/`arkana_refresh` memiliki `Secure`, `HttpOnly`, `SameSite=Lax`.
4. Unggah bukti dukung, buka pratinjau, salin tautan publik lalu buka tanpa sesi.
5. Kirim undangan atau reset password → email diterima.
6. Log backend tidak memuat `cookie`, `authorization`, maupun token pada URL.

### 6. Probe dan monitoring

- Render hanya memakai `/api/health` sebagai health check.
- Backend produksi (`src/lib/keep-alive.ts`) menjalankan self-ping ke `https://${RENDER_EXTERNAL_HOSTNAME}/api/health` tiap 7 menit agar instance free tidak tidur. `RENDER_EXTERNAL_HOSTNAME` di-inject otomatis oleh Render; bila kosong, self-ping nonaktif.
- DB keep-alive `SELECT 1` tiap 12 jam mencegah Supabase free project pause.
- Self-ping tidak dapat membangunkan instance yang sudah tidur (timer mati bersama proses). Untuk itu pasang monitor eksternal ke `https://<api-domain>/api/health` dengan interval 5 menit; request dari luar sekaligus membangunkan instance dan menguji jalur domain + Cloudflare.
- Jangan mengarahkan monitor ke `/api/health/ready`: tiap probe melakukan query database dan `HeadBucket` R2.
- Log `/api/health` dibisukan dari request log; kegagalan self-ping tetap tercatat sebagai `warn`.
