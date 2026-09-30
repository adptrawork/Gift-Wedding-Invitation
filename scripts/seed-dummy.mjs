/**
 * Seed data dummy untuk demo lokal dan preview.
 *
 * Berbeda dengan `supabase/seed.sql` yang hanya mengisi registry template,
 * script ini membuat pengguna sungguhan (lewat Supabase Auth Admin API),
 * undangan di beberapa tahap lifecycle, RSVP, dan order — supaya dashboard
 * tidak kosong saat demo.
 *
 * Sifat penting:
 *  - Idempoten. Dijalankan dua kali tidak menggandakan data; baris yang sudah
 *    ada dilewati, dan email yang sama dipakai ulang.
 *  - Semua data dummy diberi awalan slug `demo-`, jadi gampang dibersihkan.
 *  - Password bersifat diketahui publik, bukan rahasia. Jangan pernah jalankan script
 *    ini di database produksi.
 *
 * Pakai dari dalam container DDEV (ddev exec tidak meneruskan env host):
 *   ddev exec node scripts/seed-dummy.mjs
 *
 * Opsi:
 *   --clean   hapus dulu semua data dummy dari run sebelumnya
 */

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

/* --------------------------------------------------------------- env & config */

function readEnv() {
  const out = {};
  for (const line of readFileSync(".env", "utf8").split("\n")) {
    const m = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
    if (m) out[m[1]] = m[2];
  }
  return out;
}

const env = readEnv();
const URL_ = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE = env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL_?.startsWith("http") || !SERVICE) {
  console.error("SUPABASE_URL atau SUPABASE_SERVICE_ROLE_KEY belum ada di .env");
  process.exit(1);
}

const db = createClient(URL_, SERVICE, { auth: { persistSession: false } });
const CLEAN = process.argv.includes("--clean");
const PREFIX = "demo-";

/** Password yang diketahui publik; hanya untuk data demo. */
const DEMO_PASSWORD = "Demo1234!";

let made = 0;
let skipped = 0;
const log = (msg) => console.log(msg);

/* ------------------------------------------------------------------ utilitas */

async function ensureUser({ email, password, fullName, role, phone }) {
  const hdr = { apikey: SERVICE, Authorization: `Bearer ${SERVICE}`, "Content-Type": "application/json" };

  // Cari dulu: Auth Admin API tidak punya "get by email" yang murah, jadi
  // daftar user lalu cari. Halaman pertama saja cukup untuk data demo.
  const list = await fetch(`${URL_}/auth/v1/admin/users?page=1&per_page=1000`, { headers: hdr });
  const listJson = list.ok ? await list.json() : null;
  const found = listJson?.users?.find((u) => u.email === email);

  let id = found?.id;
  if (id) {
    skipped++;
  } else {
    const res = await fetch(`${URL_}/auth/v1/admin/users`, {
      method: "POST",
      headers: hdr,
      body: JSON.stringify({ email, password, email_confirm: true }),
    });
    const json = await res.json();
    if (!json?.id) {
      console.error(`  gagal membuat user ${email}:`, JSON.stringify(json).slice(0, 160));
      return null;
    }
    id = json.id;
    made++;
    log(`  user   ${email}  (${id.slice(0, 8)})`);
  }

  // profiles dibuat oleh trigger; cukup lengkapi nama, telepon, dan role.
  await db
    .from("profiles")
    .upsert(
      { id, full_name: fullName, phone, role },
      { onConflict: "id" }
    )
    .select("id")
    .single();

  return id;
}

