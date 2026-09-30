import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file") as File | null;
  const weddingId = String(form.get("wedding_id") ?? "");
  const type = String(form.get("type") ?? "image");
  if (!file || !weddingId) return NextResponse.json({ error: "file + wedding_id wajib" }, { status: 400 });
  if (!ALLOWED[type]?.includes(file.type)) return NextResponse.json({ error: `Tipe ${file.type} tidak diizinkan` }, { status: 400 });
  if (file.size > (MAX_SIZE[type] ?? 10 * 1024 * 1024)) return NextResponse.json({ error: "File terlalu besar" }, { status: 400 });

  const path = `${user.id}/${weddingId}/${Date.now()}-${file.name}`;
  const { error: upErr } = await supabase.storage
    .from("wedding-media")
    .upload(path, file, { contentType: file.type });
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

  const { data: urlData } = supabase.storage.from("wedding-media").getPublicUrl(path);
  await supabase.from("media").insert({
    user_id: user.id,
    wedding_id: weddingId,
    type,
    path,
    url: urlData.publicUrl,
    mime_type: file.type,
    size: file.size,
  });
  return NextResponse.json({ data: { path, url: urlData.publicUrl } }, { status: 201 });
}
