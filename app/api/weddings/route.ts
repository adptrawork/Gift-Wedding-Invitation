import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createWeddingSchema } from "@/lib/validation";

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data, error } = await supabase
    .from("weddings")
    .select("id, slug, title, status, published_at, templates(slug, name)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = createWeddingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Resolve template_id + current version
  const { data: tpl } = await supabase
    .from("templates")
    .select("id, current_version")
    .eq("slug", parsed.data.template_slug)
    .eq("status", "published")
    .maybeSingle();
  if (!tpl) return NextResponse.json({ error: "Template tidak tersedia" }, { status: 404 });

  const { data: ver } = await supabase
    .from("template_versions")
    .select("id")
    .eq("template_id", (tpl as { id: string }).id)
    .eq("version", ((tpl as { current_version: string }).current_version ?? "1.0.0"))
    .maybeSingle();

  const { data: created, error } = await supabase
    .from("weddings")
    .insert({
      user_id: user.id,
      template_id: (tpl as { id: string }).id,
      template_version_id: ver ? (ver as { id: string }).id : null,
      slug: parsed.data.slug,
      title: parsed.data.title,
      content: {},
      status: "draft",
    })
    .select("id, slug")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: created }, { status: 201 });
}