async function ensureTemplate(slug) {
  const t = await db.from("templates").select("id").eq("slug", slug).maybeSingle();
  if (!t.data) {
    console.error(`  template ${slug} tidak ada di DB — jalankan npm run db:migrate dulu`);
    return null;
  }
  const v = await db
    .from("template_versions")
    .select("id")
    .eq("template_id", t.data.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return { templateId: t.data.id, versionId: v.data?.id ?? null };
}

async function ensureWedding({ userId, templateSlug, slug, title, content, status }) {
  const meta = await ensureTemplate(templateSlug);
  if (!meta) return null;

  const existing = await db.from("weddings").select("id, status").eq("slug", slug).maybeSingle();
  if (existing.data) {
    skipped++;
    // Status boleh berbeda dari yang tertulis di sini (misal draft yang
    // sebelumnya sudah di-publish lewat dashboard), jadi biarkan apa adanya.
    return existing.data.id;
  }

  const ins = await db
    .from("weddings")
    .insert({
      user_id: userId,
      template_id: meta.templateId,
      template_version_id: meta.versionId,
      slug,
      title,
      // draft_content = content: data demo sengaja berstatus final supaya
      // editor tidak terlihat kosong. Wedding demo yang masih draft memakai
      // draft_content terpisah (lihat bawah).
      content: status === "published" ? content : {},
      draft_content: content,
      status,
      published_at: status === "published" ? new Date().toISOString() : null,
    })
    .select("id")
    .single();

  if (ins.error) {
    console.error(`  gagal membuat wedding ${slug}:`, ins.error.message);
    return null;
  }
  made++;
  log(`  wedding ${slug}  [${status}]`);
  return ins.data.id;
}

async function ensureRsvp(weddingId, rsvp) {
  // rsvps tidak punya kolom unik, jadi Existence dicek lewat count per nama.
  const cek = await db
    .from("rsvps")
    .select("id")
    .eq("wedding_id", weddingId)
    .eq("name", rsvp.name)
    .maybeSingle();
  if (cek.data) {
    skipped++;
    return;
  }
  const ins = await db.from("rsvps").insert({ wedding_id: weddingId, ...rsvp });
  if (ins.error) {
    console.error(`  gagal membuat RSVP ${rsvp.name}:`, ins.error.message);
    return;
  }
  made++;
}

async function ensureOrder({ userId, weddingId, planId, amount, status }) {
  // Cari order pending milik pasangan (wedding, plan) supaya tidak menumpuk.
  const cek = await db
    .from("orders")
    .select("id")
    .eq("wedding_id", weddingId)
    .eq("status", status)
    .maybeSingle();
  if (cek.data) {
    skipped++;
    return;
  }
  const ins = await db
    .from("orders")
    .insert({
      user_id: userId,
      wedding_id: weddingId,
      amount,
      currency: "IDR",
      status,
      plan_id: planId,
    })
    .select("id")
    .single();
  if (ins.error) {
    console.error(`  gagal membuat order ${planId}:`, ins.error.message);
    return;
  }
  made++;

  // Order paid perlu baris payments agar halaman billing punya riwayat.
  if (status === "paid") {
    await db.from("payments").insert({
      order_id: ins.data.id,
      provider: "duitku",
      provider_transaction_id: `DEMO-${planId}-${weddingId.slice(0, 8)}`,
      amount,
      status: "Success",
      paid_at: new Date().toISOString(),
    });
  }
  log(`  order  ${planId}  [${status}]`);
}

/* ------------------------------------------------------------------- cleaning */

async function clean() {
  log("Membersihkan data dummy dari run sebelumnya…");

  const weddings = await db.from("weddings").select("id").like("slug", `${PREFIX}%`);
  const ids = (weddings.data ?? []).map((w) => w.id);

  // Hapus anak dulu; cascade dari weddings akan menangani sebagian, tapi
  // payments tidak cascade dari orders sehingga harus eksplisit.
  if (ids.length) {
    const orders = await db.from("orders").select("id").in("wedding_id", ids);
    const orderIds = (orders.data ?? []).map((o) => o.id);
    if (orderIds.length) {
      await db.from("payments").delete().in("order_id", orderIds);
      await db.from("orders").delete().in("id", orderIds);
    }
    await db.from("rsvps").delete().in("wedding_id", ids);
    await db.from("weddings").delete().in("id", ids);
  }

  // Pengguna demo dihapus lewat Auth Admin API supaya auth.users ikut bersih
  // lewat cascade ke profiles.
  const hdr = { apikey: SERVICE, Authorization: `Bearer ${SERVICE}` };
  const list = await fetch(`${URL_}/auth/v1/admin/users?page=1&per_page=1000`, { headers: hdr });
  const json = list.ok ? await list.json() : null;
  for (const u of json?.users ?? []) {
    if (u.email?.startsWith(PREFIX)) {
      await fetch(`${URL_}/auth/v1/admin/users/${u.id}`, { method: "DELETE", headers: hdr });
    }
  }

  log("Selesai dibersihkan.\n");
}

/* ---------------------------------------------------------------------- data */

const USERS = [
  {
    email: "admin@demo.test",
    password: DEMO_PASSWORD,
    fullName: "Admin Demo",
    role: "admin",
    phone: "081200000001",
  },
  {
    email: "andi@demo.test",
    password: DEMO_PASSWORD,
    fullName: "Andi Pratama",
    role: "customer",
    phone: "081200000002",
  },
  {
    email: "sinta@demo.test",
    password: DEMO_PASSWORD,
    fullName: "Sinta Lestari",
    role: "customer",
    phone: "081200000003",
  },
  {
    email: "bunga@demo.test",
    password: DEMO_PASSWORD,
    fullName: "Bunga Anindya",
    role: "customer",
    phone: "081200000004",
  },
];

function themeLuxury() {
  return {
    primary: "#C9A227",
    background: "#0F0F12",
    text: "#F5F0E1",
    fontHeading: "Cormorant Garamond",
    fontBody: "Inter",
  };
}

const WEDDINGS = [
  {
    owner: "andi@demo.test",
    templateSlug: "luxury-gold",
    slug: "demo-andi-sinta",
    title: "Andi & Sinta",
    status: "published",
    content: {
      groom: { name: "Andi Pratama", photo: "" },
      bride: { name: "Sinta Lestari", photo: "" },
      hero: { photo: "", subtitle: "Kami menstruationikan pernikahan kami" },
      event: {
        date: "2027-05-16",
        time: "10:00",
        venue: "Grand Tumbuh Hotel",
        address: "Jl. Jenderal Sudirman No. 1, Jambi",
        mapsUrl: "https://maps.google.com/?q=Grand+Tumbuh+Hotel+Jambi",
      },
      story: {
        title: "Cerita Kami",
        content:
          "Kami bertemu pada 2019 dan memutuskan bersama membangun keluarga. Sekarang kami mohon kepada kerabat dan teman untuk hadir di hari yang berbunyi.",
      },
      gallery: [],
      music: "",
      theme: themeLuxury(),
    },
  },
  {
    owner: "sinta@demo.test",
    templateSlug: "romantic-garden",
    slug: "demo-dewi-rizky",
    title: "Dewi & Rizky",
    status: "published",
    content: {
      groom: { name: "Rizky Hidayat", photo: "" },
      bride: { name: "Dewi Anggraini", photo: "" },
      hero: { photo: "", subtitle: "Segera hadir di hari bahagi kami" },
      event: {
        date: "2027-06-21",
        time: "09:30",
        venue: "Taman Bouget INV",
        address: "Jl. Slamet Riyadi, Solo",
        mapsUrl: "https://maps.google.com/?q=Taman+Bouget+Solo",
      },
      story: { title: "Kisah Kami", content: "Enam tahun sebagai pacaran sebelum resmi cabang kecil bersama." },
      gallery: [],
      music: "",
      theme: { primary: "#8FBF9F", background: "#FAF7F2", text: "#2F3E32", fontHeading: "Playfair Display", fontBody: "Inter" },
    },
  },
  {
    owner: "bunga@demo.test",
    templateSlug: "modern-minimal",
    slug: "demo-modern-rizky",
    title: "Invitation of Rizky",
    status: "published",
    content: {
      groom: { name: "Rizky Maulana", photo: "" },
      bride: { name: "Ayu Maharani", photo: "" },
      hero: { photo: "", subtitle: "One day, one moment, one forever" },
      event: {
        date: "2027-07-04",
        time: "11:00",
        venue: "Ruang JK. Ginting",
        address: "Jl. Asia Afrika, Bandung",
        mapsUrl: "https://maps.google.com/?q=Asia+Afrika+Bandung",
      },
      story: { title: "", content: "" },
      gallery: [],
      music: "",
      theme: { primary: "#111111", background: "#FFFFFF", text: "#111111", fontHeading: "Inter", fontBody: "Inter" },
    },
  },
  {
    owner: "bunga@demo.test",
    templateSlug: "wedding-gift",
    slug: "demo-gift-rizky",
    title: "Kado untuk Ayu & Rizky",
    status: "published",
    content: {
      recipient: { name: "Ayu Maharani", photo: "" },
      cover: { photo: "", title: "Ayu & Rizky" },
      message: {
        title: "Kado Pernikahan",
        content: "Semoga kenangan ini membantu kalian memulai rumah tangga baru.",
      },
      gift: { amount: "Rp 500.000", note: "Transfer ke BCA a.n. Ayu Maharani" },
      music: "",
      theme: { primary: "#B08968", background: "#FFF8F0", text: "#3B2F2A", fontHeading: "Cormorant Garamond", fontBody: "Inter" },
    },
  },
  {
    // Sengaja masih draft: memperlihatkan alur preview sebelum publish.
    owner: "andi@demo.test",
    templateSlug: "luxury-gold",
    slug: "demo-draft-belum-jadi",
    title: "Proyek Wedding Baru",
    status: "draft",
    content: {
      groom: { name: "Andi Pratama", photo: "" },
      bride: { name: "Sinta Lestari", photo: "" },
      hero: { photo: "", subtitle: "Draft — belum dipublish" },
      event: {
        date: "2027-08-08",
        time: "10:00",
        venue: "Belum ditentukan",
        address: "",
        mapsUrl: "",
      },
      story: { title: "", content: "" },
      gallery: [],
      music: "",
      theme: themeLuxury(),
    },
  },
];

const RSVPS = {
  "demo-andi-sinta": [
    { name: "Pak Hendra", attendance: "yes", guests_count: 2, message: "Selamat-manyun! Semoga bahagia selalu." },
    { name: "Bu Ratna", attendance: "yes", guests_count: 1, message: "" },
    { name: "Universitas Pelajar", attendance: "no", guests_count: 1, message: "Maaf berhalangan, ada urusan keluarga." },
    { name: "Kak Rina", attendance: "yes", guests_count: 4, message: "Datang bersama keluarga." },
  ],
  "demo-dewi-rizky": [
    { name: "Mbah Sutarti", attendance: "yes", guests_count: 2, message: "Semoga jadi keluarga bahagia." },
    { name: "Pak Hendra", attendance: "no", guests_count: 1, message: "Ada keperluan mendadak." },
  ],
  "demo-modern-rizky": [{ name: "Teman Kuliah", attendance: "yes", guests_count: 2, message: "" }],
};

// Nominal WAJIB sama dengan `lib/plans.ts` (sumber kebenaran harga di server).
// Kalau keduanya berbeda, tabel riwayat order menampilkan nominal yang
// bertentangan dengan kartu paket di halaman billing, dan user mengira
// ditagih lebih mahal. Kalau harga paket berubah, ubah kedua tempatnya.
const ORDERS = [
  { slug: "demo-andi-sinta", owner: "andi@demo.test", planId: "premium", amount: 99_000, status: "paid" },
  { slug: "demo-dewi-rizky", owner: "sinta@demo.test", planId: "basic", amount: 49_000, status: "pending" },
  { slug: "demo-modern-rizky", owner: "bunga@demo.test", planId: "basic", amount: 49_000, status: "failed" },
];

/* ---------------------------------------------------------------------- main */

async function main() {
  if (CLEAN) await clean();

  log("Membuat pengguna demo…");
  const userIds = {};
  for (const u of USERS) {
    const id = await ensureUser(u);
    if (id) userIds[u.email] = id;
  }
  if (Object.keys(userIds).length === 0) {
    console.error("Tidak ada pengguna yang berhasil dibuat.");
    process.exit(1);
  }

  log("\nMembuat undangan demo…");
  const weddingIds = {};
  for (const w of WEDDINGS) {
    const ownerId = userIds[w.owner];
    if (!ownerId) continue;
    const id = await ensureWedding({ ...w, userId: ownerId });
    if (id) weddingIds[w.slug] = id;
  }

  log("\nMembuat RSVP demo…");
  for (const [slug, list] of Object.entries(RSVPS)) {
    const wid = weddingIds[slug];
    if (!wid) continue;
    for (const r of list) await ensureRsvp(wid, r);
  }

  log("\nMembuat order demo…");
  for (const o of ORDERS) {
    const wid = weddingIds[o.slug];
    const uid = userIds[o.owner];
    if (!wid || !uid) continue;
    await ensureOrder({ ...o, weddingId: wid, userId: uid });
  }

  log(`\nSelesai. ${made} baris dibuat, ${skipped} sudah ada dan dilewati.`);
  log("\nAkun demo (password semuanya sama):");
  for (const u of USERS) {
    log(`  ${u.role.padEnd(8)} ${u.email.padEnd(20)} ${DEMO_PASSWORD}`);
  }
  log("\nURL undangan publik:");
  for (const w of WEDDINGS.filter((x) => x.status === "published")) {
    log(`  /${w.slug}  —  ${w.title}`);
  }
  log("\nHapus lagi dengan: ddev exec node scripts/seed-dummy.mjs --clean");
}

main().catch((err) => {
  console.error("seed-dummy gagal:", err?.message ?? err);
  process.exit(1);
});
