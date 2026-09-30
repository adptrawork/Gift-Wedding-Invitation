"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { SchemaField, TemplateCategory } from "@/lib/types";
import type { PublishedTemplate } from "@/lib/types";
import { FormRenderer } from "@/components/form-builder/FormRenderer";
import { TemplateRenderer } from "@/components/template-renderer";
import { slugify } from "@/lib/slug";
import { getSchema } from "@/lib/templates";
import { schemaDefaults } from "@/lib/schema";
import { DEMO_WEDDING, DEMO_GIFT } from "@/lib/demo-data";

export default function CreateClient({ templates }: { templates: PublishedTemplate[] }) {
  const router = useRouter();
  const [tpl, setTpl] = useState(templates[0]?.slug ?? "luxury-gold");
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const manifest = templates.find((t) => t.slug === tpl);
  const schema = useMemo(() => getSchema(tpl), [tpl]);

  // Ganti template → reset konten ke default template baru, bukan sisa data
  // template lama (yang field-nya tidak sama).
  const [content, setContent] = useState<Record<string, unknown>>(() => {
    const g = manifest?.category === "gift" ? DEMO_GIFT : DEMO_WEDDING;
    return { ...schemaDefaults(schema?.properties ?? {}), ...g } as Record<string, unknown>;
  });

  function pickTemplate(slugValue: string) {
    const next = templates.find((t) => t.slug === slugValue);
    setTpl(slugValue);
    const s = getSchema(slugValue);
    const demo = next?.category === "gift" ? DEMO_GIFT : DEMO_WEDDING;
    setContent({ ...schemaDefaults(s?.properties ?? {}), ...demo } as Record<string, unknown>);
    setError("");
  }

  const effectiveSlug = slugTouched ? slug : slugify(title);

  async function save() {
    if (!manifest) return;
    setBusy(true);
    setError("");

    try {
      const res = await fetch("/api/weddings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim() || "Undangan Baru",
          template_slug: manifest.slug,
          slug: effectiveSlug || slugify(title) || `undangan-${Date.now()}`,
        }),
      });
      const json = (await res.json()) as { data?: { id: string }; error?: unknown };

      if (!res.ok || !json.data) {
        setError(
          typeof json.error === "string"
            ? json.error
            : `Gagal membuat undangan (HTTP ${res.status}).`
        );
        return;
      }

      // Seed draft_content dengan isi form sekarang supaya tidak perlu mengetik ulang.
      await fetch(`/api/weddings/${json.data.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim() || "Undangan Baru",
          draft_content: content as Record<string, SchemaField | unknown>,
        }),
      });

      router.push(`/dashboard/wedding/${json.data.id}/edit`);
    } catch {
      setError("Koneksi bermasalah. Coba lagi.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="text-3xl font-bold">Buat Undangan</h1>

      <section className="mt-6 grid gap-2">
        <label className="font-medium" htmlFor="tpl-group">
          1. Pilih template
        </label>
        <div id="tpl-group" className="flex flex-wrap gap-2">
          {templates.map((t) => (
            <button
              key={t.slug}
              type="button"
              onClick={() => pickTemplate(t.slug)}
              aria-pressed={tpl === t.slug}
              className={`rounded-full border px-4 py-1.5 text-sm ${
                tpl === t.slug ? "bg-black text-white" : ""
              }`}
            >
              {t.name}{" "}
              <span className="opacity-60">({t.category as TemplateCategory})</span>
            </button>
          ))}
        </div>
      </section>

      <section className="mt-6 grid gap-2">
        <label className="font-medium" htmlFor="title">
          2. Judul
        </label>
        <input
          id="title"
          className="max-w-md rounded-lg border px-3 py-2"
          value={title}
          placeholder="Contoh: Undangan Andi &amp; Sinta"
          onChange={(e) => {
            setTitle(e.target.value);
            if (!slugTouched) setSlug(slugify(e.target.value));
          }}
        />
        <label className="mt-2 font-medium" htmlFor="slug">
          Slug URL
        </label>
        <input
          id="slug"
          className="max-w-md rounded-lg border px-3 py-2 font-mono text-sm"
          value={effectiveSlug}
          placeholder="andi-sinta"
          onChange={(e) => {
            setSlugTouched(true);
            setSlug(slugify(e.target.value));
          }}
        />
        <p className="text-sm opacity-60">
          Live URL: <code>/{effectiveSlug || "slug-anda"}</code>
        </p>
      </section>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 font-semibold">3. Isi data (dari schema.json)</h2>
          {schema ? (
            <FormRenderer schema={schema} value={content} onChange={setContent} />
          ) : (
            <p className="text-sm opacity-60">Schema template tidak ditemukan.</p>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={save}
              disabled={busy}
              className="rounded-lg bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
            >
              {busy ? "Menyimpan…" : "Simpan & Lanjut Edit"}
            </button>
            <a
              href="/dashboard"
              className="rounded-lg border px-4 py-2 text-sm"
            >
              Batal
            </a>
          </div>
          {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
          <p className="mt-2 text-xs opacity-60">
            Publish dilakukan dari halaman edit — supaya data bisa ditinjau dulu lewat preview.
          </p>
        </div>

        <div>
          <h2 className="mb-3 font-semibold">Preview langsung</h2>
          <div className="overflow-hidden rounded-2xl border">
            <TemplateRenderer templateSlug={tpl} data={content} />
          </div>
        </div>
      </div>
    </main>
  );
}
