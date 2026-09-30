import { NextResponse, type NextRequest } from "next/server";

// US-019: parsing host untuk subdomain (slug.platform.com) & custom domain.
// MVP: teruskan ke routing [slug]; lookup domain dilakukan di page via wedding_domains.
export function middleware(req: NextRequest) {
  const host = req.headers.get("host") ?? "";
  const base = process.env.NEXT_PUBLIC_BASE_DOMAIN ?? "";
  const res = NextResponse.next();
  if (base && host.endsWith(`.${base}`)) {
    const sub = host.slice(0, -(`.${base}`.length));
    if (sub && sub !== "www") res.headers.set("x-wedding-subdomain", sub);
  }
  return res;
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
