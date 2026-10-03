"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Hero, Couple, EventInfo, Story, Gallery, Countdown, MusicToggle, RSVP, Footer } from "@/components/template-sdk";
import { Marquee } from "@/components/ui/marquee";
import { GradientText } from "@/components/ui/gradient-text";

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

export default function ModernMinimalTemplate({ data }: { data: WeddingData }) {
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".hero-title", { y: 40, opacity: 0, duration: 0.9, ease: "power2.out" });
      gsap.utils.toArray(".reveal").forEach((el) => {
        gsap.from(el as HTMLElement, {
          scrollTrigger: { trigger: el as HTMLElement, start: "top 90%" },
          y: 30,
          opacity: 0,
          duration: 0.7,
        });
      });
    });
    return () => ctx.revert();
  }, []);
  const theme = data.theme ?? {};
  return (
    <main
      style={{ background: theme.background ?? "#FFFFFF", color: theme.text ?? "#111", fontFamily: theme.fontBody ?? "Inter, sans-serif" } as React.CSSProperties}
    >
      <Hero title={`${data.groom.name} & ${data.bride.name}`} image={data.hero.photo} subtitle={data.hero.subtitle} />
      <Marquee className="py-2 text-sm opacity-40" repeat={3}>
        <span className="mx-4">— ${data.groom.name} & ${data.bride.name} — Modern Minimal —</span>
      </Marquee>
      <Couple groom={data.groom.name} bride={data.bride.name} />
      <Countdown date={data.event.date} />
      <EventInfo {...data.event} />
      {data.story.title ? (
        <GradientText className="block text-3xl font-semibold text-center mt-8 mb-4" from="#111111" to="#555555">
          {data.story.title}
        </GradientText>
      ) : null}
      {data.story.title ? <Story title="" content={data.story.content ?? ""} /> : null}
      <Gallery photos={data.gallery} />
      {data.weddingId ? <RSVP weddingId={data.weddingId} /> : null}
      <MusicToggle src={data.music} />
      <Footer text={`${data.groom.name} & ${data.bride.name} — Modern Minimal`} />
    </main>
  );
}
