import { redirect } from "next/navigation";
import { TemplateRenderer } from "@/components/template-renderer";
import { createClient } from "@/lib/supabase/server";

export default async function PreviewPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: wedding } = await supabase
    .from("weddings")
    .select("content, templates(slug)")
    .eq("id", params.id)
    .maybeSingle();
  if (!wedding) redirect("/dashboard");
  const w = wedding as unknown as { content: Record<string, unknown>; templates: { slug: string } | null };
  return <TemplateRenderer templateSlug={w.templates?.slug ?? "luxury-gold"} data={w.content} />;
}
