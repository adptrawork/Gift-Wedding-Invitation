#!/usr/bin/env node
/**
 * Diagnosa konfigurasi Duitku tanpa membuat transaksi apa pun.
 *
 *   ddev npm run check:duitku
 *
 * Yang diperiksa:
 *   1.kelengkapan env + environment mana (sandbox/production)
 *   2. apakah host API menjawab dengan error terstruktur (artinya path hidup)
 *   3. apakah Merchant Code dikenali Duitku
 *   4. apakah kredensial sandbox cocok dengan environment yang dipilih
 *
 * PENTING: semua probe memakai signature PALSU yang dijamin tidak bisa
 * membuat invoice. Tidak ada transaksi yang terbentuk, dan tidak ada kode
 * yang dicetak ke layar.
 */

import { readFileSync } from "node:fs";

const BASES = {
  sandbox: "https://sandbox.duitku.com",
  production: "https://passport.duitku.com",
};

function readEnvFile(path = ".env") {
  const out = {};
  let raw = "";
  try {
    raw = readFileSync(path, "utf8");
  } catch {
    return out;
  }
  for (const line of raw.split("\n")) {
    const m = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
    if (m) out[m[1]] = m[2];
  }
  return out;
}

const env = { ...readEnvFile(".env"), ...readEnvFile(".env.local") };
const merchantCode = (env.DUITKU_MERCHANT_CODE ?? "").trim();
const apiKey = (env.DUITKU_API_KEY ?? "").trim();
const useProduction = (env.DUITKU_IS_PRODUCTION ?? "").trim() === "true";
const envName = useProduction ? "production" : "sandbox";
const base = BASES[envName];

const mask = (s) => (s ? `${s.slice(0, 3)}…${s.slice(-2)} (${s.length} char)` : "KOSONG");

console.log("=".repeat(64));
console.log("  DIAGNOSA KONFIGURASI DUITKU");
console.log("=".repeat(64));
console.log(`  Merchant Code     : ${mask(merchantCode)}`);
console.log(`  API Key           : ${mask(apiKey)}`);
console.log(`  Environment       : ${envName}  (${base})`);
console.log(`  Payment method    : ${env.DUITKU_PAYMENT_METHOD || "*"}`);
console.log(`  NEXT_PUBLIC_BASE_URL: ${env.NEXT_PUBLIC_BASE_URL || "TIDAK DISET"}`);
console.log(`  Service role key  : ${env.SUPABASE_SERVICE_ROLE_KEY ? "TERISI" : "KOSONG (webhook tidak bisa tulis DB)"}`);
console.log();

if (!merchantCode || !apiKey) {
  console.log("HASIL: konfigurasi belum lengkap — isi DUITKU_MERCHANT_CODE dan DUITKU_API_KEY.");
  process.exit(1);
}

// Signature palsu yang dijamin tidak akan pernah menghasilkan invoice.
const FAKE_SIG = "0".repeat(64);

async function post(host, path, payload) {
  try {
    const res = await fetch(`${host}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      redirect: "manual",
    });
    const text = (await res.text()).replace(/\s+/g, " ").trim();
    return { status: res.status, text };
  } catch (e) {
    return { status: 0, text: `GAGAL: ${e.message}` };
  }
}

console.log("--- 1. Host API menjawab? ---");
const root = await fetch(base, { redirect: "manual" }).then(
  (r) => ({ status: r.status, text: "" }),
  (e) => ({ status: 0, text: e.message })
);
console.log(`  GET ${base}`);
console.log(`    -> HTTP ${root.status} ${root.text ? `(${root.text})` : ""}`);
console.log();

console.log("--- 2. Path endpoint hidup? (pakai signature palsu) ---");
const probe = await post(base, "/webapi/api/merchant/v2/inquiry", {
  merchantCode,
  paymentAmount: 49000,
  merchantOrderId: "PROBE",
  productDetails: "probe",
  email: "probe@example.com",
  paymentMethod: "*",
  customerVaName: "probe",
  returnUrl: "https://example.com",
  callbackUrl: "https://example.com",
  signature: FAKE_SIG,
});
console.log(`  POST /webapi/api/merchant/v2/inquiry -> HTTP ${probe.status}`);
console.log(`    ${probe.text || "(body kosong — path kemungkinan salah)"}`);

const pathAlive = probe.text.includes("Message") || probe.text.includes("statusCode");
if (!pathAlive) {
  console.log();
  console.log("HASIL: endpoint tidak menjawab JSON terstruktur.");
  console.log("  - Host tidak terjangkau, atau path /webapi/... tidak sesuai.");
  process.exit(1);
}
console.log("  -> endpoint hidup (error terstruktur, bukan 404 kosong)");
console.log();

console.log("--- 3. Merchant Code dikenali? ---");
const merchantKnown = !/Merchant not found/i.test(probe.text);
console.log(`  ${merchantKnown ? "YA" : "TIDAK — Duitku tidak mengenali kode ini di " + envName}`);
if (!merchantKnown) {
  console.log();
  console.log("HASIL: Merchant Code ditolak.");
  console.log("");
  console.log("  Penyebab yang paling mungkin:");
  console.log("  1. Kode sandbox dan kode production itu BERBEDA. Kode dari dashboard");
  console.log("     production tidak akan pernah jalan di sandbox. Buat project terpisah");
  console.log("     di portal sandbox, atau pakai kode production + DUITKU_IS_PRODUCTION=true.");
  console.log("  2. Yang disalin bukan Merchant Code, melainkan Project ID atau nomor lain.");
  console.log("     Cek di portal: Settings > Project > Merchant Code.");
  console.log("  3. Project belum aktif (verifikasi akun/KYC belum selesai).");
  console.log("");
  console.log("  Buka portal Duitku -> Settings -> Project, lalu salin ulang");
  console.log("  Merchant Code + API Key ke dalam .env, lalu ulangi perintah ini.");
  process.exit(2);
}
console.log();

console.log("--- 4. Kredensial cocok dengan environment? ---");
console.log("  Merchant code DITEMU di " + envName + ".");
console.log("  Uji lengkap (membuat invoice) baru bisa dilakukan setelah:");
console.log("    a. migrations Supabase sudah dijalankan");
console.log("    b. SUPABASE_SERVICE_ROLE_KEY terisi");
console.log("    c. NEXT_PUBLIC_BASE_URL menunjuk URL publik yang hidup");
console.log("  Jalankan: ddev npm run check:duitku -- --live");
console.log();
console.log("HASIL: Merchant code valid. Lanjut ke langkah di atas.");
