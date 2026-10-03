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

export default function BirthdayGiftTemplate({ data }: { data: GiftData }) {
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".hero-title", { scale: 0.9, opacity: 0, duration: 1, ease: "back.out(1.5)" });
    });
    return () => ctx.revert();
  }, []);
  const theme = data.theme ?? {};
  return (
    <main
      style={{ background: theme.background ?? "#FFF9F7", color: theme.text ?? "#333", fontFamily: theme.fontBody ?? "Inter, sans-serif" } as React.CSSProperties}
    >
      <Hero title={data.cover.title ?? "Selamat Ulang Tahun!"} image={data.cover.photo} subtitle={`Untuk ${data.recipient.name}`} />
      <Marquee className="py-2 text-sm opacity-60" repeat={3}>
        <span className="mx-4">🎉 Selamat Ulang Tahun 🎉 Untuk ${data.recipient.name} 🎉 Birthday Gift 🎉</span>
      </Marquee>
      <Section title={data.message.title ?? "Pesan"}>
        <GradientText className="block text-2xl font-semibold mb-2" from="#f472b6" to="#a855f7">
          {data.message.title ?? "Untukmu"}
        </GradientText>
        <p className="whitespace-pre-line opacity-80">{data.message.content}</p>
      </Section>
      <GiftBox amount={data.gift.amount} note={data.gift.note} />
      <MusicToggle src={data.music} />
      <Footer text={`Birthday Gift untuk ${data.recipient.name}`} />
    </main>
  );
}
