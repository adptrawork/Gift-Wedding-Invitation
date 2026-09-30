import type { SchemaField } from "./types";

/**
 * Utilitas untuk schema.json template.
 *
 * Dipakai di tiga tempat:
 *  - form builder  → `schemaDefaults` (placeholder awal form)
 *  - publish       → `validateContent` (field wajib terisi)
 *  - halaman publik→ `mergeWithDefaults` (content kosong tidak boleh 500)
 */

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Nilai object tempat `default` diambil, mis. { a: 1 } untuk string. */
function coerceDefault(field: SchemaField, raw: unknown): unknown {
  if (field.type === "string" || field.type === "textarea" || field.type === "richtext" ||
      field.type === "url" || field.type === "date" || field.type === "time" ||
      field.type === "image" || field.type === "audio" || field.type === "color") {
    return raw === undefined || raw === null ? "" : String(raw);
  }
  if (field.type === "object") return isPlainObject(raw) ? raw : {};
  if (field.type === "array") return Array.isArray(raw) ? raw : [];
  return raw;
}

/**
 * Object dengan nilai `default` dari schema.
 * Dipakai agar form baru dibuka dengan isi yang masuk akal, bukan string kosong.
 */
export function schemaDefaults(properties: Record<string, SchemaField>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, field] of Object.entries(properties)) {
    if (field.default !== undefined) {
      out[key] = coerceDefault(field, field.default);
    } else if (field.type === "object" && field.properties) {
      out[key] = schemaDefaults(field.properties);
    } else if (field.type === "array") {
      out[key] = [];
    }
  }
  return out;
}

/**
 * Deep-merge data customer di atas default schema.
 *
 * Ini yang mencegah halaman publik crash: template boleh aman akses
 * `data.groom.name` karena `groom` selalu ada sebagai object, walau row
 * `content` masih `{}`.
 */
export function mergeWithDefaults(
  properties: Record<string, SchemaField>,
  data: Record<string, unknown>
): Record<string, unknown> {
  const base = schemaDefaults(properties);
  const out: Record<string, unknown> = { ...base };

  for (const [key, field] of Object.entries(properties)) {
    const incoming = data?.[key];

    if (incoming === undefined || incoming === null) continue;

    if (field.type === "object" && field.properties) {
      out[key] = isPlainObject(incoming)
        ? mergeWithDefaults(field.properties, incoming)
        : out[key];
    } else {
      out[key] = incoming;
    }
  }

  // Pertahankan key yang tidak dikenal di schema (mis. field kustom /
  // data hasil migrasi), supaya tidak hilang diam-diam.
  for (const [key, value] of Object.entries(data ?? {})) {
    if (!(key in properties)) out[key] = value;
  }

  return out;
}

function isBlank(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

/**
 * Validasi content terhadap `required` di schema.
 * Mengembalikan daftar path yang kosong, mis. ["groom.name", "event.date"].
 */
export function validateContent(
  properties: Record<string, SchemaField>,
  data: Record<string, unknown>,
  prefix: string[] = []
): string[] {
  const errors: string[] = [];

  for (const [key, field] of Object.entries(properties)) {
    const path = [...prefix, key];
    const value = data?.[key];

    if (field.required?.includes(key) && isBlank(value)) {
      errors.push(path.join("."));
      continue;
    }

    if (field.type === "object" && field.properties && isPlainObject(value)) {
      errors.push(...validateContent(field.properties, value, path));
    }
  }

  return errors;
}
