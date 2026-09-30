import { createClient } from "./supabase/server";
import { allTemplates } from "./templates";
import type { PublishedTemplate } from "./types";

/**
 * Lapisan baca status template.
 *
 * Status published/unpublished hidup di DB (sumber kebenaran), bukan di
 * template.json. File Git hanya membawa identitas.
 *
 * Perilaku saat DB tidak terkonfigurasi / error: fallback ke seluruh template
 * di build. Ini disengaja untuk halaman publik — lebih baik menampilkan
 * katalog daripada 500 karena Supabase sedang tidak bisa dijangkau.
 */

function supabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith("http") &&
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  );
}

// Definisi tipe ada di lib/types.ts supaya client component bisa mengimpor
// tipe ini tanpa menarik modul yang mengimpor Supabase server client.

export async function listPublishedTemplates(category?: string): Promise<PublishedTemplate[]> {
  let slugs: Set<string> | null = null;

  if (supabaseConfigured()) {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("templates")
        .select("slug, current_version")
        .eq("status", "published");

      if (error) throw error;
      slugs = new Set((data ?? []).map((r) => r.slug as string));
    } catch (err) {
      console.warn("[templates] gagal membaca status dari DB, fallback ke build:", err);
    }
  }

  const rows: PublishedTemplate[] = allTemplates()
    .filter((t) => (slugs ? slugs.has(t.slug) : true))
    .map((t) => ({ ...t, current_version: t.version, status: "published" as const }));

  return category && category !== "all" ? rows.filter((t) => t.category === category) : rows;
}

// Catatan: `prepareTemplateData` sengaja TIDAK diekspor dari sini karena modul
// ini mengimpor Supabase server client. Versi murni ada di lib/template-data.ts
// supaya client component bisa memakainya tanpa menarik `next/headers`.
