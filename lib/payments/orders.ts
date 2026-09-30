import { getServiceClient } from "@/lib/supabase/service";

/**
 * Penulisan ke tabel `orders` memakai service_role, bukan sesi user.
 *
 * Kenapa bukan RLS: tabel `orders` sengaja TIDAK punya policy UPDATE untuk
 * `authenticated`. Kalau customer boleh mengubah barisnya sendiri, dia bisa
 * menulis `status = 'paid'` dan membuka paket premium tanpa membayar. Jadi
 * tabel ini ditulis hanya dari server, dan setiap fungsi di bawah wajib
 * menerima `userId` supaya kepemilikan bisa diverifikasi di kode sebelum
 * penulisan terjadi.
 *
 * Pola ini sama dengan `lib/payments/record.ts`, hanya untuk notifikasi dari
 * gateway.
 */

export type OrderWriteResult = { ok: true } | { ok: false; error: string };

/** Data invoice yang disimpan setelah inquiry Duitku berhasil. */
export interface InvoiceData {
  /** `reference` dari respons inquiry — dipakai untuk rekonsiliasi. */
  providerRef: string;
  /** `paymentUrl` — satu-satunya jalan kembali ke halaman bayar. */
  paymentUrl: string;
  /** Kode channel yang dipakai, mis. "BC". */
  paymentMethod: string;
  /** Batas akhir invoice dalam menit, sesuai `expiryPeriod` yang dikirim. */
  expiryMinutes: number;
}

/**
 * Simpan detail invoice Duitku ke order.
 *
 * ownerId wajib: tanpa itu, ID order dari request bisa dipakai menimpa order
 * milik orang lain.
 */
export async function attachInvoice(
  orderId: string,
  ownerId: string,
  invoice: InvoiceData
): Promise<OrderWriteResult> {
  const supabase = getServiceClient();
  if (!supabase) return { ok: false, error: "SUPABASE_SERVICE_ROLE_KEY belum dikonfigurasi" };

  const { error } = await supabase
    .from("orders")
    .update({
      provider_ref: invoice.providerRef,
      payment_url: invoice.paymentUrl,
      payment_method: invoice.paymentMethod,
      expires_at: new Date(Date.now() + invoice.expiryMinutes * 60_000).toISOString(),
    })
    .eq("id", orderId)
    .eq("user_id", ownerId);

  if (error) return { ok: false, error: `attachInvoice: ${error.message}` };
  return { ok: true };
}

/**
 * Tandai order `failed` — dipakai saat inquiry ditolak gateway.
 *
 * Hanya berlaku dari status `pending`, supaya notifikasi sukses yang datang
 * belakangan tidak tertimpa oleh kegagalan pembuatan invoice.
 */
export async function markOrderFailed(orderId: string, ownerId: string): Promise<OrderWriteResult> {
  const supabase = getServiceClient();
  if (!supabase) return { ok: false, error: "SUPABASE_SERVICE_ROLE_KEY belum dikonfigurasi" };

  const { error } = await supabase
    .from("orders")
    .update({ status: "failed" })
    .eq("id", orderId)
    .eq("user_id", ownerId)
    .eq("status", "pending");

  if (error) return { ok: false, error: `markOrderFailed: ${error.message}` };
  return { ok: true };
}

/**
 * Batalkan order `pending` → `expired` atas permintaan customer.
 *
 * `expired` bukan `failed`: tidak ada uang yang masuk dan tidak ada kesalahan
 * pembayaran, invoice-nya yang tidak dipakai. Dipakai juga saat invoice
 * kedaluwarsa dengan sendirinya.
 *
 * Order yang sudah `paid` tidak bisa disentuh di sini — filter `.eq("status",
 * "pending")` membuat cancel order yang sudah lunas tidak mengubah apa pun.
 */
export async function expireOrder(orderId: string, ownerId: string): Promise<OrderWriteResult> {
  const supabase = getServiceClient();
  if (!supabase) return { ok: false, error: "SUPABASE_SERVICE_ROLE_KEY belum dikonfigurasi" };

  const { error } = await supabase
    .from("orders")
    .update({ status: "expired" })
    .eq("id", orderId)
    .eq("user_id", ownerId)
    .eq("status", "pending");

  if (error) return { ok: false, error: `expireOrder: ${error.message}` };
  return { ok: true };
}