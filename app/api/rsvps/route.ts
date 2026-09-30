import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rsvpSchema } from "@/lib/validation";

/**
 * POST /api/rsvps — tamu konfirmasi kehadiran.
 *
 * dipanggil tanpa login. Policy RLS "rsvps insert published wedding"
 * (migration 000002) juga menolak insert untuk wedding yang belum published,
 * jadi datapakai langsung lewat anon key tidak bisa menulis ke wedding draft.
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

  const { data, error } = await supabase
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
    // 42501 = RLS menolak. Umumnya karena wedding belum published.
    if (error.code === "42501") {
      return NextResponse.json({ error: "Undangan belum menerima RSVP" }, { status: 409 });
    }
    console.error("[rsvps] insert gagal:", error.message);
    return NextResponse.json({ error: "Gagal menyimpan RSVP" }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 201 });
}
