"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Halaman login.
 *
 * `next` diisi middleware agar user kembali ke halaman yang tadi dibuka
 * (mis. `/dashboard/wedding/<id>/edit`), bukan selalu ke dashboard.
 * Path dari query tetap difilter agar hanya path internal yang diterima
 * (`//evil.com` akan dianggap URL absolut oleh browser).
 */
function LoginForm() {
  const params = useSearchParams();
  const rawNext = params.get("next") ?? "";
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setMsg(error.message);
      setBusy(false);
      return;
    }

    setMsg("Berhasil. Mengalihkan…");
    // full reload supaya server component membaca cookie sesi baru.
    window.location.href = next;
  }

  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <h1 className="text-3xl font-bold">Login</h1>
      {rawNext && rawNext !== "/dashboard" ? (
        <p className="mt-2 text-sm opacity-60">Silakan masuk untuk melanjutkan.</p>
      ) : null}

      <form onSubmit={login} className="mt-6 grid gap-3">
        <label className="grid gap-1">
          <span className="text-sm font-medium">Email</span>
          <input
            type="email"
            required
            autoComplete="email"
            className="rounded-lg border px-3 py-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="grid gap-1">
          <span className="text-sm font-medium">Password</span>
          <input
            type="password"
            required
            autoComplete="current-password"
            className="rounded-lg border px-3 py-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-black px-4 py-2 text-white disabled:opacity-50"
        >
          {busy ? "Memeriksa…" : "Masuk"}
        </button>
      </form>

      {msg ? <p className="mt-3 text-sm opacity-70">{msg}</p> : null}
      <p className="mt-4 text-sm">
        Belum punya akun?{" "}
        <a className="underline" href={`/register?next=${encodeURIComponent(next)}`}>
          Register
        </a>
      </p>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
