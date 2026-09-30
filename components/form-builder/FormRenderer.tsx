"use client";

import { useState } from "react";
import type { SchemaField } from "@/lib/types";

function get(obj: Record<string, unknown>, path: string[]): unknown {
  return path.reduce<unknown>((acc, key) => {
    if (typeof acc === "object" && acc !== null) return (acc as Record<string, unknown>)[key];
    return undefined;
  }, obj);
}

function set(obj: Record<string, unknown>, path: string[], value: unknown): Record<string, unknown> {
  const next: Record<string, unknown> = Array.isArray(obj) ? [...(obj as unknown[])] as unknown as Record<string, unknown> : { ...obj };
  let cur = next;
  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i];
    const child = cur[key];
    const clone = typeof child === "object" && child !== null ? { ...(child as Record<string, unknown>) } : {};
    cur[key] = clone;
    cur = clone;
  }
  cur[path[path.length - 1]] = value;
  return next;
}

export function FieldRenderer({
  name,
  field,
  value,
  onChange,
  path = [],
}: {
  name: string;
  field: SchemaField;
  value: unknown;
  onChange: (v: unknown) => void;
  path?: string[];
}) {
  const label = field.title ?? name;
  const fullPath = [...path, name].join(".");

  if (field.type === "object" && field.properties) {
    const obj = (value as Record<string, unknown>) ?? {};
    return (
      <fieldset className="rounded-xl border p-4">
        <legend className="px-2 font-semibold">{label}</legend>
        <div className="grid gap-4">
          {Object.entries(field.properties).map(([key, sub]) => (
            <FieldRenderer
              key={key}
              name={key}
              field={sub}
              value={obj[key]}
              onChange={(v) => onChange({ ...obj, [key]: v })}
              path={[...path, name]}
            />
          ))}
        </div>
      </fieldset>
    );
  }

  if (field.type === "array") {
    const arr = Array.isArray(value) ? (value as unknown[]) : [];
    return (
      <div className="grid gap-2">
        <label className="font-medium">{label}</label>
        {arr.map((item, i) => (
          <div key={i} className="flex gap-2">
            <input
              className="w-full rounded-lg border px-3 py-2"
              placeholder={`${fullPath}[${i}] — URL gambar`}
              value={String(item ?? "")}
              onChange={(e) => {
                const next = [...arr];
                next[i] = e.target.value;
                onChange(next);
              }}
            />
            <button
              type="button"
              className="rounded-lg border px-3"
              onClick={() => onChange(arr.filter((_, j) => j !== i))}
            >
              ✕
            </button>
          </div>
        ))}
        <button
          type="button"
          className="w-fit rounded-lg border px-3 py-1.5 text-sm"
          onClick={() => onChange([...arr, ""])}
        >
          + Tambah
        </button>
        {field.description ? <p className="text-xs opacity-60">{field.description}</p> : null}
      </div>
    );
  }

  if (field.type === "textarea" || field.type === "richtext") {
    return (
      <div className="grid gap-1">
        <label className="font-medium">{label}</label>
        <textarea
          className="min-h-24 rounded-lg border px-3 py-2"
          value={String(value ?? field.default ?? "")}
          onChange={(e) => onChange(e.target.value)}
        />
        {field.description ? <p className="text-xs opacity-60">{field.description}</p> : null}
      </div>
    );
  }

  if (field.type === "date") {
    return (
      <div className="grid gap-1">
        <label className="font-medium">{label}</label>
        <input
          type="date"
          className="rounded-lg border px-3 py-2"
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    );
  }

  if (field.type === "color") {
    return (
      <div className="grid gap-1">
        <label className="font-medium">{label}</label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={String(value ?? field.default ?? "#000000")}
            onChange={(e) => onChange(e.target.value)}
          />
          <input
            className="rounded-lg border px-3 py-1.5 text-sm"
            value={String(value ?? field.default ?? "")}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      </div>
    );
  }

  if (field.type === "image" || field.type === "audio") {
    return (
      <div className="grid gap-1">
        <label className="font-medium">{label}</label>
        <input
          className="w-full rounded-lg border px-3 py-2"
          placeholder={field.type === "image" ? "URL gambar / path Storage" : "URL audio"}
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
        />
        <p className="text-xs opacity-60">Upload file via API /api/media (US-005) — temp: isi URL dulu.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-1">
      <label className="font-medium">{label}</label>
      <input
        className="rounded-lg border px-3 py-2"
        value={String(value ?? field.default ?? "")}
        onChange={(e) => onChange(e.target.value)}
      />
      {field.description ? <p className="text-xs opacity-60">{field.description}</p> : null}
    </div>
  );
}

export function FormRenderer({
  schema,
  value,
  onChange,
}: {
  schema: { properties: Record<string, SchemaField> };
  value: Record<string, unknown>;
  onChange: (v: Record<string, unknown>) => void;
}) {
  const [draft, setDraft] = useState(value);
  const update = (next: Record<string, unknown>) => {
    setDraft(next);
    onChange(next);
  };
  return (
    <div className="grid gap-6">
      {Object.entries(schema.properties).map(([key, field]) => (
        <FieldRenderer
          key={key}
          name={key}
          field={field}
          value={get(draft, [key])}
          onChange={(v) => update(set(draft, [key], v))}
        />
      ))}
    </div>
  );
}
