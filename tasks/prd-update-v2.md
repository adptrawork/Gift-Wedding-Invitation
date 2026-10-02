# PRD v2: Gift & Wedding Invitation SaaS Platform

Status: dokumen perencanaan terkonsolidasi — menggabungkan PRD awal, benchmark
Wevitation/Viding, dan semua keputusan yang sudah dibuat.
Tanggal: 2026-10-02
Digantikan oleh: PRD awal hanya berubah saat model di bawah berubah

---

## 1. Ringkasan

Platform SaaS untuk undangan digital **Wedding + Gift**. SaaS + Template Engine:
platform hanya tahu `template_id`, `schema`, `content`, `status`, `version`.
Template tahu cara menampilkan data (React + GSAP + Lenis + Tailwind).

Konstanta keputusan yang tidak berubah:

- DDEV untuk pengembangan lokal Next.js; Supabase tetap cloud.
- Payment sole provider = Duitku.
- Template ditambah via Git trusted (tidak ada upload ZIP / eksekusi JS arbitrer).
- Domain = Vercel bawaan (`*.vercel.app`); subdomain dan custom domain gugur
  permanen dari scope.
- Font = Geist + Geist Mono via `next/font/google`; display marketing
  BELUM diputuskan (Fraunces vs ketat Geist).
- Tidak ada Framer Motion, Three.js, Lottie, Barba.js, atau Bootstrap.

---

## 2. Goals

- Customer menyelesaikan undangan (pilih template → isi form → preview →
  publish → share) dalam < 15 menit tanpa bantuan.
- Satu engine modern (React per template) melayani Wedding dan Gift hanya
  dengan ganti `template.json + schema.json + template.tsx`.
- Form customer 100% dari `schema.json`.
- Template versioning: customer lama tetap aman saat template di-update.
- Admin publish/unpublish/version tanpa deploy ulang.
- Payment (Duitku) dan resume/cancel berfungsi, tidak bisa downgrade `paid`.
- Lingkungan lokal parity via DDEV dengan env cloud.
- RLS aktif; user hanya akses resource miliknya.

---

## 3. Arsitektur (tetap)

```
app/                      Next.js App Router
  (marketing)/            rute marketing
  (auth)/                 login, register
  (app)/                  /dashboard customer
  (admin)/                /admin
  (invitation)/           /[slug] undangan publik
components/              UI + form-builder + template-sdk
templates/{slug}/        template.json, schema.json, template.tsx, styles.css, animations.ts
lib/                     payments, schema, templates db, supabase, template-data
supabase/migrations/     SQL, semua idempotent
scripts/                 db-migrate, seed, vercel-env-sync
```

Kebijakan:
- Token desain sebagai CSS variables di `globals.css`, dipakai via Tailwind.
- Undangans’ `--inv-*` token terpisah dari token platform.
- Payment/schema/login: server authoritative; harga dari `lib/plans.ts`.
- Tidak ada UPDATE policy untuk `authenticated` di `orders` (cegah inflating
  `paid` sendiri); status di-set via service_role.

---

## 4. Fitur yang sudah berjalan vs yang ada di jalan

### Sudah berjalan (verifikasi 2026-10-02)
- Next.js dev via DDEV, deploy manual Vercel.
- Register/login (guest create, admin role).
- Weddings CRUD + draft/publish (`draft_content` vs `content`).
- Template registry + demo `/demo-{slug}`.
- Admin template CRUD (templates-client).
- Payment Duitku: create order, inquiry, webhook signature, verify manual,
  record paid, resume (Lanjut bayar / Buat invoice baru), cancel (expired).
- Channel list dari Duitku.
- Header sesuai sesi (Keluar/Dashboard/Admin).
- `scripts/db-migrate.sh` menjalankan migration idempotent via pooler.

### Dirancang tapi belum di database
- `guests` (migrasi 000005, SQL sudah ada di rancangan).
- `events` multi-event (000006).
- `invitation_views` (000007).
- `wedding_appearance` untuk color/font/motion (000008).
- RSVP constraint memperbolehkan `maybe` (000005_sql_alter).

