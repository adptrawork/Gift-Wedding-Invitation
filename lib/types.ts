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

export interface Wedding {
  id: string;
  user_id: string;
  template_id: string;
  template_version_id: string;
  template_slug: string;
  slug: string;
  title: string;
  content: Record<string, unknown>;
  status: WeddingStatus;
  published_at: string | null;
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
