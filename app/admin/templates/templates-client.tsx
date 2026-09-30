"use client";

import { useState } from "react";

interface Row {
  slug: string;
  name: string;
  category: string;
  gitVersion: string;
  db: { status: string; current_version: string; updated_at: string | null } | null;
}

export default function TemplatesClient({ templates }: { templates: Row[] }) {
  const [status, setStatus] = useState<Record<string, string>>(() =>
    Object.fromEntries(templates.map((t) => [t.slug, t.db?.status ?? "unknown"]))
  );
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  async function toggle(slug: string) {
    const next = status[slug] === "published" ? "draft" : "published";
    setBusy(slug);
    setMsg("");
    try {
      const res = await fetch(`/api/admin/templates/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        setMsg(`${slug}: ${json.error ?? "gagal"}`);
        return;
      }
      setStatus((s) => ({ ...s, [slug]: next }));
      setMsg(`${slug} → ${next}`);
    } catch {
      setMsg(`${slug}: koneksi bermasalah`);
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <table className="mt-6 w-full text-left text-sm">
        <thead>
          <tr className="border-b">
            <th className="py-2">Slug</th>
            <th>Nama</th>
            <th>Kategori</th>
            <th>Versi (Git)</th>
            <th>Versi (DB)</th>
            <th>Status</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {templates.map((t) => (
            <tr key={t.slug} className="border-b">
              <td className="py-2 font-mono">{t.slug}</td>
              <td>{t.name}</td>
              <td>{t.category}</td>
              <td className="font-mono text-xs">{t.gitVersion}</td>
              <td className="font-mono text-xs">{t.db?.current_version ?? "—"}</td>
              <td>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs ${
                    status[t.slug] === "published"
                      ? "bg-green-100 text-green-800"
                      : "bg-neutral-100 text-neutral-700"
                  }`}
                >
                  {status[t.slug]}
                </span>
              </td>
              <td>
                <button
                  onClick={() => toggle(t.slug)}
                  disabled={busy === t.slug || !t.db}
                  title={t.db ? undefined : "Belum ada di DB — jalankan supabase/seed.sql"}
                  className="rounded-lg border px-3 py-1 text-xs hover:bg-neutral-50 disabled:opacity-40"
                >
                  {busy === t.slug
                    ? "…"
                    : status[t.slug] === "published"
                      ? "Unpublish"
                      : "Publish"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {msg ? <p className="mt-3 text-sm opacity-70">{msg}</p> : null}
    </>
  );
}
