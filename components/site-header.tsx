import Link from "next/link";
import { LogoutButton } from "@/components/logout-button";
import { createClient } from "@/lib/supabase/server";

/**
 * Header situs, sesuai status sesi.
 *
 * Sebelumnya header ini ditulis statis di `app/layout.tsx` dengan teks "Login"
 * yang di-hardcode, sehingga tombol itu tetap muncul untuk pengguna yang sudah
 * masuk dan tidak ada cara keluar sama sekali.
 *
 * Header ini Server Component yang membaca sesi lewat cookie. Halaman yang
 * memakainya sudah `force-dynamic` semua (`/`, `/[slug]`, `/dashboard`, `/admin`),
 * jadi membaca cookie tidak costing apa pun: tidak ada build statis yang
 *adiation.
 *
 * `middleware.ts` sudah me-refresh sesi di semua route sebelum halaman dirender,
 * jadi `getUser()` di sini tidak perlu memanggil network setiap kali.
 */
async function session() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { email: null, role: null };

  // Role tidak ada di JWT, jadi dibaca dari tabel profiles. Query ini mengikuti
  // RLS: user hanya boleh membaca barisnya sendiri, admin barisnya sendiri.
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  return {
    email: user.email ?? null,
    role: (profile as { role?: string } | null)?.role ?? "customer",
  };
}

export async function SiteHeader() {
  const { email, role } = await session();
  const masuk = email !== null;

  return (
    <header className="sticky top-0 z-50 border-b border-neutral-200/60 bg-white/80 backdrop-blur-md">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-xl font-bold tracking-tight">
          💒 <span className="bg-gradient-to-r from-amber-600 to-rose-600 bg-clip-text text-transparent">Gift &amp; Wedding</span>
        </Link>
        <div className="flex items-center gap-5 text-sm">
          {masuk ? (
            <>
              <Link href="/dashboard" className="text-neutral-600 transition hover:text-neutral-900">Dashboard</Link>
              <Link href="/dashboard/billing" className="text-neutral-600 transition hover:text-neutral-900">Billing</Link>
              {role === "admin" ? <Link href="/admin/templates" className="text-neutral-600 transition hover:text-neutral-900">Admin</Link> : null}
              <span className="hidden max-w-40 truncate text-neutral-400 sm:inline">
                {email}
              </span>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link href="/login" className="text-neutral-600 transition hover:text-neutral-900">Masuk</Link>
              <Link
                href="/register"
                className="rounded-xl bg-gradient-to-r from-amber-600 to-rose-600 px-4 py-2 text-white transition hover:opacity-90"
              >
                Daftar
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}