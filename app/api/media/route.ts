import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/media — upload foto/audio/video ke Supabase Storage.
 *
 * Bucket `wedding-media` dibuat public-read di migration 000002 karena undangan
 * adalah halaman publik dan template merender <img src> biasa. Yang tetap
 * ketat adalah sisi write: hanya pemilik wedding yang boleh menulis.
 */

const ALLOWED: Record<string, string[]> = {
  image: ["image/jpeg", "image/png", "image/webp"],
  video: ["video/mp4"],
  audio: ["audio/mpeg", "audio/mp3", "audio/wav"],
};

const MAX_SIZE: Record<string, number> = {
  image: 10 * 1024 * 1024,
  video: 25 * 1024 * 1024,
  audio: 25 * 1024 * 1024,
};

const EXTENSION: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "video/mp4": "mp4",
  "audio/mpeg": "mp3",
  "audio/mp3": "mp3",
  "audio/wav": "wav",
};

/** Nama file dari user tidak boleh membentuk path; ambil basename + buat nama acak. */
function safeObjectName(mime: string): string {
  const ext = EXTENSION[mime] ?? "bin";
  const random = Math.random().toString(36).slice(2, 10);
  return `${Date.now()}-${random}.${ext}`;
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Body harus multipart/form-data" }, { status: 400 });
  }

  const file = form.get("file");
  const weddingId = String(form.get("wedding_id") ?? "");
  const type = String(form.get("type") ?? "image");

  if (!(file instanceof File) || !weddingId) {
    return NextResponse.json({ error: "file + wedding_id wajib diisi" }, { status: 400 });
  }
  if (!ALLOWED[type]?.includes(file.type)) {
    return NextResponse.json({ error: `Tipe ${file.type || "tidak dikenal"} tidak diizinkan` }, { status: 400 });
  }
  if (file.size > (MAX_SIZE[type] ?? 10 * 1024 * 1024)) {
    return NextResponse.json({ error: "File terlalu besar" }, { status: 400 });
  }

  // Ownership check: tanpa ini user bisa menulis ke folder wedding orang lain,
  // karena policy storage hanya memeriksa segmen pertama (user id).
  const { data: wedding, error: weddingErr } = await supabase
    .from("weddings")
    .select("id")
    .eq("id", weddingId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (weddingErr) return NextResponse.json({ error: "Gagal memverifikasi wedding" }, { status: 500 });
  if (!wedding) return NextResponse.json({ error: "Wedding tidak ditemukan" }, { status: 404 });

  const path = `${user.id}/${weddingId}/${safeObjectName(file.type)}`;

  const { error: upErr } = await supabase.storage
    .from("wedding-media")
    .upload(path, file, { contentType: file.type, upsert: false });

  if (upErr) {
    console.error("[media] upload gagal:", upErr.message);
    return NextResponse.json({ error: "Upload gagal" }, { status: 500 });
  }

  const { data: urlData } = supabase.storage.from("wedding-media").getPublicUrl(path);

  const { error: insertErr } = await supabase.from("media").insert({
    user_id: user.id,
    wedding_id: weddingId,
    type,
    path,
    url: urlData.publicUrl,
    mime_type: file.type,
    size: file.size,
  });

  if (insertErr) {
    // Jangan laporkan sukses kalau bookkeeping gagal; file yang terlanjur
    // terupload akan jadi orphan, dan itu lebih mudah dibersihkan daripada
    // record media yang menunjuk file tidak ada.
    console.error("[media] insert record gagal:", insertErr.message);
    return NextResponse.json({ error: "File terupload tapi pencatatan gagal" }, { status: 500 });
  }

  return NextResponse.json({ data: { path, url: urlData.publicUrl } }, { status: 201 });
}

/** GET /api/media?wedding_id=… — daftar media milik wedding caller. */
export async function GET(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const weddingId = new URL(req.url).searchParams.get("wedding_id") ?? "";
  if (!weddingId) return NextResponse.json({ error: "wedding_id wajib diisi" }, { status: 400 });

  const { data: wedding } = await supabase
    .from("weddings")
    .select("id")
    .eq("id", weddingId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!wedding) return NextResponse.json({ error: "Wedding tidak ditemukan" }, { status: 404 });

  const { data, error } = await supabase
    .from("media")
    .select("id, type, path, url, mime_type, size, created_at")
    .eq("wedding_id", weddingId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: "Gagal memuat media" }, { status: 500 });
  return NextResponse.json({ data });
}
