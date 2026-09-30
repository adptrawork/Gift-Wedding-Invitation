/** @type {import('next').NextConfig} */
const nextConfig = {
  // `next dev` (dari web_extra_daemons) dan `next build` TIDAK boleh berbagi
  // satu direktori output. Keduanya menulis hasil kompilasi ke `.next/server`,
  // dan kalau berjalan bersamaan satu menimpa yang lain: build gagal dengan
  // "Cannot find module for page" atau dev server balas 500 untuk semua
  // request. Jadi build produksi memakai direktori sendiri.
  //
  // Hanya berlaku di luar Vercel. Di Vercel, `distDir` harus tetap `.next`:
  // platform itu mencari `.next/routes-manifest.json` dengan path yang sudah
  // ditentukan, dan build gagal kalau dipindah.
  ...(process.env.NEXT_DIST_DIR && !process.env.VERCEL
    ? { distDir: process.env.NEXT_DIST_DIR }
    : {}),

  // Host lokal DDEV diakses lewat ddev-router, jadi browser perceive origin
  // `gift-wedding.ddev.site` sementara dev server bind ke localhost. Tanpa
  // daftar ini Next.js memperingatkan bahwa request /_next/* lintas origin, dan
  // akan mulai menolaknya di major version berikutnya.
  allowedDevOrigins: [
    "gift-wedding.ddev.site",
    "admin.gift-wedding.ddev.site",
    "preview.gift-wedding.ddev.site",
  ],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "**.supabase.in" },
    ],
  },
};

export default nextConfig;
