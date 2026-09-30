import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { orderSchema } from "@/lib/validation";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const parsed = orderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { data, error } = await supabase
    .from("orders")
    .insert({ user_id: user.id, wedding_id: parsed.data.wedding_id, amount: parsed.data.amount, currency: parsed.data.currency, status: "pending" })
    .select("id, status")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  // TODO US-018: buat transaksi Midtrans Snap / Xendit Invoice di sini, return redirect_url.
  return NextResponse.json({ data, redirect_url: null }, { status: 201 });
}
