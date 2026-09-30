-- MVP init: profiles, templates, template_versions, weddings, wedding_domains,
-- orders, payments, rsvps, media + RLS + trigger new-user + storage bucket.
-- Terapkan via Supabase Dashboard > SQL Editor atau `supabase db push`.

create extension if not exists "pgcrypto";

-- ============ profiles ============
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  role text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============ templates ============
create table if not exists public.templates (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text,
  category text not null default 'wedding' check (category in ('wedding', 'gift', 'birthday', 'engagement')),
  thumbnail_url text,
  preview_url text,
  status text not null default 'draft' check (status in ('draft', 'published')),
  current_version text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============ template_versions ============
create table if not exists public.template_versions (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.templates(id) on delete cascade,
  version text not null,
  manifest jsonb not null default '{}'::jsonb,
  schema jsonb not null default '{}'::jsonb,
  package_url text,
  status text not null default 'draft' check (status in ('draft', 'published')),
  created_at timestamptz not null default now(),
  unique(template_id, version)
);

-- ============ weddings ============
create table if not exists public.weddings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  template_id uuid references public.templates(id),
  template_version_id uuid references public.template_versions(id),
  slug text unique not null,
  title text,
  content jsonb not null default '{}'::jsonb,
  status text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============ wedding_domains ============
create table if not exists public.wedding_domains (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  domain text unique not null,
  verified boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============ orders / payments ============
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id),
  wedding_id uuid references public.weddings(id),
  amount bigint not null check (amount > 0),
  currency text not null default 'IDR',
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed', 'expired')),
  created_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id),
  provider text check (provider in ('midtrans', 'xendit')),
  provider_transaction_id text,
  amount bigint,
  status text,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

-- ============ rsvps ============
create table if not exists public.rsvps (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  name text not null,
  attendance text not null check (attendance in ('yes', 'no')),
  guests_count int not null default 1 check (guests_count between 1 and 20),
  message text default '',
  created_at timestamptz not null default now()
);

-- ============ media ============
create table if not exists public.media (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  wedding_id uuid references public.weddings(id) on delete cascade,
  type text,
  path text,
  url text,
  mime_type text,
  size bigint,
  created_at timestamptz not null default now()
);

-- ============ indexes (lookup + FK) ============
create index if not exists idx_weddings_user on public.weddings(user_id);
create index if not exists idx_weddings_slug on public.weddings(slug);
create index if not exists idx_weddings_published on public.weddings(slug) where status = 'published';
create index if not exists idx_versions_template on public.template_versions(template_id);
create index if not exists idx_domains_wedding on public.wedding_domains(wedding_id);
create index if not exists idx_domains_domain on public.wedding_domains(domain);
create index if not exists idx_orders_user on public.orders(user_id);
create index if not exists idx_rsvps_wedding on public.rsvps(wedding_id);
create index if not exists idx_media_wedding on public.media(wedding_id);

-- ============ helper: is_admin ============
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'admin'
  );
$$;

-- ============ trigger: auto-create profiles ============
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''), 'customer')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============ RLS ============
alter table public.profiles enable row level security;
alter table public.templates enable row level security;
alter table public.template_versions enable row level security;
alter table public.weddings enable row level security;
alter table public.wedding_domains enable row level security;
alter table public.orders enable row level security;
alter table public.payments enable row level security;
alter table public.rsvps enable row level security;
alter table public.media enable row level security;

-- profiles: own read/update; admin all
drop policy if exists "profiles own select" on public.profiles;
create policy "profiles own select" on public.profiles for select
  using ((select auth.uid()) = id or public.is_admin());
drop policy if exists "profiles own update" on public.profiles;
create policy "profiles own update" on public.profiles for update
  using ((select auth.uid()) = id);

-- templates + versions: public read published; admin all
drop policy if exists "templates public read published" on public.templates;
create policy "templates public read published" on public.templates for select
  using (status = 'published' or public.is_admin());
drop policy if exists "templates admin write" on public.templates;
create policy "templates admin write" on public.templates for all
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists "versions public read published" on public.template_versions;
create policy "versions public read published" on public.template_versions for select
  using (status = 'published' or public.is_admin());
