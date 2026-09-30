"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [msg, setMsg] = useState("");

  const register = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("...");
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    setMsg(error ? error.message : "Cek email untuk verifikasi, lalu login.");
  };

  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <h1 className="text-3xl font-bold">Register</h1>
      <form onSubmit={register} className="mt-6 grid gap-3">
        <input className="rounded-lg border px-3 py-2" placeholder="Nama lengkap" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        <input className="rounded-lg border px-3 py-2" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="rounded-lg border px-3 py-2" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button className="rounded-lg bg-black px-4 py-2 text-white">Daftar</button>
      </form>
      {msg ? <p className="mt-3 text-sm opacity-70">{msg}</p> : null}
      <p className="mt-4 text-sm">Sudah punya akun? <a className="underline" href="/login">Login</a></p>
    </main>
  );
}
