"use client";

import { useEffect } from "react";
import type { CSSProperties } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  Hero,
  Couple,
  EventInfo,
  Story,
  Gallery,
  Countdown,
  MusicToggle,
  Footer,
} from "@/components/template-sdk";

gsap.registerPlugin(ScrollTrigger);

interface LuxuryData {
  groom: { name: string; photo?: string };
  bride: { name: string; photo?: string };
  hero: { photo?: string; subtitle?: string };
  event: { date: string; time?: string; venue?: string; address?: string; mapsUrl?: string };
  story: { title?: string; content?: string };
  gallery: string[];
  music?: string;
  theme?: { primary?: string; background?: string; text?: string; fontHeading?: string; fontBody?: string };
}

export default function LuxuryGoldTemplate({ data }: { data: LuxuryData }) {
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".hero-title", { y: 100, opacity: 0, duration: 1.2, ease: "power4.out" });
      gsap.from(".hero-image", { scale: 1.2, opacity: 0, duration: 1.5 });
      gsap.utils.toArray(".reveal").forEach((el) => {
        gsap.from(el as HTMLElement, {
          scrollTrigger: { trigger: el as HTMLElement, start: "top 80%" },
          y: 60,
          opacity: 0,
          duration: 1,
        });
      });
    });
    return () => ctx.revert();
  }, []);

  const theme = data.theme ?? {};
  return (
    <main
      style={
        {
          "--template-primary": theme.primary ?? "#C9A227",
          "--template-background": theme.background ?? "#FAF7F0",
          "--template-text": theme.text ?? "#222222",
          background: "var(--template-background)",
          color: "var(--template-text)",
          fontFamily: theme.fontBody ?? "Inter, sans-serif",
        } as CSSProperties
      }
    >
      <Hero
        title={`${data.groom.name} & ${data.bride.name}`}
        image={data.hero.photo}
        subtitle={data.hero.subtitle}
      />
      <Couple groom={data.groom.name} bride={data.bride.name} />
      <Countdown date={data.event.date} />
      <EventInfo {...data.event} />
      {data.story.title ? <Story title={data.story.title} content={data.story.content ?? ""} /> : null}
      <Gallery photos={data.gallery} />
      <MusicToggle src={data.music} />
      <Footer text={`${data.groom.name} & ${data.bride.name} — Luxury Gold`} />
    </main>
  );
}
