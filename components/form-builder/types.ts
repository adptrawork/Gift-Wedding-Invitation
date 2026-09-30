import type { SchemaField } from "@/lib/types";

export interface FieldContext {
  /**
   * Id wedding. Kalau ada, field gambar/galeri/audio menampilkan tombol
   * upload; kalau belum (mis. sedang di form "create"), user hanya bisa
   * menempelkan URL.
   */
  weddingId?: string;
}

export interface FieldRendererProps {
  name: string;
  field: SchemaField;
  value: unknown;
  onChange: (value: unknown) => void;
  context?: FieldContext;
  /** Object induk, supaya field anak tahu `required` milik induknya. */
  parentRequired?: string[];
  /** Path lengkap field ini, mis. ["event", "date"]. */
  path?: string[];
  /** Path wajib yang masih kosong, hasilnya dari validateContent(). */
  missing?: ReadonlySet<string>;
}

export const inputClass =
  "w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 disabled:bg-neutral-50 disabled:text-neutral-400";

export const errorClass = "text-xs text-neutral-500";

export const invalidClass = "border-red-400 focus:border-red-500 focus:ring-red-500";

/** Apakah field ini ada di daftar yang belum terisi? */
export function isMissing(props: Pick<FieldRendererProps, "path" | "missing">): boolean {
  if (!props.missing || !props.path?.length) return false;
  return props.missing.has(props.path.join("."));
}
