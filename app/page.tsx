import { listTemplates } from "@/lib/templates";

export default function Home({
  searchParams,
}: {
  searchParams: { category?: string };
}) {
  const category = searchParams.category ?? "all";
  const templates = listTemplates(category);
  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="text-4xl font-bold">Pilih Template Undangan</h1>
      <p className="mt-2 opacity-70">
        Platform SaaS + Template Engine — Wedding & Gift. Form otomatis dari schema.json.
      </p>
      <div className="mt-6 flex gap-2 text-sm">
        {["all", "wedding", "gift"].map((c) => (
          <a
            key={c}
            href={c === "all" ? "/" : `/?category=${c}`}
            className={`rounded-full border px-4 py-1.5 ${category === c ? "bg-black text-white" : ""}`}
          >
            {c === "all" ? "Semua" : c === "wedding" ? "Wedding" : "Gift"}
          </a>
        ))}
      </div>
      <div className="mt-8 grid gap-6 md:grid-cols-3">
        {templates.map((t) => (
          <article key={t.slug} className="rounded-2xl border p-5">
            <div className="flex aspect-video items-center justify-center rounded-xl bg-neutral-100 text-4xl">
              {t.category === "wedding" ? "💒" : "🎁"}
            </div>
            <h2 className="mt-4 text-xl font-semibold">{t.name}</h2>
            <p className="text-sm opacity-70">{t.description}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs">{t.category}</span>
              {t.features.map((f) => (
                <span key={f} className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs">{f}</span>
              ))}
            </div>
            <a
              href={`/dashboard/wedding/create?template=${t.slug}`}
              className="mt-4 inline-block rounded-lg bg-black px-4 py-2 text-sm text-white"
            >
              Gunakan Template
            </a>
          </article>
        ))}
      </div>
      {templates.length === 0 ? <p className="mt-8 opacity-60">Belum ada template published.</p> : null}
      <section className="mt-16 rounded-2xl border p-6 text-sm opacity-80">
        <h2 className="font-semibold">Cara jalan lokal (DDEV)</h2>
        <pre className="mt-2 overflow-auto rounded-lg bg-neutral-950 p-4 text-neutral-100">
{`cp .env.example .env
ddev start
ddev npm install
ddev npm run dev   # https://gift-wedding.ddev.site:3001`}
        </pre>
      </section>
    </main>
  );
}
