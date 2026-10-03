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
    <header className="sticky top-0 z-50 border-b border-pink-100/60 bg-[#FDF2F8]/80 backdrop-blur-md">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="font-[var(--font-great-vibes)] text-3xl text-[#831843]">
          Gift &amp; Wedding
        </Link>
        <div className="flex items-center gap-5 text-sm">
          {masuk ? (
            <>
              <Link href="/dashboard" className="text-[#475569] transition hover:text-[#DB2777]">Dashboard</Link>
              <Link href="/dashboard/billing" className="text-[#475569] transition hover:text-[#DB2777]">Billing</Link>
              {role === "admin" ? <Link href="/admin/templates" className="text-[#475569] transition hover:text-[#DB2777]">Admin</Link> : null}
              <span className="hidden max-w-40 truncate text-[#A16207] sm:inline">
                {email}
              </span>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link href="/login" className="text-[#475569] transition hover:text-[#DB2777]">Masuk</Link>
              <Link
                href="/register"
                className="rounded-full bg-[#DB2777] px-5 py-2 text-white shadow-md shadow-pink-200 transition hover:bg-[#BE185D]"
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