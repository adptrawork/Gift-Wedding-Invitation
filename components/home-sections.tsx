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

const TESTIMONIALS = [
  { name: "Andi & Sinta", role: "Menikah 2024", text: "Undangan digital ini membuat hari pernikahan kami semakin spesial!" },
  { name: "Bima & Dewi", role: "Menikah 2025", text: "Template Luxury Gold-nya sangat elegan, tamu-tamu kami memuji desainnya." },
  { name: "Citra & Fajar", role: "Menikah 2025", text: "Fitur RSVP online sangat membantu kami mengatur kapasitas acara." },
];

const FAQS = [
  { q: "Apakah bisa gratis?", a: "Ya, Anda bisa mulai dengan paket gratis yang sudah termasuk 1 undangan." },
  { q: "Berapa lama undangan bisa diakses?", a: "Undangan akan tetap aktif selama 1 tahun setelah pernikahan." },
  { q: "Bisakah pakai domain sendiri?", a: "Tentu! Paket premium mendukung custom domain dengan mudah." },
  { q: "Apakah aman menerima kado?", a: "Ya, kami bekerja sama dengan payment gateway terpercaya." },
];

export function HomeSections() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-[#FDF2F8] font-[var(--font-cormorant)]">
      {/* Hero */}
      <section className="relative overflow-hidden px-6 py-28 text-center">
        <div className="absolute inset-0 bg-gradient-to-b from-pink-100/60 via-transparent to-transparent" />
        <h1 className="relative font-[var(--font-great-vibes)] text-6xl text-[#831843] sm:text-7xl">
          Undangan Digital
        </h1>
        <p className="relative mt-4 text-2xl text-[#A16207]">yang Berkesan &amp; Elegan</p>
        <p className="relative mx-auto mt-6 max-w-xl text-lg text-[#475569]">
          Buat undangan pernikahan &amp; kado digital yang memukau, interaktif, dan mudah dibagikan.
        </p>
        <div className="relative mt-10 flex items-center justify-center gap-4">
          <Link href="/register" className="rounded-full bg-[#DB2777] px-8 py-3 text-white shadow-lg shadow-pink-200 transition hover:bg-[#BE185D] hover:shadow-xl">
            Mulai Gratis
          </Link>
          <Link href="/demo-wedding-gift" className="rounded-full border-2 border-[#DB2777] px-8 py-3 text-[#DB2777] transition hover:bg-pink-50">
            Lihat Demo
          </Link>
        </div>
      </section>

      {/* Marquee */}
      <Marquee className="bg-[#831843] py-3 text-sm text-white" repeat={6}>
        <span className="mx-6">✦ Wedding ✦ Gift ✦ RSVP ✦ Custom Domain ✦ Music ✦ Animasi ✦</span>
      </Marquee>

      {/* Templates */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="text-center font-[var(--font-great-vibes)] text-5xl text-[#831843]">Pilih Template Favoritmu</h2>
        <p className="mx-auto mt-3 max-w-lg text-center text-[#475569]">Setiap template dirancang dengan tema unik yang bisa disesuaikan.</p>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {TEMPLATES.map((t) => (
            <Link key={t.slug} href={`/demo-${t.slug}`} className="group rounded-3xl border border-pink-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
              <div className="mb-4 h-40 rounded-2xl bg-gradient-to-br from-pink-100 to-amber-100" />
              <h3 className="text-xl font-semibold text-[#831843] group-hover:text-[#DB2777]">{t.name}</h3>
              <p className="mt-1 text-sm text-[#475569]">{t.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="bg-white px-6 py-20">
        <h2 className="text-center font-[var(--font-great-vibes)] text-5xl text-[#831843]">Fitur Lengkap</h2>
        <div className="mx-auto mt-12 grid max-w-6xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-3xl border border-pink-100 bg-[#FDF2F8] p-6 transition hover:-translate-y-1 hover:shadow-md">
              <div className="mb-4 h-12 w-12 rounded-2xl bg-pink-200" />
              <h3 className="text-lg font-semibold text-[#831843]">{f.title}</h3>
              <p className="mt-1 text-sm text-[#475569]">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Steps */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="text-center font-[var(--font-great-vibes)] text-5xl text-[#831843]">Cara Membuat</h2>
        <div className="mx-auto mt-12 grid max-w-4xl gap-10 md:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.step} className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#DB2777] text-2xl font-bold text-white shadow-lg shadow-pink-200">{s.step}</div>
              <h3 className="mt-5 text-xl font-semibold text-[#831843]">{s.title}</h3>
              <p className="mt-2 text-sm text-[#475569]">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-white px-6 py-20">
        <h2 className="text-center font-[var(--font-great-vibes)] text-5xl text-[#831843]">Apa Kata Mereka</h2>
        <div className="mx-auto mt-12 grid max-w-5xl gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <div key={i} className="rounded-3xl border border-pink-100 bg-[#FDF2F8] p-6 text-center">
              <p className="italic text-[#475569]">&ldquo;{t.text}&rdquo;</p>
              <p className="mt-4 font-semibold text-[#831843]">{t.name}</p>
              <p className="text-sm text-[#A16207]">{t.role}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-6 py-20">
        <h2 className="text-center font-[var(--font-great-vibes)] text-5xl text-[#831843]">Pertanyaan Umum</h2>
        <div className="mt-12 space-y-4">
          {FAQS.map((item, i) => (
            <button
              key={i}
              onClick={() => setOpenFaq(openFaq === i ? null : i)}
              className="w-full rounded-2xl border border-pink-100 bg-white p-5 text-left transition hover:bg-pink-50"
            >
              <span className="text-lg font-medium text-[#831843]">{item.q}</span>
              {openFaq === i && <p className="mt-2 text-sm text-[#475569]">{item.a}</p>}
            </button>
          ))}
        </div>
      </section>

      {/* CTA Footer */}
      <section className="bg-[#831843] px-6 py-20 text-center">
        <h2 className="font-[var(--font-great-vibes)] text-5xl text-white">Siap Membuat Undangan?</h2>
        <p className="mx-auto mt-4 max-w-md text-pink-200">Mulai sekarang dan buat momen spesial Anda lebih berkesan.</p>
        <Link href="/register" className="mt-8 inline-block rounded-full bg-white px-10 py-4 text-lg font-semibold text-[#831843] transition hover:bg-pink-50">
          Daftar Sekarang
        </Link>
      </section>
    </div>
  );
}
