# Perbandingan Platform: Kita vs Wevitation vs Viding

Tanggal: 2026-10-02
Dokumen berdampingan dengan PRD update. Dipakai untuk memutuskan apa yang
digali dari kompetitor dan apa yang kita tinggalkan.

---

## 1. Tech stack & arsitektur

| Aspek | Platform kita | Wevitation | Viding |
|---|---|---|---|
| Framework web | **Next.js 14 App Router**, TypeScript strict | Laravel + jQuery + Bootstrap (UI metronic) | Laravel + jQuery + Bootstrap |
| Template engine | React per-template (`templates/{slug}/template.tsx`) + `schema.json` | Template per-paket, HTML template per tema (`themes.viding.co/theme_{N}`) | Template statis HTML per tema |
| Animation | **GSAP + ScrollTrigger + Lenis** | GSAP 3.10 + ScrollTrigger + Flip + Splide | GSAP 3.10 + ScrollTrigger + Flip + Splide |
| Formulir RSVP | tabel `rsvps` + SDK `RSVP` | jquery-validation + konfigurasi lengkap | jquery-validation |
| Media/galeri | tabel `media` + Storage `wedding-media` | internal, lightbox magnific-popup | magnific-popup |
| Warna tema | dirancang (`wedding_appearance`) | tema + allow via panel Color Variation | **token Primary/Secondary/Button** (panel colorpicker) |
| DB/Auth/Storage | Supabase managed (Postgres + RLS + Storage) | server DB sendiri (Laravel) | server DB sendiri |
| Pembayaran | Duitku (sole provider) + webhook + resume/cancel | sekali bayar paket + Wegiftry registry | tidak jelas dari aplikasi (bank transfer/Wegiftry) |
| Domain | Vercel bawaan + middleware subdomain | custom URL `wevitation.com/{slug}` | `themes.viding.co/theme_{N}` |
| Environment | DDEV lokal, Vercel cloud | server production | server production |
| MCu | admin via profiles.role | admin/backend Laravel | admin/backend |

**Pelajaran:** Viding memperlihatkan `themes.viding.co/theme_{N}/assets/{css,js}`
— satu folder per tema. Itu analog dengan `templates/{slug}/{template.tsx,styles.css,animations.ts}`
kita, jadi arsitektur folder kita sudah setara. Kebalikannya, Viding memakai jQuery —
kita memang sengaja pakai React sebagai lebih modern dan type-safe.

---

## 2. Model template & tema

| | Kita | Wevitation | Viding |
|---|---|---|---|
| Tata per template | 5 template React + registry statis | editor form per bagian + tema premium | Template (ready) & Viding Studio (canvas bebas) |
| Variasi warna | belum di real | ada palet tema | panel Primary/Secondary/Button per tema |
| Multi-event | belum (peta 1 tanggal) | ya (`Tambah Acara`) | belum terlalu terlihat |
| Upload kode from users | tidak (Git-trusted) | tidak jelas | tidak (Studio = editor bebas) |
| Demo live per tema | `/demo-{slug}` | `/{slug}` + `wevation.com/demo/{slug}` | `theme/preview/{N}` |
| Countdown | SDK punya `Countdown` | yes | yes |
| Live streaming | belum dipakai | ya (1 URL Youtube) | ya |
| Love story | section `Story` (satu block) | ya | ya |
| Wishes/guestbook | RSVP message only | ya (Buku Tamu + wishes) | ya |
| Health protocol | belum | ya (section kecil) | belum terlihat |

---

## 3. Editor (admin/customer)

| | Kita (saat ini) | Wevitation | Viding |
|---|---|---|---|
| Editor | form auto-generate dari `schema.json` + preview (`/dashboard/wedding/[id]/edit`) | form per-tab + preview iframe | canvas bebas (Studio) / form (Template) |
| Jumlah tab bagian | mengikuti skema per template | 13 tab | satu canvas |
| Live preview | sudah ada (`TemplateRenderer` di editor) | sudah ada (PREVIEW) | sudah ada |
| Kode auto-konten | sudah (schemaDefaults + merge) | manual tombol Save | manual |
| Feature: streaming | field belum ada | tab khusus | icon feature |
| Feature: privacy/access code | belum | toggle Private Mode + kode | tidak terlalu terlihat |
| Feature: guest import/QR | belum (tabel ada, migrasi pending) | ada | tidak terlihat |
| Feature: musik library | SDK `MusicToggle` (URL audio) | library royalti-free + own YouTube | tidak terlihat |

