import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const patch: Record<string, unknown> = {};
  if (body.content !== undefined) patch.content = body.content;
  if (body.title !== undefined) patch.title = body.title;
  if (body.status === "published") {
    patch.status = "published";
    patch.published_at = new Date().toISOString();
  }
  const { data, error } = await supabase
    .from("weddings")
    .update(patch)
    .eq("id", params.id)
    .eq("user_id", user.id)
    .select("id, slug, status")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
