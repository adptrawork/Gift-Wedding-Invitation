import { NextResponse } from "next/server";
import { readDuitkuConfig, verifyCallback, type DuitkuCallback } from "@/lib/payments/duitku";
import { getServiceClient, recordPayment } from "@/lib/payments/record";

/**
 * Notifikasi Duitku (`callbackUrl`).
 *
 * Duitku mengirim POST `application/x-www-form-urlencoded` dan WAJIB dibalas
 * HTTP 200; kalau tidak, callback diulang maksimal 5 kali lalu dilaporkan lewat
 * email. Jadi setiap kegagalan penyimpanan di bawah dibalas 5xx, bukan 200.
 *
 * Verifikasi relying pada HMAC-SHA256 signature, BUKAN `resultCode` dari
 * redirect — dokumentasi Duitku sendiri menyatakan resultCode pada redirect
 * bisa diubah manual oleh customer.
 */
export async function POST(req: Request) {
  const config = readDuitkuConfig();
  if (!config) {
    console.error("[duitku-webhook] DUITKU_MERCHANT_CODE / DUITKU_API_KEY belum diset");
    return NextResponse.json({ error: "Webhook belum dikonfigurasi" }, { status: 503 });
  }

  const payload = await readPayload(req);
  if (!payload) {
    return NextResponse.json({ error: "Body tidak bisa dibaca" }, { status: 400 });
  }

  const result = verifyCallback(payload, config);
  if (!result.ok) {
    console.warn("[duitku-webhook] ditolak:", result.reason);
    return NextResponse.json({ error: result.reason }, { status: 403 });
  }

  // Nominal yang ditandatangani Duitku sudah otentik, jadi selisih dengan
  // katalog hanya bisa berarti bug di sisi kita — tetap dikreditkan, tapi
  // dicatat karena sekarang ada selisih uang.
  const mismatch = await checkAmountMismatch(result.orderId!, result.amount);
  if (mismatch) console.error("[duitku-webhook] nominal tidak cocok:", mismatch);

  const written = await recordPayment({
    orderId: result.orderId!,
    provider: "duitku",
    providerTransactionId: result.transactionId,
    amount: result.amount,
    gatewayStatus: result.paid ? `paid:${result.paymentCode ?? "?"}` : `failed:${result.paymentCode ?? "?"}`,
    paid: result.paid,
  });

  if (!written.ok) {
    console.error("[duitku-webhook] gagal menyimpan:", written.error);
    return NextResponse.json({ error: "Gagal menyimpan" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, duplicate: written.duplicate });
}

/** Baca form-urlencoded (resmi Duitku), dengan fallback JSON untuk ease of testing. */
async function readPayload(req: Request): Promise<DuitkuCallback | null> {
  try {
    const form = await req.formData();
    const out: Record<string, string> = {};
    // forEach, bukan for..of — iterator FormData butuh target ES2015+.
    form.forEach((value, key) => {
      if (typeof value === "string") out[key] = value;
    });
    return out as DuitkuCallback;
  } catch {
    try {
      return (await req.json()) as DuitkuCallback;
    } catch {
      return null;
    }
  }
}

async function checkAmountMismatch(
  orderId: string,
  callbackAmount: number | null
): Promise<string | null> {
  if (callbackAmount === null) return null;
  const supabase = getServiceClient();
  if (!supabase) return null;
  const { data } = await supabase.from("orders").select("amount").eq("id", orderId).maybeSingle();
  const orderAmount = (data as { amount?: number } | null)?.amount;
  if (orderAmount == null || Number(orderAmount) === callbackAmount) return null;
  return `order ${orderId} = ${orderAmount}, callback = ${callbackAmount}`;
}
