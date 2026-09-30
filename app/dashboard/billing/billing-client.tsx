"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PLANS, formatIDR } from "@/lib/plans";

interface Wedding {
  id: string;
  slug: string;
  title: string;
  status: string;
}

interface Order {
  id: string;
  wedding_id: string | null;
  plan_id: string | null;
  amount: number;
  status: string;
  created_at: string;
  /** Kode channel Duitku yang dipakai, mis. "BC". */
  payment_method: string | null;
  /** Hanya dikirim server kalau invoice masih berlaku. */
  payment_url: string | null;
  /** Order pending tanpa tautan bayar — harus bikin invoice baru. */
  perlu_invoice_baru: boolean;
  weddings: { slug: string; title: string } | null;
}

/** Label status supaya tabel tidak menampilkan string mentah dari database. */
const STATUS: Record<string, { label: string; className: string }> = {
  paid: { label: "Lunas", className: "bg-emerald-50 text-emerald-800" },
  pending: { label: "Menunggu bayar", className: "bg-amber-50 text-amber-800" },
  failed: { label: "Gagal", className: "bg-red-50 text-red-700" },
  expired: { label: "Kedaluwarsa", className: "bg-neutral-100 text-neutral-600" },
};

interface Channel {
  code: string;
  name: string;
  fee: string;
}

