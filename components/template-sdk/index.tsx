"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Komponen dasar untuk author template.
 *
 * Aturan penting: komponen di sini TIDAK BOLEH membaca data customer secara
 * langsung. Semua isi datang lewat props dari `data.*` yang diteruskan template.
 * one-satunya sumber kebenaran ada di `weddings.content`; template hanya tahu
 * bentuk datanya.
 */

export function Hero({
  title,
  image,
  subtitle,
}: {
  title: string;
  image?: string;
  subtitle?: string;
}) {
  return (
    <section className="hero flex min-h-[90vh] flex-col items-center justify-center text-center">
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          className="hero-image h-64 w-full max-w-2xl rounded-2xl object-cover"
          src={image}
          alt=""
        />
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

export function EventInfo({
  date,
  time,
  venue,
  address,
  mapsUrl,
}: {
  date?: string;
  time?: string;
  venue?: string;
  address?: string;
  mapsUrl?: string;
}) {
  if (!date && !venue) return null;

  return (
    <Section title="Waktu &amp; Tempat">
      {date ? (
        <p>
          {date} {time ? `• ${time}` : ""}
        </p>
      ) : null}
      {venue ? <p className="mt-2 font-semibold">{venue}</p> : null}
      {address ? <p className="opacity-70">{address}</p> : null}
      {mapsUrl ? (
        <a
          className="mt-4 inline-block underline"
          href={mapsUrl}
          target="_blank"
          rel="noreferrer"
        >
          Buka Google Maps
        </a>
      ) : null}
    </Section>
  );
}

export function Story({ title, content }: { title?: string; content?: string }) {
  if (!content) return null;
  return (
    <Section title={title || undefined}>
      <p className="whitespace-pre-line opacity-80">{content}</p>
    </Section>
  );
}

export function Gallery({ photos }: { photos?: string[] }) {
  const items = (photos ?? []).filter(Boolean);
  if (items.length === 0) return null;

  return (
    <Section title="Galeri">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {items.map((src, i) => (
          // URL galeri unik per customer; index dipakai sebagai suffix agar tetap
          // stabil kalau URL kosong terfilter.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={`${i}-${src}`}
            src={src}
            alt=""
            loading="lazy"
            className="h-40 w-full rounded-xl object-cover"
          />
        ))}
      </div>
    </Section>
  );
}

export function GiftBox({ note, amount }: { note?: string; amount?: string }) {
  if (!note && !amount) return null;
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

  // Autoplay diblokir browser sebelum ada interaksi user;-catching di sini
  // membuat tombol tidak tersangkut di state "playing" padahal audio diam.
  useEffect(() => {
    if (!src) return;
    if (playing) {
      ref.current?.play().catch(() => setPlaying(false));
    } else {
      ref.current?.pause();
    }
  }, [playing, src]);

  if (!src) return null;

  return (
    <div className="fixed bottom-4 right-4 z-40">
      <audio ref={ref} src={src} loop preload="none" />
      <button
        type="button"
        aria-label={playing ? "Matikan musik" : "Putar musik"}
        className="rounded-full border bg-white/90 px-4 py-2 text-sm shadow"
        onClick={() => setPlaying((v) => !v)}
      >
        {playing ? "⏸ Musik" : "▶ Musik"}
      </button>
    </div>
  );
}

/**
 * Form konfirmasi kehadiran untuk tamu.
 *
 * Template hanya meneruskan `weddingId`; endpoint yang memvalidasi payload ada
 * di /api/rsvps. Kolom `attendance` dikirim sebagai "yes"/"no" sesuai enum di
 * lib/validation.ts.
 *
 * Catatan: policy RLS menolak insert untuk wedding yang belum published, jadi
 * migration 20260930000002_hardening.sql wajib sudah dijalankan.
 */
export function RSVP({ weddingId }: { weddingId: string }) {
  const [name, setName] = useState("");
  const [attendance, setAttendance] = useState<"yes" | "no">("yes");
  const [guests, setGuests] = useState(1);
  const [message, setMessage] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [err, setErr] = useState("");

  if (!weddingId) return null;

  if (state === "done") {
    return (
      <Section title="Konfirmasi Kehadiran">
        <p className="opacity-80">Terima kasih, konfirmasi Anda sudah kami terima.</p>
      </Section>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("busy");
    setErr("");

    try {
      const res = await fetch("/api/rsvps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wedding_id: weddingId,
          name,
          attendance,
          guests_count: guests,
          message,
        }),
      });
      const json = (await res.json()) as { error?: string };

      if (!res.ok) {
        setErr(json.error ?? "Gagal mengirim konfirmasi.");
        setState("error");
        return;
      }
      setState("done");
    } catch {
      setErr("Koneksi bermasalah. Coba lagi.");
      setState("error");
    }
  }

  const inputCls =
    "w-full rounded-lg border border-black/20 bg-white/80 px-3 py-2 text-sm outline-none focus:border-black/40";

  return (
    <Section title="Konfirmasi Kehadiran">
      <form onSubmit={submit} className="grid max-w-md gap-3 text-left">
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Nama</span>
          <input
            required
            minLength={2}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputCls}
          />
        </label>

        <fieldset className="grid gap-1 text-sm">
          <legend className="font-medium">Kehadiran</legend>
          <div className="flex gap-3">
            <label className="flex items-center gap-1.5">
              <input
                type="radio"
                name="attendance"
                checked={attendance === "yes"}
                onChange={() => setAttendance("yes")}
              />
              Hadir
            </label>
            <label className="flex items-center gap-1.5">
              <input
                type="radio"
                name="attendance"
                checked={attendance === "no"}
                onChange={() => setAttendance("no")}
              />
              Tidak hadir
            </label>
          </div>
        </fieldset>

        {attendance === "yes" ? (
          <label className="grid gap-1 text-sm">
            <span className="font-medium">Jumlah tamu</span>
            <input
              type="number"
              min={1}
              max={20}
              value={guests}
              onChange={(e) => setGuests(Math.max(1, Math.min(20, Number(e.target.value) || 1)))}
              className={inputCls}
            />
          </label>
        ) : null}

        <label className="grid gap-1 text-sm">
          <span className="font-medium">Pesan (opsional)</span>
          <textarea
            value={message}
            maxLength={500}
            onChange={(e) => setMessage(e.target.value)}
            className={`${inputCls} min-h-20`}
          />
        </label>

        <button
          type="submit"
          disabled={state === "busy"}
          className="w-fit rounded-lg bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {state === "busy" ? "Mengirim…" : "Kirim Konfirmasi"}
        </button>

        {state === "error" ? <p className="text-sm text-red-600">{err}</p> : null}
      </form>
    </Section>
  );
}

