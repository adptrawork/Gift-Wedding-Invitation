# SETUP — Gift & Wedding SaaS (DDEV + Supabase Cloud)

## 1. Prasyarat

- Docker + DDEV v1.25+
- Akun Supabase (free tier cukup untuk MVP)

## 2. Clone & env

```bash
git clone <repo> gift-wedding
cd gift-wedding
cp .env.example .env
```

Isi minimal:

| Variabel | Keterangan |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Dari dashboard Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Kunci publishable baru (`sb_publishable_…`). Fallback lama: `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server only.** Dipakai webhook & pencatatan pembayaran |
| `NEXT_PUBLIC_BASE_DOMAIN` | Host untuk slug/subdomain routing |
| `NEXT_PUBLIC_BASE_URL` | URL publik root, untuk callback Duitku & redirect balik |
| `DUITKU_MERCHANT_CODE` | Dashboard Duitku → Settings → Project |
| `DUITKU_API_KEY` | Idem, jangan pernah expose ke client |

> `SUPABASE_SERVICE_ROLE_KEY` melewati RLS. Jangan pernah Prefix `NEXT_PUBLIC_`
> padanya dan jangan commit `.env` (sudah masuk `.gitignore`).

## 3. Start DDEV

```bash
ddev start
ddev npm install
ddev npm run dev
```

Buka `https://gift-wedding.ddev.site:3001` (port host menyesuaikan bila 3000 bentrok —
lihat output `ddev describe`).

## 4. Database Supabase

1. Supabase Dashboard → SQL Editor.
2. Jalankan **berurutan** — `000002` dan `00003` bergantung pada `00001`:
   1. `supabase/migrations/20260930000001_init.sql`
   2. `supabase/migrations/20260930000002_hardening.sql`
   3. `supabase/migrations/20260930000003_duitku.sql`
   4. `supabase/seed.sql`
3. Authentication → buat user → `profiles.role = 'admin'` untuk akun admin.

Semua statement dibuat idempoten (`if not exists` / `drop … if exists`), jadi
aman dijalankan ulang.

## 4b. Payment Duitku

Isi Merchant Code + API Key dari dashboard Duitku, lalu daftarkan project:

| Field di form Duitku | Nilai |
| --- | --- |
| Nama Proyek | nama brand/platform Anda |
| Website Proyek | domain publik Anda (WAJIB bisa diakses internet) |
| URL Callback Proyek | `{NEXT_PUBLIC_BASE_URL}/api/payments/webhook/duitku` |

Callback Duitku hanya diterima kalau URL-nya **publik** (port 80/443) dan
membalas HTTP 200; kalau tidak, callback diulang 5× lalu dilaporkan lewat email.
Host DDEV (`gift-wedding.ddev.site`) tidak terjangkau internet, jadi untuk
menguji callback sungguhan arahkan domain ke server Anda atau pakai tunnel:

```bash
cloudflared tunnel --url https://gift-wedding.ddev.site:3001
# lalu set NEXT_PUBLIC_BASE_URL ke URL tunnel tersebut dan restart dev server
```

Arahkan `paymentMethod` (`*`) ke halaman Choosing Payment Duitku. Kalau project
merchant Anda menolak `*`, isi kode channel konkret — contoh `BC` (BCA VA),
`SP` (ShopeePay QRIS), `M2` (Mandiri VA), `DA` (DANA). Daftar lengkap ada di
<https://docs.duitku.com/api/en#payment-method>.

Status order hanya berubah lewat callback. Kalau order masih `pending`, pakai
tombol **Cek status** di `/dashboard/billing` (panggil manual, jangan cron —
Duitku membatasi rate limit API `transactionStatus`).

## 5. Verifikasi

```bash
ddev npm run typecheck
ddev npm run lint
ddev npm run build
```

Buka `/demo-luxury-gold` — undangan harus render dengan animasi GSAP.

## 6. Troubleshooting

- Port 3000 bentrok → DDEV otomatis alihkan (cek `ddev describe`).
- `npm` host usang (v12) → selalu gunakan `ddev npm ...`, jangan `npm` host.
- RLS 403 → pastikan trigger `handle_new_user()` aktif dan user login ulang.
- Billing 503 "Duitku belum dikonfigurasi" → `DUITKU_MERCHANT_CODE`/`DUITKU_API_KEY` kosong.
- Webhook 503 → konfigurasi Duitku belum ada; sengaja gagal tertutup, bukan menerima begitu saja.
- Webhook 403 → signature tidak cocok. Periksa `amount` dan `merchantCode` diteruskan apa adanya
  (tidak boleh di-parse ke number dulu) serta API key untuk environment yang benar.
- Order `pending` setelah bayar → cek dashboard Duitku; biasanya callback terlambat.
  Bisa dipaksa lewat tombol **Cek status**.
