import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { TemplateRenderer } from "@/components/template-renderer";
import { DEMO_WEDDING, DEMO_GIFT } from "@/lib/demo-data";
import { getTemplate } from "@/lib/templates";
import { prepareTemplateData } from "@/lib/template-data";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

interface WeddingRow {
  id: string;
  slug: string;
  title: string | null;
  content: Record<string, unknown> | null;
  templates: { slug: string } | null;
}

function supabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith("http") &&
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  );
}

/**
 * Undangan publik, hanya untuk wedding yang sudah published.
 *
 * `slug` selalu berasal dari path. Untuk domain custom / subdomain,
 * `middleware.ts` sudah me-rewrite host ke path, jadi tidak ada pencarian slug
 * kedua di sini.
 */
async function findWedding(slug: string): Promise<WeddingRow | null> {
  if (!supabaseConfigured()) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("weddings")
    .select("id, slug, title, content, templates(slug)")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error) {
    // Dicatat supaya outage kelihatan di log, tapi detailnya tidak dibocorkan
    // ke tamu.
    console.error(`[public/${slug}] query gagal:`, error.message);
    return null;
  }

  return (data as unknown as WeddingRow) ?? null;
}

/**
 * Undangan publik.
 *
 * Slug selalu datang dari path: middleware sudah me-rewrite
 * `andi-sinta.platform.com/whatever` → `/andi-sinta/whatever`, jadi
 * `params.slug` adalah satu-satunya sumber kebenaran di sini.
 */
export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const row = await findWedding(params.slug);
  const isDemo = params.slug.startsWith("demo-");

  return {
    title: row?.title ?? (isDemo ? getTemplate(params.slug.slice(5))?.name : undefined) ?? "Undangan Digital",
    // Halaman demo bukan undangan sungguhan, dan slug yang tidak ada akan
    // berakhir di notFound() — keduanya tidak boleh masuk indeks.
    robots: row ? { index: true, follow: true } : { index: false, follow: false },
  };
}

export default async function PublicSlugPage({ params }: { params: { slug: string } }) {
  const { slug } = params;

  const row = await findWedding(slug);
  if (row?.templates?.slug) {
    // Defaults dari schema di-merge di sini: template boleh aman akses
    // data.groom.name walau content masih sparse.
    return (
      <TemplateRenderer
        templateSlug={row.templates.slug}
        data={prepareTemplateData(row.templates.slug, row.content)}
        weddingId={row.id}
      />
    );
  }

  // Fallback demo supaya template bisa dilihat tanpa setup Supabase.
  if (params.slug.startsWith("demo-")) {
    const templateSlug = params.slug.slice("demo-".length);
    const manifest = getTemplate(templateSlug);
    if (manifest) {
      const demo = manifest.category === "gift" ? DEMO_GIFT : DEMO_WEDDING;
      return <TemplateRenderer templateSlug={templateSlug} data={demo as Record<string, unknown>} />;
    }
  }

  notFound();
}