export function Footer({ text }: { text?: string }) {
  return (
    <footer className="px-6 py-12 text-center opacity-60">
      {text ? <p>{text}</p> : null}
    </footer>
  );
}

function parseTarget(date?: string): number | null {
  if (!date) return null;
  // Tanggal dari form adalah "YYYY-MM-DD" tanpa jam. Tanpa timezone eksplisit
  // `new Date()` akan memperlakukannya sebagai UTC dan countdown bergeser sehari.
  const t = new Date(`${date}T00:00:00+07:00`).getTime();
  return Number.isNaN(t) ? null : t;
}

export function Countdown({ date }: { date?: string }) {
  const [left, setLeft] = useState<string | null>(null);
  const target = parseTarget(date);

  useEffect(() => {
    // Tanggal kosong/tidak valid → jangan render, jangan tampilkan "NaN hari".
    if (target === null) return;

    const tick = () => {
      const diff = Math.max(0, target - Date.now());
      const d = Math.floor(diff / 86_400_000);
      const h = Math.floor((diff % 86_400_000) / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      const s = Math.floor((diff % 60_000) / 1000);
      setLeft(`${d} hari : ${h} jam : ${m} mnt : ${s} dtk`);
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);

  if (target === null) return null;

  return (
    <Section title="Menghitung Hari">
      <p className="text-xl font-semibold">{left ?? "..."}</p>
    </Section>
  );
}
