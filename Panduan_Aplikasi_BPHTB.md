# BUKU PANDUAN PENGGUNAAN APLIKASI BPHTB
**Sistem Pendataan Nilai Jual Objek Pajak (ZNT/Blok)**

Aplikasi ini dirancang untuk memudahkan pengumpulan, verifikasi, dan manajemen data Nilai Jual Objek Pajak (NJOP) dari tingkat Desa hingga tingkat Kabupaten. Aplikasi ini memiliki tiga hak akses (Role) utama dengan tugas dan fungsinya masing-masing.

---

## 1. ROLE KOLEKTOR (Tingkat Kelurahan/Desa)
**Tujuan Penggunaan:**
Ujung tombak pendataan di lapangan. Kolektor bertugas memasukkan data riil nilai tanah dari masing-masing alamat di wilayah desanya.

**Panduan Penggunaan:**
1. **Login:** Gunakan username desa Anda (contoh: `ciseureuh`) dan masukkan password.
2. **Dashboard:** Di halaman utama, Anda akan melihat indikator jumlah target data yang harus dikumpulkan dan berapa yang sudah berhasil diinput.
3. **Tambah Data (Input):**
   - Pilih menu "Tambah Data".
   - Masukkan Alamat lengkap, Kategori (Perumahan, Komersial, dll), Kode ZNT, dan Blok.
   - Masukkan **Nilai Terendah** dan **Nilai Tertinggi** (per meter persegi).
   - Simpan data tersebut.
4. **Edit & Hapus Data:** Selama data belum dikunci, Anda dapat mengubah atau menghapus data jika ada kesalahan ketik.
5. **Kirim ke Kecamatan:** Setelah seluruh data di desa Anda selesai diinput dan dipastikan benar, klik tombol **"Kirim ke Kecamatan"**. Data akan terkunci sementara untuk direview oleh pihak Kecamatan.

---

## 2. ROLE VERIFIKATOR (Tingkat Kecamatan)
**Tujuan Penggunaan:**
Bertindak sebagai pengawas tingkat pertama. Verifikator (Kecamatan) bertugas memeriksa keabsahan dan kewajaran data yang telah dikirim oleh para Kolektor Desa di wilayah kecamatannya.

**Panduan Penggunaan:**
1. **Login:** Gunakan username kecamatan Anda (contoh: `kec_purwakarta`) dan password.
2. **Dashboard Verifikasi:**
   - Anda akan melihat daftar desa-desa yang berada di bawah naungan kecamatan Anda beserta statusnya (Belum Selesai / Menunggu Verifikasi / Terverifikasi).
   - Klik panah ke bawah (▼) pada nama desa untuk melihat rincian alamat yang telah diinput oleh desa tersebut.
3. **Pemeriksaan Data:**
   - Jika data sudah benar dan masuk akal, klik tombol hijau **"Verifikasi"** untuk meneruskannya ke Superadmin Kabupaten.
   - Jika ada data yang tidak wajar atau salah ketik, Anda dapat memberikan **Catatan Perbaikan** pada baris data tersebut, atau Anda dapat langsung **Mengedit/Menghapusnya** sendiri demi efisiensi.
4. **Unduh Laporan:** Anda dapat mengunduh rekapan seluruh data desa di kecamatan Anda dalam bentuk Excel (Tombol "Unduh Excel") untuk dicetak atau dilaporkan ke pimpinan.

---

## 3. ROLE SUPERADMIN (Tingkat Kabupaten/Bapenda)
**Tujuan Penggunaan:**
Pemegang kendali penuh atas sistem. Superadmin bertugas memantau seluruh pergerakan data dari seluruh kecamatan, mengelola akun pengguna, dan mencetak laporan akhir.

**Panduan Penggunaan:**
1. **Login:** Gunakan username `superadmin`.
2. **Dashboard Utama (Monitoring):**
   - Melihat grafik dan persentase penyelesaian penginputan data di seluruh kecamatan.
   - Memiliki hak penuh untuk melihat, mengedit, memverifikasi, atau bahkan mengembalikan status data dari kecamatan mana pun.
   - Superadmin dapat melihat data yang **(Dihapus)** oleh Kolektor/Verifikator sebagai rekam jejak (audit trail).
3. **Manajemen Akun (Accounts):**
   - Membuat akun baru untuk Kolektor Desa atau Verifikator Kecamatan.
   - Mengganti password (Reset) jika ada staf yang lupa password.
4. **Ekspor Data Keseluruhan:**
   - Mengunduh seluruh data se-kabupaten dalam bentuk Excel untuk keperluan penetapan NJOP resmi.
   - Data yang diekspor akan mencakup rentang nilai tertinggi dan terendah dari setiap blok perumahan/komersial di wilayah tersebut.

---
*Dokumen ini dibuat otomatis oleh Sistem.*
