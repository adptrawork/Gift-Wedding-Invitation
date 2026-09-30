import { getSchema } from "./templates";
import { mergeWithDefaults } from "./schema";

/**
 * Siapkan `content` customer untuk render template.
 *
 * Modul ini SENGAJA bebas dari Supabase/`next/headers` supaya bisa dipakai
 * dari client component (`components/template-renderer.tsx`) maupun server
 * component. Pembacaan status publish dari DB ada di `lib/templates-db.ts`.
 *
 * Gunanya: isi field kosong dengan default schema, sehingga template boleh aman
 * melakukan `data.groom.name` walau `content` masih `{}` — tanpa optional
 * chaining di setiap template.
 */
export function prepareTemplateData(
  templateSlug: string,
  content: Record<string, unknown> | null | undefined
): Record<string, unknown> {
  const schema = getSchema(templateSlug);
  if (!schema) return content ?? {};
  return mergeWithDefaults(schema.properties, content ?? {});
}
