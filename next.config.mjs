/** @type {import('next').NextConfig} */
const nextConfig = {
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
