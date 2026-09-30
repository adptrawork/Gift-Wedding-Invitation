import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Webhook Midtrans/Xendit — verifikasi signature (US-018).
// Gunakan service_role agar bisa update orders/payments (bypass RLS).
export async function POST(req: Request) {
  const raw = await req.text();
  const provider = req.headers.get("x-provider") ?? "midtrans";

  if (provider === "midtrans") {
    const crypto = await import("crypto");
    const signature = req.headers.get("x-signature") ?? "";
    const expected = crypto
      .createHash("sha512")
      .update(`${raw}${process.env.MIDTRANS_SERVER_KEY ?? ""}`)
      .digest("hex");
    if (signature !== expected) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  } else if (provider === "xendit") {
    const token = req.headers.get("x-callback-token") ?? "";
    if (token !== (process.env.XENDIT_WEBHOOK_TOKEN ?? "")) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const payload = JSON.parse(raw || "{}");
  const orderId: string | undefined = payload.order_id ?? payload.external_id;
  const status: string = payload.transaction_status ?? payload.status ?? "";
  if (!orderId) return NextResponse.json({ error: "Missing order id" }, { status: 400 });

  const paid = ["settlement", "capture", "PAID", "paid"].includes(status);
  await supabase.from("orders").update({ status: paid ? "paid" : "failed" }).eq("id", orderId);
  await supabase.from("payments").insert({
    order_id: orderId,
    provider,
    provider_transaction_id: payload.transaction_id ?? null,
    amount: payload.gross_amount ?? payload.amount ?? null,
    status,
    paid_at: paid ? new Date().toISOString() : null,
  });
  return NextResponse.json({ ok: true });
}
