import type { TemplateManifest } from "./types";

// Registry statis MVP: template terdaftar via Git (folder templates/<slug>/).
// Admin hanya mengatur metadata/status/version via DB (US-016).
//atile DDEV: file ini dibaca server-side via import JSON.
import luxuryGold from "@/templates/luxury-gold/template.json";
import romanticGarden from "@/templates/romantic-garden/template.json";
import modernMinimal from "@/templates/modern-minimal/template.json";
import weddingGift from "@/templates/wedding-gift/template.json";
import birthdayGift from "@/templates/birthday-gift/template.json";

const REGISTRY: TemplateManifest[] = [
  luxuryGold as TemplateManifest,
  romanticGarden as TemplateManifest,
  modernMinimal as TemplateManifest,
  weddingGift as TemplateManifest,
  birthdayGift as TemplateManifest,
];

export function listTemplates(category?: string): TemplateManifest[] {
  const published = REGISTRY.filter((t) => t.status === "published");
  if (!category || category === "all") return published;
  return published.filter((t) => t.category === category);
}

export function getTemplate(slug: string): TemplateManifest | undefined {
  return REGISTRY.find((t) => t.slug === slug);
}