**Catatan penting:** our loop schema.json → auto form sudah lebih bersih
dari keduanya. Yang kita kalah banyak di **content tab & feature editor** —
bukan arsitektur.

---

## 4. Customer dashboard (our skill vs theirs)

| Fitur | Kita | Wevitation | Viding |
|---|---|---|---|
| Sudah build | billing (resume/cancel), weddings CRUD, template preview | daftar undangan, kelola, statistik tamu | tidak terlihat |
| Belum | dashboard statistik (views/rsvp/guests), quick actions, sidebar | sudah ada | tidak terlihat |
| Notifikasi tamu | belum | Pusher real-time (layar penerima) | tidak terlihat |
| Export data | belum | ada check-in export | tidak terlihat |

---

## 5. Kelebihan & kekurangan kita

### Kelebihan kita yang harus dipertahankan

- **Schema-driven form** — tunggal source of truth; form customer, default,
  dan form generator semua dari `schema.json`. Wevitation & Viding tidak
  punya pola ini.
- **Stack modern** — Next.js App Router + TypeScript strict + Tailwind v3.
  Type-safe, lebih mudah dirawat, RSC mengurangi bundle client.
- **RLS Supabase** — user hanya akses resource miliknya; admin via role.
  Wevitation/Viding tidak mengekspos setup se-SQL se-jelas itu.
- **Payment yang benar** — resume (Lanjut bayar/Buat invoice baru), cancel
  → expired, webhook signature verification, status `paid` tidak bisa
  di-downgrade. Pola resume/cancel ini tidak tampak di kedua kompetitor.
- **DDEV** — lingkungan lokal konsisten; mereka tidak punya parity lokal
  yang jelas.
- **Trust model benar** — Git-trusted templates, tidak ada eksekusi JS
  sembarangan. Keamanan lebih kuat.

### Kekurangan kita yang harus digali dari kompetitor

- **Fitur set belum lengkap** — dibanding Wevitation yang punya streaming,
  love story, wishes/guestbook, health protocol, multi-event, private mode
  + kode akses, check-in, gift registry, dan musik library. Kita masih
  static/kurang dinamis di beberapa section.
- **Marker/placeholder** — thumbnail tamplat `/demo/cover-gold.svg`, emoji
  🎁 sebagai preview di katalog, dan isi template masih tipis (animations.ts
  mati, banyak file kecil).
- **Brand/token** — preset shadcn abu-abu murni; --font-sans self-referential
  (bug),Inter masih terpasang. Tidak ada kepribadian brand selain logo.
- **Harga/marketing** — halaman `/` masih berisi instruksi DDEV, bukan
  landing page. Tidak ada /pricing, /template detail, /how-it-works.
- **Feature yang dirancang tapi belum di-migration** — guests, events,
  views, appearance, mari di database.
- **Tidak ada real-time** — tampilan check-in real-time via Pusher di
  Wevitation belum setara di kita; kita baru punya kolom `checked_in_at`
  rencana.

---

## 6. Kesimpulan: apa yang kita gali

Yang solidkan diutakan (prioritas road map kita):

1. **Multi-event** (tabel `events`) — tiru `Tambah Acara`.
2. **Private mode + access code** — kolom `access_code` di weddings + gate.
3. **Guests UI + import + QR** — tabel `guests`, cetak QR, check-in.
4. **Live streaming** — section + field + link (Wegiftry-like via URL YouTube).
5. **Wishes/guestbook** — fitur terpisah dari RSVP.
6. **Musik library / RTL** — tiru Kumpulan Musik (label artist) dengan
   kolom `music_src` pilihan.
7. **Template color variation** — token warna per tema via setting.
8. **Check-in Monitor Display** — real-time via Pusher atau Supabase Realtime.

Yang **tidak** kita gali:

- Model template statis HTML (jQuery/Bootstrap) — kita tetap React.
- Viding Studio (drag-and-drop canvas bebas) — terlalu mahal untuk MVP.
- Pola upgrade banner yang selalu mengusung penting — kita buat UX berbeda
  (produk berguna duluan, upgrade belakangan).
- Tidak menambah pustaka jQuery/Bootstrap/Splide — kontradiksi dengan stack.

---

## 7. Bahan untuk PRD v2

Lanjut ke `tasks/prd-update-v2.md` untuk PRD sistem yang dikonsolidasi.
Cek akhir task ada di sana.