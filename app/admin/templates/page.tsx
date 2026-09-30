import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { allTemplates } from "@/lib/templates";
import TemplatesClient from "./templates-client";

// Status template berasal dari DB, jadi render per-request.
export const dynamic = "force-dynamic";

export default async function AdminTemplatesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if ((profile as { role?: string } | null)?.role !== "admin") redirect("/dashboard");

  // Status operational dari DB; metadata build dari Git.
  const { data: rows } = await supabase
    .from("templates")
    .select("slug, status, current_version, updated_at");

  const bySlug = new Map(
    (rows ?? []).map((r) => [
      r.slug as string,
      {
        status: (r.status as string) ?? "draft",
        current_version: (r.current_version as string | null) ?? "—",
        updated_at: (r.updated_at as string | null) ?? null,
      },
    ])
  );

  const templates = allTemplates().map((t) => ({
    slug: t.slug,
    name: t.name,
    category: t.category,
    gitVersion: t.version,
    db: bySlug.get(t.slug) ?? null,
  }));

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="text-3xl font-bold">Admin — Templates</h1>
      <p className="mt-2 max-w-2xl text-sm opacity-70">
        Source code template selalu dari Git (trusted) — tidak ada upload kode dari dashboard demi
        keamanan. Halaman ini hanya mengatur status publish dan versi.
      </p>
      <TemplatesClient templates={templates} />
    </main>
  );
}
