"use client";

import Link from "next/link";
import { useState } from "react";
import { Marquee } from "@/components/ui/marquee";
import { GradientText } from "@/components/ui/gradient-text";

const TEMPLATES = [
  { name: "Luxury Gold", slug: "luxury-gold", desc: "Elegan dengan aksen emas" },
  { name: "Modern Minimal", slug: "modern-minimal", desc: "Bersih dan kontemporer" },
  { name: "Romantic Garden", slug: "romantic-garden", desc: "Nuansa taman yang hangat" },
  { name: "Wedding Gift", slug: "wedding-gift", desc: "Untuk kado spesial pernikahan" },
  { name: "Birthday Gift", slug: "birthday-gift", desc: "Ceria untuk ulang tahun" },
];

const FEATURES = [
  { title: "Template Engine", desc: "Pilih dari berbagai template siap pakai yang bisa dikustomisasi." },
  { title: "RSVP Online", desc: "Tamu bisa konfirmasi kehadiran langsung dari undangan digital." },
  { title: "Gift Registry", desc: "Terima kado digital dengan mudah dan aman." },
  { title: "Custom Domain", desc: "Gunakan domain sendiri untuk undangan yang lebih profesional." },
  { title: "Music & Animasi", desc: "Tambahkan musik latar dan animasi GSAP yang memukau." },
  { title: "Responsive", desc: "Tampil sempurna di semua perangkat, mobile atau desktop." },
];

const STEPS = [
  { step: "1", title: "Pilih Template", desc: "Pilih dari koleksi template yang sudah didesain profesional." },
  { step: "2", title: "Isi Konten", desc: "Tambahkan foto, cerita, dan detail acara Anda." },
  { step: "3", title: "Bagikan", desc: "Bagikan link undangan ke tamu Anda." },
];

export function HomeSections() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-amber-50 via-white to-rose-50 px-6 py-24 text-center">
        <h1 className="text-5xl font-bold tracking-tight text-neutral-900 sm:text-6xl">
          <GradientText from="#d97706" to="#be123c">
            Undangan Digital
          </GradientText>
          <br />
          <span className="text-neutral-700">yang Berkesan</span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-neutral-600">
          Buat undangan pernikahan &amp; kado digital yang elegan, interaktif, dan mudah dibagikan.
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <Link href="/register" className="rounded-xl bg-neutral-900 px-6 py-3 text-white transition hover:bg-neutral-800">
            Mulai Gratis
          </Link>
          <Link href="/demo-wedding-gift" className="rounded-xl border border-neutral-300 px-6 py-3 text-neutral-700 transition hover:bg-neutral-100">
            Lihat Demo
          </Link>
        </div>
      </section>

      {/* Templates */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="text-center text-3xl font-bold text-neutral-900">Pilih Template Favoritmu</h2>
        <p className="mx-auto mt-3 max-w-lg text-center text-neutral-500">Setiap template dirancang dengan tema unik yang bisa disesuaikan.</p>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {TEMPLATES.map((t) => (
            <Link key={t.slug} href={`/demo-${t.slug}`} className="group rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition hover:shadow-md">
              <div className="mb-4 h-32 rounded-xl bg-gradient-to-br from-amber-100 to-rose-100" />
              <h3 className="text-lg font-semibold text-neutral-900 group-hover:text-amber-700">{t.name}</h3>
              <p className="mt-1 text-sm text-neutral-500">{t.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Marquee divider */}
      <Marquee className="bg-neutral-900 py-3 text-sm text-white" repeat={6}>
        <span className="mx-6">✦ Wedding ✦ Gift ✦ RSVP ✦ Custom Domain ✦ Music ✦ Animasi ✦</span>
      </Marquee>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="text-center text-3xl font-bold text-neutral-900">Fitur Lengkap untuk Undangannmu</h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-2xl border border-neutral-200 bg-white p-6">
              <div className="mb-3 h-10 w-10 rounded-xl bg-amber-100" />
              <h3 className="font-semibold text-neutral-900">{f.title}</h3>
              <p className="mt-1 text-sm text-neutral-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Steps */}
      <section className="bg-white px-6 py-20">
        <h2 className="text-center text-3xl font-bold text-neutral-900">Cara Membuat Undangan</h2>
        <div className="mx-auto mt-10 grid max-w-4xl gap-8 md:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.step} className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-neutral-900 text-xl font-bold text-white">{s.step}</div>
              <h3 className="mt-4 text-lg font-semibold text-neutral-900">{s.title}</h3>
              <p className="mt-1 text-sm text-neutral-500">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-6 py-20">
        <h2 className="text-center text-3xl font-bold text-neutral-900">Pertanyaan Umum</h2>
        <div className="mt-10 space-y-4">
          {[
            { q: "Apakah bisa gratis?", a: "Ya, Anda bisa mulai dengan paket gratis yang sudah termasuk 1 undangan." },
            { q: "Berapa lama undangan bisa diakses?", a: "Undangan akan tetap aktif selama 1 tahun setelah pernikahan." },
            { q: "Bisakah pakai domain sendiri?", a: "Tentu! Paket premium mendukung custom domain dengan mudah." },
            { q: "Apakah aman menerima kado?", a: "Ya, kami bekerja sama dengan payment gateway terpercaya." },
          ].map((item, i) => (
            <button
              key={i}
              onClick={() => setOpenFaq(openFaq === i ? null : i)}
              className="w-full rounded-xl border border-neutral-200 bg-white p-4 text-left transition hover:bg-neutral-50"
            >
              <span className="font-medium text-neutral-900">{item.q}</span>
              {openFaq === i && <p className="mt-2 text-sm text-neutral-500">{item.a}</p>}
            </button>
          ))}
        </div>
      </section>

      {/* CTA Footer */}
      <section className="bg-neutral-900 px-6 py-16 text-center">
        <h2 className="text-3xl font-bold text-white">Siap Membuat Undangan?</h2>
        <p className="mx-auto mt-3 max-w-md text-neutral-400">Mulai sekarang dan buat momen spesial Anda lebih berkesan.</p>
        <Link href="/register" className="mt-6 inline-block rounded-xl bg-white px-8 py-3 font-semibold text-neutral-900 transition hover:bg-neutral-200">
          Daftar Sekarang
        </Link>
      </section>
    </div>
  );
}
