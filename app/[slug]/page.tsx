import { notFound } from "next/navigation";
import { TemplateRenderer } from "@/components/template-renderer";
import { DEMO_WEDDING, DEMO_GIFT } from "@/lib/demo-data";
import { getTemplate } from "@/lib/templates";
import { createClient } from "@/lib/supabase/server";

interface Row {
  content: Record<string, unknown>;
  status: string;
  templates: { slug: string } | null;
}

export default async function PublicSlugPage({ params }: { params: { slug: string } }) {
  let row: Row | null = null;
  try {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith("http")) {
      const supabase = createClient();
      const { data } = await supabase
        .from("weddings")
        .select("content, status, templates(slug)")
        .eq("slug", params.slug)
        .eq("status", "published")
        .maybeSingle();
      if (data) row = data as unknown as Row;
    }
  } catch {
    row = null;
  }

  if (!row) {
    if (params.slug.startsWith("demo-")) {
      const tpl = params.slug.replace("demo-", "");
      const manifest = getTemplate(tpl);
      if (!manifest) return notFound();
      const demo = manifest.category === "gift" ? DEMO_GIFT : DEMO_WEDDING;
      return <TemplateRenderer templateSlug={tpl} data={demo as Record<string, unknown>} />;
    }
    return notFound();
  }

  const slug = row.templates?.slug ?? "luxury-gold";
  return <TemplateRenderer templateSlug={slug} data={row.content} />;
}
