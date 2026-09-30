"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { Hero, Story, GiftBox, MusicToggle, Footer, Section } from "@/components/template-sdk";

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
      style={{ background: theme.background ?? "#FFF9F7", color: theme.text ?? "#333", fontFamily: theme.fontBody ?? "Inter, sans-serif" } as React.CSSProperties}
    >
      <Hero title={data.cover.title ?? "Kado Spesial Untukmu"} image={data.cover.photo} subtitle={`Untuk ${data.recipient.name}`} />
      <Section title={data.message.title ?? "Pesan"}>
        <p className="whitespace-pre-line opacity-80">{data.message.content}</p>
      </Section>
      <GiftBox amount={data.gift.amount} note={data.gift.note} />
      <MusicToggle src={data.music} />
      <Footer text={`Dengan cinta — Wedding Gift untuk ${data.recipient.name}`} />
    </main>
  );
}
