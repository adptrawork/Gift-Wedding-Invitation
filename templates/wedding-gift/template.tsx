"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { Hero, Story, GiftBox, MusicToggle, Footer, Section } from "@/components/template-sdk";
import { Marquee } from "@/components/ui/marquee";
import { GradientText } from "@/components/ui/gradient-text";

interface GiftData {
  recipient: { name: string; photo?: string };
  cover: { photo?: string; title?: string };
  message: { title?: string; content?: string };
  gift: { amount?: string; note?: string };
  music?: string;
  theme?: Record<string, string>;
}

export default function WeddingGiftTemplate({ data }: { data: GiftData }) {
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".hero-title", { y: 60, opacity: 0, duration: 1, ease: "power3.out" });
    });
    return () => ctx.revert();
  }, []);
  const theme = data.theme ?? {};
  return (
    <main
      style={{ background: theme.background ?? "#FDF2F8", color: theme.text ?? "#831843", fontFamily: theme.fontBody ?? "Inter, sans-serif" } as React.CSSProperties}
    >
      <Hero title={data.cover.title ?? "Kado Spesial Untukmu"} image={data.cover.photo} subtitle={`Untuk ${data.recipient.name}`} />
      {data.recipient.photo && (
        <Marquee className="py-2 text-sm opacity-60" repeat={3}>
          <span className="mx-4">✦ Dengan Cinta ✦ Untuk ${data.recipient.name} ✦ Wedding Gift ✦</span>
        </Marquee>
      )}
      <Section title={data.message.title ?? "Pesan"}>
        <GradientText className="block text-2xl font-semibold mb-2" from="#DB2777" to="#A16207">
          {data.message.title ?? "Untukmu"}
        </GradientText>
        <p className="whitespace-pre-line opacity-80">{data.message.content}</p>
      </Section>
      <GiftBox amount={data.gift.amount} note={data.gift.note} />
      <MusicToggle src={data.music} />
      <Footer text={`Dengan cinta — Wedding Gift untuk ${data.recipient.name}`} />
    </main>
  );
}
