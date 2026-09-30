import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rsvpSchema } from "@/lib/validation";

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = rsvpSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const supabase = await createClient();
  const { error } = await supabase.from("rsvps").insert(parsed.data);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true }, { status: 201 });
}
