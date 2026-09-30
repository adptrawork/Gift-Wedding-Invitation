import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { orderSchema } from "@/lib/validation";
import { getPlan } from "@/lib/plans";
import {
  createInquiry,
  listPaymentMethods,
  readDuitkuConfig,
  type PaymentChannel,
} from "@/lib/payments/duitku";
import { attachInvoice, markOrderFailed } from "@/lib/payments/orders";

/** GET /api/orders — riwayat order milik caller. */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("orders")
    .select(
      "id, wedding_id, plan_id, amount, currency, status, provider, payment_method, payment_url, expires_at, created_at, weddings(slug, title)"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: "Gagal memuat order" }, { status: 500 });

  // `payment_url` hanya berguna kalau invoice-nya masih berlaku. Duitku tidak
  // menghidupkan kembali invoice kedaluwarsa, jadi jangan tawarkan tombol
  // "Lanjut bayar" yang pasti gagal — tawarkan buat invoice baru.
  const now = Date.now();
  const rows = (data ?? []).map((row) => {
    const o = row as Record<string, unknown>;
    const expires = typeof o.expires_at === "string" ? Date.parse(o.expires_at) : null;
    const masihBerlaku = Boolean(expires !== null && expires > now);
    return {
      ...o,
      payment_url: masihBerlaku ? o.payment_url : null,
      // Invoice kedaluwarsa ATAU `paymentUrl`-nya tidak pernah tersimpan. Yang
      // kedua terjadi pada order lama, sebelum kolom ini ada.
      perlu_invoice_baru: o.status === "pending" && !masihBerlaku,
    };
  });

  return NextResponse.json({ data: rows });
}

/**
 * POST /api/orders — buat order pembayaran.
 *
 * Harga SELALU dari lib/plans.ts. Body hanya boleh membawa `plan_id`.
 */
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body bukan JSON valid" }, { status: 400 });
  }

  const parsed = orderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const plan = getPlan(parsed.data.plan_id);
  if (!plan) {
    return NextResponse.json({ error: "Paket tidak dikenal" }, { status: 400 });
  }

  // Pastikan wedding milik caller sebelum memesan (RLS juga menolak, tapi
  // pesanan yang gagal karena RLS akan muncul sebagai 500).
  const { data: wedding, error: weddingErr } = await supabase
    .from("weddings")
    .select("id, slug")
    .eq("id", parsed.data.wedding_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (weddingErr) return NextResponse.json({ error: "Gagal memuat wedding" }, { status: 500 });
  if (!wedding) return NextResponse.json({ error: "Wedding tidak ditemukan" }, { status: 404 });

  const duitku = readDuitkuConfig();
  if (!duitku) {
    return NextResponse.json(
      { error: "Payment gateway Duitku belum dikonfigurasi di server" },
      { status: 503 }
    );
  }

  // Kode channel dari client TIDAK dipercaya langsung — dicocokkan dengan
  // daftar channel yang benar-benar aktif di project Duitku.
  const requested = parsed.data.payment_method;
  let channels: PaymentChannel[];
  try {
    channels = await listPaymentMethods(duitku);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Gagal mengambil channel";
    console.error("[orders] daftar channel gagal:", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }

  const channel = channels.find((c) => c.code === requested);
  if (!channel) {
    return NextResponse.json(
      { error: `Metode pembayaran "${requested}" tidak tersedia`, available: channels.map((c) => c.code) },
      { status: 400 }
    );
  }

  // Order dibuat lebih dulu supaya ID-nya bisa jadi merchantOrderId di gateway.
  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .insert({
      user_id: user.id,
      wedding_id: wedding.id,
      plan_id: plan.id,
      amount: plan.amount,
      currency: "IDR",
      status: "pending",
      provider: "duitku",
    })
    .select("id, amount")
    .single();

  if (orderErr) return NextResponse.json({ error: "Gagal membuat order" }, { status: 500 });

  // URL publik yangfondasi untuk callback Duitku. Callback harus terjangkau
  // dari internet, jadi localhost DDEV tidak akan pernah work saat tes callback.
  const base = (process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000").replace(/\/+$/, "");
  const callbackUrl = `${base}/api/payments/webhook/duitku`;

  try {
    const inquiry = await createInquiry(
      {
        orderId: order.id,
        amount: plan.amount,
        // Duitku mewajibkan email; user dari Supabase selalu punya email.
        customerEmail: user.email ?? "",
        // customerVaName tampil di sisi bank dan dibatasi 20 karakter.
        customerName: user.email?.split("@")[0] ?? "Pelanggan",
        productDetails: `Paket ${plan.name} — undangan digital (${wedding.slug})`,
        returnUrl: `${base}/dashboard/billing?from=duitku&order=${order.id}`,
        callbackUrl,
        // Sudah tervalidasi terhadap daftar channel aktif.
        paymentMethod: channel.code,
      },
      duitku
    );

    // Penulisan lewat service_role. Sebelumnya memakai client user, yang UPDATE-nya
    // ditolak RLS tanpa error — sehingga `provider_ref` tidak pernah tersimpan dan
    // order `pending` tidak punya `paymentUrl` untuk dilanjutkan.
    const saved = await attachInvoice(order.id, user.id, {
      providerRef: inquiry.reference,
      paymentUrl: inquiry.paymentUrl,
      paymentMethod: channel.code,
      expiryMinutes: duitku.expiryMinutes,
    });
    if (!saved.ok) {
      // Order sudah dibuat di Duitku tapi URL-nya tidak tersimpan. Jangan dihapus —
      // bayarannya masih bisa masuk lewat webhook — tapi pembayaran yang berhasil
      // tidak akan punya tombol "Lanjut bayar".
      console.error("[orders] gagal menyimpan invoice:", saved.error);
      return NextResponse.json(
        { error: "Transaksi dibuat di Duitku, tetapi URL pembayaran gagal disimpan. Hubungi support dengan nomor order Anda." },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: { order }, redirect_url: inquiry.paymentUrl }, { status: 201 });
  } catch (err) {
    // Transaksi gagal dibuat → jangan tinggalkan order pending yang menggantung.
    const failed = await markOrderFailed(order.id, user.id);
    if (!failed.ok) console.error("[orders] gagal menandai failed:", failed.error);
    const message = err instanceof Error ? err.message : "Gateway tidak dapat dihubungi";
    console.error("[orders] create transaction failed:", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