### Belum ada (prioritas implementasi)
- Landing/marketing di `/` (saat ini tampil instruksi DDEV).
- Halaman `/pricing`, `/templates`, `/templates/[slug]`, `/how-it-works`, `/faq`.
- Editor live preview dengan tab bagian (streaming, gift, RSVP, guest, music,
  private mode).
- Dashboard widgets: stats (views/rsvp/guests), quick actions.
- Multi-event di editor + render.
- Private mode + kode akses.
- Tabel wishes/gift-registry data (via content JSONB dulu, tabel belakangan).
- Musik library / "Sematkan Musik Anda".
- Check-in UI + monitor display real-time (Supabase Realtime / Pusher).

---

## 5. Keputusan teknis konstanta

- **No Framer Motion**: gerak CSS saja untuk dashboard/admin; GSAP + Lenis
  untuk undangan.
- **No Three.js/WebGL** di MVP; kalau ditambahkan nanti harus dinamis
  `import()` per template dan ada fallback statis.
- **No Lottie/Barba.js**.
- **Tailwind v3** (bukan v4); token di `tailwind.config.ts`, jangan import
  `shadcn/tailwind.css`.
- **React.StrictMode** default Next; hydration aman.
- **Audio/musik**: SDK komponen `MusicToggle` sudah ada; ekstensi library
  "Sematkan musik Anda" di V1.
- **Access code**: kolom `weddings.access_code` (nullable); private mode
  memblokir `/{slug}` kecuali `?code=` sama.
- **Countdown**: SDK `Countdown` sudah ada; pakai di semua tema wedding
  saat road map itu jadi.

---

## 6. Feature Matrix (compare 3-way)

| Fitur | Kita (target) | Wevitation | Viding |
|---|---|---|---|
| Cover + Open Invitation | ✅ lubang SDK hero | ✅ | ✅ |
| Couples info | ✅ | ✅ | ✅ |
| Countdown | ✅ SDK | ✅ | ✅ |
| Love story | ✅ `Story` | ✅ | ✅ |
| Multi-event | **tambah (000006)** | ✅ | ✅ (hanya template) |
| Gallery | ✅ SDK | ✅ | ✅ (magnific-popup) |
| RSVP (yes/no/maybe) | constraint ditambah | ✅ config + statistik | ✅ |
| Live streaming | **tambah** | ✅ (1 URL) | ✅ |
| Music | ✅ SDK toggle | ✅ library | tidak |
| Gift + kado registry | ✅ SDK GiftBox | ✅ Wegiftry | ✅ Wegiftry |
| Wishes/guestbook | **tambah** | ✅ | ada |
| Access code | **tambah** | ✅ | tidak |
| Check-in (QR/manual/monitor) | **tambah (V2)** | ✅ full | tidak |
| Guest import/print QR | **tambah (V2)** | ✅ | tidak |
| Kirim tracking | **tambah (V2)** | ✅ | tidak |
| Color variation (Primary/Secondary/Button) | **tambah via appearance** | theme palette | ✅ colorpicker |
| Live preview | ✅ sudah | ✅ | ✅ |
| Form dari schema | ✅ | mirip | Studio = editor bebas |

Kewajiban implementasi ditegaskan di task list.

---

## 7. PRD sistem — perubahan struktur

### 7.1 Route groups
Pindahkan semua route ke grup `(marketing)`, `(auth)`, `(app)`, `(admin)`,
`(invitation)` di `app/`. URL tetap. Tujuan: keterbacaan saat sitemap
besar.

### 7.2 Design tokens
- Ganti preset shadcn Abu-abu dengan 3 layer (primitive, semantic, component).
- `--font-sans: var(--font-sans)` bug HARUS dibereskan; harsh register ke
  `--font-geist` dari `next/font/google`.
- Tambah `--inv-*` namespace untuk token undangan.
- Hapus emoji placeholder di `app/page.tsx` dan header.

### 7.3 Data model
Apply migration sequence:

1. `20260930000004_order_invoice.sql` (sudah)
2. `20261001000005_guests_events_views_appearance_rsvpsmaybe.sql` (baru)
3. `20261001000006_guests.sql` (baru)
4. `20261001000007_events.sql` (baru)
5. `20261001000008_views.sql` (baru)
6. `20261001000009_appearance.sql` (baru)

