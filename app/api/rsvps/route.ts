import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getServiceClient } from "@/lib/supabase/service";
import { rsvpSchema } from "@/lib/validation";

/**
 * POST /api/rsvps — tamu konfirmasi kehadiran.
 *
 * Dipanggil tanpa login, jadi tidak ada sesi yang bisa dipakai untuk insert.
 * Role `anon` sebenarnya boleh INSERT lewat policy RLS "rsvps insert published
 * wedding" (migration 000002), tapi TIDAK boleh SELECT baris rsvps: nama,
 * pesan, dan jumlah tamu adalah data pribadi pemilik undangan.
 *
 * Karena itu `.insert().select("id")` — yang menambah header
 * `Prefer: return=representation` sehingga Postgres menjalankan
 * `INSERT ... RETURNING` — ditolak dengan 42501. Daripada melonggarkan policy
 * SELECT, insert ditulis lewat service_role setelah route memverifikasi bahwa
 * wedding-nya benar-benar published.
 *
 * Policy RLS tetap berguna sebagai pertahanan kedua: publishable key ada di
 * browser, jadi PostgREST bisa dipanggil langsung tanpa melewati route ini.
 */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body bukan JSON valid" }, { status: 400 });
  }

  const parsed = rsvpSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = await createClient();

  // Beri pesan yang jelas kalau wedding-nya belum tayang.
  const { data: wedding } = await supabase
    .from("weddings")
    .select("id, status")
    .eq("id", parsed.data.wedding_id)
    .maybeSingle();

  if (!wedding) return NextResponse.json({ error: "Undangan tidak ditemukan" }, { status: 404 });
  if (wedding.status !== "published") {
    return NextResponse.json({ error: "Undangan belum dipublish" }, { status: 409 });
  }

  // Insert lewat service_role, bukan client anonim. Pemeriksaan published di
  // atas sudah menjadi otorisasi di sisi aplikasi, dan policy RLS tetap
  // melindungi wedding yang belum tayang dari penulisan langsung lewat
  // PostgREST memakai publishable key.
  const service = getServiceClient();
  if (!service) {
    return NextResponse.json(
      { error: "Server belum dikonfigurasi untuk menerima RSVP" },
      { status: 503 }
    );
  }

  const { data, error } = await service
    .from("rsvps")
    .insert({
      wedding_id: parsed.data.wedding_id,
      name: parsed.data.name,
      attendance: parsed.data.attendance,
      guests_count: parsed.data.guests_count,
      message: parsed.data.message,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[rsvps] insert gagal:", error.message);
    return NextResponse.json({ error: "Gagal menyimpan RSVP" }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 201 });
}
