# CHANGELOG

## 2026-09-30 — Skeleton MVP (US-001/002/003/006/007/009)

- DDEV generic + Node 20, tanpa DB lokal (`omit_containers: [db]`), extra port Next.js 3000.
- Next.js 14 App Router + TS strict + Tailwind; deps: supabase, gsap, lenis + helper libs (zod, clsx, tailwind-merge, lucide-react, date-fns, cva, radix-slot).
- 5 template package (luxury-gold, romantic-garden, modern-minimal, wedding-gift, birthday-gift) + TemplateRenderer + SDK.
- FormRenderer dinamis dari schema.json (string/textarea/richtext/date/url/image/audio/array/color + theme).
- Supabase migration init (8 tabel + RLS + trigger + storage bucket) + seed registry.
- Routes: `/` marketplace, `/demo-*`, `/[slug]` publik, `/dashboard`, `/dashboard/wedding/create`, `/dashboard/wedding/[id]/edit|preview`, `/dashboard/billing`, `/admin`, `/admin/templates`, `/login`, `/register`.
- API: templates, weddings CRUD + publish, rsvps, orders, payments webhook (signature), media upload (validasi).
- CI GitHub Actions (typecheck + lint + build).
