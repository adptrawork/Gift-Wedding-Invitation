"use client";

import { useMemo, useState } from "react";
import { listTemplates } from "@/lib/templates";
import { FormRenderer } from "@/components/form-builder/FormRenderer";
import { TemplateRenderer } from "@/components/template-renderer";
import { slugify } from "@/lib/slug";
import luxurySchema from "@/templates/luxury-gold/schema.json";
import romanticSchema from "@/templates/romantic-garden/schema.json";
import minimalSchema from "@/templates/modern-minimal/schema.json";
import weddingGiftSchema from "@/templates/wedding-gift/schema.json";
import birthdayGiftSchema from "@/templates/birthday-gift/schema.json";
import { DEMO_WEDDING, DEMO_GIFT } from "@/lib/demo-data";

const SCHEMAS: Record<string, { properties: Record<string, never> } & Record<string, unknown>> = {
  "luxury-gold": luxurySchema as never,
  "romantic-garden": romanticSchema as never,
  "modern-minimal": minimalSchema as never,
  "wedding-gift": weddingGiftSchema as never,
  "birthday-gift": birthdayGiftSchema as never,
};

export default function CreatePage({
  searchParams,
}: {
  searchParams: { template?: string };
}) {
  const templates = useMemo(() => listTemplates(), []);
  const [tpl, setTpl] = useState(searchParams.template ?? "luxury-gold");
  const [title, setTitle] = useState("Andi & Sinta");
  const manifest = templates.find((t) => t.slug === tpl);
  const isGift = manifest?.category === "gift";
  const [content, setContent] = useState<Record<string, unknown>>(
    (isGift ? DEMO_GIFT : DEMO_WEDDING) as Record<string, unknown>
  );
  const schema = SCHEMAS[tpl] ?? SCHEMAS["luxury-gold"];
  const slug = slugify(title);

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="text-3xl font-bold">Buat Wedding / Gift</h1>
      <div className="mt-6 grid gap-2">
        <label className="font-medium">1. Pilih template</label>
        <div className="flex flex-wrap gap-2">
          {templates.map((t) => (
            <button
              key={t.slug}
              onClick={() => {
                setTpl(t.slug);
                setContent((t.category === "gift" ? DEMO_GIFT : DEMO_WEDDING) as Record<string, unknown>);
              }}
              className={`rounded-full border px-4 py-1.5 text-sm ${tpl === t.slug ? "bg-black text-white" : ""}`}
            >
              {t.name} ({t.category})
            </button>
          ))}
        </div>
      </div>
      <div className="mt-6 grid gap-2">
        <label className="font-medium">2. Judul & slug</label>
        <input
          className="max-w-md rounded-lg border px-3 py-2"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <p className="text-sm opacity-60">Live URL: <code>/{slug || "slug-anda"}</code></p>
      </div>
      <div className="mt-6 grid gap-8 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 font-semibold">3. Isi data (dari schema.json)</h2>
          <FormRenderer schema={schema as never} value={content} onChange={setContent} />
          <div className="mt-4 flex gap-2">
            <button className="rounded-lg bg-black px-4 py-2 text-sm text-white">Save Draft</button>
            <button className="rounded-lg border px-4 py-2 text-sm">Publish</button>
          </div>
          <p className="mt-2 text-xs opacity-60">Save/Publish ke Supabase aktif setelah US-011/012 (butuh login + env).</p>
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
