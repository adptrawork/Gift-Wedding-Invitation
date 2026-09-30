"use client";

import { inputClass } from "../types";
import { FieldFrame, fieldClass, fieldId, type FieldRendererProps } from "./shared";

export function TextField(props: FieldRendererProps) {
  const { field, value, onChange, parentRequired } = props;
  const id = fieldId(props, "text");

  return (
    <FieldFrame
      props={props}
      label={field.title ?? "Kolom teks"}
      required={parentRequired?.includes(props.name ?? "")}
      htmlFor={id}
      description={typeof field.description === "string" ? field.description : undefined}
    >
      <input
        id={id}
        className={fieldClass(inputClass, props)}
        value={String(value ?? "")}
        placeholder={typeof field.default === "string" ? field.default : undefined}
        onChange={(e) => onChange(e.target.value)}
      />
    </FieldFrame>
  );
}

export function TextareaField(props: FieldRendererProps) {
  const { field, value, onChange, parentRequired } = props;
  const id = fieldId(props, "textarea");

  return (
    <FieldFrame
      props={props}
      label={field.title ?? "Kolom teks panjang"}
      required={parentRequired?.includes(props.name ?? "")}
      htmlFor={id}
      description={typeof field.description === "string" ? field.description : undefined}
    >
      <textarea
        id={id}
        className={`${fieldClass(inputClass, props)} min-h-24`}
        value={String(value ?? "")}
        onChange={(e) => onChange(e.target.value)}
      />
    </FieldFrame>
  );
}

export function DateField(props: FieldRendererProps) {
  const { field, value, onChange, parentRequired } = props;
  const id = fieldId(props, "date");

  return (
    <FieldFrame
      props={props}
      label={field.title ?? "Tanggal"}
      required={parentRequired?.includes(props.name ?? "")}
      htmlFor={id}
    >
      <input
        id={id}
        type="date"
        className={fieldClass(inputClass, props)}
        value={String(value ?? "")}
        onChange={(e) => onChange(e.target.value)}
      />
    </FieldFrame>
  );
}

export function TimeField(props: FieldRendererProps) {
  const { field, value, onChange } = props;
  const id = fieldId(props, "time");

  return (
    <FieldFrame props={props} label={field.title ?? "Waktu"} htmlFor={id}>
      <input
        id={id}
        type="time"
        className={inputClass}
        value={String(value ?? "")}
        onChange={(e) => onChange(e.target.value)}
      />
    </FieldFrame>
  );
}

export function UrlField(props: FieldRendererProps) {
  const { field, value, onChange, parentRequired } = props;
  const id = fieldId(props, "url");

  return (
    <FieldFrame
      props={props}
      label={field.title ?? "Tautan"}
      required={parentRequired?.includes(props.name ?? "")}
      htmlFor={id}
    >
      <input
        id={id}
        type="url"
        className={fieldClass(inputClass, props)}
        value={String(value ?? "")}
        placeholder="https://…"
        onChange={(e) => onChange(e.target.value)}
      />
    </FieldFrame>
  );
}

export function ColorField(props: FieldRendererProps) {
  const { field, value, onChange } = props;
  const current = String(value ?? field.default ?? "#000000");

  return (
    <FieldFrame props={props} label={field.title ?? "Warna Tema"}>
      <div className="flex items-center gap-2">
        <input
          type="color"
          aria-label={field.title ?? "Pilih warna"}
          className="h-9 w-12 cursor-pointer rounded border border-neutral-300"
          value={current}
          onChange={(e) => onChange(e.target.value)}
        />
        <input
          className={`${inputClass} font-mono`}
          value={current}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </FieldFrame>
  );
}
