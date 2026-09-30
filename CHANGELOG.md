# CHANGELOG

## 2026-10-01 (lanjutan 3) — Deploy Vercel production

Project `gift-wedding-invitation` dibuat di Vercel dan dideploy ke
`https://gift-wedding.vercel.app`. Sepuluh variabel env diteruskan lewat
dashboard Vercel; `DATABASE_URL` dan `SUPABASE_DB_REGION` sengaja tidak, karena
hanya dipakai `scripts/db-migrate.sh` yang berjalan di mesin lokal.

### `.vercelignore` (baru)

Vercel menyalin sumber memakai `.vercelignore`, bukan `.gitignore`. Tanpa file
itu `.env` ikut terupload ke server build, sehingga secret Supabase dan Duitku
bisa bocor ke build log. Isinya mengecualikan `.env`, `.env*.local`,
direktori build, `node_modules`, `.ddev`, dan `scripts`.

### Build dan dev server tidak lagi berbagi direktori output

`ddev npm run build` gagal dengan `Cannot find module for page:
/api/admin/templates/[slug]` dan dev server membalas 500 untuk semua request.
Penyebabnya bukan route yang hilang — file-nya ada dan `next build` berhasil
sebelum Vercel ada. `next dev` (dijalankan otomatis oleh `web_extra_daemons`)
dan `next build` sama-sama menulis hasil kompilasi ke `.next/server`, dan saat
keduanya hidup bersamaan, satu menimpa yang lain.

Perbaikan: `next build` sekarang memakai `distDir` sendiri lewat
`NEXT_DIST_DIR=.next-build`. Next.js hanya membaca `distDir` dari konfigurasi
bukan dari env, jadi variabelnya dibaca di `next.config.mjs`. Dev server tetap
pakai `.next`. Setelah ini build produksi bisa dijalankan tanpa mematikan dev
server — sudah diuji: build sukses sementara `/`, `/api/templates`,
`/demo-andi-sinta`, dan `/api/payments/channels` tetap 200.

## 2026-10-01 (lanjutan 2) — Data dummy untuk demo

`scripts/seed-dummy.mjs` (`db:seed:demo`) mengisi database yang tadinya hanya
berisi registry template: 4 user (1 admin, 3 customer), 5 undangan di berbagai
tahap lifecycle, 7 RSVP, dan 3 order dengan status paid/pending/failed supaya
halaman billing punya riwayat. Idempoten, dan `--clean` menghapus semuanya
termasuk user lewat Auth Admin API. Semua slug berawalan `demo-`.

Cara buat user lewat Auth Admin API (`email_confirm: true`) alih-alih signup
biasa: signup kena rate limit email Supabase, sedangkan Admin API tidak
mengirim email sama sekali.

## 2026-10-01 (lanjutan) — Smoke test end-to-end, tiga bug diperbaiki

### Hasil pengujian

Alur penuh dari daftar sampai halaman publik sudah dijalankan terhadap database
sungguhan: buat akun → trigger `profiles` → 401 tanpa login → buat wedding dari
template published → slug ganda ditolak 409 → draft 404 di halaman publik →
simpan draft → draft tidak bocor → publish → halaman publik berisi data yang
dipublish → RSVP anon 201 → policy RLS menahan penulisan langsung ke wedding
draft dan pembacaan data tamu → order tanpa `payment_method` ditolak 400.
**19 pemeriksaan, 0 gagal.**

### Bug yang ditemukan dan diperbaiki

1. **`POST /api/rsvps` selalu membalas 409.** Penyebabnya `.insert().select("id")`
   pada client anonim menambahkan header `Prefer: return=representation`, jadi
   Postgres menjalankan `INSERT ... RETURNING` — yang membutuhkan hak SELECT.
   Policy RLS memang sengaja tidak memberi SELECT pada `rsvps` untuk anon
   (nama, pesan, dan jumlah tamu adalah data pribadi pemilik undangan), sehingga
   Postgres menolak dengan `42501` dan route memenerjemahkannya jadi
   "Undangan belum menerima RSVP". Daripada melonggarkan policy SELECT, insert
   dipindahkan ke service_role lewat `lib/supabase/service.ts` — pemeriksa
   `status === "published"` di route sudah menjadi otorisasi di sisi aplikasi,
   dan policy RLS tetap melindungi wedding draft dari penulisan langsung lewat
   publishable key.
2. **`PATCH /api/weddings/[id]` membalas 500 untuk body tanpa perubahan.**
   zod membuang key yang tidak dikenal, jadi `update({})` menolak dengan
   "Cannot coerce the result to a single JSON object". Sekarang dibalas 400
   "Tidak ada perubahan untuk disimpan".
