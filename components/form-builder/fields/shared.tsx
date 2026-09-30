"use client";

import { invalidClass, isMissing, type FieldRendererProps } from "../types";

/**
 * Kerangka label + penanda "wajib diisi" untuk semua tipe field.
 * Satu tempat menentukan tampilan error supaya konsisten.
 */
export function FieldFrame({
  props,
  label,
  required,
  htmlFor,
  description,
  children,
}: {
  props: FieldRendererProps;
  label: string;
  required?: boolean;
  htmlFor?: string;
  description?: string;
  children: React.ReactNode;
}) {
  const invalid = isMissing(props);

  return (
    <div className="grid gap-1.5">
      <label className="text-sm font-medium text-neutral-800" htmlFor={htmlFor}>
        {label}
        {required ? <span className="ml-1 text-red-600">*</span> : null}
      </label>
      {children}
      {invalid ? (
        <p className="text-xs text-red-600">Wajib diisi sebelum publish.</p>
      ) : description ? (
        <p className="text-xs text-neutral-500">{description}</p>
      ) : null}
    </div>
  );
}

/** Tambahkan gaya error bila field ini ada di daftar yang belum terisi. */
export function fieldClass(base: string, props: FieldRendererProps): string {
  return isMissing(props) ? `${base} ${invalidClass}` : base;
}

/** Id DOM yang stabil & unik per path field. */
export function fieldId(props: FieldRendererProps, fallback: string): string {
  return `f-${(props.path ?? [props.name ?? fallback]).join("-")}`;
}

export { isMissing };
export type { FieldRendererProps };
