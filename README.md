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
2. SQL Editor → jalankan `supabase/migrations/20260930000001_init.sql`.
3. Jalankan `supabase/seed.sql` untuk registry template.
4. Buat user admin via Authentication, lalu `update profiles set role='admin'`.
5. Isi `.env` dari `.env.example`.

## Demo tanpa DB

- `/demo-luxury-gold`, `/demo-romantic-garden`, `/demo-modern-minimal`
- `/demo-wedding-gift`, `/demo-birthday-gift`
- `/dashboard/wedding/create` — pilih template + isi form + live preview

## Deploy

Vercel (Hobby untuk dev/MVP pribadi) atau Cloudflare Pages.
DDEV hanya untuk dev lokal, bukan prod runtime.
Env prod via dashboard provider — jangan commit `.env`.
# Gift-Wedding-Invitation
