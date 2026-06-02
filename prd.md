# PRODUCT REQUIREMENTS DOCUMENT (PRD)

# Sistem Pendaftaran Kursus

# Madrasah Ilmu Al Quran Pondok Pesantren Miftahul Ulum Panyeppen

Versi: 1.0
Status: Draft Final
Target Platform: Web Responsive (Mobile & Desktop)

---

# 1. LATAR BELAKANG

Madrasah Ilmu Al Quran Pondok Pesantren Miftahul Ulum Panyeppen menyelenggarakan program Kursus Madrasah Ilmu Al Quran yang berlangsung selama beberapa hari dan membutuhkan sistem pendaftaran yang terpusat, profesional, modern, serta mudah digunakan.

Saat ini proses pendaftaran, pengaturan kamar, pengelolaan peserta, validasi pembayaran, pembuatan bukti pendaftaran, hingga pembuatan sertifikat masih berpotensi dilakukan secara manual sehingga memerlukan banyak waktu dan tenaga.

Sistem ini dibuat untuk mengotomatisasi seluruh proses tersebut sehingga panitia dapat mengelola kegiatan dengan lebih tertib, cepat, dan profesional.

---

# 2. TUJUAN SISTEM

Tujuan utama sistem:

* Digitalisasi pendaftaran peserta.
* Mengurangi pekerjaan manual panitia.
* Otomatisasi pembagian kamar.
* Otomatisasi pembuatan bukti pendaftaran.
* Otomatisasi pembuatan sertifikat.
* Memudahkan validasi pembayaran.
* Menyediakan dashboard pengelolaan peserta yang lengkap.
* Menyediakan sistem yang dapat digunakan untuk banyak angkatan atau gelombang.

---

# 3. TEKNOLOGI

Frontend

* React
* Vite
* Tailwind CSS
* Axios
* React Router

Backend

* Supabase

Database

* PostgreSQL (Supabase)

Authentication

* Supabase Auth

Storage

* Supabase Storage

Hosting

* Vercel

PDF Generator

* pdf-lib

QR Code

* qrcode

---

# 4. JENIS PENGGUNA

## 4.1 Admin

Memiliki akses penuh ke seluruh sistem.

## 4.2 Operator

Mengelola peserta dan pembayaran.

## 4.3 Peserta

Melakukan pendaftaran dan mengunduh dokumen.

## 4.4 Penanggung Jawab

Menerima informasi dan bergabung ke grup WhatsApp.

---

# 5. HOMEPAGE

Homepage harus memiliki desain profesional, modern, islami, dan mobile friendly.

Bagian homepage:

## Hero Section

Judul utama.

Kalimat motivasi.

Tombol:

* Daftar Sekarang
* Lihat Informasi

## Profil Program

Penjelasan singkat program.

## Keunggulan Program

* Pembelajaran terarah
* Pembimbing berpengalaman
* Sistem administrasi modern
* Sertifikat resmi

## Alur Pendaftaran

1. Daftar
2. Pembayaran
3. Validasi
4. Penempatan Kamar
5. Mengikuti Kursus
6. Mendapat Sertifikat

## FAQ

Pertanyaan yang sering ditanyakan.

## Kontak

* WhatsApp
* Email
* Alamat

---

# 6. MANAJEMEN GELOMBANG

Admin dapat membuat banyak gelombang.

Data gelombang:

* Nama Gelombang
* Tahun
* Tanggal Mulai
* Tanggal Selesai
* Status Aktif
* Kuota
* Link Grup WhatsApp

Contoh:

Gelombang 1 Tahun 2026

Gelombang 2 Tahun 2026

---

# 7. FORM PENDAFTARAN

Data yang wajib diisi:

* Nama Lembaga
* Asal Pesantren
* Nama Santri
* Nama Penanggung Jawab
* Nomor Penanggung Jawab
* Jenis Kursus

Pilihan Kursus:

1. Tartil Pemula
2. Tartil Melanjutkan

Setelah submit sistem membuat:

* Nomor Registrasi
* Data Peserta
* Status Pembayaran

---

# 8. VALIDASI PEMBAYARAN

Status pembayaran:

* Belum Bayar
* Menunggu Validasi
* Valid
* Ditolak

Admin dapat:

* Melihat bukti transfer
* Menyetujui pembayaran
* Menolak pembayaran

---

# 9. SISTEM KAMAR OTOMATIS

Admin membuat:

* Nama Kamar
* Nomor Kamar
* Kapasitas

Contoh:

Kamar A01
Kapasitas 20

Kamar A02
Kapasitas 20

Kamar B01
Kapasitas 30

Sistem mengisi kamar secara otomatis berdasarkan urutan pendaftaran.

Jika kamar penuh maka peserta berikutnya masuk ke kamar berikutnya.

---

# 10. SISTEM RUANGAN

Admin dapat membuat:

* Nama Ruangan
* Kode Ruangan
* Jenis Kursus

Contoh:

Ruang Al Fatih
Ruang Al Furqan
Ruang Al Ikhlas

