# PROJECT.md

## 1. Project Overview

Aplikasi web untuk membantu ASN mengelola catatan pekerjaan, bukti dukung, arsip pribadi, laporan kinerja, jadwal, dan catatan dalam satu tempat.

### Identitas Aplikasi

- **Nama aplikasi:** ARKANA
- **Kepanjangan:** Arsip, Rekam Kinerja, dan Agenda
- **Karakter brand:** Independen, modern, dan profesional.

ARKANA merupakan nama brand aplikasi yang tidak terbatas pada lingkungan ASN dan dapat dikembangkan untuk kebutuhan pengelolaan pekerjaan serta produktivitas yang lebih luas.

## 2. Background

Pencatatan pekerjaan dan pengelolaan dokumen ASN sering tersebar di berbagai media. Penyusunan laporan kinerja juga membutuhkan waktu karena aktivitas dan bukti dukung harus dikumpulkan kembali.

Aplikasi ini bertujuan menyederhanakan proses tersebut melalui pengelolaan data yang terpusat dan terstruktur.

## 3. Goals

- Mempermudah pencatatan pekerjaan sehari-hari.
- Memusatkan penyimpanan bukti dukung dan arsip pribadi.
- Mempermudah penyusunan rekap laporan kinerja.
- Menyediakan riwayat pekerjaan yang terstruktur.
- Membantu pengelolaan jadwal, pengingat, dan catatan pribadi.

## 4. Target Users & Roles

Aplikasi ditujukan untuk ASN. Penggunaan awal berfokus pada kebutuhan pribadi, tetapi sistem dirancang untuk mendukung banyak pengguna.

Terdapat dua role:

### Admin

- Hanya terdapat satu akun Admin.
- Akun dibuat melalui proses inisialisasi aplikasi.
- Bertugas mengelola akun pengguna ASN.
- Dapat mengundang pengguna, mengubah informasi akun, menonaktifkan, dan menghapus akun User.
- Tidak menggunakan modul pekerjaan, bukti dukung, arsip pribadi, jadwal, dan catatan.
- Tidak memiliki akses untuk membaca atau mengubah konten data pribadi User, kecuali menampilkan foto profil pada daftar akun.

### User

- Akun dibuat dan diundang oleh Admin.
- Dapat mengelola seluruh data miliknya sendiri.
- Dapat membuat, melihat, mengubah, dan menghapus data pribadi.
- Tidak dapat melihat atau mengubah data pengguna lain.
- Memiliki akses ke seluruh modul utama aplikasi.

## 5. Core Modules

### 5.1. User & Authentication

- Login menggunakan Google OAuth atau email dan password.
- Tidak tersedia pendaftaran akun secara mandiri.
- Admin membuat akun User melalui undangan email.
- Pengguna mengatur password sendiri melalui tautan undangan.
- Login Google hanya diizinkan menggunakan email yang sudah terdaftar dan diaktifkan.
- Admin dapat mengelola informasi dan status akun pengguna.
- Pengguna dapat melakukan pemulihan password melalui email.

### 5.2. Work Log

Pencatatan pekerjaan dilakukan secara manual. Setiap aktivitas menjadi satu catatan tersendiri.

Informasi catatan:

- Tanggal kegiatan (otomatis menggunakan tanggal hari ini dan tidak diubah dari antarmuka).
- Nama kegiatan.
- Uraian pekerjaan.
- Hasil atau output.
- Satu kategori utama.
- Satu atau lebih file bukti dukung.

Kategori tetap:

1. Pelaksanaan Tugas
2. Pengembangan dan Perbaikan
3. Koordinasi dan Rapat
4. Pelayanan dan Pendampingan
5. Administrasi dan Pelaporan
6. Pengembangan Kompetensi
7. Perjalanan Dinas dan Kegiatan Lapangan

Pengguna dapat mengubah kategori pada catatan yang sudah dibuat.

### 5.3. Evidence & Archive

Mengelola bukti dukung pekerjaan dan arsip pribadi.

**Bukti dukung pekerjaan:**

- Satu aktivitas dapat memiliki beberapa file bukti dukung.
- Setiap aktivitas memiliki satu tautan publik yang stabil.
- Tautan dapat dibuka tanpa login oleh pimpinan atau pemeriksa.
- Halaman publik menampilkan nama kegiatan, tanggal, uraian pekerjaan, hasil atau output, serta seluruh file bukti dukung.
- Setiap file menampilkan nama, format, ukuran, dan pilihan untuk melihat atau mengunduh.
- Tautan bersifat permanen dan tidak dapat dinonaktifkan oleh pemiliknya.
- Perubahan atau penambahan lampiran memperbarui halaman bukti dukung yang sama.

