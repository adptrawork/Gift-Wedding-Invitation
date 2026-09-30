import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refresh sesi Supabase untuk setiap request.
 *
 * Sengaja TIDAK melakukan redirect di sini. Undangan tamu adalah halaman
 * publik: memaksa semua request anonim ke halaman login akan membuat undangan
 * tidak bisa dibuka tanpa akun. Keputusan "mana yang perlu login" diambil di
 * `middleware.ts`.
 *
 * Mengembalikan response yang sudah membawa cookie sesi terbaru. Kalau response
 * perlu diganti (redirect/rewrite), WAJIB menyalin cookie dari sini:
 *   `newResponse.cookies.setAll(response.cookies.getAll())`
 */
export async function updateSession(
  request: NextRequest
): Promise<{ response: NextResponse; authenticated: boolean }> {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Jangan menulis kode antara createServerClient dan getClaims() — itu membuat
  // sesiuser terlogout secara inexplicable.
  const { data } = await supabase.auth.getClaims();

  return { response: supabaseResponse, authenticated: Boolean(data?.claims) };
}
