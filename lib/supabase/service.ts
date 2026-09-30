import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Client dengan service_role — melewati RLS.
 *
 * Hanya boleh dipakai di server, dan hanya setelah otorisasi dilakukan di
 * kode aplikasi. Dua pemakai saat ini:
 *
 * 1. `lib/payments/record.ts` — notifikasi Duitku datang tanpa sesi user.
 * 2. `POST /api/rsvps` — tamu mengirim konfirmasi tanpa login, sehingga tidak
 *    ada sesi yang bisa dipakai. Role `anon` memang boleh INSERT lewat policy
 *    RLS, tetapi TIDAK boleh SELECT baris `rsvps` (nama, pesan, jumlah tamu
 *    adalah data pribadi). `.insert().select()` menambah header
 *    `Prefer: return=representation`, yang membuat Postgres menjalankan
 *    `INSERT ... RETURNING` — itu butuh hak SELECT dan ditolak dengan 42501.
 *    Daripada melonggarkan policy SELECT, insert dilakukan di sini setelah
 *    route memeriksa wedding-nya benar-benar published.
 *
 * Mengembalikan `null` kalau env belum lengkap, supaya pemanggil bisa
 * membalas 503 alih-alih melempar error yang membingungkan.
 */
export function getServiceClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url?.startsWith("http") || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
