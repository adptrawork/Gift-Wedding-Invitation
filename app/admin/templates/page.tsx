import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { listTemplates } from "@/lib/templates";

export default async function AdminTemplatesPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if ((profile as { role: string } | null)?.role !== "admin") redirect("/dashboard");

  const templates = listTemplates("all");
  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="text-3xl font-bold">Admin — Templates</h1>
      <p className="mt-2 text-sm opacity-70">Kode via Git (trusted). Di sini atur publish/version (US-016 full CRUD menyusul).</p>
      <table className="mt-6 w-full text-left text-sm">
        <thead><tr className="border-b"><th className="py-2">Slug</th><th>Nama</th><th>Kategori</th><th>Versi</th><th>Status</th></tr></thead>
        <tbody>
          {templates.map((t) => (
            <tr key={t.slug} className="border-b">
              <td className="py-2 font-mono">{t.slug}</td>
              <td>{t.name}</td>
              <td>{t.category}</td>
              <td>{t.version}</td>
              <td>{t.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
