"use client";

import { useEffect, useRef, useState } from "react";

export function useTemplateData<T>(data: T): T {
  return data;
}

export function Hero({ title, image, subtitle }: { title: string; image?: string; subtitle?: string }) {
  return (
    <section className="hero flex min-h-[90vh] flex-col items-center justify-center text-center">
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="hero-image h-64 w-full max-w-2xl rounded-2xl object-cover" src={image} alt="" />
      ) : null}
      <div className="hero-content mt-6">
        {subtitle ? <p className="opacity-70">{subtitle}</p> : null}
        <h1 className="hero-title mt-2 text-5xl font-bold">{title}</h1>
      </div>
    </section>
  );
}

export function Section({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <section className="reveal mx-auto max-w-3xl px-6 py-16">
      {title ? <h2 className="mb-4 text-3xl font-semibold">{title}</h2> : null}
      {children}
    </section>
  );
}

export function Couple({ groom, bride }: { groom: string; bride: string }) {
  return (
    <Section title="Mempelai">
      <p className="text-xl">
        {groom} <span className="opacity-60">&amp;</span> {bride}
      </p>
    </Section>
  );
}

export function EventInfo({ date, time, venue, address, mapsUrl }: Record<string, string>) {
  return (
    <Section title="Waktu & Tempat">
      <p>{date} {time ? `• ${time}` : ""}</p>
      <p className="mt-2 font-semibold">{venue}</p>
      <p className="opacity-70">{address}</p>
      {mapsUrl ? (
        <a className="mt-4 inline-block underline" href={mapsUrl} target="_blank" rel="noreferrer">
          Buka Google Maps
        </a>
      ) : null}
    </Section>
  );
}

export function Story({ title, content }: { title: string; content: string }) {
  return (
    <Section title={title}>
      <p className="whitespace-pre-line opacity-80">{content}</p>
    </Section>
  );
}

export function Gallery({ photos }: { photos: string[] }) {
  if (!photos || photos.length === 0) return null;
  return (
    <Section title="Galeri">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {photos.map((src, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={i} src={src} alt="" loading="lazy" className="h-40 w-full rounded-xl object-cover" />
        ))}
      </div>
    </Section>
  );
}

export function GiftBox({ note, amount }: { note?: string; amount?: string }) {
  return (
    <Section title="Tanda Kasih">
      {amount ? <p className="text-2xl font-bold">Rp {amount}</p> : null}
      {note ? <p className="mt-2 opacity-70">{note}</p> : null}
    </Section>
  );
}

export function MusicToggle({ src }: { src?: string }) {
  const ref = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    if (!src) return;
    if (playing) ref.current?.play().catch(() => setPlaying(false));
    else ref.current?.pause();
  }, [playing, src]);
  if (!src) return null;
  return (
    <div className="fixed bottom-4 right-4">
      <audio ref={ref} src={src} loop />
      <button
        className="rounded-full border bg-white/90 px-4 py-2 text-sm shadow"
        onClick={() => setPlaying((v) => !v)}
      >
        {playing ? "⏸ Musik" : "▶ Musik"}
      </button>
    </div>
  );
}

export function Location({ address, mapsUrl }: { address?: string; mapsUrl?: string }) {
  if (!address && !mapsUrl) return null;
  return (
    <Section title="Lokasi">
      <p className="opacity-80">{address}</p>
      {mapsUrl ? (
        <a className="mt-3 inline-block underline" href={mapsUrl} target="_blank" rel="noreferrer">
          Petunjuk Arah
        </a>
      ) : null}
    </Section>
  );
}

export function Footer({ text }: { text: string }) {
  return (
    <footer className="px-6 py-12 text-center opacity-60">
      <p>{text}</p>
    </footer>
  );
}

export function Countdown({ date }: { date: string }) {
  const [left, setLeft] = useState("");
  useEffect(() => {
    const target = new Date(`${date}T00:00:00+07:00`).getTime();
    const tick = () => {
      const diff = Math.max(0, target - Date.now());
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setLeft(`${d} hari : ${h} jam : ${m} mnt : ${s} dtk`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [date]);
  return (
    <Section title="Menghitung Hari">
      <p className="text-xl font-semibold">{left || "..."}</p>
    </Section>
  );
}
