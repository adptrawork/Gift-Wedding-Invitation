"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Hero, Couple, EventInfo, Story, Gallery, Countdown, MusicToggle, RSVP, Footer } from "@/components/template-sdk";

gsap.registerPlugin(ScrollTrigger);

interface WeddingData {
  /** Diisi renderer dari baris `weddings`, bukan dari content customer. */
  weddingId?: string;
  groom: { name: string; photo?: string };
  bride: { name: string; photo?: string };
  hero: { photo?: string; subtitle?: string };
  event: { date?: string; time?: string; venue?: string; address?: string; mapsUrl?: string };
  story: { title?: string; content?: string };
  gallery: string[];
  music?: string;
  theme?: Record<string, string>;
}

/**
 * Varian warna dari template yang sama. Warna bawaan dipakai hanya kalau
 * customer belum memilih tema, jadi beberapa varian tetap bisa berbagi satu
 * file template.
 */
function make(accent: string, bg: string, label: string) {
  return function Template({ data }: { data: WeddingData }) {
    useEffect(() => {
      const ctx = gsap.context(() => {
        gsap.from(".hero-title", { y: 80, opacity: 0, duration: 1.1, ease: "power3.out" });
        gsap.utils.toArray(".reveal").forEach((el) => {
          gsap.from(el as HTMLElement, {
            scrollTrigger: { trigger: el as HTMLElement, start: "top 85%" },
            y: 50,
            opacity: 0,
            duration: 0.9,
          });
        });
      });
      return () => ctx.revert();
    }, []);
    const theme = data.theme ?? {};
    return (
      <main
        style={{ background: theme.background ?? bg, color: theme.text ?? "#222", fontFamily: theme.fontBody ?? "Inter, sans-serif" } as React.CSSProperties}
      >
        <Hero title={`${data.groom.name} & ${data.bride.name}`} image={data.hero.photo} subtitle={data.hero.subtitle} />
        <Couple groom={data.groom.name} bride={data.bride.name} />
        <Countdown date={data.event.date} />
        <EventInfo {...data.event} />
        {data.story.title ? <Story title={data.story.title} content={data.story.content ?? ""} /> : null}
        <Gallery photos={data.gallery} />
        {data.weddingId ? <RSVP weddingId={data.weddingId} /> : null}
        <MusicToggle src={data.music} />
        <Footer text={`${data.groom.name} & ${data.bride.name} — ${label}`} />
      </main>
    );
  };
}

const RomanticGardenTemplate = make("#2F7D4F", "#F4FBF4", "Romantic Garden");
export default RomanticGardenTemplate;
