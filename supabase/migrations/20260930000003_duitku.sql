-- Migrasi payment: pindah dari Midtrans/Xendit ke Duitku (satu-satunya provider).
--
-- Constraint lama dik-drop lalu dibuat ulang karena `check (...)` inline di
-- 20260930000001_init.sql menghasilkan nama constraint payments_provider_check.
-- Kalau tabel belum pernah dibuat, statement di bawah aman (drop if exists).
--
-- Jalankan file ini SETELAH 20260930000002_hardening.sql.

do $$
begin
  if exists (
    select 1 from pg_constraint
    where conrelid = 'public.payments'::regclass
      and conname = 'payments_provider_check'
  ) then
    alter table public.payments drop constraint payments_provider_check;
  end if;
end
$$;

alter table public.payments
  add constraint payments_provider_check check (provider in ('duitku'));

-- Catatan rekonsiliasi: kolom `reference` dari respons inquiry Duitku disimpan
-- di orders.provider_ref; `publisherOrderId` dari callback disimpan di
-- payments.provider_transaction_id (sudah ada unique index dari hardening).
