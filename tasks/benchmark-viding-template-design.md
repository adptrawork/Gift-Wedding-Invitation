# Benchmark Viding — Template Design & Konsep Teknologi

Tanggal: 2026-10-02
URL: `https://viding.co/id/template-design`
Tool: agent-browser + preview langsung

---

## 1. Struktur halaman katalog

Halaman "Template Desain Undangan" menampilkan dua mode pembuatan:

| Mode | Deskripsi | Cocok untuk |
|---|---|---|
| **Viding Studio** | Edit dan custom undangan bebas, semua elemen bisa diatur, desain unik sesuai keinginan | Tampil beda |
| **Template** | Pakai template siap pakai, tinggal edit nama, tanggal, foto, detail acara | Cepat, mudah, praktis |

- Filter sort: **Terbaru**
- Reset filter
- Product fitur yang dipromosikan: Undangan Digital (edit semudah Canva,
  sebar via WhatsApp), Buku Tamu Digital (RSVP → QR → scan aplikasi penerima),
  Live Streaming (multi-platform + arsip rekaman)

---

## 2. Daftar template yang terlihat

**Template (siap pakai):** Tema 167, Tema 166, Tema 165, Tema 164, Tema 163,
Tema 162, dst.

**Viding Studio (konsep adat/custom):**
- 195 — Envelope Velvet
- 194 — Palembang Classic Artistry
- 193 — Chinese Royal Radiance
- 192 — Betawi Timeless Delight
- 191 — Bugis Essence
- 190 — Indian Grandeur

Pola URL:
- Template: `https://viding.co/theme/preview/{N}`
- Studio: `https://studio.viding.co/theme/preview/{N}`

Konsep adat (Palembang, Chinese Royal, Betawi, Bugis, Indian) memakai budaya
lokal sebagai tema visual — menjejak kebutuhan pernikahan Indonesia yang macam-macam.

---

## 3. Fitur tema yang dianalisis

### Tema 167 (`viding.co/theme/preview/167`)

Visual:
- Bingkai kayu ukir khas tradisional membungkus seluruh layar
- Sudut bunga air warna (watercolor florals) di empat sudut
- Latar lanskap lembut
- Foto pasangan dalam bingkai oval emas
- Heading serif besar ("Vidi & Hening")

Fitur halaman:
- Panel **Color Variation**: THEME COLOR → Primary Color, Secondary Color,
  Button Color, tombol Reset + Save Color
- Bagian dalam template: "We invite you to The Wedding of", nama pasangan,
  tombol **Open the Invitation**, **E-Angpao**, **Gift Registry**,
  **Live Streaming (YouTube)**, footer copyright

### Tema 195 — "Envelope Velvet" (`studio.viding.co/theme/preview/195`)

Visual:
- Latar kain velvet merah gelap (tekstur foto)
- Amplop tertutup dengan stempel lilin (wax seal) sebagai kartu undangan
- Tipografi skrip elasigans ("Vidi and Hening", "Marriage contract")
- Hero monogram "V / H", tanggal "26 06 26", countdown

Konsep: elegan-gelap, gotik-mewah.

**Keduanya memakai pola yang sama: satu halaman cover → tombol "Open
Invitation" → konten berikutnya."** Detail "marriage contract" adalah spesifik
karena berpasangan dengan frasa tersebut dalam tradisi.

---

## 4. Konsep teknologi yang dipakai (yang faktual)

### 4.1 Template berbasis data, bukan rebuild per-invitasi
Satu ukuran untuk banyak tema: `template` tertentu punya komponen sendiri, dan
invitasi cukup mengisikan data. Itulah kenapa semua tema di atas tidak
berbagi berkas kode — masing-masing punya URL preview sendiri tetapi konsep
data yang sama (nama, tanggal, alamat, gift, streaming). Ini sama dengan
arsitektur `templates/` kita: satu industri per template, isi dari data.

