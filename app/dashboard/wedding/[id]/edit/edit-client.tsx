"use client";

import { useMemo, useState } from "react";
import { FormRenderer } from "@/components/form-builder/FormRenderer";
import { TemplateRenderer } from "@/components/template-renderer";
import { getSchema, getTemplate } from "@/lib/templates";
import { schemaDefaults } from "@/lib/schema";
import { DEMO_GIFT, DEMO_WEDDING } from "@/lib/demo-data";

interface Wedding {
  id: string;
  title: string;
  slug: string;
  status: string;
  published_at: string | null;
  draft_content: Record<string, unknown> | null;
  content: Record<string, unknown> | null;
  templates: { slug: string; name?: string } | null;
}

type Status = { kind: "idle" } | { kind: "busy" } | { kind: "ok"; text: string } | { kind: "err"; text: string };

export default function EditClient({ wedding }: { wedding: Wedding }) {
  const tpl = wedding.templates?.slug ?? "luxury-gold";
  const schema = useMemo(() => getSchema(tpl), [tpl]);

  // Editor SELALU bekerja pada draft. `content` (snapshot publik) tidak pernah
  // disentuh di sini — hanya /publish yang menyalinnya.
  const [title, setTitle] = useState(wedding.title);
  const [content, setContent] = useState<Record<string, unknown>>(
    () =>
      ({
        ...schemaDefaults(schema?.properties ?? {}),
        ...(wedding.draft_content ?? wedding.content ?? {}),
      }) as Record<string, unknown>
  );
  const [showErrors, setShowErrors] = useState(false);
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const busy = status.kind === "busy";

  async function saveDraft(): Promise<boolean> {
    setStatus({ kind: "busy" });
    try {
      const res = await fetch(`/api/weddings/${wedding.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim() || "Undangan Baru", draft_content: content }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        setStatus({ kind: "err", text: `Gagal menyimpan: ${json.error ?? res.status}` });
        return false;
      }
      setStatus({ kind: "ok", text: "Draft tersimpan." });
      return true;
    } catch {
      setStatus({ kind: "err", text: "Koneksi bermasalah." });
      return false;
    }
  }

  async function publish() {
    // Publish selalu lewat simpan-draft dulu supaya tidak ada perubahan yang
    // tertinggal di browser tapi belum tersimpan.
    setShowErrors(true);
    const saved = await saveDraft();
    if (!saved) return;

    setStatus({ kind: "busy" });
    try {
      const res = await fetch(`/api/weddings/${wedding.id}/publish`, { method: "POST" });
      const json = (await res.json()) as { error?: string; fields?: string[]; url?: string };
      if (!res.ok) {
        const fields = json.fields?.length ? ` (${json.fields.join(", ")})` : "";
        setStatus({ kind: "err", text: `Gagal publish: ${json.error ?? res.status}${fields}` });
        return;
      }
      setStatus({ kind: "ok", text: `Published! ${wedding.status === "published" ? "Perubahan sudah live." : json.url ?? ""}` });
    } catch {
      setStatus({ kind: "err", text: "Koneksi bermasalah." });
    }
  }

  function loadDemo() {
    const demo = getTemplate(tpl)?.category === "gift" ? DEMO_GIFT : DEMO_WEDDING;
    setContent({ ...schemaDefaults(schema?.properties ?? {}), ...demo } as Record<string, unknown>);
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Edit: {wedding.title}</h1>
          <p className="text-sm opacity-60">
            /{wedding.slug} • <span className="font-mono">{tpl}</span> •{" "}
            <span className={wedding.status === "published" ? "text-green-700" : ""}>
              {wedding.status}
            </span>
            {wedding.published_at ? ` (live ${new Date(wedding.published_at).toLocaleDateString("id-ID")})` : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={loadDemo}
          className="rounded-lg border px-3 py-1.5 text-xs hover:bg-neutral-50"
        >
          Isi contoh
        </button>
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="w-title">
            Judul
          </label>
          <input
            id="w-title"
            className="w-full max-w-md rounded-lg border px-3 py-2"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <h2 className="mb-3 mt-6 font-semibold">Isi data (dari schema.json)</h2>
          {schema ? (
            <FormRenderer
              schema={schema}
              value={content}
              onChange={setContent}
              context={{ weddingId: wedding.id }}
              showErrors={showErrors}
            />
          ) : (
            <p className="text-sm opacity-60">Schema template tidak ditemukan.</p>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={saveDraft}
              disabled={busy}
              className="rounded-lg bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
            >
              {busy ? "Menyimpan…" : "Simpan Draft"}
            </button>
            <button
              type="button"
              onClick={publish}
              disabled={busy}
              className="rounded-lg border px-4 py-2 text-sm disabled:opacity-50"
            >
              Publish
            </button>
            <a
              href={`/dashboard/wedding/${wedding.id}/preview`}
              className="rounded-lg border px-4 py-2 text-sm"
            >
              Preview
            </a>
            {wedding.status === "published" ? (
              <a
                href={`/${wedding.slug}`}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg border px-4 py-2 text-sm"
              >
                Lihat live ↗
              </a>
            ) : null}
          </div>

          {status.kind === "ok" ? <p className="mt-2 text-sm text-green-700">{status.text}</p> : null}
          {status.kind === "err" ? <p className="mt-2 text-sm text-red-600">{status.text}</p> : null}
          <p className="mt-3 text-xs opacity-60">
            Edit hanya mengubah draft. Halaman publik baru berubah setelah Publish.
          </p>
        </div>

        <div>
          <h2 className="mb-3 font-semibold">Preview draft</h2>
          <div className="overflow-hidden rounded-2xl border">
            <TemplateRenderer templateSlug={tpl} data={content} />
          </div>
        </div>
      </div>
    </main>
  );
}
