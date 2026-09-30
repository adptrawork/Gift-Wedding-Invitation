"use client";

import { ACCEPT } from "../constants";
import { errorClass, inputClass } from "../types";
import { useMediaUpload } from "../use-media-upload";
import { FieldFrame, fieldClass, fieldId, type FieldRendererProps } from "./shared";

const NO_WEDDING = "Simpan draft dulu untuk mengaktifkan upload.";

function UploadButton({
  accept,
  onPicked,
  disabled,
  busy,
}: {
  accept: string;
  onPicked: (file: File) => void;
  disabled?: boolean;
  busy?: boolean;
}) {
  return (
    <label
      className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-medium transition hover:bg-neutral-50 ${
        disabled || busy ? "pointer-events-none opacity-50" : ""
      }`}
    >
      <input
        type="file"
        accept={accept}
        className="sr-only"
        disabled={disabled || busy}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onPicked(file);
          e.target.value = ""; // izinkan memilih file yang sama lagi
        }}
      />
      {busy ? "Mengunggah…" : "Upload"}
    </label>
  );
}

export function ImageField(props: FieldRendererProps) {
  const { field, value, onChange, context, parentRequired } = props;
  const { busy, error, upload } = useMediaUpload(context);
  const url = String(value ?? "");
  const canUpload = Boolean(context?.weddingId);
  const id = fieldId(props, "image");

  return (
    <FieldFrame
      props={props}
      label={field.title ?? "Gambar"}
      required={parentRequired?.includes(props.name ?? "")}
      htmlFor={id}
    >
      <div className="flex items-start gap-3">
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg border bg-neutral-50">
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-neutral-400">
              kosong
            </div>
          )}
        </div>

        <div className="grid flex-1 gap-1.5">
          <input
            id={id}
            className={fieldClass(inputClass, props)}
            value={url}
            placeholder="https://… atau URL dari Storage"
            onChange={(e) => onChange(e.target.value)}
          />
          <div className="flex items-center gap-2">
            <UploadButton
              accept={ACCEPT.image}
              busy={busy}
              disabled={!canUpload}
              onPicked={(f) => upload(f, "image").then((u) => u && onChange(u))}
            />
            {url ? (
              <button
                type="button"
                className="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs hover:bg-neutral-50"
                onClick={() => onChange("")}
              >
                Hapus
              </button>
            ) : null}
          </div>
          {!canUpload ? <p className={errorClass}>{NO_WEDDING}</p> : null}
          {error ? <p className="text-xs text-red-600">{error}</p> : null}
        </div>
      </div>
    </FieldFrame>
  );
}

export function AudioField(props: FieldRendererProps) {
  const { field, value, onChange, context } = props;
  const { busy, error, upload } = useMediaUpload(context);
  const src = String(value ?? "");
  const canUpload = Boolean(context?.weddingId);
  const id = fieldId(props, "audio");

  return (
    <FieldFrame props={props} label={field.title ?? "Audio"} htmlFor={id}>
      <input
        id={id}
        className={inputClass}
        value={src}
        placeholder="https://… atau URL dari Storage"
        onChange={(e) => onChange(e.target.value)}
      />
      <div className="flex items-center gap-2">
        <UploadButton
          accept={ACCEPT.audio}
          busy={busy}
          disabled={!canUpload}
          onPicked={(f) => upload(f, "audio").then((u) => u && onChange(u))}
        />
        {src ? <audio src={src} controls className="h-8" /> : null}
      </div>
      {!canUpload ? <p className={errorClass}>{NO_WEDDING}</p> : null}
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </FieldFrame>
  );
}

export function GalleryField(props: FieldRendererProps) {
  const { field, value, onChange, context } = props;
  const { busy, error, upload } = useMediaUpload(context);
  const photos = Array.isArray(value) ? (value as string[]) : [];
  const canUpload = Boolean(context?.weddingId);

  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-neutral-800">
          {field.title ?? "Galeri"}
        </span>
        <span className="text-xs text-neutral-500">{photos.length} foto</span>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {photos.map((src, i) => (
          // src bisa sama/kosong, jadi index ikut dimasukkan sebagai pengaman.
          <div key={`${i}-${src || "empty"}`} className="relative">
            <div className="aspect-square overflow-hidden rounded-lg border bg-neutral-50">
              {src ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={src} alt="" className="h-full w-full object-cover" />
              ) : null}
            </div>
            <button
              type="button"
              aria-label={`Hapus foto ${i + 1}`}
              className="absolute right-1 top-1 rounded-full bg-white/90 px-1.5 text-xs shadow hover:bg-red-50 hover:text-red-600"
              onClick={() => onChange(photos.filter((_, j) => j !== i))}
            >
              ✕
            </button>
          </div>
        ))}

        <label
          className={`flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-neutral-300 text-xs text-neutral-500 transition hover:border-neutral-500 ${
            canUpload && !busy ? "" : "pointer-events-none opacity-50"
          }`}
        >
          <input
            type="file"
            accept={ACCEPT.image}
            className="sr-only"
            disabled={!canUpload || busy}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) upload(file, "image").then((u) => u && onChange([...photos, u]));
              e.target.value = "";
            }}
          />
          <span className="text-lg leading-none">+</span>
          {busy ? "Unggah…" : "Tambah"}
        </label>
      </div>

      {!canUpload ? <p className={errorClass}>{NO_WEDDING}</p> : null}
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}

export function StringListField(props: FieldRendererProps) {
  const { field, value, onChange } = props;
  const items = Array.isArray(value) ? (value as string[]) : [];
  const id = fieldId(props, "list");

  return (
    <FieldFrame props={props} label={field.title ?? "Daftar"} htmlFor={id}>
      <div className="grid gap-2">
        {items.map((item, i) => (
          <div key={i} className="flex gap-2">
            <input
              className={inputClass}
              value={item}
              aria-label={`${field.title ?? "Item"} ${i + 1}`}
              onChange={(e) => {
                const next = [...items];
                next[i] = e.target.value;
                onChange(next);
              }}
            />
            <button
              type="button"
              aria-label={`Hapus item ${i + 1}`}
              className="shrink-0 rounded-lg border border-neutral-300 px-3 text-xs hover:bg-neutral-50"
              onClick={() => onChange(items.filter((_, j) => j !== i))}
            >
              ✕
            </button>
          </div>
        ))}
        <button
          type="button"
          className="w-fit rounded-lg border border-neutral-300 px-3 py-1.5 text-xs hover:bg-neutral-50"
          onClick={() => onChange([...items, ""])}
        >
          + Tambah
        </button>
      </div>
    </FieldFrame>
  );
}
