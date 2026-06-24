const defaultArticles = [
  {
    id: 1,
    title: "Masalah Koneksi WiFi Kantor 'Corpo-Net'",
    category: "konektivitas",
    categoryDisplay: "Konektivitas",
    description: "Panduan langkah demi langkah untuk mengatasi masalah perangkat laptop atau HP yang tidak dapat terhubung atau sering terputus dari jaringan WiFi utama kantor.",
    symptoms: "Perangkat terus-menerus meminta login/password, status menunjukkan 'Connected, no internet', atau SSID 'Corpo-Net' tidak terdeteksi.",
    steps: [
      "Pastikan WiFi pada perangkat Anda dalam posisi aktif (ON).",
      "Buka pengaturan jaringan, pilih 'Corpo-Net', lalu klik kanan/tahan dan pilih 'Lupakan Jaringan' (Forget Network).",
      "Matikan WiFi perangkat Anda selama 5 detik, kemudian aktifkan kembali.",
      "Pilih kembali 'Corpo-Net', masukkan username AD (Active Directory) Anda (tanpa domain) dan password Windows Anda.",
      "Jika muncul peringatan sertifikat keamanan, klik 'Trust' atau 'Connect' untuk menyetujui."
    ],
    tags: ["wifi", "internet", "koneksi", "jaringan", "corpo-net", "nirkabel", "wireless"]
  },
  {
    id: 2,
    title: "Konfigurasi VPN untuk Kerja Remote (WFH)",
    category: "konektivitas",
    categoryDisplay: "Konektivitas",
    description: "Cara menginstal dan mengonfigurasi klien FortiClient VPN agar Anda dapat mengakses server internal dan database kantor dari rumah dengan aman.",
    symptoms: "Tidak dapat mengakses server berkas (File Server), Gitlab lokal, atau sistem intranet perusahaan saat bekerja dari rumah.",
    steps: [
      "Unduh FortiClient VPN terbaru dari portal IT Support atau gunakan Software Center di laptop kantor.",
      "Buka FortiClient, pilih 'Configure VPN' lalu atur tipe koneksi ke SSL-VPN.",
      "Isi nama koneksi dengan 'VPN Kantor', dan set IP Remote Gateway ke: vpn.perusahaan.co.id (Port: 443).",
      "Centang opsi 'Prompt on login', lalu klik Save.",
      "Masukkan username AD dan password Anda, lalu lakukan verifikasi OTP (One-Time Password) melalui aplikasi Google Authenticator di HP Anda."
    ],
    tags: ["vpn", "remote", "wfh", "forticlient", "koneksi", "jaringan", "akses"]
  },
  {
    id: 3,
    title: "Printer Kantor Tidak Merespons / Macet",
    category: "perangkat-keras",
    categoryDisplay: "Perangkat Keras",
    description: "Mengatasi masalah antrean cetak yang menumpuk (print queue crash) atau printer departemen yang tidak merespons perintah cetak dari laptop.",
    symptoms: "Status printer menunjukkan 'Offline', dokumen tertahan di status 'Spooling' / 'Printing' tetapi kertas tidak keluar, atau muncul error 'Printer in Error State'.",
    steps: [
      "Pastikan printer departemen dalam keadaan menyala, layar kontrol normal (tidak ada error paper jam/tinta habis).",
      "Tekan tombol Windows + R, ketik 'services.msc' lalu tekan Enter.",
      "Cari layanan bernama 'Print Spooler', klik kanan lalu pilih 'Restart'.",
      "Buka Control Panel > Devices and Printers, klik kanan printer yang bermasalah, lalu pilih 'See what's printing' dan hapus antrean dokumen yang error (Cancel All Documents).",
      "Coba cetak kembali dokumen Anda."
    ],
    tags: ["printer", "cetak", "kertas", "print spooler", "perangkat keras", "hardware", "macet"]
  },
  {
    id: 4,
    title: "Monitor Eksternal Tidak Terdeteksi",
    category: "perangkat-keras",
    categoryDisplay: "Perangkat Keras",
    description: "Panduan troubleshooting saat monitor kedua/eksternal Anda tidak menampilkan gambar (layar hitam) saat dihubungkan ke laptop via HDMI atau Type-C Hub.",
    symptoms: "Layar monitor eksternal menampilkan pesan 'No Signal', layar berkedip-kedip, atau resolusi gambar terlihat sangat pecah/tidak sesuai.",
    steps: [
      "Periksa koneksi fisik kabel HDMI/DisplayPort/Type-C. Lepaskan kabel dari port laptop dan monitor, bersihkan port dari debu secara perlahan, lalu colokkan kembali hingga rapat.",
      "Gunakan tombol shortcut keyboard Windows + P, kemudian pilih mode proyeksi 'Extend' atau 'Duplicate'.",
      "Jika menggunakan Dongle / USB-C Hub, coba hubungkan monitor langsung ke laptop (jika ada port langsung) untuk memastikan dongle tidak rusak.",
      "Klik kanan di desktop, pilih 'Display settings', lalu gulir ke bawah dan klik tombol 'Detect' di bawah bagian Multiple Displays.",
      "Update driver kartu grafis Anda melalui Device Manager atau perangkat lunak pendukung produsen laptop (Lenovo Vantage / Dell Command)."
    ],
    tags: ["monitor", "layar", "hdmi", "display", "dongle", "proyektor", "perangkat keras", "hardware"]
  },
  {
    id: 5,
    title: "Reset Password Akun Windows / Active Directory",
    category: "akun-akses",
    categoryDisplay: "Akun & Akses",
    description: "Prosedur mandiri (Self-Service) untuk mereset password akun Windows (Active Directory) Anda yang terkunci atau akan kedaluwarsa.",
    symptoms: "Muncul pesan 'Your account has been locked' setelah salah memasukkan password sebanyak 3 kali, atau peringatan 'Your password will expire in X days'.",
    steps: [
      "Akses portal Reset Mandiri melalui HP atau browser luar di: https://sspm.perusahaan.co.id.",
      "Masukkan username AD Anda dan ketik kode captcha yang tertera.",
      "Verifikasi identitas Anda dengan memasukkan kode OTP yang dikirimkan via SMS atau Email cadangan terdaftar.",
      "Buat password baru dengan ketentuan minimal 12 karakter, mengandung huruf besar, huruf kecil, angka, dan karakter khusus (!@#$%). Password baru tidak boleh mengandung nama Anda.",
      "Tunggu 1-2 menit sebelum mencoba login kembali di laptop Anda menggunakan koneksi kabel LAN kantor atau VPN."
    ],
    tags: ["password", "reset", "akun", "terkunci", "lock", "ad", "active directory", "kredensial"]
  },
  {
    id: 6,
    title: "Permintaan Akses Folder Shared Drive (Folder S:)",
    category: "akun-akses",
    categoryDisplay: "Akun & Akses",
    description: "Langkah-langkah untuk mengajukan hak akses (Read/Write) ke folder bersama departemen di server penyimpanan terpusat (Shared Drive).",
    symptoms: "Muncul error 'Windows cannot access \\\\shared-drive\\departemen' atau 'Access Denied' saat membuka drive S:.",
    steps: [
      "Minta persetujuan (approval) tertulis melalui email dari Kepala Departemen (Head of Department) Anda terlebih dahulu.",
      "Buka portal Tiket IT Support di: https://helpdesk.perusahaan.co.id.",
      "Buat tiket baru dengan kategori 'Akses & Akun' > 'Shared Drive Access'.",
      "Lampirkan screenshot error akses dan bukti email persetujuan dari Kepala Departemen Anda.",
      "Tim IT akan memproses permintaan Anda ke grup keamanan (Security Group) AD dalam waktu maksimal 2 jam kerja setelah tiket diterima."
    ],
    tags: ["shared drive", "folder", "akses", "izin", "permission", "drive", "server", "data"]
  },
  {
    id: 7,
    title: "Lisensi Microsoft 365 Tidak Aktif (Unlicensed Product)",
    category: "software",
    categoryDisplay: "Software",
    description: "Cara memulihkan lisensi Microsoft Word, Excel, atau PowerPoint yang tiba-tiba berstatus 'Unlicensed Product' atau tidak bisa diedit.",
    symptoms: "Muncul banner merah 'Product Deactivated' di bagian atas aplikasi Office, atau tombol editing terkunci (Read-Only).",
    steps: [
      "Pastikan laptop Anda terhubung ke internet yang stabil.",
      "Di dalam aplikasi Office (misal: Word), buka menu 'File' di kiri atas, lalu klik 'Account'.",
      "Di bawah 'User Information', klik 'Sign Out' dari akun Microsoft Anda saat ini.",
      "Tutup semua aplikasi Microsoft Office yang sedang berjalan.",
      "Buka kembali Microsoft Word, klik 'Sign In', lalu masukkan email resmi kantor Anda (misal: nama.karyawan@perusahaan.co.id) dan password Windows Anda."
    ],
    tags: ["office", "excel", "word", "microsoft 365", "m365", "lisensi", "license", "software", "aplikasi"]
  },
  {
    id: 8,
    title: "Instalasi dan Pembaruan Browser Google Chrome",
    category: "software",
    categoryDisplay: "Software",
    description: "Mengatasi masalah browser Google Chrome yang lambat, sering crash, atau panduan memperbarui ke versi aman terbaru demi perlindungan data.",
    symptoms: "Browser Chrome sering 'Not Responding', halaman web tertentu tidak termuat dengan sempurna, atau muncul peringatan pembaruan dari tim Cyber Security.",
    steps: [
      "Buka Google Chrome, klik ikon tiga titik vertikal di pojok kanan atas.",
      "Pilih 'Help' > 'About Google Chrome'.",
      "Chrome akan otomatis mencari pembaruan yang tersedia dan mengunduhnya. Tunggu hingga proses selesai.",
      "Klik tombol 'Relaunch' setelah pengunduhan selesai untuk menerapkan pembaruan.",
      "Jika Chrome rusak total atau tidak bisa dibuka, jalankan 'Software Center' di laptop Anda, cari 'Google Chrome', lalu pilih 'Reinstall'."
    ],
    tags: ["chrome", "google chrome", "browser", "update", "pembaruan", "crash", "lambat", "software"]
  }
];

// Load articles from localStorage if available, otherwise use default
let articles = JSON.parse(localStorage.getItem('kb_articles')) || defaultArticles;

// Synchronize back to localStorage if empty
if (!localStorage.getItem('kb_articles')) {
  localStorage.setItem('kb_articles', JSON.stringify(articles));
}
