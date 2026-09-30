export type TemplateCategory = "wedding" | "gift";

export interface TemplateManifest {
  id: string;
  name: string;
  slug: string;
  version: string;
  description: string;
  category: TemplateCategory;
  preview: string;
  thumbnail: string;
  author: { name: string };
  features: string[];
  engine: { type: "react"; version: string };
  animations: { gsap: boolean; lenis: boolean; three: boolean };
  status: "draft" | "published";
}

export type WeddingStatus = "draft" | "published";

/**
 * Template yang lolos filter status publish.
 *
 * `status` di sini sudah dinormalisasi ke "published" karena baris DB adalah
 * sumber kebenaran; `version` tetap diambil dari manifest Git.
 */
export interface PublishedTemplate extends TemplateManifest {
  /** Version yang dipakai customer baru. */
  current_version: string;
}

/**
 * Baris `weddings` sebagaimana dibaca lewat Supabase.
 *
 * Dua kolom konten punya peran berbeda dan tidak boleh tertukar:
 *  - `draft_content` — yang sedang diedit customer (halaman edit & preview)
 *  - `content`       — snapshot yang sudah di-publish (dibaca halaman publik)
 */
export interface Wedding {
  id: string;
  user_id: string;
  template_id: string | null;
  template_version_id: string | null;
  slug: string;
  title: string | null;
  draft_content: Record<string, unknown>;
  content: Record<string, unknown>;
  status: WeddingStatus;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

// JSON Schema ekstensi: selain tipe standar, dukung image/audio/color/richtext
export type ExtendedFieldType =
  | "string"
  | "textarea"
  | "richtext"
  | "date"
  | "time"
  | "url"
  | "image"
  | "audio"
  | "color"
  | "object"
  | "array";

export interface SchemaField {
  type: ExtendedFieldType | string;
  title?: string;
  description?: string;
  format?: string;
  items?: SchemaField;
  properties?: Record<string, SchemaField>;
  required?: string[];
  default?: unknown;
}
