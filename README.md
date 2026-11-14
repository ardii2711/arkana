# ARKANA

Arsip, Rekam Kinerja, dan Agenda — aplikasi pengelolaan catatan pekerjaan, bukti dukung, arsip pribadi, laporan kinerja, jadwal, dan catatan.

## Prasyarat

- Node.js 24 LTS
- npm 11

## Struktur

```text
arkana/
├── backend/   # Express.js + TypeScript API
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

## Perintah Root

| Perintah | Fungsi |
| --- | --- |
| `npm run dev` | Jalankan backend (watch mode) |
| `npm run build` | Build backend ke `backend/dist` |
| `npm start` | Jalankan backend hasil build |
| `npm run typecheck` | Pemeriksaan TypeScript |
| `npm run lint` | ESLint |
| `npm run format` | Prettier (tulis) |
| `npm run format:check` | Prettier (cek) |
