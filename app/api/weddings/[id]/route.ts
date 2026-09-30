import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { saveDraftSchema } from "@/lib/validation";
import { getSchema } from "@/lib/templates";
import { schemaDefaults } from "@/lib/schema";

/**
 * PATCH /api/weddings/[id] — simpan draft.
 *
 * Menulis ke `draft_content`, BUKAN `content`. Halaman publik membaca
 * `content` (snapshot yang dipublish), jadi mengedit tidak langsung mengubah
 * undangan yang sudah tayang. Publish ada di /publish.
 */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
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

  const parsed = saveDraftSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Siapkan merge default schema supaya field yang belum disentuh tetap punya
  // nilai, dan template tidak pernah menerima `undefined` untuk object.
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

  const patch: Record<string, unknown> = {};
  if (parsed.data.title !== undefined) patch.title = parsed.data.title;

  if (parsed.data.draft_content !== undefined) {
    const schema = row.templates?.slug ? getSchema(row.templates.slug) : undefined;
    const base = schema
      ? { ...schemaDefaults(schema.properties), ...(row.draft_content ?? {}) }
      : (row.draft_content ?? {});
    patch.draft_content = { ...base, ...parsed.data.draft_content };
  }

  // zod membuang key yang tidak dikenal, jadi body `{}` — atau body yang
  // seluruhnya key asing — menghasilkan patch kosong. PostgREST menolak
  // `update({})` ("Cannot coerce the result to a single JSON object") karena
  // tidak ada baris yang tersentuh; itu kesalahan klien, bukan kegagalan DB.
  if (Object.keys(patch).length === 0) {
    return NextResponse.json(
      { error: "Tidak ada perubahan untuk disimpan" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("weddings")
    .update(patch)
    .eq("id", params.id)
    .eq("user_id", user.id)
    .select("id, slug, status, updated_at")
    .single();

  if (error) {
    console.error("[weddings] patch gagal:", error.message);
    return NextResponse.json({ error: "Gagal menyimpan draft" }, { status: 500 });
  }

  return NextResponse.json({ data });
}
