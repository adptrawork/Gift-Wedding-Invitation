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
ddev npm install
ddev start
ddev launch
```

`ddev start` menjalankan `next dev` sendiri lewat `web_extra_daemons`, jadi
`ddev npm run dev` tidak perlu dijalankan manual — menjalankannya dua kali akan
membuat dua proses berebut port 3000.

Buka `https://gift-wedding.ddev.site:3001` (port host untuk HTTP menyesuaikan
bila 3000 bentrok — lihat output `ddev describe`).

### Troubleshooting: 502 Bad Gateway

502 dari `*.ddev.site` artinya ddev-router tidak punya backend, yaitu tidak ada
proses yang listen di port 3000 di dalam container. Container bisa saja hidup
normal, jadi `ddev status` tetap hijau — itu bukan tanda dev server hidup.

```bash
ddev restart
docker logs --tail 30 ddev-gift-wedding-web   # harus ada "✓ Ready in ..."
```

Kalau lognya berhenti di "Starting..." tanpa "Ready", biasanya `node_modules`
belum terpasang: `ddev npm install`.

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

Alternatif tanpa SQL Editor — pakai `psql` dari dalam container DDEV:

```bash
# taruh di .env (gitignored, jangan di-commit)
# DATABASE_URL=postgresql://postgres:<password>@db.<ref>.supabase.co:5432/postgres

ddev exec bash -c '
  for f in supabase/migrations/20260930000001_init.sql \
           supabase/migrations/20260930000002_hardening.sql \
           supabase/migrations/20260930000003_duitku.sql \
           supabase/seed.sql; do
    echo "== $f"
    psql -v ON_ERROR_STOP=1 -f "$f"
  done'
```

`SUPABASE_SERVICE_ROLE_KEY` tidak bisa dipakai untuk menjalankan SQL — key itu
hanya berlaku untuk PostgREST/Storage/Auth, bukan eksekusi DDL.

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

### Penting: project Anda tidak punya channel `*`

Duitku menerima `paymentMethod` bertipe `string(2)`, dan tabel metode resmi
**tidak memuat `*`** (pilihan semua channel di halaman bayar Duitku). Cek
sendiri daftar channel yang aktif di project Anda:

```bash
ddev npm run check:duitku
```

Endpoint `/api/payments/channels` mengambil daftar ini dari Duitku, jadi form
di `/dashboard/billing` menampilkan pilihan metode yang benar-benar aktif —
BCA VA, BRI VA, Mandiri VA, QRIS ShopeePay, DANA, OVO, ritel, dan seterusnya
sesuai apa yang Anda aktifkan di dashboard Duitku.

Konsekuensinya: `POST /api/orders` mewajibkan `payment_method`, dan nilainya
divalidasi ulang di server terhadap daftar aktif — kode dari client tidak
dipercaya langsung. `DUITKU_PAYMENT_METHOD` hanya jadi nilai cadangan untuk
server ke server.

Status order hanya berubah lewat callback. Kalau order masih `pending`, pakai
tombol **Cek status** di `/dashboard/billing` (panggil manual, jangan cron —
Duitku membatasi rate limit API `transactionStatus`).

## 5. Verifikasi

```bash
ddev npm run typecheck
ddev npm run lint
ddev npm run build
ddev npm run check:duitku    # diagnosa kredensial Duitku, tanpa membuat transaksi
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
