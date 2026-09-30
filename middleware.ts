import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Middleware.
 *
 * 1. Refresh sesi Supabase di SEMUA route (bukan hanya yang dilindungi), supaya
 *    `auth.getUser()` di server component selalu punya cookie yang valid.
 * 2. Proteksi route: `/dashboard` dan `/admin` butuh login. Undangan tamu
 *    (`/[slug]`) tetap publik.
 * 3. Subdomain / custom domain → rewrite root ke `/{slug}`.
 */

function baseDomain(): string | null {
  const raw = process.env.NEXT_PUBLIC_BASE_DOMAIN?.split(":")[0];
  return raw ? raw : null;
}

/** Subdomain dari host, mis. "andi-sinta" dari "andi-sinta.platform.com". */
function subdomainOf(req: NextRequest): string | null {
  const base = baseDomain();
  if (!base) return null;

  const host = (req.headers.get("host") ?? "").split(":")[0].toLowerCase();
  if (!host.endsWith(`.${base}`)) return null;

  const sub = host.slice(0, -(base.length + 1));
  return sub && sub !== "www" ? sub : null;
}

/**
 * Salin cookie dari response hasil refresh sesi ke response yang kita kirim.
 *
 * ResponseCookies di Next 14 tidak punya `setAll`, jadi disalin manual. Kalau
 * ini dilewatkan, browser dan server keluar sync dan sesi bisa terputus.
 */
function carryCookies(from: NextResponse, to: NextResponse): void {
  for (const cookie of from.cookies.getAll()) {
    to.cookies.set(cookie);
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const { response: sessionResponse, authenticated } = await updateSession(req);

  // --- 3. Subdomain / custom domain → /{slug} ---------------------------
  //
  // Hanya root yang di-rewrite. Undangan memang satu halaman, jadi sub-path
  // lain tidak perlu dipetakan — dan membiarkannya 404 lebih jujur daripada
  // memakai catch-all: dengan catch-all, domain.com/<apa-saja> akan membalas 200
  // dengan isi yang sama dan mesin pencari akan mengindeks tak Terbatas URL
  // duplikat. Kalau nanti ada fitur multi-halaman (album, buku tamu), tambahkan
  // `app/[slug]/[[...path]]` saat itu juga.
  const sub = subdomainOf(req);
  if (sub && pathname === "/") {
    const url = req.nextUrl.clone();
    url.pathname = `/${sub}`;
    const rewritten = NextResponse.rewrite(url, { request: req });
    carryCookies(sessionResponse, rewritten);
    return rewritten;
  }

  // --- 2. Proteksi route -----------------------------------------------
  const needsAuth = pathname.startsWith("/dashboard") || pathname.startsWith("/admin");

  if (needsAuth && !authenticated) {
    const url = req.nextUrl.clone();
    // Kembalikan user ke halaman yang tadi dibuka setelah login.
    url.pathname = "/login";
    url.search = "";
    url.searchParams.set("next", pathname);
    const redirect = NextResponse.redirect(url);
    carryCookies(sessionResponse, redirect);
    return redirect;
  }

  return sessionResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