drop policy if exists "versions admin write" on public.template_versions;
create policy "versions admin write" on public.template_versions for all
  using (public.is_admin()) with check (public.is_admin());

-- weddings: owner CRUD; anon+auth read published; admin all
drop policy if exists "weddings owner select" on public.weddings;
create policy "weddings owner select" on public.weddings for select
  using ((select auth.uid()) = user_id or status = 'published' or public.is_admin());
drop policy if exists "weddings owner insert" on public.weddings;
create policy "weddings owner insert" on public.weddings for insert
  with check ((select auth.uid()) = user_id);
drop policy if exists "weddings owner update" on public.weddings;
create policy "weddings owner update" on public.weddings for update
  using ((select auth.uid()) = user_id or public.is_admin());
drop policy if exists "weddings owner delete" on public.weddings;
create policy "weddings owner delete" on public.weddings for delete
  using ((select auth.uid()) = user_id or public.is_admin());

-- wedding_domains: owner via wedding; public read verified
drop policy if exists "domains read" on public.wedding_domains;
create policy "domains read" on public.wedding_domains for select
  using (
    verified = true
    or public.is_admin()
    or exists (
      select 1 from public.weddings w
      where w.id = wedding_id and w.user_id = (select auth.uid())
    )
  );
drop policy if exists "domains owner write" on public.wedding_domains;
create policy "domains owner write" on public.wedding_domains for all
  using (
    public.is_admin()
    or exists (
      select 1 from public.weddings w
      where w.id = wedding_id and w.user_id = (select auth.uid())
    )
  )
  with check (
    public.is_admin()
    or exists (
      select 1 from public.weddings w
      where w.id = wedding_id and w.user_id = (select auth.uid())
    )
  );

-- orders: owner read/insert; admin all (status update via service_role webhook)
drop policy if exists "orders owner select" on public.orders;
create policy "orders owner select" on public.orders for select
  using ((select auth.uid()) = user_id or public.is_admin());
drop policy if exists "orders owner insert" on public.orders;
create policy "orders owner insert" on public.orders for insert
  with check ((select auth.uid()) = user_id);

-- payments: via order ownership; admin all
drop policy if exists "payments read" on public.payments;
create policy "payments read" on public.payments for select
  using (
    public.is_admin()
    or exists (
      select 1 from public.orders o
      where o.id = order_id and o.user_id = (select auth.uid())
    )
  );

-- rsvps: public insert; owner/admin read
drop policy if exists "rsvps public insert" on public.rsvps;
create policy "rsvps public insert" on public.rsvps for insert with check (true);
drop policy if exists "rsvps owner read" on public.rsvps;
create policy "rsvps owner read" on public.rsvps for select
  using (
    public.is_admin()
    or exists (
      select 1 from public.weddings w
      where w.id = wedding_id and w.user_id = (select auth.uid())
    )
  );

-- media: owner CRUD; admin all
drop policy if exists "media owner select" on public.media;
create policy "media owner select" on public.media for select
  using ((select auth.uid()) = user_id or public.is_admin());
drop policy if exists "media owner insert" on public.media;
create policy "media owner insert" on public.media for insert
  with check ((select auth.uid()) = user_id);
drop policy if exists "media owner delete" on public.media;
create policy "media owner delete" on public.media for delete
  using ((select auth.uid()) = user_id or public.is_admin());

-- ============ storage bucket wedding-media (private) ============
insert into storage.buckets (id, name, public)
values ('wedding-media', 'wedding-media', false)
on conflict (id) do nothing;

drop policy if exists "storage owner insert" on storage.objects;
create policy "storage owner insert" on storage.objects for insert
  with check (bucket_id = 'wedding-media' and (select auth.uid())::text = (storage.foldername(name))[1]);
drop policy if exists "storage owner read" on storage.objects;
create policy "storage owner read" on storage.objects for select
  using (bucket_id = 'wedding-media' and (select auth.uid())::text = (storage.foldername(name))[1]);
drop policy if exists "storage owner delete" on storage.objects;
create policy "storage owner delete" on storage.objects for delete
  using (bucket_id = 'wedding-media' and (select auth.uid())::text = (storage.foldername(name))[1]);