**Format file yang didukung:**

- Foto: JPG, JPEG, PNG, WEBP, HEIC, HEIF.
- Dokumen: PDF, DOC, DOCX, XLS, XLSX.
- Foto harus dapat ditampilkan secara kompatibel, termasuk melalui konversi atau optimasi HEIC/HEIF jika diperlukan.

**Batas unggahan:**

- Maksimal 5 MB per file.
- Maksimal 10 file per aktivitas.
- Maksimal total 50 MB per aktivitas.
- Berlaku untuk seluruh format file.
- Foto dapat dioptimalkan secara otomatis dengan tetap mempertahankan kualitas yang memadai untuk verifikasi.

**Arsip pribadi:**

- Menyimpan SK CPNS/PNS, sertifikat pelatihan, dokumen kepegawaian, dan dokumen pribadi lainnya.
- Dokumen dikelompokkan menggunakan folder yang dibuat pengguna, maksimal 3 level. Pemilihan folder menampilkan dokumen pada folder tersebut beserta seluruh subfoldernya.
- Folder bawaan disiapkan saat arsip pertama kali digunakan dan dapat diubah atau dihapus pengguna.
- Setiap dokumen dapat disimpan pada arsip utama atau di dalam folder, serta menyimpan nama, deskripsi opsional, tanggal dokumen opsional, dan satu file.
- Mendukung pencarian berdasarkan nama atau deskripsi dan filter jenis berkas. Dokumen diurutkan berdasarkan waktu unggah terbaru.
- Format dan batas ukuran file mengikuti ketentuan bukti dukung pekerjaan.
- Kuota penyimpanan arsip maksimal 1 GB per akun.
- Bersifat privat dan hanya dapat diakses pemilik akun.
- Tidak otomatis memiliki tautan publik.

### 5.4. Performance Report

Menyediakan rekap pekerjaan berdasarkan:

- Harian.
- Mingguan (Senin–Minggu).
- Bulanan.
- Tahunan.

Batas periode dihitung berdasarkan zona waktu Asia/Makassar (WITA) atas tanggal kegiatan. Periode mengikuti periode berjalan (tanggal hari ini); pemilihan tanggal acuan, rentang tanggal khusus, dan filter kategori tidak disediakan.

Rekap disusun mengikuti kebutuhan pengisian e-Kinerja (myASN) dengan kolom: nomor, tanggal, Rencana Aksi, Target, Realisasi, Bukti Dukung, Link, dan Kategori.

- Rencana Aksi menggunakan nama kegiatan pada Work Log.
- Target dan Realisasi berupa teks bebas yang diisi pengguna dan bersifat opsional.
- Bukti Dukung merupakan ringkasan nama file: tanpa file ditampilkan `-`; satu file ditampilkan tanpa ekstensi; lebih dari satu file digabung dengan pemisah `;` dan dipotong 255 karakter disertai jumlah file tersisa.
- Link menggunakan tautan publik permanen kegiatan.
- Kategori ditampilkan sebagai kolom.
- Baris tanpa bukti dukung tetap disertakan.

Ekspor tersedia dalam format XLSX dan PDF.

### 5.5. Schedule & Reminder

Mengelola agenda, jadwal kegiatan, tenggat waktu, dan pengingat pribadi.

Informasi agenda:

- Judul agenda.
- Deskripsi opsional.
- Tanggal dan waktu mulai.
- Tanggal dan waktu selesai opsional.
- Penanda agenda sepanjang hari.
- Tempat atau lokasi opsional.
- Satu kategori.
- Status: Belum Dimulai, Selesai, Dibatalkan.

Kategori tetap:

1. Rapat dan Koordinasi
2. Pekerjaan dan Tugas
3. Pelatihan dan Pengembangan Kompetensi
4. Perjalanan Dinas
5. Kegiatan Pribadi
6. Tenggat Waktu (Deadline)
7. Lainnya

Ketentuan:

- Agenda bersifat privat dan hanya dapat diakses pemiliknya.
- Pengulangan agenda tidak tersedia pada versi awal.
- Pengingat dan notifikasi ditangguhkan ke pengembangan berikutnya.
- Waktu mengikuti zona waktu WITA (Asia/Makassar).

### 5.6. Notes

Menyediakan tempat untuk menyimpan catatan, ide, informasi, dan hal-hal yang perlu ditindaklanjuti.

Ketentuan:

- Satu catatan hanya berisi satu isi teks bebas tanpa judul.
- Catatan dapat disematkan (pin) agar tampil lebih dahulu.
- Pencarian dilakukan pada isi catatan.
- Tidak tersedia tag, folder, checklist, maupun lampiran pada versi awal.
- Catatan bersifat privat dan hanya dapat diakses pemiliknya.

