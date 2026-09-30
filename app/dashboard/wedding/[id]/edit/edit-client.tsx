"use client";

import { useState } from "react";
import { FormRenderer } from "@/components/form-builder/FormRenderer";
import { TemplateRenderer } from "@/components/template-renderer";
import luxurySchema from "@/templates/luxury-gold/schema.json";
import romanticSchema from "@/templates/romantic-garden/schema.json";
import minimalSchema from "@/templates/modern-minimal/schema.json";
import weddingGiftSchema from "@/templates/wedding-gift/schema.json";
import birthdayGiftSchema from "@/templates/birthday-gift/schema.json";

const SCHEMAS: Record<string, { properties: Record<string, never> }> = {
  "luxury-gold": luxurySchema as never,
  "romantic-garden": romanticSchema as never,
  "modern-minimal": minimalSchema as never,
  "wedding-gift": weddingGiftSchema as never,
  "birthday-gift": birthdayGiftSchema as never,
};

interface Wedding {
  id: string;
  title: string;
  slug: string;
  status: string;
  content: Record<string, unknown>;
  templates: { slug: string } | null;
}

export default function EditClient({ wedding }: { wedding: Wedding }) {
  const tpl = wedding.templates?.slug ?? "luxury-gold";
  const [content, setContent] = useState(wedding.content ?? {});
  const [msg, setMsg] = useState("");

  const save = async (publish: boolean) => {
    setMsg("Menyimpan...");
    const res = await fetch(`/api/weddings/${wedding.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, ...(publish ? { status: "published" } : {}) }),
    });
    const json = await res.json();
    setMsg(res.ok ? (publish ? "Published! 🎉" : "Draft tersimpan ✓") : `Gagal: ${json.error}`);
  };

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="text-2xl font-bold">Edit: {wedding.title}</h1>
      <p className="text-sm opacity-60">/{wedding.slug} • {wedding.status} • template {tpl}</p>
      <div className="mt-6 grid gap-8 lg:grid-cols-2">
        <div>
          <FormRenderer schema={SCHEMAS[tpl] ?? SCHEMAS["luxury-gold"]} value={content} onChange={setContent} />
          <div className="mt-4 flex gap-2">
            <button onClick={() => save(false)} className="rounded-lg bg-black px-4 py-2 text-sm text-white">Save Draft</button>
            <button onClick={() => save(true)} className="rounded-lg border px-4 py-2 text-sm">Publish</button>
            <a href={`/dashboard/wedding/${wedding.id}/preview`} className="rounded-lg border px-4 py-2 text-sm">Preview</a>
          </div>
          {msg ? <p className="mt-2 text-sm opacity-70">{msg}</p> : null}
        </div>
        <div>
          <div className="overflow-hidden rounded-2xl border">
            <TemplateRenderer templateSlug={tpl} data={content} />
          </div>
        </div>
      </div>
    </main>
  );
}