Admin dapat memindahkan peserta kapan saja.

---

# 11. PDF BUKTI PENDAFTARAN

Setelah pendaftaran berhasil sistem membuat PDF otomatis.

Isi PDF:

* Nomor Registrasi
* Nama Santri
* Nama Lembaga
* Asal Pesantren
* Nama Penanggung Jawab
* Nomor Penanggung Jawab
* Jenis Kursus
* Kamar
* Ruangan
* Tanggal Pendaftaran
* QR Code Registrasi
* Link Grup WhatsApp

PDF dapat dicetak.

---

# 12. INTEGRASI WHATSAPP

Setiap gelombang memiliki:

* Link Grup WhatsApp

Setelah pendaftaran:

Peserta dapat langsung klik tombol:

Gabung Grup WhatsApp

Link juga muncul pada PDF.

---

# 13. DASHBOARD ADMIN

## Dashboard Utama

Menampilkan statistik:

* Total Pendaftar
* Total Pembayaran Valid
* Total Kamar Terisi
* Total Ruangan
* Total Sertifikat

---

## Menu Dashboard

### Dashboard

Ringkasan sistem.

### Peserta

* Daftar Peserta
* Detail Peserta
* Edit Data
* Hapus Data

### Pembayaran

* Validasi Pembayaran
* Riwayat Pembayaran

### Kamar

* Tambah Kamar
* Edit Kamar
* Kapasitas

### Ruangan

* Tambah Ruangan
* Edit Ruangan

### Gelombang

* Tambah Gelombang
* Tutup Gelombang

### Sertifikat

* Template
* Generate
* Download

### Pengaturan

* Informasi Program
* WhatsApp
* Homepage

---

# 14. FITUR PENCARIAN

Admin dapat mencari berdasarkan:

* Nama Santri
* Nomor Registrasi
* Nomor HP
* Kamar
* Ruangan
* Gelombang
* Jenis Kursus

---

# 15. EXPORT DATA

Admin dapat:

* Export Excel
* Export CSV
* Print Data

---

# 16. SISTEM SERTIFIKAT OTOMATIS

Fitur unggulan sistem.

Konsep seperti Mail Merge Word + Excel.

---

## Template Sertifikat

Admin dapat mengunggah:

* PNG
* JPG
* PDF

Sebagai background sertifikat.

---

## Variabel Sertifikat

Sistem menyediakan:

{{nomor_sertifikat}}

{{nama_santri}}

{{nama_lembaga}}

{{asal_pesantren}}

{{jenis_kursus}}

{{tanggal}}

{{tahun}}

---

## Posisi Teks

Admin dapat mengatur:

* Posisi X
* Posisi Y
* Font
* Ukuran Font
* Warna
* Alignment

Tanpa perlu mengubah desain sertifikat.

---

## Generate Sertifikat

Pilihan:

### Generate Per Peserta

Membuat satu sertifikat.

### Generate Massal

Membuat seluruh sertifikat sekaligus.

---

## Nomor Sertifikat

Contoh:

MIQ/2026/0001

MIQ/2026/0002

MIQ/2026/0003

Otomatis bertambah.

---

## Download Sertifikat

Format:

PDF

Dapat dicetak langsung.

---

# 17. VERIFIKASI SERTIFIKAT

Setiap sertifikat memiliki:

* QR Code
* Nomor Sertifikat

Ketika QR Code dipindai:

Sistem menampilkan:

* Nama Peserta
* Nomor Sertifikat
* Jenis Kursus
* Gelombang
* Status Valid

---

# 18. DATABASE

## admins

* id
* nama
* email
* role

## gelombang

* id
* nama
* tanggal_mulai
* tanggal_selesai
* whatsapp_group

## peserta

* id
* nomor_registrasi
* nama_santri
* nama_lembaga
* asal_pesantren
* jenis_kursus
* kamar_id
* ruangan_id

## kamar

* id
* nama_kamar
* nomor_kamar
* kapasitas

## ruangan

* id
* nama_ruangan
* kode_ruangan

## pembayaran

* id
* peserta_id
* status

## sertifikat

* id
* peserta_id
* nomor_sertifikat
* pdf_url
* verification_code

## certificate_templates

* id
* nama_template
* background_file

---

# 19. KEAMANAN

* Login Admin
* Role Based Access
* Backup Database
* Audit Log Aktivitas Admin
* HTTPS
* Row Level Security Supabase

---

# 20. TARGET HASIL

Sistem mampu:

* Mendaftarkan peserta secara online
* Mengelola pembayaran
* Mengelola kamar otomatis
* Mengelola ruangan
* Menghasilkan PDF bukti pendaftaran
* Menghasilkan sertifikat otomatis
* Menyediakan QR verifikasi
* Mengelola banyak gelombang kursus
* Memudahkan panitia dalam seluruh proses administrasi

Dengan sistem ini seluruh proses pendaftaran hingga penerbitan sertifikat dapat dilakukan secara digital, cepat, profesional, dan minim pekerjaan manual.
