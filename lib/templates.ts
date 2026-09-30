import type { SchemaField, TemplateManifest } from "./types";

/**
 * Registry template statis.
 *
 * Template source code (template.tsx) selalu datang dari Git — tidak ada
 * upload kode dari dashboard demi keamanan. File JSON di sini hanya identitas
 * build-time.
 *
 * `status` TIDAK dibaca dari JSON. Itu atribut operasional (siapa yang boleh
 * memakai template) dan sumbernya adalah DB, supaya admin bisa unpublish
 * tanpa deploy ulang. Lihat `lib/templates-db.ts`.
 */

import luxuryGold from "@/templates/luxury-gold/template.json";
import romanticGarden from "@/templates/romantic-garden/template.json";
import modernMinimal from "@/templates/modern-minimal/template.json";
import weddingGift from "@/templates/wedding-gift/template.json";
import birthdayGift from "@/templates/birthday-gift/template.json";

import luxuryGoldSchema from "@/templates/luxury-gold/schema.json";
import romanticGardenSchema from "@/templates/romantic-garden/schema.json";
import modernMinimalSchema from "@/templates/modern-minimal/schema.json";
import weddingGiftSchema from "@/templates/wedding-gift/schema.json";
import birthdayGiftSchema from "@/templates/birthday-gift/schema.json";

type Schema = { properties: Record<string, SchemaField> };

const MANIFESTS: TemplateManifest[] = [
  luxuryGold as TemplateManifest,
  romanticGarden as TemplateManifest,
  modernMinimal as TemplateManifest,
  weddingGift as TemplateManifest,
  birthdayGift as TemplateManifest,
];

const SCHEMAS: Record<string, Schema> = {
  "luxury-gold": luxuryGoldSchema as Schema,
  "romantic-garden": romanticGardenSchema as Schema,
  "modern-minimal": modernMinimalSchema as Schema,
  "wedding-gift": weddingGiftSchema as Schema,
  "birthday-gift": birthdayGiftSchema as Schema,
};

/**
 * Template yang ada di build ini, apa pun statusnya di DB.
 * Dipakai halaman publik: undangan yang sudah published tidak boleh hilang
 * hanya karena admin sedang maintenance.
 */
export function allTemplates(): TemplateManifest[] {
  return MANIFESTS;
}

export function getTemplate(slug: string): TemplateManifest | undefined {
  return MANIFESTS.find((t) => t.slug === slug);
}

export function getSchema(slug: string): Schema | undefined {
  return SCHEMAS[slug];
}

export function allSchemas(): Record<string, Schema> {
  return SCHEMAS;
}
