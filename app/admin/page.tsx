import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function table(name: "profiles" | "orders" | "weddings") {
  const supabase = createClient();
  const { data } = await supabase.from(name).select("*").limit(50);
  return (data ?? []) as Record<string, unknown>[];
}

export default async function AdminOverview({ searchParams }: { searchParams: { t?: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if ((profile as { role: string } | null)?.role !== "admin") redirect("/dashboard");

  const t = (searchParams.t ?? "orders") as "profiles" | "orders" | "weddings";
  const rows = await table(t);
  const cols = rows.length > 0 ? Object.keys(rows[0]).slice(0, 6) : [];

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="text-3xl font-bold">Admin — Overview</h1>
      <div className="mt-4 flex gap-2 text-sm">
        {(["orders", "weddings", "profiles"] as const).map((k) => (
          <a key={k} href={`/admin?t=${k}`} className={`rounded-full border px-4 py-1.5 ${t === k ? "bg-black text-white" : ""}`}>{k}</a>
        ))}
        <a href="/admin/templates" className="rounded-full border px-4 py-1.5">templates</a>
      </div>
      <div className="mt-6 overflow-auto rounded-2xl border">
        <table className="w-full text-left text-xs">
          <thead><tr className="border-b">{cols.map((c) => <th key={c} className="px-3 py-2 font-mono">{c}</th>)}</tr></thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-b">{cols.map((c) => <td key={c} className="max-w-64 truncate px-3 py-2">{String(r[c] ?? "")}</td>)}</tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length === 0 ? <p className="mt-4 text-sm opacity-60">Kosong — hubungkan .env ke Supabase cloud lalu jalankan migrasi.</p> : null}
    </main>
  );
}
