import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Refresh sesi Supabase + parsing host untuk subdomain (US-019).
// Proteksi: /dashboard dan /admin butuh login, sisanya publik
// (undangan tamu TANPA login).
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const needsAuth = pathname.startsWith("/dashboard") || pathname.startsWith("/admin");

  const res = needsAuth ? await updateSession(req) : NextResponse.next({ request: req });
  if (needsAuth && res.headers.get("location")?.includes("/auth/login")) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // US-019: tandai subdomain (slug.platform.com) untuk page [slug]
  const host = req.headers.get("host") ?? "";
  const base = process.env.NEXT_PUBLIC_BASE_DOMAIN ?? "";
  const bareBase = base.split(":")[0];
  if (bareBase && host.endsWith(`.${bareBase}`)) {
    const sub = host.slice(0, -(`.${bareBase}`.length));
    if (sub && sub !== "www") res.headers.set("x-wedding-subdomain", sub);
  }
  return res;
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
