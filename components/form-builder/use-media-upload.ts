"use client";

import { useState } from "react";
import { ALLOWED_TYPES } from "./constants";
import type { FieldContext } from "./types";

interface UploadState {
  busy: boolean;
  error: string | null;
}

/**
 * Upload ke /api/media (Supabase Storage).
 *
 * Returns URL publik, atau null bila gagal. Sengaja tidak melempar error:
 * form builder hanya perlu menampilkan pesan.
 */
export function useMediaUpload(context: FieldContext | undefined) {
  const [state, setState] = useState<UploadState>({ busy: false, error: null });

  async function upload(file: File, type: string): Promise<string | null> {
    if (!context?.weddingId) {
      setState({ busy: false, error: "Simpan dulu undangannya sebelum upload." });
      return null;
    }

    setState({ busy: true, error: null });
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("wedding_id", context.weddingId);
      form.append("type", type);

      const res = await fetch("/api/media", { method: "POST", body: form });
      const json = (await res.json()) as { data?: { url: string }; error?: string };

      if (!res.ok || !json.data?.url) {
        setState({ busy: false, error: json.error ?? "Upload gagal" });
        return null;
      }

      setState({ busy: false, error: null });
      return json.data.url;
    } catch {
      setState({ busy: false, error: "Koneksi bermasalah saat upload" });
      return null;
    }
  }

  return { ...state, upload, allowed: ALLOWED_TYPES };
}
