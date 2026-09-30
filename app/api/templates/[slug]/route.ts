import { NextResponse } from "next/server";
import { getTemplate } from "@/lib/templates";
import luxurySchema from "@/templates/luxury-gold/schema.json";
import romanticSchema from "@/templates/romantic-garden/schema.json";
import minimalSchema from "@/templates/modern-minimal/schema.json";
import weddingGiftSchema from "@/templates/wedding-gift/schema.json";
import birthdayGiftSchema from "@/templates/birthday-gift/schema.json";

const SCHEMAS: Record<string, unknown> = {
  "luxury-gold": luxurySchema,
  "romantic-garden": romanticSchema,
  "modern-minimal": minimalSchema,
  "wedding-gift": weddingGiftSchema,
  "birthday-gift": birthdayGiftSchema,
};

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const manifest = getTemplate(params.slug);
  if (!manifest) return NextResponse.json({ error: "Template tidak ditemukan" }, { status: 404 });
  return NextResponse.json({ manifest, schema: SCHEMAS[params.slug] ?? null });
}
