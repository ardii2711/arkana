# Project Rules

Dokumen ini mengatur pengelolaan konteks proyek, dokumentasi, pembagian tanggung jawab agent, roadmap, dan checkpoint pekerjaan. Untuk prinsip kerja serta standar teknis, ikuti Global Rules OpenCode.

## 1. Project Context

Gunakan dokumen berikut sebagai referensi utama untuk memahami proyek:

- `docs/PROJECT.md`: Tujuan, kebutuhan, ruang lingkup, fitur, dan teknologi proyek.
- `docs/ARCHITECTURE.md`: Arsitektur sistem, struktur komponen, dan alur kerja aplikasi jika tersedia.
- `docs/ROADMAP.md`: Rencana dan urutan seluruh pekerjaan proyek.
- `docs/PROGRESS.md`: Status pekerjaan dan checkpoint terakhir.

Pastikan informasi dalam dokumentasi tetap selaras dengan kondisi implementasi aktual. Jika terdapat perbedaan, identifikasi dan klarifikasi sebelum menjadikannya dasar pekerjaan.

## 2. Documentation Management

Ketentuan pengelolaan dokumentasi:

- Periksa dokumen yang relevan sebelum menyusun rencana atau melanjutkan pekerjaan.
- Perbarui dokumen jika terdapat perubahan yang memengaruhi informasi di dalamnya.
- Hindari duplikasi informasi antar-dokumen.
- Tempatkan informasi sesuai fungsi masing-masing dokumen.
- Jangan membuat dokumentasi tambahan tanpa kebutuhan yang jelas.

## 3. Agent Responsibilities

Pembagian tanggung jawab agent dalam proyek:

### Plan Agent

Bertanggung jawab atas analisis dan perencanaan proyek.

- Menganalisis kebutuhan dan kondisi proyek.
- Menyusun roadmap lengkap beserta dependensi dan urutan pekerjaan.
- Menentukan tujuan, ruang lingkup, dan kriteria penyelesaian setiap task.
- Mengidentifikasi risiko, kebutuhan teknis, dan keputusan yang memerlukan persetujuan pengguna.
- Tidak melakukan implementasi kode.

### Build Agent

Bertanggung jawab atas implementasi proyek.

- Memahami roadmap dan checkpoint proyek.
- Fokus pada satu task yang sedang aktif dan telah disetujui.
- Menjaga kesesuaian implementasi dengan kebutuhan serta arsitektur proyek.
- Memperbarui dokumentasi yang terdampak oleh hasil implementasi.
- Melaporkan hasil pekerjaan sesuai Global Rules.

Gunakan subagent hanya jika pembagian pekerjaan memberikan manfaat nyata dan tidak menimbulkan kompleksitas yang tidak diperlukan.

## 4. Roadmap Management

Gunakan `docs/ROADMAP.md` sebagai acuan keseluruhan pekerjaan proyek.

Struktur roadmap:

`Phase → Subphase → Task`

Setiap task harus memiliki:

- **ID:** Identitas unik task.
- **Objective:** Tujuan yang ingin dicapai.
- **Scope:** Batasan pekerjaan yang akan dilakukan.
- **Acceptance Criteria:** Kriteria yang menentukan task telah memenuhi tujuannya.
- **Dependencies:** Ketergantungan terhadap task lain jika ada.

Ketentuan:

- Roadmap harus mencakup seluruh kebutuhan proyek, termasuk implementasi dan final testing.
- Susun urutan pekerjaan berdasarkan dependensi dan prioritas.
- Roadmap yang telah disetujui menjadi acuan pelaksanaan proyek.
- Perubahan ruang lingkup, urutan, atau penambahan task pada roadmap harus dikomunikasikan dan mendapat persetujuan pengguna.

## 5. Progress & Context Management

Gunakan `docs/PROGRESS.md` sebagai checkpoint utama untuk melanjutkan pekerjaan antar-sesi.

Informasi yang perlu dicatat:

- Phase dan task yang sedang aktif.
- Status setiap task.
- Task yang telah selesai dan dikonfirmasi commit-nya.
- Ringkasan hasil implementasi terakhir.
- Hasil pemeriksaan dan tindakan manual yang masih menunggu.
- Hambatan serta keputusan yang belum terselesaikan.
- Usulan pekerjaan lanjutan.
- Langkah berikutnya yang perlu dilakukan.

Ketentuan:

- Perbarui checkpoint ketika terdapat perubahan status atau hasil pekerjaan penting.
- Simpan informasi yang diperlukan agar pekerjaan dapat dilanjutkan tanpa mengulang analisis yang sudah dilakukan.
- Pastikan status yang dicatat sesuai kondisi aktual dan konfirmasi pengguna.
- Hindari mencatat seluruh riwayat percakapan atau mengulang informasi yang sudah tersedia dalam dokumen lain.

---

**Prinsip pengelolaan proyek:** Plan Agent memahami dan merencanakan keseluruhan proyek, sedangkan Build Agent mengimplementasikannya secara bertahap berdasarkan roadmap dan checkpoint yang telah disepakati.
