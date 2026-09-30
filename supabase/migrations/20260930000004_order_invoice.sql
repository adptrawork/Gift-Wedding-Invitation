-- Simpan data invoice Duitku di order supaya pembayaran bisa DILANJUTKAN.
--
-- Latar belakang: `POST /api/orders` menyimpan `provider_ref` hasil inquiry, tapi
-- (1) tabel `orders` tidak punya policy UPDATE sehingga penulisan itu ditolak RLS
-- secara diam-diam, dan (2) `paymentUrl` — satu-satunya cara kembali ke halaman
-- bayar Duitku — tidak pernah disimpan sama sekali. Akibatnya begitu customer
-- menutup tab, order `pending` tidak punya jalan keluar apa pun kecuali hoping
-- webhook datang.
--
-- `expires_at` dipakai untuk menandai batas invoice. Duitku membuat VA sekali
-- inquiry dan tidak menyediakan API untuk mengambil ulang `paymentUrl`; kalau
-- invoice sudah kedaluwarsa, satu-satunya jalan adalah inquiry baru dengan
-- merchantOrderId baru, bukan menghidupkan kembali tautan lama.

alter table public.orders
  add column if not exists payment_url text,
  add column if not exists payment_method text,
  add column if not exists expires_at timestamptz;

comment on column public.orders.payment_url is
  'URL halaman bayar Duitku. Hanya untuk melanjutkan invoice yang masih berlaku.';
comment on column public.orders.payment_method is
  'Kode channel yang dipakai saat inquiry, mis. BC (BCA VA).';
comment on column public.orders.expires_at is
  'Batas akhir invoice. Setelah lewat, harus inquiry baru dengan merchantOrderId baru.';

-- Status `expired` sudah ada di CHECK constraint sejak init, tapi belum pernah
-- dipakai. Sekarang dipakai ketika customer membatalkan atau invoice kedaluwarsa.
--
-- Catatan keamanan: TIDAK ada policy UPDATE untuk `authenticated` di tabel ini,
-- dan itu harus tetap begitu. Kalau customer boleh mengubah `orders`, dia bisa
-- menulis status paid sendiri dan membuka paket premium tanpa membayar.
-- Semua penulisan dari sisi aplikasi memakai service_role di
-- `lib/payments/orders.ts` setelah kepemilikan order diverifikasi di kode.