"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function RegisterForm() {
  const params = useSearchParams();
  const rawNext = params.get("next") ?? "";
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function register(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    setErr("");

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });

    if (error) {
      setErr(error.message);
      setBusy(false);
      return;
    }

    // Kalau email confirmation dimatikan di Supabase, sesi langsung aktif.
    if (data.session) {
      window.location.href = next;
      return;
    }

    setMsg("Cek email untuk verifikasi, lalu login.");
    setBusy(false);
  }

  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <h1 className="text-3xl font-bold">Register</h1>
      <form onSubmit={register} className="mt-6 grid gap-3">
        <label className="grid gap-1">
          <span className="text-sm font-medium">Nama lengkap</span>
          <input
            required
            autoComplete="name"
            className="rounded-lg border px-3 py-2"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </label>
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
            minLength={8}
            autoComplete="new-password"
            className="rounded-lg border px-3 py-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <span className="text-xs opacity-60">Minimal 8 karakter.</span>
        </label>
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-black px-4 py-2 text-white disabled:opacity-50"
        >
          {busy ? "Mendaftarkan…" : "Daftar"}
        </button>
      </form>

      {msg ? <p className="mt-3 text-sm text-green-700">{msg}</p> : null}
      {err ? <p className="mt-3 text-sm text-red-600">{err}</p> : null}
      <p className="mt-4 text-sm">
        Sudah punya akun?{" "}
        <a className="underline" href={`/login?next=${encodeURIComponent(next)}`}>
          Login
        </a>
      </p>
    </main>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
