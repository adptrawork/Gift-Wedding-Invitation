# CHANGELOG

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
