# PRD: Gift & Wedding Invitation SaaS Platform (DDEV)

## Introduction / Overview

Membangun platform SaaS untuk undangan digital **Wedding + Gift** (sesuai nama repo `gift&wedding_invitation`) dengan arsitektur **SaaS + Template Engine**, bukan sekadar "website undangan dengan banyak template".

Prinsip pemisahan:

- **Platform** hanya tahu: `template_id`, `schema`, `content (JSONB)`, `status`, `version`.
- **Template** tahu: bagaimana data ditampilkan (React + GSAP + Lenis + Tailwind, opsional Three.js).

Customer flow: `Register → Create Wedding/Gift → Pilih Template → Isi Form (auto-generated dari schema.json) → Upload Foto → Save Draft → Preview → Publish → Live di platform.com/slug`.

Local development **wajib menggunakan DDEV** untuk Next.js (Node.js). Supabase tetap **cloud** (PostgreSQL + Auth + Storage) selama MVP. Deploy awal ke Vercel (Hobby untuk dev/MVP pribadi) atau Cloudflare Pages, dengan catatan Hobby non-komersial untuk jangka panjang.

Template ditambah via **Git (trusted)** + dikelola metadata/version/publish via **Admin Dashboard**. Tidak ada eksekusi arbitrary JS dari upload ZIP di MVP ini.

Kategori MVP: **Wedding + Gift**. Birthday/Engagement ditunda sebagai kategori baru memakai engine yang sama.

## Goals

- Customer dapat register, membuat 1 wedding atau gift, memilih template, mengisi data, preview, dan publish dalam < 15 menit tanpa bantuan developer.
- Satu template engine melayani Wedding dan Gift hanya dengan ganti `template.json + schema.json + template.tsx`.
- Form customer 100% di-generate dari `schema.json` — tidak ada form manual per template.
- Template versioning menjamin customer lama tidak rusak saat template di-update (pin `template_version_id`).
- Admin dapat publish/unpublish/version/duplicate template tanpa deploy ulang kode customer content.
- Payment (Duitku) dan domain (slug + subdomain + custom domain mapping) berfungsi di MVP.
- Seluruh development lokal berjalan via DDEV (`ddev start` → `https://*.ddev.site`) dengan parity env ke staging/prod.
- RLS Supabase aktif: user hanya akses wedding/order/media miliknya; public hanya baca wedding `published`.

## User Stories

### EPIC A — Project Skeleton & DDEV

#### US-001: Setup repo + DDEV untuk Next.js

**Description:** Sebagai developer, saya ingin menjalankan project via DDEV sehingga semua developer punya env lokal yang sama.

**Acceptance Criteria:**

