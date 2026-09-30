import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSchema } from "@/lib/templates";
import { mergeWithDefaults, validateContent } from "@/lib/schema";

/**
 * POST /api/weddings/[id]/publish — terbitkan draft.
 *
 * Menyalin `draft_content` → `content`. Ini satu-satunya tempat halaman publik
 * berubah, jadi customer selalu bisa preview dulu sebelum URL live.
 */
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: existing, error: readErr } = await supabase
    .from("weddings")
    .select("draft_content, templates(slug)")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (readErr) return NextResponse.json({ error: "Gagal memuat wedding" }, { status: 500 });
  if (!existing) return NextResponse.json({ error: "Wedding tidak ditemukan" }, { status: 404 });

  const row = existing as unknown as {
    draft_content: Record<string, unknown> | null;
    templates: { slug: string } | null;
  };

  const templateSlug = row.templates?.slug ?? "";
  const schema = getSchema(templateSlug);
  const content = schema
    ? mergeWithDefaults(schema.properties, row.draft_content ?? {})
    : (row.draft_content ?? {});

  // Jangan terbitkan undangan yang field wajibnya masih kosong — tamu akan
  // melihat halaman dengan nama/tanggal kosong.
  if (schema) {
    const missing = validateContent(schema.properties, content);
    if (missing.length > 0) {
      return NextResponse.json(
        { error: "Field wajib belum diisi", fields: missing },
        { status: 422 }
      );
    }
  }

  const { data, error } = await supabase
    .from("weddings")
    .update({ content, status: "published", published_at: new Date().toISOString() })
    .eq("id", params.id)
    .eq("user_id", user.id)
    .select("id, slug, status, published_at")
    .single();

  if (error) {
    console.error("[weddings] publish gagal:", error.message);
    return NextResponse.json({ error: "Gagal menerbitkan" }, { status: 500 });
  }

  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "";
  return NextResponse.json({ data, url: base ? `${base}/${data.slug}` : `/${data.slug}` });
}
