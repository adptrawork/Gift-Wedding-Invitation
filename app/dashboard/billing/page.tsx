"use client";

import { useState } from "react";

const PACKAGES = [
  { id: "basic", name: "Basic", price: 49000, desc: "1 undangan, 20 foto, subdomain" },
  { id: "premium", name: "Premium", price: 99000, desc: "3 undangan, 100 foto, custom domain" },
];

export default function BillingPage() {
  const [weddingId, setWeddingId] = useState("");
  const [msg, setMsg] = useState("");

  const order = async (pkg: (typeof PACKAGES)[number]) => {
    if (!weddingId) {
      setMsg("Isi wedding ID dulu (lihat URL edit).");
      return;
    }
    setMsg("Membuat order...");
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wedding_id: weddingId, amount: pkg.price }),
    });
    const json = await res.json();
    setMsg(res.ok ? `Order ${json.data.id} pending — integrasi Snap/Xendit menyusul (US-018).` : `Gagal: ${JSON.stringify(json.error)}`);
  };

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="text-3xl font-bold">Billing</h1>
      <div className="mt-4 grid gap-2">
        <label className="text-sm font-medium">Wedding ID (dari halaman edit)</label>
        <input className="max-w-md rounded-lg border px-3 py-2" value={weddingId} onChange={(e) => setWeddingId(e.target.value)} placeholder="uuid wedding" />
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {PACKAGES.map((p) => (
          <div key={p.id} className="rounded-2xl border p-6">
            <h2 className="text-xl font-semibold">{p.name}</h2>
            <p className="text-2xl font-bold">Rp {p.price.toLocaleString("id-ID")}</p>
            <p className="text-sm opacity-70">{p.desc}</p>
            <button onClick={() => order(p)} className="mt-4 rounded-lg bg-black px-4 py-2 text-sm text-white">
              Bayar
            </button>
          </div>
        ))}
      </div>
      {msg ? <p className="mt-4 text-sm opacity-70">{msg}</p> : null}
    </main>
  );
}