(Nama akhir diputuskan saat implementasi — yang penting urutan & idempotent.)
Tambahkan ke `FILES` di `scripts/db-migrate.sh`.

### 7.4 Templates
- Hapus/hilangkan `templates/*/animations.ts` yang mati (atau sambungkan ke
  manifest) — pilih satu sumber kebenaran.
- Buat satu template (`luxury-gold`) réellement dengan rework section GSAP
  (cover mask, scroll sections, footer). Semua template lain mengikuti
  pola itu akhirnya.
- Tambah streaming/gift registry/konfigurasi color variation di schema.json
  dan template.tsx.

### 7.5 Payments
Tidak berubah. Resume/cancel sudah benar dan teruji (15 pemeriksaan, 0 gagal).

---

## 8. Cek akhir task yang akan dikerjakan nanti

### Phase A — Fondasi (step 1 PRD v2)
- [ ] Ganti Inter ↔ Geist/Geist Mono di `app/layout.tsx`, perbaiki token
      `--font-sans` circular.
- [ ] Bangun token 3-layer + theme tokens di `globals.css` + `tailwind.config.ts`.
- [ ] Hapus emoji placeholder dari `app/page.tsx` & `components/site-header.tsx`.
- [ ] Tambah `@radix-ui/react-icons`, angkat `lucide-react`.
- [ ] Tambah migration tables guests/events/views/appearance + RSVP `maybe`.
- [ ] Update `scripts/db-migrate.sh` FILES list.

### Phase B — Halaman marketing & katalog (step 2)
- [ ] Kerjakan `/` menjadi landing (hero + featured template + cara guna + CTA).
- [ ] Buat `/templates` + filter (category).
- [ ] Buat `/templates/[slug]` — detail + live preview iframe dari `/demo-{slug}`.
- [ ] Buat `/pricing` — Basic/Premium/Business dari `lib/plans.ts`.

### Phase C — Editor & content (step 3)
- [ ] Tab bagian di editor: Couple, Event, Story, Gallery, RSVP, Gift, Music,
      Streaming, Wishes, Private Mode.
- [ ] Form field stream dan access code per weddings.
- [ ] Multi-event opsi.
- [ ] Color variation per tema.

### Phase D — Customer dashboard (step 4)
- [ ] Sidebar + stats (views/rsvp/guests) + quick actions.
- [ ] Query dari `invitation_views`, `rsvps`, `guests`.

### Phase E — Admin & teman (step 5)
- [ ] Admin template manager (publish/version via metadata).
- [ ] Schema Inspector dari `schema.json`.
- [ ] Admin guests/RSVP/Check-in views.

### Phase F — Animasi & template quality (step 6)
- [ ] Kontrak `prefers-reduced-motion` (Lenis + GSAP off, fallback statis).
- [ ] Satu template GSAP réellement (luxury-gold): cover mask, scroll sections,
      countdown nyata. 600–900 baris.
- [ ] Tombol "Open Invitation" yang nyata, bukan decorative.

### Phase G — Realtime & check-in (step 7, V2)
- [ ] Check-in page (guests table + checked_in_at).
- [ ] Monitor Display + QR scan.
- [ ] Supabase Realtime untuk tampilan real-time.

### Non-goals
- Upload ZIP template ke dashboard.
- Template drag-and-drop canvas ala Canva.
- WebGeGL/Three.js di MVP.
- Subdomain custom.
- Fitur AI content generation.

---

## 9. Non-functional & compliance

- **Security**: orders tidak boleh diupdate langsung dari client (RLS
  no-update). Private mode dengan kode. HTTPS enforced (Vercel). Webhook
  Duitku verify signature.
- **Performance**: invitation page harus render tanpa FOUC; audio tidak
  autoplay; images lewat Next/Image penting (atau `unoptimized` kalo remote).
- **Reduced motion**: semua animasi Lenis/GSAP wajib menghormati
  `prefers-reduced-motion: reduce`.
- **Privacy**: akses undangan tamu via slug/kode; email customer tidak dikirim
  ke web interview tanpa diformulir.
- **License**: Hobby Vercel non-komersial jangka panjang — nilai secara bisnis
  (bisa Pro MVP).