- [ ] Repo memiliki `.ddev/config.yaml` (`type: nodejs`, `nodejs_version: "20"`, project name `gift-wedding`)
- [ ] `ddev start` berhasil dan membuka Next.js dev server via `ddev launch` / `https://gift-wedding.ddev.site`
- [ ] `.env.example` berisi `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `DUITKU_MERCHANT_CODE`, `DUITKU_API_KEY`, `NEXT_PUBLIC_BASE_DOMAIN`, `NEXT_PUBLIC_BASE_URL`
- [ ] README menjelaskan `ddev start`, `ddev npm install`, `ddev npm run dev`, `ddev exec`
- [ ] Typecheck (`tsc --noEmit`) passes

#### US-002: Skeleton Next.js + TypeScript + Tailwind + shadcn/ui

**Description:** Sebagai developer, saya ingin skeleton app terstandar sehingga fitur dashboard dan public site konsisten.

**Acceptance Criteria:**

- [ ] Next.js App Router + TypeScript strict + Tailwind + shadcn/ui terinstall
- [ ] Struktur `app/(auth)/`, `app/dashboard/`, `app/admin/`, `app/[slug]/`, `app/api/`, `components/`, `lib/`, `templates/` ada
- [ ] Lint passes
- [ ] Verify in browser using dev-browser skill (halaman home render tanpa error via DDEV URL)

### EPIC B — Database, Auth, Storage (Supabase Cloud)

#### US-003: Migrasi Supabase + RLS dasar

**Description:** Sebagai developer, saya membutuhkan tabel profiles, templates, template_versions, weddings, wedding_domains, orders, payments, rsvps, media agar platform punya sumber kebenaran tunggal.

**Acceptance Criteria:**

- [ ] `supabase/migrations/` berisi tabel sesuai FR-10–FR-17 dengan FK dan unique constraints (`templates.slug`, `weddings.slug`, `template_versions(template_id,version)`)
- [ ] RLS enabled: select/insert/update own weddings (`auth.uid() = user_id`); public read hanya `status='published'` via policy terpisah
- [ ] Seed 1 admin + 2 template metadata + 1 published wedding contoh berhasil di Supabase cloud
- [ ] Typecheck passes

#### US-004: Auth Register/Login/Logout via Supabase Auth

**Description:** Sebagai customer, saya ingin register dan login sehingga wedding/gift saya tersimpan privat.

**Acceptance Criteria:**

- [ ] Halaman `/register`, `/login` dengan Supabase Auth (email/password)
- [ ] Setelah register otomatis membuat row `profiles` dengan `role='customer'`
- [ ] Session persist, logout membersihkan session, route `/dashboard` proteksi redirect ke `/login` jika belum login
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

#### US-005: Upload media ke Supabase Storage

**Description:** Sebagai customer, saya ingin upload foto/galeri/musik sehingga tersimpan aman dan tampil di undangan.

**Acceptance Criteria:**

- [ ] Bucket `wedding-media` (private) + policy insert/select/delete own `user_id/wedding_id/*`
- [ ] Upload via `POST /api/media` validasi mime (jpg/png/webp/mp4/mp3) dan size max 10MB foto, 25MB video/audio
- [ ] Return `url` signed/public dan insert row `media`
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### EPIC C — Template Package System

#### US-006: Spesifikasi template package + 3 wedding template awal

**Description:** Sebagai developer template, saya ingin standar package sehingga template baru tinggal duplikasi folder.

**Acceptance Criteria:**

- [ ] Setiap folder `templates/<slug>/` wajib ada `template.json`, `schema.json`, `template.tsx`, `animations.ts`, `styles.css`, `assets/`
- [ ] 3 wedding template tersedia: `luxury-gold`, `romantic-garden`, `modern-minimal` dengan `template.json` valid (id, slug, version, category=wedding, features, engine.type=react, status)
- [ ] `TemplateRenderer` me-render berdasarkan `template_slug` dan fallback "Template tidak ditemukan"
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill (masing-masing template render dengan dummy data)

#### US-007: 2 gift template awal memakai engine yang sama

**Description:** Sebagai customer, saya ingin membuat gift invitation (birthday-gift, wedding-gift) dengan engine yang sama seperti wedding.

**Acceptance Criteria:**

- [ ] `templates/wedding-gift/` dan `templates/birthday-gift/` dengan `category=gift` dan schema gift (penerima, pesan, nominal/voucher opsional, cover, musik)
- [ ] `TemplateRenderer` mendukung `category` wedding dan gift tanpa perubahan core
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

#### US-008: Template SDK komponen standar

**Description:** Sebagai developer template, saya ingin komponen standar sehingga template konsisten.

**Acceptance Criteria:**

- [ ] Package `@/components/template-sdk` menyediakan `Hero`, `Countdown`, `Couple`, `Event`, `Story`, `Gallery`, `RSVP`, `Gift`, `Music`, `Location`, `Footer`, hook `useTemplateData`
- [ ] `luxury-gold` direfactor memakai SDK tanpa perubahan visual
- [ ] Typecheck passes

### EPIC D — Schema → Form Generator

#### US-009: FormRenderer otomatis dari schema.json

**Description:** Sebagai customer, saya ingin form otomatis muncul sesuai template yang saya pilih tanpa developer membuat form manual.

**Acceptance Criteria:**

- [ ] `components/form-builder/FormRenderer.tsx` + `FieldRenderer` mendukung `string`, `textarea`, `richtext`, `date`, `url`, `image`, `audio`, `array(image)`, `color`
- [ ] Field `image/audio` memakai upload US-005 dengan preview dan progress
- [ ] Validasi `required` dari schema, error tampil inline
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

#### US-010: Theme configuration per wedding

**Description:** Sebagai customer, saya ingin mengganti warna/font tanpa ganti template.

**Acceptance Criteria:**

- [ ] Schema mendukung blok `theme { primary, background, text, fontHeading, fontBody }` tipe `color`/`string`
- [ ] Template membaca CSS vars `--template-primary` dll dan menerapkannya
- [ ] Perubahan theme terlihat di preview tanpa reload penuh
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### EPIC E — Customer Dashboard (Wedding/Gift CRUD + Draft/Publish)

#### US-011: Create wedding/gift pilih template

**Description:** Sebagai customer, saya ingin membuat wedding/gift dan memilih template dari marketplace.

**Acceptance Criteria:**

- [ ] `/dashboard/wedding/create` menampilkan grid template published (thumbnail, name, category filter wedding/gift)
- [ ] Memilih template membuat row `weddings` dengan `status='draft'`, `template_id` + `template_version_id` = current version, slug auto dari title + cek unik
- [ ] Redirect ke halaman edit
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

#### US-012: Edit draft + save draft

**Description:** Sebagai customer, saya ingin mengisi data dan menyimpan draft tanpa mengubah situs live.

**Acceptance Criteria:**

- [ ] `/dashboard/wedding/[id]/edit` me-render FormRenderer dari schema versi yang di-pin
- [ ] Tombol Save Draft menyimpan ke `weddings.content` (JSONB), status tetap `draft`, toast sukses
- [ ] Reload halaman menampilkan data tersimpan
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

#### US-013: Preview draft vs Live published

**Description:** Sebagai customer, saya ingin preview sebelum publish sehingga tidak malu saat share link.

**Acceptance Criteria:**

- [ ] `/dashboard/wedding/[id]/preview` render draft content (belum publish) hanya bisa diakses owner
- [ ] `/{slug}` public hanya render jika `status='published'`, selain itu 404
- [ ] Tombol Publish mengubah `status` → `published` + set `published_at`; tombol Unpublish kembali ke `draft`
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

#### US-014: RSVP & Guestbook publik

**Description:** Sebagai tamu, saya ingin mengisi RSVP/komentar sehingga mempelai tahu kehadiran.

**Acceptance Criteria:**

- [ ] Form RSVP (nama, kehadiran ya/tidak, jumlah tamu, pesan) di halaman publik menyimpan ke `rsvps`
- [ ] Tanpa login, dengan rate-limit sederhana + captcha/honeypot
- [ ] Owner melihat daftar RSVP di dashboard
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### EPIC F — Public Rendering & Animasi

#### US-015: Halaman publik `[slug]` + GSAP + Lenis

**Description:** Sebagai tamu, saya ingin membuka undangan yang halus dan premium di HP.

**Acceptance Criteria:**

- [ ] `app/[slug]/page.tsx` fetch wedding by slug + TemplateRenderer + GSAP ScrollTrigger reveal + Lenis smooth scroll
- [ ] Lighthouse mobile performance >= 80, gambar lazy + `next/image`
- [ ] Countdown ke `event.date` akurat (zona Asia/Jakarta default)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill (mobile viewport)

### EPIC G — Admin Panel

#### US-016: Admin kelola metadata template

**Description:** Sebagai admin, saya ingin mengatur publish/unpublish/version tanpa menyentuh kode customer.

**Acceptance Criteria:**

- [ ] `/admin/templates` list semua template + status + current_version; hanya `role='admin'` bisa akses (middleware + RLS)
- [ ] Create/edit metadata (name, description, category, thumbnail/preview), Publish/Unpublish, Duplicate, Bump version (copy `template_versions` baru)
- [ ] Mengubah current_version tidak mengubah wedding lama (tetap pin versi lama)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

#### US-017: Admin kelola users, orders, weddings

**Description:** Sebagai admin, saya ingin melihat customer, order, dan wedding untuk support.

**Acceptance Criteria:**

- [ ] `/admin/users`, `/admin/orders`, `/admin/weddings` dengan tabel + search + pagination
- [ ] Hanya admin, audit sederhana (siapa publish kapan)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### EPIC H — Payment & Billing (MVP)

#### US-018: Orders + Payment Duitku

**Description:** Sebagai customer, saya ingin membayar paket agar wedding saya bisa publish dengan domain premium.

**Acceptance Criteria:**

- [ ] Membuat order dari dashboard (`/dashboard/billing`) → `orders(status=pending)` → redirect ke Duitku payment page
- [ ] Webhook `POST /api/payments/webhook/duitku` verifikasi HMAC-SHA256 signature, update `orders` + `payments` + tandai wedding `is_paid`
- [ ] Invoice sederhana tampil di dashboard
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### EPIC I — Domain Management (MVP)

#### US-019: Slug + subdomain + custom domain mapping

**Description:** Sebagai customer berbayar, saya ingin link cantik dan custom domain.

**Acceptance Criteria:**

- [ ] Slug unik: `platform.com/andi-sinta`; validasi regex `^[a-z0-9-]+$`, error jika duplikat dengan saran alternatif
- [ ] Subdomain: `andi-sinta.platform.com` resolve ke wedding yang sama via middleware host parsing
- [ ] Custom domain: tabel `wedding_domains(domain, wedding_id, verified)` + panduan DNS CNAME + verifikasi via API; request custom domain hanya jika order paid
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### EPIC J — Release & Observability

#### US-020: CI/CD + Sentry + DDEV docs

**Description:** Sebagai developer, saya ingin deploy aman dan error terpantau.

**Acceptance Criteria:**

- [ ] GitHub Actions: typecheck + lint + build di setiap push; deploy ke Vercel/Cloudflare Pages
- [ ] Sentry terpasang di client+server, source maps, contoh error terkirim di staging
- [ ] `README.md` + `SETUP.md` menjelaskan DDEV + Supabase cloud + deploy
- [ ] Typecheck passes

## Functional Requirements

- FR-1: Project harus berjalan lokal via DDEV (`ddev start`, Node 20, `.ddev/config.yaml`) dan terdokumentasi di README.
- FR-2: App Next.js App Router + TypeScript strict + Tailwind + shadcn/ui; struktur `app/(auth)/`, `app/dashboard/`, `app/admin/`, `app/[slug]/`, `app/api/`, `components/`, `lib/`, `templates/`, `packages/template-sdk/`, `supabase/migrations/`.
- FR-3: Setiap template adalah folder `templates/<slug>/` berisi `template.json` (id, slug, version, category wedding|gift, preview/thumbnail, features, engine, status), `schema.json` (JSON Schema draft 2020-12 + ekstensi `image/audio/color/richtext`), `template.tsx` (`({data})` only, tanpa hardcode konten), `animations.ts`, `styles.css`.
- FR-4: `TemplateRenderer` memilih komponen berdasarkan `template_slug`; unknown slug menampilkan fallback 404-friendly.
- FR-5: `FormRenderer`/`FieldRenderer` mendukung tipe `string, textarea, richtext, date, string(time), url, image, audio, array(image), color`; `image/audio` upload ke Supabase Storage.
- FR-6: Data customer disimpan sebagai `weddings.content JSONB`; platform tidak menyimpan HTML hasil render.
- FR-7: Wedding mem-pin `template_id` + `template_version_id`; update template membuat `template_versions` baru, wedding lama tidak berubah; tersedia aksi "Upgrade ke vX".
- FR-8: Status lifecycle `draft → preview (owner only) → published → live`; `/{slug}` publik hanya baca `published`; edit selalu ke draft sampai klik Publish.
- FR-9: Auth Supabase; `profiles(id, full_name, phone, role customer|admin)` auto-create via trigger; proteksi route dashboard/admin via middleware + RLS.
- FR-10: Tabel `profiles`, `templates(id, slug unique, name, description, category, thumbnail_url, preview_url, status draft|published, current_version)`, `template_versions(id, template_id FK cascade, version, manifest JSONB, schema JSONB, package_url, status)`.
- FR-11: Tabel `weddings(id, user_id FK cascade, template_id, template_version_id, slug unique, title, content JSONB default '{}', status draft|published, published_at)`.
- FR-12: Tabel `wedding_domains(id, wedding_id FK cascade, domain unique, verified bool, created_at)`.
- FR-13: Tabel `orders(id, user_id, wedding_id, plan_id, amount, currency IDR default, provider, provider_ref, status pending|paid|failed|expired)`, `payments(id, order_id, provider duitku, provider_transaction_id, amount, status, paid_at)`.
- FR-14: Tabel `rsvps(id, wedding_id FK cascade, name, attendance, guests_count, message, created_at)`, `media(id, user_id FK cascade, wedding_id FK cascade, type, path, url, mime_type, size)`.
- FR-15: RLS: owner CRUD own weddings/orders/media/rsvps-read; anon read weddings `published` + insert rsvps; admin bypass via `role='admin'` policy; Storage bucket `wedding-media` dengan policy prefix `user_id/wedding_id/`.
- FR-16: API `GET /api/templates`, `GET /api/templates/[slug]/schema`, `CRUD /api/weddings`, `POST /api/weddings/[id]/publish`, `POST /api/media`, `POST /api/rsvps`, `POST /api/orders`, `POST /api/orders/[id]/verify`, `POST /api/payments/webhook/duitku` (verifikasi signature).
- FR-17: Public page `app/[slug]/page.tsx` + middleware subdomain/custom-domain: parse `host`, lookup `wedding_domains` atau slug, render TemplateRenderer dengan `content` published.
- FR-18: Animasi GSAP + ScrollTrigger + Lenis wajib di semua wedding template; Three.js hanya template yang mendeklarasikan `animations.three=true`; cleanup via `gsap.context` + `ctx.revert()`.
- FR-19: Admin (`/admin`) hanya `role=admin`: list/create/edit metadata template, publish/unpublish, duplicate, bump version, kelola users/orders/weddings.
- FR-20: Billing `/dashboard/billing`: pilih paket → create order → Duitku Inquiry API → webhook update status; custom domain/subdomain premium hanya jika `orders.status='paid'`.
- FR-21: Slug generator: lowercase, strip non `[a-z0-9-]`, cek unik, saran `slug-2` jika konflik.
- FR-22: Media constraints: foto max 10MB, video/audio max 25MB; thumbnail otomatis via `next/image`; hapus file Storage saat row `media` dihapus.
- FR-23: Observability: Sentry client+server; logging INFO default; `Logs/` tidak commit secret.
- FR-24: CI/CD GitHub Actions (typecheck, lint, build) + deploy Vercel/Cloudflare; env via `.env` (tidak commit); DDEV hanya untuk dev lokal, bukan prod runtime.
- FR-25: Kategori awal `wedding` (luxury-gold, romantic-garden, modern-minimal) dan `gift` (wedding-gift, birthday-gift); kategori baru (birthday, engagement) tinggal tambah `category` tanpa ubah engine.

## Non-Goals (Out of Scope)

- Tidak ada upload template ZIP arbitrary + eksekusi JS di server (Model B marketplace untrusted) — tetap via Git trusted + review.
- Tidak ada drag-and-drop website builder / visual editor.
- Tidak ada microservices, Kubernetes, Redis, Elasticsearch, Kafka, custom CMS.
- Tidak ada AI website generator.
- Tidak ada Three.js di semua template; hanya template flagged.
- Tidak ada mobile app native.
- Tidak ada auto custom-domain DNS provisioning (CNAME manual + verifikasi); tidak ada wildcard SSL custom otomatis di MVP.
- Tidak ada migrasi R2 terpisah di MVP — tetap Supabase Storage; R2 dipertimbangkan saat egress/storage > free tier.
- Tidak ada priority/notif otomatis, tidak ada multi-bahasa penuh (ID dulu, EN menyusul).
- Tidak ada self-host Supabase lokal via DDEV di MVP — Supabase cloud untuk dev/staging/prod.

## Design Considerations

- Dashboard + Admin: shadcn/ui (Card, Dialog, Dropdown, Badge, Table, Toast), layout sidebar, mode terang; reuse `Badge` untuk status draft/published/paid.
- Public invitation: full-bleed mobile-first, serif heading (Playfair Display) + sans body (Inter) via theme vars; palet awal luxury-gold `#C9A227 / #FAF7F0 / #222222`.
- Template marketplace grid: thumbnail 16:9, filter kategori Wedding/Gift, badge features (gallery, rsvp, gift, music, countdown).
- Form builder: label Indonesia ("Nama Mempelai Pria"), helper text dari `description` schema, preview image inline, date picker native + time input.
- Mockup reuse: `Hero`, `Countdown`, `Couple`, `Event`, `Story`, `Gallery`, `RSVP`, `Gift`, `Music`, `Location`, `Footer` dari Template SDK; template hanya susun urutan + styling + animasi.
- Aksesibilitas: alt image, kontras, focus state, keyboard navigable.

## Technical Considerations

- DDEV: `ddev config --project-type=nodejs` (atau generic Node 20), `docroot` kosong karena Next standalone, `web_extra_exposed_ports` untuk `3000`, `additional_hostnames` untuk `*.ddev.site`; perintah harian `ddev start`, `ddev npm run dev -- --port 3000`, `ddev exec npm run build`. Env Supabase cloud di `.ddev/.env` (gitignored) + `.env.example`. Jangan jalankan Supabase self-host di DDEV untuk MVP.
- Next.js: hindari static export jika pakai Route Handlers/webhook/middleware domain; pilih Node server (Vercel) atau adapter Cloudflare sesuai fitur; pin versi `next`, `react`, `gsap`, `lenis`, `three`, `@supabase/supabase-js`.
- Supabase: trigger `handle_new_user()` untuk insert `profiles`; RLS contoh `auth.uid() = user_id`; service_role hanya di server (`/api/*`), anon di client.
- Template pinning: `weddings.template_version_id` FK; fungsi `duplicate_template()` dan `bump_version()` di admin API.
- Keamanan: validasi `template.json`/`schema.json` di CI (ajv); CSP ketat di public page; sanitasi richtext (DOMPurify); webhook verifikasi HMAC-SHA256 Duitku (resultCode pada redirect tidak dipercaya karena bisa diubah manual oleh customer); upload validasi mime+size + scan ekstensi; tidak pernah `eval()` konten template.
- Performa: `next/image`, lazy gallery, `dynamic(import)` untuk Three.js, Lenis + GSAP hanya client (`"use client"`).
- Env yang dibutuhkan: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `DUITKU_MERCHANT_CODE`, `DUITKU_API_KEY`, `DUITKU_IS_PRODUCTION`, `DUITKU_PAYMENT_METHOD`, `DUITKU_EXPIRY_MINUTES`, `NEXT_PUBLIC_BASE_DOMAIN`, `NEXT_PUBLIC_BASE_URL`, `SENTRY_DSN`.
- Testing: `tsc --noEmit` + `eslint` di CI; verifikasi visual invitation via dev-browser skill sebelum merge template baru.

## Success Metrics

- DDEV onboarding: developer baru `git clone → cp .env.example .env → ddev start` berhasil < 10 menit.
- Customer dapat publish wedding/gift pertama < 15 menit dari register (diukur via funnel dashboard).
- 100% field customer berasal dari schema (0 form hardcode per template) — audit via grep.
- 0 wedding lama berubah visual saat template di-bump version (test pinning).
- Public page mobile Lighthouse Performance ≥ 80, LCP < 3.5s di koneksi 4G.
- Webhook payment success rate ≥ 99% (signature valid → order paid < 60 detik).
- 0 pelanggaran RLS (user A tidak bisa fetch wedding user B) — diuji via policy test.
- Admin publish/unpublish template < 2 klik dan langsung reflected di marketplace.

## Open Questions

- Paket harga final (sekali bayar vs langganan) dan batasan paket gratis (jumlah foto, custom domain, masa aktif link)?
- ~~Provider payment utama~~ **PUTUS: Duitku** — satu-satunya provider di MVP; modul Midtrans/Xendit dihapus
- Base domain produksi apa (`namaplatform.com`)? Kapan beli dan siapa pegang Cloudflare DNS? gunakan vercel yang gratisan
- Apakah gift perlu nominal/voucher + amplop digital terpisah dari wedding gift, atau satu komponen Gift shared? ya fitur nya seperti https://weddingpress.co.id/
- Perlu subdomain otomatis `slug.platform.com` untuk semua user, atau hanya paid? hanya paid, untuk sekarang belum
- Batas upload total per wedding (misal 100MB) dan retensi wedding expired? expired
- Apakah perlu editor richtext WYSIWYG penuh atau markdown sederhana cukup untuk Story? markdown sederhana cukup
- Kapan marketplace untrusted (upload ZIP + sandbox build) benar-benar dibutuhkan — Q3/Q4? tidak