export default function BillingClient() {
  const params = useSearchParams();
  const [weddings, setWeddings] = useState<Wedding[]>([]);
  const [weddingId, setWeddingId] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [verifying, setVerifying] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const [channels, setChannels] = useState<Channel[]>([]);
  const [channel, setChannel] = useState("");

  // Duitku mengarahkan balik ke sini dengan ?from=duitku. Status TIDAK boleh
  // diambil dari redirect — dokumentasi Duitku menyatakan resultCode bisa
  // diubah manual oleh customer. Sumber kebenaran tetap webhook.
  const returnedFromGateway = params.get("from") === "duitku";

  const load = useCallback(async () => {
    const [w, o, c] = await Promise.all([
      fetch("/api/weddings")
        .then((r) => r.json())
        .catch(() => ({ data: [] })),
      fetch("/api/orders")
        .then((r) => r.json())
        .catch(() => ({ data: [] })),
      // Channel boleh gagal (mis. Duitku belum dikonfigurasi) — halaman
      // billing tetap harus usable untuk melihat riwayat order.
      fetch("/api/payments/channels")
        .then((r) => r.json())
        .catch(() => ({ data: [] })),
    ]);
    setWeddings((w.data ?? []) as Wedding[]);
    setOrders((o.data ?? []) as Order[]);
    const list = (c.data ?? []) as Channel[];
    setChannels(list);
    setChannel((prev) => (prev && list.some((x) => x.code === prev) ? prev : (list[0]?.code ?? "")));
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Order yang baru dibuat belum tentu webhook-nya sudah sampai, jadi muat
  // ulang sekali setelah user kembali dari gateway.
  useEffect(() => {
    if (returnedFromGateway) void load();
  }, [returnedFromGateway, load]);

  /**
   * Tanya Duitku langsung tentang satu order. Dipakai manual karena API
   * transactionStatus punya rate limit dan tidak boleh dipanggil otomatis.
   */
  async function verify(orderId: string) {
    setVerifying(orderId);
    setMsg("");
    try {
      const res = await fetch(`/api/orders/${orderId}/verify`, { method: "POST" });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        setMsg(json.error ?? `Gagal cek status (${res.status}).`);
        return;
      }
      await load();
    } catch {
      setMsg("Koneksi bermasalah.");
    } finally {
      setVerifying(null);
    }
  }

  /**
   * Batalkan order yang belum dibayar.
   *
   * Order `paid` ditolak server dengan 409 — disable di sini hanya supaya
   * tombolnya tidak muncul, bukan sebagai penjaga.
   */
  async function cancel(orderId: string) {
    setCancelling(orderId);
    setMsg("");
    try {
      const res = await fetch(`/api/orders/${orderId}`, { method: "DELETE" });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        setMsg(json.error ?? `Gagal membatalkan (${res.status}).`);
        return;
      }
      await load();
    } catch {
      setMsg("Koneksi bermasalah.");
    } finally {
      setCancelling(null);
    }
  }

  /**
   * Buat invoice baru dan langsung arahkan ke halaman bayar Duitku.
   *
   * `weddingOverride` dipakai tombol "Buat invoice baru" di baris order:
   * order lama bisa punya undangan sendiri, dan itu harus tetap terpilih
   * walau select di atas menunjuk undangan lain.
   */
  async function checkout(planId: string, weddingOverride?: string | null) {
    const wedding = weddingOverride ?? weddingId;
    if (!wedding) {
      setMsg("Pilih undangan dulu.");
      return;
    }
    if (!channel) {
      setMsg("Pilih metode pembayaran dulu.");
      return;
    }
    setBusy(planId);
    setMsg("");

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Kirim plan_id + kode channel saja. Harga ditentukan server dari
        // katalog, dan kode channel divalidasi ulang di server.
        body: JSON.stringify({
          wedding_id: wedding,
          plan_id: planId,
          payment_method: channel,
        }),
      });
      const json = (await res.json()) as { redirect_url?: string; error?: unknown };

      if (!res.ok) {
        setMsg(
          typeof json.error === "string" ? json.error : `Gagal membuat order (${res.status}).`
        );
        return;
      }
      if (json.redirect_url) {
        window.location.href = json.redirect_url;
        return;
      }
      setMsg("Order dibuat, tapi gateway tidak mengembalikan URL.");
      void load();
    } catch {
      setMsg("Koneksi bermasalah.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="text-3xl font-bold">Billing</h1>

      {returnedFromGateway ? (
        <p className="mt-3 rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-800">
          Kembali dari halaman pembayaran Duitku. Status final ditentukan dari
          notifikasi webhook, jadi biasanya perlu beberapa detik sebelum berubah di
          tabel di bawah. Muat ulang halaman bila belum sesuai.
        </p>
      ) : null}

      <div className="mt-6 grid gap-2">
        <label className="text-sm font-medium" htmlFor="wedding">
          Paket untuk undangan
        </label>
        <select
          id="wedding"
          className="max-w-md rounded-lg border bg-white px-3 py-2"
          value={weddingId}
          onChange={(e) => setWeddingId(e.target.value)}
        >
          <option value="">— pilih undangan —</option>
          {weddings.map((w) => (
            <option key={w.id} value={w.id}>
              {w.title} (/{w.slug}) — {w.status}
            </option>
          ))}
        </select>
        {weddings.length === 0 ? (
          <p className="text-sm opacity-60">
            Belum ada undangan.{" "}
            <a className="underline" href="/dashboard/wedding/create">
              Buat dulu
            </a>
            .
          </p>
        ) : null}
      </div>

      <div className="mt-4 grid gap-2">
        <label className="text-sm font-medium" htmlFor="channel">
          Metode pembayaran
        </label>
        <select
          id="channel"
          className="max-w-md rounded-lg border bg-white px-3 py-2"
          value={channel}
          onChange={(e) => setChannel(e.target.value)}
          disabled={channels.length === 0}
        >
          {channels.length === 0 ? (
            <option value="">— memuat metode pembayaran… —</option>
          ) : (
            channels.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))
          )}
        </select>
        <p className="text-sm opacity-60">
          Metode yang ditampilkan mengikuti channel yang aktif di project Duitku
          Anda.
        </p>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {PLANS.map((p) => (
          <div key={p.id} className="flex flex-col rounded-2xl border p-6">
            <h2 className="text-xl font-semibold">{p.name}</h2>
            <p className="text-2xl font-bold">{formatIDR(p.amount)}</p>
            <p className="text-sm opacity-70">{p.description}</p>
            <ul className="mt-3 grid gap-1 text-sm opacity-80">
              {p.features.map((f) => (
                <li key={f}>· {f}</li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => checkout(p.id)}
              disabled={busy === p.id || !weddingId || !channel}
              className="mt-4 w-fit rounded-lg bg-black px-4 py-2 text-sm text-white disabled:opacity-40"
            >
              {busy === p.id ? "Membuat order…" : "Bayar"}
            </button>
          </div>
        ))}
      </div>

      {msg ? <p className="mt-4 text-sm opacity-70">{msg}</p> : null}

      <section className="mt-10">
        <h2 className="text-xl font-semibold">Riwayat order</h2>
        <p className="mt-1 text-sm opacity-60">
          Order menunggu bayar bisa dilanjutkan ke halaman Duitku, dicek, atau dibatalkan.
          Order yang sudah kedaluwarsa tidak bisa dihidupkan kembali — pilih paket di atas
          untuk membuat invoice baru.
        </p>
        {orders.length === 0 ? (
          <p className="mt-2 text-sm opacity-60">Belum ada order.</p>
        ) : (
          <table className="mt-3 w-full text-left text-sm">
            <thead>
              <tr className="border-b">
                <th className="py-2">Tanggal</th>
                <th>Undangan</th>
                <th>Metode</th>
                <th>Nominal</th>
                <th>Status</th>
                <th className="text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => {
                const badge = STATUS[o.status] ?? {
                  label: o.status,
                  className: "bg-neutral-100 text-neutral-700",
                };
                return (
                  <tr key={o.id} className="border-b align-top">
                    <td className="py-2 whitespace-nowrap">
                      {new Date(o.created_at).toLocaleDateString("id-ID")}
                    </td>
                    <td>
                      {o.wedding_id ? (
                        <a className="underline" href={`/dashboard/wedding/${o.wedding_id}/edit`}>
                          {o.weddings?.title ?? o.weddings?.slug ?? "Lihat"}
                        </a>
                      ) : (
                        "—"
                      )}
                      <span className="block font-mono text-xs opacity-50">{o.plan_id ?? "—"}</span>
                    </td>
                    <td className="font-mono text-xs">{o.payment_method ?? "—"}</td>
                    <td className="whitespace-nowrap">{formatIDR(o.amount)}</td>
                    <td>
                      <span className={`rounded-full px-2 py-0.5 text-xs ${badge.className}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="py-2">
                      {o.status === "pending" ? (
                        <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1">
                          {/* Invoice masih hidup: tautan ke halaman bayar Duitku
                              masih berlaku, jadi ini jalan paling langsung. */}
                          {o.payment_url ? (
                            <a
                              href={o.payment_url}
                              className="rounded-lg bg-neutral-900 px-3 py-1.5 text-xs text-white transition-transform active:translate-y-px"
                            >
                              Lanjut bayar
                            </a>
                          ) : null}
                          {/* Invoice sudah mati atau order dibuat sebelum kolom
                              payment_url ada. Duitku tidak menghidupkan kembali
                              invoice lama, dan merchantOrderId tidak bisa
                              dipakai ulang, jadi satu-satunya jalan adalah
                              invoice BARU — bukan tautan yang sama. */}
                          {!o.payment_url && o.perlu_invoice_baru ? (
                            <button
                              type="button"
                              onClick={() => checkout(o.plan_id ?? "", o.wedding_id)}
                              disabled={busy === o.plan_id || !o.plan_id}
                              title="Buat invoice baru untuk paket ini dan buka halaman bayar Duitku"
                              className="rounded-lg bg-neutral-900 px-3 py-1.5 text-xs text-white transition-transform active:translate-y-px disabled:opacity-40"
                            >
                              {busy === o.plan_id ? "Membuat…" : "Buat invoice baru"}
                            </button>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => verify(o.id)}
                            disabled={verifying === o.id}
                            className="text-xs underline disabled:opacity-40"
                          >
                            {verifying === o.id ? "Cek…" : "Cek status"}
                          </button>
                          <button
                            type="button"
                            onClick={() => cancel(o.id)}
                            disabled={cancelling === o.id}
                            className="text-xs underline opacity-60 hover:opacity-100 disabled:opacity-40"
                          >
                            {cancelling === o.id ? "Batal…" : "Batalkan"}
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs opacity-40">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}