3. **`getServiceClient` dipindah** dari `lib/payments/record.ts` ke
   `lib/supabase/service.ts` supaya tidak tinggal di dalam modul pembayaran
   padahal kini dipakai dua domain.

### DDEV

- `nodejs_version` 20 → 22. `@supabase/supabase-js` tidak bisa jalan di Node 20
  (belum ada native WebSocket) dan memunculkan peringatan deprecation pada
  setiap hot reload. Setelah menaikkan versi, peringatan hilang dan
  `supabase-js` bisa dipakai langsung dari script di dalam container.

### Database

- Dialihkan ke project Supabase `lrluncnmxymzlbupbppz` (region `us-east-1`).
  Keempat file migrasi dijalankan ulang di sana lewat `npm run db:migrate`.
- `SUPABASE_SERVICE_ROLE_KEY` memakai JWT `service_role`, bukan key
  `sb_secret_…`. Key `sb_secret_` bukan JWT sehingga ditolak oleh Supabase
  Auth Admin API dengan `bad_jwt`.

## 2026-10-01 — Database Supabase terpasang, dev server otomatis

### Migrasi database

Schema, seed template, dan bucket storage sudah diterapkan ke project
`qovsxnasojsnvzzfldxg` (region `ap-south-1`, PostgreSQL 17.11).

- `scripts/db-migrate.sh` — menjalankan keempat file migrasi berurutan lewat
  `psql` dari dalam container DDEV, dengan verifikasi jumlah tabel, template,
  bucket, dan constraint payment di akhir. Terdaftar sebagai `db:migrate`.
- Koneksi langsung ke `db.<ref>.supabase.co` tidak bisa dipakai dari jaringan
  ini: host itu hanya punya alamat IPv6, sedangkan jaringan lokal dan container
  DDEV rootless tidak punya route IPv6 global. Script mencoba koneksi langsung
  dulu, lalu fallback ke Supavisor (IPv4) dengan user `postgres.<project-ref>`.
  Region dibaca dari `SUPABASE_DB_REGION`.
- **Perbaikan idempotensi.** PostgreSQL tidak punya
  `create policy if not exists`, jadi 24 `create policy` gagal di run kedua
  dengan `policy ... already exists` — padahal dokumentasi mengklaim migrasi
  aman diulang. Setiap `create policy` sekarang didahului
  `drop policy if exists`. Dua run berturut-turut sudah diuji bersih.

Hasil verifikasi: 9 tabel dengan RLS aktif, 22 policy di 10 tabel, 3 trigger
`set_updated_at`, index unik `payments_provider_tx_uniq`, bucket
`wedding-media` public, constraint `payments.provider in ('duitku')`, 5
template + 5 template_versions. Uji RLS sebagai role `anon`: 5 template
published terbaca, `profiles`/`orders`/`payments` tetap 0.

### DDEV

- `web_extra_daemons` menjalankan `npm run dev` otomatis. Sebelumnya container
  hidup tapi port 3000 kosong, sehingga ddev-router membalas 502 Bad Gateway
  padahal `ddev status` hijau.
- `next.config.mjs` — `allowedDevOrigins` untuk host ddev-router.
- Dokumentasi: URL lokal per protokol, urutan quickstart tanpa menjalankan dev
  server dua kali, dan langkah diagnosis 502.

## 2026-09-30 — Hardening + migrasi payment ke Duitku

### Payment: Midtrans/Xendit → Duitku

Provider payment diganti menjadi **Duitku** (satu-satunya). Modul Midtrans dan
Xendit dihapus, tidak ada sisa jalur yang bisa menerima order ke sana.

- `lib/payments/duitku.ts` — config, tiga formula signature, inquiry,
  verifikasi callback, check status.
- `lib/payments/crypto.ts` — `hmacSha256Hex` + `safeEqual` (dulu berada di
  `midtrans.ts`; dipindah supaya tidak terikat provider).
- Webhook pindah ke `POST /api/payments/webhook/duitku`. Body dibaca sebagai
  `x-www-form-urlencoded` (format resmi Duitku), `amount` dipakai apa adanya
  saat menghitung signature.
- Verifikasi callback: `merchantCode` dicocokkan dengan project server, lalu
  HMAC-SHA256 `merchantCode + amount + merchantOrderId` dibandingkan
  constant-time. Tanpa konfigurasi → 503 (gagal tertutup).
- Order `paid` tidak lagi bisa diturunkan `failed` oleh notifikasi yang datang
  belakangan.
