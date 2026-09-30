"use client";

import type { SchemaField } from "@/lib/types";
import {
  ColorField,
  DateField,
  TextField,
  TextareaField,
  TimeField,
  UrlField,
} from "./fields/basic-fields";
import { AudioField, GalleryField, ImageField, StringListField } from "./fields/media-fields";
import type { FieldContext, FieldRendererProps } from "./types";

/**
 * Memetakan `schema.json` → kontrol form.
 *
 * Menambah tipe field cukup menambah satu `case` di sini; tidak ada form
 * manual per template.
 */
export function FieldRenderer(props: FieldRendererProps) {
  const { field, context, path, missing, parentRequired } = props;
  const childPath = path ?? [props.name];

  switch (field.type) {
    case "object":
      return <ObjectField {...props} path={childPath} />;

    case "array":
      // Schema template memakai array-of-image (galeri). Array tipe lain
      // ditangani sebagai daftar input biasa.
      return field.items?.type === "image" || !field.items ? (
        <GalleryField {...props} path={childPath} missing={missing} />
      ) : (
        <StringListField {...props} path={childPath} />
      );

    case "textarea":
    case "richtext":
      return <TextareaField {...props} path={childPath} missing={missing} />;

    case "date":
      return <DateField {...props} path={childPath} missing={missing} />;

    case "time":
      return <TimeField {...props} path={childPath} />;

    case "url":
      return <UrlField {...props} path={childPath} missing={missing} />;

    case "color":
      return <ColorField {...props} path={childPath} />;

    case "image":
      return <ImageField {...props} path={childPath} missing={missing} />;

    case "audio":
    case "video":
      return <AudioField {...props} path={childPath} />;

    default:
      return <TextField {...props} path={childPath} missing={missing} />;
  }
}

function ObjectField({
  name,
  field,
  value,
  onChange,
  context,
  parentRequired,
  path,
  missing,
}: FieldRendererProps) {
  const obj = (value && typeof value === "object" ? value : {}) as Record<string, unknown>;
  const base = path ?? [name];

  return (
    <fieldset className="rounded-xl border border-neutral-200 p-4">
      <legend className="px-2 text-sm font-semibold">{field.title ?? name}</legend>
      <div className="grid gap-4">
        {Object.entries(field.properties ?? {}).map(([key, sub]) => (
          <FieldRenderer
            key={key}
            name={key}
            field={sub as SchemaField}
            value={obj[key]}
            parentRequired={field.required}
            context={context}
            path={[...base, key]}
            missing={missing}
            onChange={(v) => onChange({ ...obj, [key]: v })}
          />
        ))}
      </div>
    </fieldset>
  );
}

export type { FieldContext, FieldRendererProps };
