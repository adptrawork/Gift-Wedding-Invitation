# Benchmark Wevitation — Invetarisasi Fitur Nyata

Tanggal: 2026-10-02
Akun: testing@gmailccom (akun gratis, satu undangan demo "testing & bae")
URL publik: `https://wevitation.com/testing-bae`
Tool: agent-browser + cookie sesi pengguna

Dokumen ini mencatat hasil eksplorasi langsung ke aplikasi live Wevitation,
tidak dari dokumentasi marketing. Dipakai sebagai acuan untuk platform kita.

---

## 1. Struktur navigasi aplikasi

Login langsung ke dashboard dengan 4 menu utama:

| Menu | URL | Isi |
|---|---|---|
| Home | `/dashboard` | Kartu statistik (Tamu, Akan Hadir, Ucapan), akses cepat, aktivitas |
| Undangan | `/dashboard/invitation` | Daftar undangan, search, tombol Buat, Kelola per undangan |
| Transaksi | `/dashboard/subscribe` | Halaman paket upgrade |
| Customer Service | `/dashboard/customer-service` | Bantuan |

Banner kuning "Email belum diverifikasi" selalu tampil. Free tier selalu
menampilkan "Kamu masih pakai akun gratisan!" sebagai pengait upgrade.

---

## 2. Paking langganan (`/dashboard/setup/subscribe`)

Radio paket dengan harga dicoret (promo):

| Paket | Harga asli | Promo | Termasuk |
|---|---|---|---|
| Gratis | IDR 0K | — | uji coba |
| Premium | IDR 100.000 | 31% → 69K | 1 undangan |
| Business | 200.000 | 50% → 99K | Premium + 1 undangan |
| Enterprise | 500.000 | 52% → 240K | Premium + 4 undangan |
| Mitra Silver | 1.100.000 | 54% → 500K | Premium + 10 undangan |
| Mitra Gold | 2.300.000 | 56% → 1Mio | Premium + 22 undangan |

Pola: sekali bayar, bukan subscription. Harga inti mengikuti pasak pasar
undangan digital Indonesia pada umumnya.

---

## 3. Editor undangan (`/dashboard/invitation/{id}`)

Satu halaman "Edit Undangan". Tab bagian di kiri, tombol PREVIEW dan iframe
live preview di kanan. Overview undangan menampilkan status AKTIF, URL
publik, statistik Tamu/Akan Hadir/Ucapan, Private Mode, kode akses, dan
tombol "Buka Layar Penerima Tamu".

Setiap bagian di bawah ini adalah satu form independen:

| Tab | Isi form | Catatan |
|---|---|---|
| Pengantin | Foto (maks 2MB, Upload/Delete), Nama Mempelai 1 & 2, Subtitle (nama orang tua), link Instagram/TikTok/Facebook/X/YouTube, Simpan | section pertama |
| Tema | Grid tema, filter, sort (Terbaru/Trending/A-Z/Z-A), tombol `Aktifkan` + `Lihat Demo` | demo per tema |
| Acara | Checkbox on/off + `Tambah Acara` | multi-event (Ceremony & Reception) |
| Galeri | `Tambah Galeri` | upload foto |
| Musik Latar | `Sematkan Musik Anda`, Kumpulan Musik, cari, filter Original/Cover/Instrumental/Other, pagination | library musik |
| Ucapan & Doa | Checkbox on/off, daftar ucapan tamu, halaman atur ucapan | guestbook |
| Kado Cashless | Checkbox on/off, `Tambah Rekening`, URL Wegiftry, link kado | rekening + gift registry |
| RSVP | on/off, Konfigurasi, filter, search, show entries | konfirmasi kehadiran |
| Streaming | textbox URL Youtube + Simpan | satu URL |
| Kisah Cinta | `Tambah` cerita | love story |
| Instagram Story | on/off + textbox | fitur story |
| Quote | textbox Tulis Quote + Author, tombol **Buat dengan AI** | konten quote |
| Setting | Judul, Bahasa, slug URL, pilih font Heading/Content, ukuran font (32/28/14/12), teks isi tiap section | pengaturan penuh |
| Buku Tamu | search, `Tambah Tamu`, `Import Data Tamu`, `Cetak QR` | manajemen tamu |
| Kirim Undangan | tab Semua/Belum Dikirim/Sudah Dikirim, search, prev/next | tracking broadcast |
| Check-in | Dashboard, Monitor Display, level tamu, QR Scan / Manual / Walk-in, heading Kehadiran RSVP / Metode Check-In / Level Tamu | sistem check-in |
| Pengelola (contributor) | list pengelola | multi-admin undangan |

**Pola penting:** Wevitation TIDAK memakai drag-and-drop. Setiap tab adalah
form input biasa + satu tombol Simpan. Ini memvalidasi keputusan MVP kita
(form-based editor + live preview), dan kita bisa memakai pola yang sama.

---

## 4. Struktur undangan publik (demo `sage-bloom`)

Urutan bagian yang terlihat saat dibuka:

