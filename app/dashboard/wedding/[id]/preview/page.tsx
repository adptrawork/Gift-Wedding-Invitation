import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TemplateRenderer } from "@/components/template-renderer";
import { prepareTemplateData } from "@/lib/template-data";

export const dynamic = "force-dynamic";

/**
 * Preview.pratinjau SEBELUM publish.
 *
 * Membaca `draft_content` (bukan `content`) dan tetap memfilter `user_id`,
 * jadi hanya owner yang bisa melihat drafnya sebelum tayang.
 */
export default async function PreviewPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: wedding } = await supabase
    .from("weddings")
    .select("draft_content, templates(slug)")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!wedding) redirect("/dashboard");

  const row = wedding as unknown as {
    draft_content: Record<string, unknown> | null;
    templates: { slug: string } | null;
  };
  const templateSlug = row.templates?.slug ?? "luxury-gold";

  return (
    <>
      <div className="sticky top-0 z-50 flex items-center justify-between gap-3 border-b bg-white/90 px-4 py-2 text-sm backdrop-blur">
        <span className="font-medium">Preview draft — belum tayang di publik</span>
        <a
          href={`/dashboard/wedding/${params.id}/edit`}
          className="rounded-lg border px-3 py-1 text-xs hover:bg-neutral-50"
        >
          Kembali ke editor
        </a>
      </div>
      <TemplateRenderer
        templateSlug={templateSlug}
        data={prepareTemplateData(templateSlug, row.draft_content)}
        weddingId={params.id}
      />
    </>
  );
}