### 4.2 Theme color sebagai token terpusat
Panel Color Variation (Primary/Secondary/Button) membuktikan bahwa warna
ditentukan lewat satu set token, lalu diaplikasikan ke seluruh section template.
Ini persis dengan susunan kolom `wedding_appearance` (§10) yang kita rancang:
satu set token (primary, secondary, font, motion_level), bukan mengedit tiap
elemen satu per satu.

### 4.3 Mode "Studio" = editor canvas bebas
Berbeda
dengan Viding Studio: pengguna bebas menata elemen (seperti Canva). Mode ini
adalah pre-order terhadap full builder drag-and-drop — dan jauh lebih mahal
biayanya. Untuk MVP kita, rancangan Anda sudah tepat: **form-based + preview**,
tidak menganuti Canva clone.

### 4.4 Satu set section, bebas halaman
Kedua template salah satu memulai dengan cover, lalu "Open Invitation" —
pola cover/pembatas ini sama di Wevitation maupun Viding. Setiap tema
punya block sendiri (nama, tanggal, galeri, RSVP, gift, livestream) yang
bisa diulang antar template.

### 4.5 Kustomisasi warna tanpa kustomisasi struktur
Color Variation membuktikan: tema menentukan *struktur & tipografi*, isinya
dapat disetel warna. Ini kompromi yang membuat platform bisa menawarkan
banyak tema premium tanpa menambah kode.

---

## 5. Perbandingan dengan arsitektur kita

| Fitur Viding | Status di kita | Keputusan |
|---|---|---|
| Template siap pakai (grid tema) | template registry statis (5) | lanjut tambah |
| Mode Studio (editor bebas) | belum | tolak untuk MVP |
| Color Variation (primary/secondary/button) | kolom `wedding_appearance.primary_color/secondary` (dirancang) | bangun UI §10 |
| Satu tema = banyak warna | belum | konfigurasi warna per tema dari data |
| Live demo per tema (`/theme/preview/{N}`) | `/demo-{slug}` sudah ada | tetap |
| Eform Canva pada mode Studio | kita pakai form-based | sudah sesuai §12 |
| Buku Tamu Digital + QR | sudah dirancang di `guests`/`checked_in_at` | §10 |
| Live Streaming link | belum | tambahkan sebagai section gift/streaming |

---

## 6. Aset yang saya screenshotkan (bukti)

- `/tmp/opencode/viding_167.png` — Tema 167 tradisional carved-wood + floral
- `/tmp/opencode/viding_195.png` — Envelope Velvet velvet + wax seal envelope

Keduanya dijalankan dengan preview asli di `wevitation-x` session.

---

## 7. Yang belum bisa diperiksa dalam satu pass

- Konten section setelah cover (RSVP, galeri, countdown detail) — perlu
  scroll lebih jauh setelah Open Invitation.
- Halaman `studio.viding.co` builder drag-and-drop-nya — tidak bisa dipahami
  hanya dari preview.
- Apakah tiap tema memakai GSAP/scrollytelling — dari preview inisiasi menu
  tampak tulang konvensional (cover statis, tidak ada scroll). Tapi ini tidak
  bisa dikonfirmasi tanpa inspeksi DOM.

## 8. Catatan untuk kita

1. Setiap tema Viding punya warna yang bisa ditukar **per tema** — jadi
   customize warna sebaiknya jadi bagian dari step "Tema" pada editor kita,
   bukan halaman terpisah.
2. Mode "Studio" mahal; kita tidak perlu marketingnya di MVP. Form-based +
   preview + Color Variation sudah cukup untuk menawarkan "Edit semudah
   Canva" tanpa jadi clone Canva.
3. Perilisan tema ber-per-event (Palembang, Chinese Royal, Betawi, Bugis,
   Indian) rendah buta dan besar di Indonesia — *referensi bentuk* yang
   layak ditiru untuk katalog kita berikutnya.