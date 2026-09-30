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

Isi: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_BASE_DOMAIN`.

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
2. Paste `supabase/migrations/20260930000001_init.sql` → Run.
3. Paste `supabase/seed.sql` → Run.
4. Authentication → buat user → `profiles.role = 'admin'` untuk akun admin.

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
