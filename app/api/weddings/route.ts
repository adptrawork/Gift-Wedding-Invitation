import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createWeddingSchema } from "@/lib/validation";
import { getSchema } from "@/lib/templates";
import { schemaDefaults } from "@/lib/schema";

/** GET /api/weddings — daftar wedding milik caller. */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("weddings")
    .select("id, slug, title, status, published_at, created_at, templates(slug, name)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: "Gagal memuat data" }, { status: 500 });
  return NextResponse.json({ data });
}

/** POST /api/weddings — buat draft baru. */
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

  const parsed = createWeddingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Status template dibaca dari DB, bukan dari template.json.
  const { data: tpl, error: tplErr } = await supabase
    .from("templates")
    .select("id, current_version")
    .eq("slug", parsed.data.template_slug)
    .eq("status", "published")
    .maybeSingle();

  if (tplErr) return NextResponse.json({ error: "Gagal memuat template" }, { status: 500 });
  if (!tpl) return NextResponse.json({ error: "Template tidak tersedia" }, { status: 404 });

  // Pin versi saat wedding dibuat supaya update template tidak mengubah
  // tampilan customer lama.
  const version = (tpl as { current_version: string | null }).current_version ?? "1.0.0";
  const { data: tplVersion } = await supabase
    .from("template_versions")
    .select("id")
    .eq("template_id", tpl.id)
    .eq("version", version)
    .maybeSingle();

  const templateId = (tpl as { id: string }).id;
  const schema = getSchema(parsed.data.template_slug);
  const defaults = schema ? schemaDefaults(schema.properties) : {};

  const { data: created, error } = await supabase
    .from("weddings")
    .insert({
      user_id: user.id,
      template_id: templateId,
      template_version_id: tplVersion ? (tplVersion as { id: string }).id : null,
      slug: parsed.data.slug,
      title: parsed.data.title,
      draft_content: defaults,
      content: {}, // belum ada yang dipublish
      status: "draft",
    })
    .select("id, slug")
    .single();

  if (error) {
    // Jangan kirim pesan error Postgres mentah ke client.
    if (error.code === "23505") {
      return NextResponse.json(
        { error: `Slug "${parsed.data.slug}" sudah dipakai. Coba slug lain.` },
        { status: 409 }
      );
    }
    console.error("[weddings] insert gagal:", error.message);
    return NextResponse.json({ error: "Gagal membuat wedding" }, { status: 500 });
  }

  return NextResponse.json({ data: created }, { status: 201 });
}
