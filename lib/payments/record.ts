import { getServiceClient } from "@/lib/supabase/service";

/**
 * Penulisan hasil pembayaran memakai service_role (bypass RLS), karena
 * notifikasi datang dari gateway tanpa sesi user.
 *
 * Semua fungsi mengembalikan error alih-alih melempar exception diam-diam:
 * kalau DB gagal, route handler harus balas 5xx supaya gateway mengulang
 *-notifikasi. Membalas 200 saat penulisan gagal membuat pembayaran hilang
 * tanpa jejak.
 */

export type Provider = "duitku";

export interface RecordPaymentInput {
  orderId: string;
  provider: Provider;
  providerTransactionId?: string | null;
  amount?: number | null;
  gatewayStatus: string;
  paid: boolean;
}

export type RecordResult =
  | { ok: true; duplicate: boolean }
  | { ok: false; error: string };

export async function recordPayment(input: RecordPaymentInput): Promise<RecordResult> {
  const supabase = getServiceClient();
  if (!supabase) return { ok: false, error: "SUPABASE_SERVICE_ROLE_KEY belum dikonfigurasi" };

  // Notifikasi "gagal" bisa tiba setelah notifikasi "berhasil" — Duitku tidak
  // menjamin urutan. Order yang sudah `paid` tidak boleh diturunkan kembali.
  const orderUpdate = supabase
    .from("orders")
    .update({ status: input.paid ? "paid" : "failed" })
    .eq("id", input.orderId);

  const { error: orderErr } = input.paid ? await orderUpdate : await orderUpdate.neq("status", "paid");

  if (orderErr) {
    return { ok: false, error: `update orders: ${orderErr.message}` };
  }

  const { error: payErr } = await supabase.from("payments").insert({
    order_id: input.orderId,
    provider: input.provider,
    provider_transaction_id: input.providerTransactionId ?? null,
    amount: input.amount ?? null,
    status: input.gatewayStatus,
    paid_at: input.paid ? new Date().toISOString() : null,
  });

  if (payErr) {
    // 23505 = unique violation pada (provider, provider_transaction_id).
    // Itu artinya notifikasi ini sudah pernah diproses → idempoten, bukan error.
    if (payErr.code === "23505") return { ok: true, duplicate: true };
    return { ok: false, error: `insert payments: ${payErr.message}` };
  }

  return { ok: true, duplicate: false };
}