- `POST /api/orders/[id]/verify` untuk cek status manual, dan tombol
  **Cek status** di halaman billing. Sengaja bukan poller — dokumentasi Duitku
  memperingatkan rate limit `transactionStatus` memblokir IP ±1 jam.
- `resultCode` pada redirect tidak lagi dipakai menandai sukses; dokumentasi
  Duitku menyatakan URL redirect bisa diubah manual oleh customer.
- **Channel pembayaran jadi pilihan user, bukan hardcoded `*`.** Ternyata
  project Duitku tidak mengaktifkan `*` (dokumentasi resmi hanya memuat kode 2
  karakter, `*` tidak termasuk). `GET /api/payments/channels` mengambil
  daftar channel aktif dari Duitku (di-cache 1 jam) dan `/dashboard/billing`
  menampilkannya sebagai dropdown. `POST /api/orders` mewajibkan
  `payment_method` dan memvalidasinya terhadap daftar aktif di server.
  Verifikasi `ddev npm run check:duitku` untuk diagnosa Merchant Code dan
  environment tanpa membuat transaksi apa pun.
- Env: `DUITKU_MERCHANT_CODE`, `DUITKU_API_KEY`, `DUITKU_IS_PRODUCTION`,
  `DUITKU_PAYMENT_METHOD` (default `*`), `DUITKU_EXPIRY_MINUTES`.
- Migrasi baru `20260930000003_duitku.sql` mempersempit
  `payments.provider` ke `'duitku'`.

### Keamanan & kebenaran data

- Draft vs published dipisah: `weddings.draft_content` untuk edit,
  `/publish` menyalin ke `content`. Halaman publik hanya membaca `content`
  (design §34).
- Harga jadi server-authoritative lewat `lib/plans.ts`; body order hanya
  menerima `plan_id`.
- Idempotensi capture payment: unique index
  `payments (provider, provider_transaction_id)`.
- Halaman edit/preview memfilter kepemilikan; error di-log lalu disanitasi
  sebelum sampai ke klien.
- Media: bucket public-read (undangan bersifat publik), write tetap
  owner-scoped, nama objek disanitasi.
- Status template jadi DB-authoritative, dengan fallback ke daftar build Git
  bila Supabase tidak terkonfigurasi.
- `updateSession` tidak lagi me-redirect; gate `/dashboard` + `/admin` dipindah
  ke `middleware.ts` supaya halaman tamu publik tidak terpental ke login.
- Rewrite subdomain dibatasi hanya di path `/`, supaya `domain.com/<apa saja>`
  tidak selalu 200 dan mengindeks URL duplitat tanpa batas.

### Perbaikan lain

- `globals.css` + `tailwind.config.ts`: token shadcn didaftarkan sebagai
  `var(--…)` di `theme.extend.colors` — blok CSS shadcn v4 memakai
  `@theme inline` yang tidak dikenali Tailwind v3.
- Placeholder demo/template dipindah ke `public/demo/*.svg` (sebelumnya
  menunjuk file JPG yang tidak ada).
- Form builder dipecah per-tipe field; `FormRenderer` jadi fully controlled.
- `TS` strict + lint bersih, `next build` lolos.

### Catatan environment

- `NEXT_PUBLIC_BASE_URL` sekarang wajib diisi — dipakai untuk membangun callback
  URL Duitku. Variabel ini sebelumnya dipakai di kode tapi tidak ada di `.env`.
- `.env` tidak pernah di-commit.

## 2026-09-30 — Skeleton MVP (US-001/002/003/006/007/009)

- DDEV generic + Node 20, tanpa DB lokal (`omit_containers: [db]`), extra port Next.js 3000.
- Next.js 14 App Router + TS strict + Tailwind; deps: supabase, gsap, lenis + helper libs (zod, clsx, tailwind-merge, lucide-react, date-fns, cva, radix-slot).
- 5 template package (luxury-gold, romantic-garden, modern-minimal, wedding-gift, birthday-gift) + TemplateRenderer + SDK.
- FormRenderer dinamis dari schema.json (string/textarea/richtext/date/url/image/audio/array/color + theme).
- Supabase migration init (8 tabel + RLS + trigger + storage bucket) + seed registry.
- Routes: `/` marketplace, `/demo-*`, `/[slug]` publik, `/dashboard`, `/dashboard/wedding/create`, `/dashboard/wedding/[id]/edit|preview`, `/dashboard/billing`, `/admin`, `/admin/templates`, `/login`, `/register`.
- API: templates, weddings CRUD + publish, rsvps, orders, payments webhook (signature), media upload (validasi).
- CI GitHub Actions (typecheck + lint + build).
