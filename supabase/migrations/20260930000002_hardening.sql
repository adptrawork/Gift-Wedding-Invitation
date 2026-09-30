-- Hardening pass (setelah 20260930000001_init.sql).
--
-- Isu yang ditutup:
--  1. Draft vs Published terpisah (design §34) — edit tidak langsung mengubah
--     halaman publik.
--  2. Media bucket harus publicly readable: undangan adalah halaman publik dan
--     template render <img src>. Write tetap owner-scoped.
--  3. Idempotensi capture payment — gateway mengulang notifikasi kalau tidak
--     dibalas HTTP 200 (Duitku maksimal 5 kali).
--  4. RSVP anonymous insertion dibatasi ke wedding yang published.
--  5. Order tidak boleh attach ke wedding milik orang lain.
--  6. updated_at dipelihara trigger (tadi selalu = created_at).
--
-- Semua statement idempoten supaya aman dijalankan ulang.

-- ============ 1. draft vs published ============
alter table public.weddings
  add column if not exists draft_content jsonb not null default '{}'::jsonb;

-- Pindahkan konten lama ke draft supaya tidak hilang.
update public.weddings
   set draft_content = content
 where draft_content = '{}'::jsonb
   and content is not null
   and content <> '{}'::jsonb;

-- ============ 2. media bucket public read ============
update storage.buckets set public = true where id = 'wedding-media';

drop policy if exists "storage owner read" on storage.objects;

-- ============ 3. payment idempotency ============
create unique index if not exists payments_provider_tx_uniq
  on public.payments (provider, provider_transaction_id)
  where provider_transaction_id is not null;

alter table public.orders add column if not exists plan_id text;
alter table public.orders add column if not exists provider text;
alter table public.orders add column if not exists provider_ref text;

-- ============ 4. rsvps: hanya untuk wedding published ============
drop policy if exists "rsvps public insert" on public.rsvps;

drop policy if exists "rsvps insert published wedding" on public.rsvps;
create policy "rsvps insert published wedding" on public.rsvps for insert
  with check (
    exists (
      select 1
        from public.weddings w
       where w.id = wedding_id
         and w.status = 'published'
    )
  );

-- ============ 5. orders: wedding harus milik pemilik ============
drop policy if exists "orders owner insert" on public.orders;

create policy "orders owner insert" on public.orders for insert
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1
        from public.weddings w
       where w.id = wedding_id
         and w.user_id = (select auth.uid())
    )
  );

-- ============ 6. updated_at trigger ============
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists templates_set_updated_at on public.templates;
create trigger templates_set_updated_at
  before update on public.templates
  for each row execute function public.set_updated_at();

drop trigger if exists weddings_set_updated_at on public.weddings;
create trigger weddings_set_updated_at
  before update on public.weddings
  for each row execute function public.set_updated_at();
