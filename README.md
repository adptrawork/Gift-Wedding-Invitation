# Gift & Wedding Invitation SaaS Platform

Platform SaaS undangan digital **Wedding + Gift** dengan **Template Engine**
(React + GSAP + Lenis). PRD: `tasks/prd-gift-wedding-saas-platform.md`.

## Quickstart (DDEV — wajib untuk dev lokal)

```bash
cp .env.example .env        # isi kredensial Supabase cloud
ddev start                  # https://gift-wedding.ddev.site
ddev npm install
ddev npm run dev            # Next.js :3000 (router https :3001)
ddev launch
```

Perintah harian:

```bash
ddev start
ddev npm run dev
ddev npm run typecheck
ddev npm run lint
ddev exec <cmd>
```

## Struktur

```text
app/                 # (auth) login/register, dashboard, admin, [slug] publik, api/
components/          # template-sdk, template-renderer, form-builder, ui/
lib/                 # supabase client/server, templates registry, slug, validation, cn
templates/           # luxury-gold, romantic-garden, modern-minimal, wedding-gift, birthday-gift
supabase/            # migrations/ + seed.sql (Supabase cloud)
.ddev/               # config DDEV (Node 20, generic, tanpa DB lokal)
```

## Supabase (cloud)

1. Buat project di Supabase Dashboard.
2. SQL Editor → jalankan **berurutan**:
   `20260930000001_init.sql` → `20260930000002_hardening.sql` → `20260930000003_duitku.sql` → `supabase/seed.sql`.
3. Buat user admin via Authentication, lalu `update profiles set role='admin'`.
4. Isi `.env` dari `.env.example`.

## Payment (Duitku)

Provider tunggal: **Duitku**. Ringkasnya:

- `/api/orders` membuat invoice lewat Duitku Inquiry API; notifikasi pembayaran
  masuk ke `/api/payments/webhook/duitku`.
- Autentikasi webhook **wajib** lewat HMAC-SHA256 dengan formula
  `merchantCode + amount + merchantOrderId`. Nilai `amount` dipakai apa adanya
  dari body, tidak diparse lebih dulu.
- Metode pembayaran diambil dari daftar channel yang aktif di project Duitku
  (`GET /api/payments/channels`), bukan hardcoded. Cek konfigurasi dengan
  `ddev npm run check:duitku`.
- Status order hanya berubah dari callback. `resultCode` pada redirect **tidak
  dipercaya** — dokumentasi Duitku menyatakan URL redirect bisa diubah manual
  oleh customer.
- Callback wajib dapat diakses publik dan membalas HTTP 200, kalau tidak
  Duitku mengulangnya maksimal 5 kali.

Detail setup project Duitku ada di [SETUP.md](SETUP.md#4b-payment-duitku).

## Demo tanpa DB

- `/demo-luxury-gold`, `/demo-romantic-garden`, `/demo-modern-minimal`
- `/demo-wedding-gift`, `/demo-birthday-gift`
- `/dashboard/wedding/create` — pilih template + isi form + live preview

## Deploy

Vercel (Hobby untuk dev/MVP pribadi) atau Cloudflare Pages.
DDEV hanya untuk dev lokal, bukan prod runtime.
Env prod via dashboard provider — jangan commit `.env`.
# Gift-Wedding-Invitation
# Gift-Wedding-Invitation
