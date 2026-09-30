"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import LuxuryGold from "@/templates/luxury-gold/template";
import RomanticGarden from "@/templates/romantic-garden/template";
import ModernMinimal from "@/templates/modern-minimal/template";
import WeddingGift from "@/templates/wedding-gift/template";
import BirthdayGift from "@/templates/birthday-gift/template";
import { getTemplate } from "@/lib/templates";
import { prepareTemplateData } from "@/lib/template-data";

type TemplateProps = { data: Record<string, unknown> };
type TemplateComponent = React.ComponentType<TemplateProps>;

/**
 * Registry slug → komponen.
 *
 * Template_source code selalu dari Git. Menambah template = tambah folder di
 * `templates/` lalu satu baris di sini + build ulang. Tidak ada upload kode
 * dari dashboard.
 */
const REGISTRY: Record<string, TemplateComponent> = {
  "luxury-gold": LuxuryGold as unknown as TemplateComponent,
  "romantic-garden": RomanticGarden as unknown as TemplateComponent,
  "modern-minimal": ModernMinimal as unknown as TemplateComponent,
  "wedding-gift": WeddingGift as unknown as TemplateComponent,
  "birthday-gift": BirthdayGift as unknown as TemplateComponent,
};

export function TemplateRenderer({
  templateSlug,
  data,
  weddingId,
}: {
  templateSlug: string;
  data: Record<string, unknown>;
  /**
   * Id wedding untuk komponen interaktif (RSVP). Disuntikkan ke `data` supaya
   * template tidak perlu fetch apa pun —undangan tamu harus bisa tampil dari
   * render server.
   */
  weddingId?: string;
}) {
  const Template = REGISTRY[templateSlug];
  const manifest = getTemplate(templateSlug);

  // Guard terakhir: kalau manifest hilang, jangan render template yang bisa
  // saja crash. prepareTemplateData sudah mengisi default schema, tapi data
  // dari caller lain mungkin tidak.
  const prepared = manifest ? prepareTemplateData(templateSlug, data) : data;
  const safeData = weddingId ? { ...prepared, weddingId } : prepared;

  useEffect(() => {
    if (!manifest?.animations.lenis) return;
    const lenis = new Lenis({ duration: 1.1, smoothWheel: true });
    let frame = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      frame = requestAnimationFrame(raf);
    };
    frame = requestAnimationFrame(raf);
    return () => {
      cancelAnimationFrame(frame);
      lenis.destroy();
    };
  }, [manifest?.animations.lenis]);

  if (!Template) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-12 text-center">
        <div>
          <h1 className="text-2xl font-semibold">Template tidak ditemukan</h1>
          <p className="mt-2 text-sm opacity-70">
            Slug <code>{templateSlug}</code> tidak ada di build ini.
          </p>
        </div>
      </div>
    );
  }

  return <Template data={safeData} />;
}