1. Cover — "WEDDING INVITATION", nama pasangan, tanggal, tombol `Open Invitation`
2. Salam — "To: Yth. Bapak/Ibu/Saudara/i {nama tamu}"
3. Countdown — hari/jam/menit/detik
4. Ayat/Quote — tergantung setting
5. Perkenalan pasangan — foto + nama mempelai
6. Event — Ceremony & Reception: tanggal, jam, venue, alamat (2 baris event)
7. Tombol — Map Navigation, Save The Date, Live Streaming
8. Love Story — judul + paragraf
9. Gallery
10. RSVP — tombol konfirmasi kehadiran
11. Gift — rekening bank + tombol Copy + tombol Gift Registry
12. Wishes — form Nama + tulis ucapan + Send; daftar ucapan masuk
13. Health Protocol
14. Penutup — "Thank you for your coming & your blessing"
15. QR Code — tombol bawah

Personalisi tamu: nama tamu muncul di salam via link token (`/demo/{slug}?to=...`
atau sejenisnya), bukan query `?to=` mentah. QR code mengarah ke reception.

---

## 5. Temuan dari setting (field konkret)

- Judul undangan (textbox)
- Bahasa (combobox: Bahasa Indonesia)
- Slug URL (textbox, `https://wevitation.com/{slug}`)
- Font Heading (combobox cari font)
- Font Content (combobox cari font)
- Ukuran font: 32, 28, 14, 12 (empat combobox)
- Teks statis yang bisa diedit: kalimat pembuka, ucapan selamat datang, teks
  terima kasih, teks pengantar kado

Artinya: setiap teks di undangan publik dapat diubah tanpa edit kode. Ini
al yang kita perlu tiru di §23 Appearance + konten.

---

## 6. Temuan dari check-in management

- Dua mode tampilan: `Dashboard` (angka) dan `Monitor Display` (layar besar)
- Filter level tamu: Semua, VIP, VVIP, Prioritas, Regular
- Metode check-in: `QR Scan`, `Manual (Cari)`, `Walk-in Baru`
- Statistik yang ditampilkan: Kehadiran RSVP, Metode Check-In, Level Tamu

Ini fitur sistem check-in terintegrasi. Untuk kita, fitur ini bisa masuk V2
secara bertahap: pertama `guests.checked_in_at` ( sudah ada kolomnya di §10),
lalu Monitor Display dan level tamu belakangan.

---

## 7. Temuan dari Buku Tamu & Kirim

**Buku Tamu:**
- Search, show entries
- `Tambah Tamu` manual
- `Import Data Tamu` (bulk import)
- `Cetak QR` (cetak QR pass untuk tamu)

**Kirim Undangan:**
- Tab: Semua, Belum Dikirim, Sudah Dikirim
- Search + pagination
- Ini tracking pengiriman, bukan pengirim pesan otomatis. Pengiriman aktual
  via copy link per tamu atau blast WA Gateway (V2 kita).

---

## 8. Perbandingan cepat dengan platform kita

| Fitur Wevitation | Status di kita | Rencana |
|---|---|---|
| Editor form per bagian + preview | belum | §12, layar ke-4 |
| Tema grid + demo + aktifkan | belum (registry statis) | perlu ThemeSelector |
| Multi-event | belum (content JSONB satu tanggal) | §10 tabel `events` |
| Galeri | belum | gabung ke `wedding_appearance`/media |
| Musik latar (library) | belum | V1 — music_url di appearance |
| Ucapan & Doa (guestbook) | tabel `rsvps` ada, wishes belum | perlu tabel `wishes` |
| Kado Cashless (rekening + Wegiftry) | gift section JSONB | V1 — tabel/data gift |
| RSVP + konfig | tabel `rsvps` ada (tanpa konfigurasi) | tambah config tombol RSVP |
| Streaming URL | belum | V1 |
| Love Story | belum | V1 — text JSONB |
| Quote + **Buat dengan AI** | belum | V2, opsional |
| Setting font + teks | `wedding_appearance` (sudah dirancang) | §10 tabel appearance |
| Buku Tamu + import + cetak QR | belum | perlu tabel `guests` (sudah dirancang §10) |
| Kirim tracking | belum | V2 |
| Check-in (QR + level + monitor) | kolom `guests.checked_in_at` | V2 — check-in page |
| Pengelola undangan | belum | V2 — kolom `wedding_contributors` |
| Private Mode + kode akses | belum | §10 bisa ditambah `access_code` di weddings |
| Live preview editor | belum | layar ke-4 |

## 9. Rekomendasi prioritas untuk kita

1. **Editor form per bagian + preview** — tiru pola Wevitation. Ini jadi
   layar ke-4 kita (§12).
2. **Setting teks + font** — sudah ada kolom appearance; tinggal bangun UI.
3. **Multi-event** — bangun tabel `events` segera (§10.2).
4. **Guests lengkap** (tambah, import, QR) — tabel `guests` sudah dirancang.
5. **Wishes guestbook** — tabel baru, gabung dengan RSVP.
6. **Tema selector + demo** — perlu ThemeSelector.
7. **Check-in & Monitor Display** — V2, mulai dari `checked_in_at`.
8. **Kado Cashless + Wegiftry + Streaming + Love Story** — V1, data JSONB
   dulu.

