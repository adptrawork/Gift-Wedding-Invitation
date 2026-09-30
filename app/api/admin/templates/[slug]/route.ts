import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { allTemplates } from "@/lib/templates";
import { z } from "zod";

const bodySchema = z.object({
  status: z.enum(["draft", "published"]),
});

/**
 * PATCH /api/admin/templates/[slug] — ubah status publish template.
 *
 * Kode template tetap dari Git (tidak bisa diupload dari sini). Yang diubah
 * hanya metadata operasional, dan hanya admin yang boleh melakukannya.
 */
export async function PATCH(req: Request, { params }: { params: { slug: string } }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if ((profile as { role?: string } | null)?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Hanya template yang benar-benar ada di build ini yang bisa diubah statusnya.
  const manifest = allTemplates().find((t) => t.slug === params.slug);
  if (!manifest) {
    return NextResponse.json({ error: "Template tidak ada di build ini" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body bukan JSON valid" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { data, error } = await supabase
    .from("templates")
    .update({ status: parsed.data.status })
    .eq("slug", params.slug)
    .select("slug, status, updated_at")
    .maybeSingle();

  if (error) {
    console.error("[admin/templates] update gagal:", error.message);
    return NextResponse.json({ error: "Gagal menyimpan status" }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json(
      { error: "Template belum ada di database. Jalankan supabase/seed.sql lebih dulu." },
      { status: 404 }
    );
  }

  return NextResponse.json({ data });
}
