"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Tombol Keluar.
 *
 * `signOut()` menghapus sesi di Supabase, tapi header di layout akar masih
 * menampilkan hasil render server sebelumnya. Karena itu router.push +
 * router.refresh() dipanggil supaya server merender ulang header berdasarkan
 * sesi yang baru.
 */
export function LogoutButton({ className }: { className?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function logout() {
    setBusy(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    // Halaman tujuan harus bisa diakses tamu, jadi middleware tidak boleh
    // sempat memantulkan balik ke /login.
    router.push("/");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={logout}
      disabled={busy}
      className={
        className ??
        "rounded-lg border px-3 py-1.5 disabled:opacity-60"
      }
    >
      {busy ? "Keluar…" : "Keluar"}
    </button>
  );
}