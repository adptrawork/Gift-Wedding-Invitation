import { NextResponse } from "next/server";
import { listPaymentMethods, readDuitkuConfig } from "@/lib/payments/duitku";

/**
 * GET /api/payments/channels — daftar channel pembayaran aktif di Duitku.
 *
 * Dipakai form billing untuk menampilkan pilihan metode. Daftar ini jarang
 * berubah, jadi hasilnya disimpan sebentar supaya tidak membanjiri rate limit
 * Duitku setiap kali halaman billing dibuka.
 */

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 jam
let cache: { at: number; channels: unknown } | null = null;

export async function GET() {
  const config = readDuitkuConfig();
  if (!config) {
    return NextResponse.json(
      { error: "Duitku belum dikonfigurasi" },
      { status: 503 }
    );
  }

  if (cache && Date.now() - cache.at < CACHE_TTL_MS) {
    return NextResponse.json({ data: cache.channels, cached: true });
  }

  try {
    const channels = await listPaymentMethods(config);
    cache = { at: Date.now(), channels };
    return NextResponse.json({ data: channels, cached: false });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Gagal mengambil channel";
    console.error("[payments/channels] gagal:", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