Fitur AI Generator (Buat dengan AI untuk Quote) bisa jadi pembeda V3, tapi
bukan fondasi.

---

*Dicetak dari eksplorasi langsung. File ini bersifat analisis kompetitor,
bukan salinan konten Wevitation, untuk referensi benchmark internal.*

---

## 10. Detail field dari inspeksi halaman

### RSVP
- Toggle **Fitur RSVP** (ON/OFF)
- Konfigurasi (collapsible) dengan tab status: Hadir, Tidak Hadir, Belum Konfirmasi, Estimasi Jumlah Orang
- Dua tab daftar: **List Tamu** dan **List Pendaftar**
- Filter status: Semua / Hadir / Tidak Hadir / Belum Konfirmasi
- Show entries 10/25/50/100, search "Cari"
- Kolom tamu: Nama, Max, Orang

### Kado Cashless
- Toggle: Fitur Kado Cashless, **Terlihat Publik** (terlihat oleh tamu selain
  undangan), **Sembunyikan Informasi Rekening Diawal** (rekening tidak
  langsung terlihat di halaman utama), Fitur Gift Registry
- Tombol: Tambah Rekening Kirim Kado Cashless, URL Wegiftry, Update Link Wegiftry
- Integrasi Wegiftry: "Buat Daftar Kado", "Belum punya daftar kado dari Wegiftry?"

### Musik Latar
- Dua sumber: **Sematkan Musik Anda** (URL YouTube sendiri) atau Kumpulan Musik
- Kumpulan: sort Terbaru / Paling Favorit / A–Z / Z–A, search Judul/Artist
- Filter: Original / Cover / Instrumental / Other (musik bebas royalti)
- Previews valid: librarian musik pakai label artist yang jelas

### Check-in Management
- Tiga mode: **Dashboard, Monitor Display, Export Data**
- Counter: Total Aktual Tamu (X dari Y RSVP), Sudah Check-In, Sudah Check-Out
  ("X masih di venue"), Tamu VIP (X dari Y istimewa), Tamu VVIP, LIVE Monitor
- Filter level tamu: Semua, VIP, VVIP, Prioritas, Regular
- Metode: QR Scan, Manual (Cari), Walk-in Baru
- Tabel: No, Nama Tamu, Grup, Level, Check-In Via, Waktu, Jumlah RSVP, Aktual Tamu, Aksi

### Layar Penerima Tamu (`/{slug}/layar/all`)
- Scan kamera, mode layar penuh
- Cari Nama (Terdaftar)
- Selamat Datang panel
- PENGATURAN LAYAR: Check-in & check-out, Notifikasi: semua sumber (**Pusher**)

### Transaksi / paket (lebih detail dari section 2)
Paket Premium mencakup: Undangan Aktif Selamanya, Unlimited Kuota Tamu,
Foto & Video Gallery, Ucapan & Doa, Tema Premium, Link Streaming, Kado
Cashless/Donasi, Layar Penerima Tamu. Business = Premium + 1 undangan.
Promo berlaku sampai 31 Oktober 2026.

## 11. Cara pengambilan data (inferensi)

- **Setiap tab editor = satu form independen** dengan tombol Simpan sendiri.
  Tidak ada state global / autosave antar tab. Data disimpan per-section.
- **Tabel bagian di editor mengikuti struktur section undangan publik** secara
  1:1. Mengisi "Pengantin" mengisi section Bride/Groom di template publik.
- **`Setting` mengontrol seluruh teks statis**: kalimat pembuka, salam, teks
  terima kasih, teks pengantar kado, bahasa, dan slug URL. Ini berarti template
  publik menarik teks dari satu objek konfigurasi, bukan hardcode.
- **Guest Reception memakai Pusher** untuk notifikasi real-time antara
  perangkat admin dan layar penerima tamu — bukan polling. Kita bisa tiru
  pola ini di V2 (kolom `checked_in_at` + event realtime).
- **Private Mode + kode akses**: tamu baru muncul di daftar Kirim hanya
  setelah ditambahkan; private mode memblokir undangan tanpa kode.
- **Tracking Kirim**: tab tracking (Belum/Sudah Dikirim) + tombol untuk
  mengirimkan pesan satu per tamu, bukan kirim otomatis. Distribusi aktual
  via link/WhatsApp per tamu.

## 12. Fitur sengaja tidak ditemukan / tidak dapat diakses

- Halaman `/dashboard/invitation/create` langsung tidak ada (diberikan lewat
  tombol tambah pada free tier yang sudah penuh).
- Role "Pengelola" tidak menampilkan field menambah admin baru di akun free.
- Tidak ada template **upload ZIP** dari Customer — tema hanya dipilih dari
  grid bawaan. Ini sejalan dengan keputusan kita (Git-trusted).