import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { expireOrder } from "@/lib/payments/orders";

/**
 * DELETE /api/orders/[id] — batalkan order yang belum dibayar.
 *
 * Statusnya jadi `expired`, bukan `failed`: tidak ada uang yang masuk dan tidak
 * ada kesalahan pembayaran, hanya invoice-nya yang tidak dipakai.
 *
 * Order `paid` tidak bisa dibatalkan di sini. `expireOrder` memfilter
 * `.eq("status", "pending")`, jadi permintaan atas order yang sudah lunas tidak
 * mengubah apa pun dan endpoint membalas 409. Melindungi uang lebih penting
 * daripada memberi customer kendali penuh atas status pembayarannya.
 */
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // RLS select hanya mengembalikan order milik caller sendiri, jadi baris yang
  // tidak terlihat di sini bukan milik caller.
  const { data: order, error } = await supabase
    .from("orders")
    .select("id, status")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: "Gagal memuat order" }, { status: 500 });
  if (!order) return NextResponse.json({ error: "Order tidak ditemukan" }, { status: 404 });

  if (order.status !== "pending") {
    return NextResponse.json(
      { error: `Order berstatus "${order.status}" tidak bisa dibatalkan.` },
      { status: 409 }
    );
  }

  const done = await expireOrder(order.id, user.id);
  if (!done.ok) {
    console.error("[orders/cancel]", done.error);
    return NextResponse.json({ error: "Gagal membatalkan order" }, { status: 500 });
  }

  return NextResponse.json({ data: { id: order.id, status: "expired" } });
}