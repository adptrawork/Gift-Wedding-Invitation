"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("...");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setMsg(error ? error.message : "Berhasil! Mengalihkan...");
    if (!error) window.location.href = "/dashboard";
  };

  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <h1 className="text-3xl font-bold">Login</h1>
      <form onSubmit={login} className="mt-6 grid gap-3">
        <input className="rounded-lg border px-3 py-2" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="rounded-lg border px-3 py-2" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button className="rounded-lg bg-black px-4 py-2 text-white">Masuk</button>
      </form>
      {msg ? <p className="mt-3 text-sm opacity-70">{msg}</p> : null}
      <p className="mt-4 text-sm">Belum punya akun? <a className="underline" href="/register">Register</a></p>
    </main>
  );
}
