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