### 5.7. Dashboard

Menampilkan ringkasan aktivitas dan akses cepat. Isi dashboard berbeda untuk User dan Admin.

**Dashboard User:**

- Kartu ringkasan: jumlah kegiatan bulan berjalan, jumlah kegiatan 7 hari terakhir, jumlah file bukti dukung yang tersimpan, dan pemakaian kuota arsip terhadap batas 1 GB.
- Agenda hari ini dan maksimal 5 agenda terdekat berikutnya.
- Maksimal 5 catatan yang disematkan, diurutkan berdasarkan pembaruan terbaru.
- Grafik jumlah kegiatan per kategori pada bulan berjalan serta tren kegiatan 7 hari dan 30 hari terakhir.
- Aksi cepat: catat kegiatan, tambah agenda, dan tambah catatan.

**Dashboard Admin:**

- Ringkasan jumlah akun per status: Aktif, Diundang, dan Nonaktif.
- Daftar undangan yang belum diterima beserta aksi kirim ulang undangan.
- Tidak menampilkan data pribadi User.

**Ketentuan:**

- Seluruh data User dibatasi pada data milik pengguna yang sedang login.
- Perhitungan periode dan hari mengikuti zona waktu WITA (Asia/Makassar).
- Grafik hanya bersifat ringkasan; tidak menyediakan analisis atau rekomendasi otomatis.

### 5.8. Halaman Publik

Halaman utama `/` dapat diakses tanpa login dan berisi informasi umum tentang ARKANA: tujuan aplikasi, modul yang tersedia, serta ketentuan privasi data.

- Tidak menampilkan data pengguna mana pun.
- Menyediakan akses menuju halaman masuk; pengguna dengan sesi aktif diarahkan menuju dashboard.
- Dashboard berada pada halaman terpisah dan hanya dapat diakses setelah login.

## 6. Business Rules

- Setiap aktivitas pekerjaan dicatat sebagai satu record tersendiri.
- Satu record memiliki satu kategori utama dan dapat memiliki beberapa file bukti dukung.
- Setiap User memiliki kendali atas data miliknya sendiri, termasuk membuat, melihat, mengubah, dan menghapus data.
- Setiap User hanya dapat mengakses dan mengelola data miliknya sendiri.
- Data pekerjaan, arsip, jadwal, dan catatan bersifat privat secara default.
- Admin hanya bertugas mengelola akun dan tidak memiliki akses ke konten data pribadi User.
- Tidak tersedia pendaftaran akun secara mandiri.
- Hanya ada satu akun Admin yang dibuat melalui inisialisasi aplikasi.
- Tautan bukti dukung hanya membuka informasi aktivitas yang secara khusus dibagikan oleh pemiliknya, bukan seluruh penyimpanan.
- Tautan publik bersifat permanen selama aplikasi dan data terkait tersedia.
- Penonaktifan akun tidak otomatis menghilangkan riwayat pekerjaan dan dokumen pengguna.
- Penghapusan akun User bersifat permanen: seluruh data dan file terkait dihapus dan tidak dapat dipulihkan.
- Admin dapat melihat foto profil User pada daftar akun, tetapi tidak dapat mengubah atau menghapusnya.
- Dashboard hanya merangkum data milik pengguna yang sedang login; Admin tidak memperoleh ringkasan konten pribadi User.
- Halaman publik hanya menampilkan informasi umum aplikasi dan tidak memuat data pribadi pengguna.

## 7. Scope & Constraints

Batasan versi awal:

- Tidak terintegrasi langsung dengan API myASN.
- Tidak mengirim laporan secara otomatis ke sistem pemerintah.
- Tidak menyediakan integrasi Google Drive per pengguna.
- Tidak menyediakan aplikasi mobile native.
- Tidak menyediakan kolaborasi atau pengelolaan pekerjaan tim.
- Tidak menyediakan pembuatan atau analisis laporan menggunakan AI.

Batasan dapat ditinjau kembali jika terdapat kebutuhan dan persetujuan yang jelas.

## 8. Open Decisions

Hal-hal yang masih perlu dibahas:

- Pencarian dan filter lintas modul.

Keputusan yang sudah ditetapkan untuk dashboard, kategori arsip, format ekspor laporan, struktur Notes, serta backup dan pemulihan data dicatat pada `ROADMAP.md`. Kanal notifikasi belum ditetapkan dan ditangguhkan bersama fitur pengingat.

Detail teknologi, struktur database, API, autentikasi, otorisasi, penyimpanan file, dan deployment dibahas dalam `ARCHITECTURE.md`.
