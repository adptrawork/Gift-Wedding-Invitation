import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkTransaction, readDuitkuConfig, DUITKU_SUCCESS_CODE } from "@/lib/payments/duitku";
import { recordPayment } from "@/lib/payments/record";

/**
 * POST /api/orders/[id]/verify — cek status order langsung ke Duitku.
 *
 * Dipakai user secara manual (tombol "Cek status") ketika order masih
 * `pending` padahal callback sudah seharusnya sampai.
 *
 * Sengaja TIDAK jadi poller/cron: dokumentasi Duitku memperingatkan rate
 * limit API transactionStatus dan memblokir IP sekitar 1 jam kalau dipanggil
 * berulang otomatis. Karena itu hanya order `pending` milik caller sendiri
 * yang boleh dicek, dan tidak ada retry loop.
 */
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const config = readDuitkuConfig();
  if (!config) {
    return NextResponse.json({ error: "Duitku belum dikonfigurasi" }, { status: 503 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: order, error } = await supabase
    .from("orders")
    .select("id, status, amount")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: "Gagal memuat order" }, { status: 500 });
  if (!order) return NextResponse.json({ error: "Order tidak ditemukan" }, { status: 404 });

  // Sudah final — tidak perlu memanggil gateway.
  if (order.status !== "pending") {
    return NextResponse.json({ data: { status: order.status } });
  }

  try {
    const status = await checkTransaction(order.id, config);
    const paid = status.statusCode === DUITKU_SUCCESS_CODE;

    if (paid) {
      const written = await recordPayment({
        orderId: order.id,
        provider: "duitku",
        providerTransactionId: status.reference,
        amount: status.amount ?? Number(order.amount),
        gatewayStatus: "paid:verify",
        paid: true,
      });
      if (!written.ok) {
        console.error("[orders/verify] gagal menyimpan:", written.error);
        return NextResponse.json({ error: "Gagal menyimpan" }, { status: 500 });
      }
    }

    return NextResponse.json({
      data: {
        status: paid ? "paid" : "pending",
        gateway: { statusCode: status.statusCode, statusMessage: status.statusMessage },
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Duitku tidak dapat dihubungi";
    console.error("[orders/verify] check transaction failed:", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
