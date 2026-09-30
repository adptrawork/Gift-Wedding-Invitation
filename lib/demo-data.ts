/**
 * Data contoh untuk halaman demo dan tombol "Isi contoh" di editor.
 *
 * Semua path gambar menunjuk ke placeholder SVG di `public/demo/`. Placeholder
 * sengaja dibuat lokal (bukan CDN) supaya demo tidak bergantung koneksi luar,
 * dan agar jelas bedanya dengan foto customer sungguhan.
 */
export const DEMO_WEDDING = {
  groom: { name: "Andi", photo: "/demo/portrait.svg" },
  bride: { name: "Sinta", photo: "/demo/portrait-2.svg" },
  hero: { photo: "/demo/cover-gold.svg", subtitle: "The Wedding Celebration" },
  event: {
    date: "2027-05-20",
    time: "10:00",
    venue: "Grand Ballroom Palembang",
    address: "Jl. Merdeka No. 1, Palembang",
    mapsUrl: "https://maps.google.com",
  },
  story: {
    title: "Our Story",
    content: "Berawal dari perkenalan sederhana di kampus, kami tumbuh bersama.",
  },
  gallery: ["/demo/gallery.svg"],
  music: "",
  theme: {
    primary: "#C9A227",
    background: "#FAF7F0",
    text: "#222222",
    fontHeading: "Playfair Display, serif",
    fontBody: "Inter, sans-serif",
  },
};

export const DEMO_GIFT = {
  recipient: { name: "Bunda Ratna", photo: "/demo/portrait.svg" },
  cover: { photo: "/demo/cover-gift.svg", title: "Kado Spesial Untukmu" },
  message: {
    title: "Pesan Spesial",
    content: "Terima kasih atas semua kasih sayangmu.",
  },
  gift: { type: "wedding", amount: "500000", note: "Amplop digital" },
  music: "",
  theme: {
    primary: "#B76E79",
    background: "#FFF9F7",
    text: "#333333",
    fontHeading: "Playfair Display, serif",
    fontBody: "Inter, sans-serif",
  },
};
