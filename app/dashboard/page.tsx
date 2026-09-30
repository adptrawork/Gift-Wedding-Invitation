import { createClient } from "@/lib/supabase/server";
import { listPublishedTemplates } from "@/lib/templates-db";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: rows } = user
    ? await supabase
        .from("weddings")
        .select("id, slug, title, status, published_at, updated_at, templates(slug, name)")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
    : { data: [] as unknown[] };

  const weddings = (rows ?? []) as Array<{
    id: string;
    slug: string;
    title: string;
    status: string;
    published_at: string | null;
    updated_at: string;
    templates: { slug: string; name: string } | null;
  }>;

  const templates = await listPublishedTemplates();

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <p className="mt-2 text-sm opacity-60">
        {user?.email ?? "Anda belum login."}
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <a
          href="/dashboard/wedding/create"
          className="rounded-lg bg-black px-4 py-2 text-sm text-white"
        >
          + Buat Undangan
        </a>
        <a href="/dashboard/billing" className="rounded-lg border px-4 py-2 text-sm">
          Billing
        </a>
      </div>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">Undangan Anda</h2>

        {weddings.length === 0 ? (
          <div className="mt-4 rounded-2xl border p-6 text-sm opacity-80">
            <p>Belum ada undangan.</p>
            <p className="mt-2">
              Mulai dari{" "}
              <a className="underline" href="/dashboard/wedding/create">
                halaman buat undangan
              </a>
              , atau lihat contoh template:
            </p>
            <ul className="mt-2 list-disc pl-5">
              {templates.map((t) => (
                <li key={t.slug}>
                  <a className="underline" href={`/demo-${t.slug}`}>
                    demo-{t.slug}
                  </a>{" "}
                  — {t.name}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="mt-4 grid gap-3">
            {weddings.map((w) => (
              <article
                key={w.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-5"
              >
                <div>
                  <h3 className="text-lg font-semibold">{w.title}</h3>
                  <p className="text-sm opacity-60">
                    /{w.slug} · {w.templates?.name ?? "—"} ·{" "}
                    <span className={w.status === "published" ? "text-green-700" : ""}>
                      {w.status}
                    </span>
                    {w.published_at
                      ? ` · live ${new Date(w.published_at).toLocaleDateString("id-ID")}`
                      : ""}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <a
                    href={`/dashboard/wedding/${w.id}/edit`}
                    className="rounded-lg bg-black px-3 py-1.5 text-xs text-white"
                  >
                    Edit
                  </a>
                  <a
                    href={`/dashboard/wedding/${w.id}/preview`}
                    className="rounded-lg border px-3 py-1.5 text-xs"
                  >
                    Preview
                  </a>
                  {w.status === "published" ? (
                    <a
                      href={`/${w.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg border px-3 py-1.5 text-xs"
                    >
                      Live ↗
                    </a>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
