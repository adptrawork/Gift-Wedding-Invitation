import { NextResponse } from "next/server";
import { getSchema, getTemplate } from "@/lib/templates";
import { listPublishedTemplates } from "@/lib/templates-db";

/**
 * GET /api/templates/[slug] — manifest + schema untuk build form.
 *
 * Schema dibaca dari registry Git, bukan dari DB: form generator harus selalu
 * cocok dengan komponen template yang benar-benar ter-deploy.
 */
export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const manifest = getTemplate(params.slug);
  if (!manifest) return NextResponse.json({ error: "Template tidak ditemukan" }, { status: 404 });

  // Kalau template di-unpublish, tetap bisa diambil lewat slug supaya preview
  // admin dan undangan yang sudah live tidak ikut error.
  const published = await listPublishedTemplates();

  return NextResponse.json({
    manifest,
    schema: getSchema(params.slug) ?? null,
    published: published.some((t) => t.slug === params.slug),
  });
}
