# Walkthrough: IT Support Knowledge Base Website

Kami telah berhasil membuat website internal IT Support Knowledge Base yang bersih, modern, dan profesional sesuai dengan semua spesifikasi Anda.

## Berkas yang Dibuat

Kami membuat 4 berkas utama di dalam direktori kerja Anda `C:/Learning Dev`:

1. **[articles.js](file:///C:/Learning%20Dev/articles.js)**: Menyimpan database data artikel troubleshooting dalam bentuk array objek JavaScript. Ini membuat penambahan artikel di masa mendatang menjadi sangat mudah dan rapi.
2. **[style.css](file:///C:/Learning%20Dev/style.css)**: Berkas CSS terpisah yang mengatur skema warna biru korporat modern (`#2563eb`, `#0f172a`), tipografi modern Google Fonts (`Outfit` & `Inter`), efek transisi transparan, layout grid/flexbox yang responsif, dan modal overlay.
3. **[index.html](file:///C:/Learning%20Dev/index.html)**: Struktur markup halaman utama yang memuat ikon SVG inline tajam, Search Bar besar di tengah, 4 kartu kategori interaktif, feed artikel dinamis, dan kontainer modal detail.
4. **[app.js](file:///C:/Learning%20Dev/app.js)**: Logika JavaScript yang menangani penyaringan artikel real-time saat mengetik, filter kategori aktif, pembukaan modal detail artikel, dan pembuatan tautan email support dinamis untuk tombol 'Hubungi IT'.

---

## Fitur Utama

- **Pencarian Real-Time (Search Bar)**: Menyaring daftar artikel secara instan saat Anda mengetik. Pencarian mencakup judul, deskripsi, gejala, dan tag artikel.
- **Filter Kategori**: Klik pada 4 kartu kategori utama ('Konektivitas', 'Perangkat Keras', 'Akun & Akses', dan 'Software') untuk menyaring artikel dengan cepat. Mengklik kartu yang sama lagi akan membatalkan filter.
- **Modal Detail Artikel**: Menampilkan detail artikel secara elegan dengan latar belakang blur transparan. Tampilan mencakup:
  - Label Kategori
  - Deskripsi Masalah
  - Gejala yang Terjadi (dengan kotak peringatan warna amber)
  - Langkah Perbaikan (list angka berdesain rapi)
  - Tombol 'Hubungi IT Support' yang otomatis membuka klien email Anda (seperti Outlook) dengan subjek dan isi email otomatis terisi detail masalah artikel.
- **Responsif Penuh**: Tata letak otomatis menyesuaikan ke layar HP, tablet, maupun layar desktop lebar secara rapi tanpa merusak desain visual.

---

## Panduan Verifikasi Mandiri

> [!NOTE]
> Karena adanya kendala teknis internal pada subagen browser penguji otomatis di sandbox, kami menyarankan Anda membuka dan menguji website ini secara langsung di browser lokal Anda.

### Cara Membuka Website:
1. Buka File Explorer Anda dan arahkan ke direktori: `C:\Learning Dev`
2. Klik ganda pada file [index.html](file:///C:/Learning%20Dev/index.html) untuk membukanya di browser pilihan Anda (Google Chrome, Edge, Firefox, dll.).

### Skenario Pengujian:
1. **Pencarian**: Ketik kata kunci `wifi` di kolom pencarian. Pastikan hanya artikel terkait WiFi dan VPN yang tersisa. Klik tombol **X** di sisi kanan kolom pencarian untuk membersihkan kolom.
2. **Penyaringan Kategori**: Klik kartu **Perangkat Keras**. Pastikan judul feed berubah menjadi "Kategori: Perangkat Keras" dan menampilkan artikel printer dan monitor eksternal. Klik kembali kartu tersebut untuk menampilkan seluruh artikel lagi.
3. **Melihat Detail**: Klik pada kartu artikel "Printer Kantor Tidak Merespons / Macet". Pastikan modal dengan detail deskripsi, gejala, langkah-langkah, dan tombol hubungi IT Support muncul secara elegan.
4. **Hubungi IT**: Klik tombol **Hubungi IT Support** di bagian bawah modal. Pastikan aplikasi email Anda terbuka dengan draf baru yang secara otomatis mengisi data masalah tersebut.
5. **Menutup Modal**: Klik tombol **X** di kanan atas modal atau klik di area kosong di luar modal untuk menutupnya.
