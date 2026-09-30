"use client";

import { useMemo } from "react";
import type { SchemaField } from "@/lib/types";
import { mergeWithDefaults, validateContent } from "@/lib/schema";
import { FieldRenderer } from "./FieldRenderer";
import type { FieldContext } from "./types";

export interface FormRendererProps {
  schema: { properties: Record<string, SchemaField> };
  value: Record<string, unknown>;
  onChange: (value: Record<string, unknown>) => void;
  context?: FieldContext;
  /** Tampilkan penanda pada field wajib yang belum terisi. */
  showErrors?: boolean;
}

/**
 * Form generik yang dibangun dari `schema.json`.
 *
 * Sengaja TIDAK menyimpan state sendiri: `value` adalah sumber kebenaran dan
 * dikontrol penuh oleh parent. Versi sebelumnya punya `draft` internal yang
 * tidak pernah disinkronkan, sehingga mengganti template tidak mereset form dan
 * ketikan berikutnya menimpa data baru.
 */
export function FormRenderer({
  schema,
  value,
  onChange,
  context,
  showErrors = false,
}: FormRendererProps) {
  // Default schema jadi lapisan dasar supaya object selalu ada — template
  // boleh aman akses `data.groom.name`.
  const resolved = useMemo(
    () => mergeWithDefaults(schema.properties, value ?? {}),
    [schema, value]
  );

  // Hanya hitung ulang kalau showErrors berubah; validateContent cukup mahal
  // untuk form besar.
  const missing = useMemo(
    () =>
      showErrors
        ? new Set(validateContent(schema.properties, resolved))
        : new Set<string>(),
    [schema, resolved, showErrors]
  );

  return (
    <div className="grid gap-6">
      {Object.entries(schema.properties).map(([key, field]) => (
        <FieldRenderer
          key={key}
          name={key}
          field={field}
          value={resolved[key]}
          parentRequired={field.required}
          context={context}
          path={[key]}
          missing={missing}
          onChange={(v) => onChange({ ...resolved, [key]: v })}
        />
      ))}
    </div>
  );
}
