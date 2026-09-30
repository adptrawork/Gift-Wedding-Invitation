export default function DashboardPage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <p className="mt-2 opacity-70">Kelola wedding & gift Anda.</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <a href="/dashboard/wedding/create" className="rounded-lg bg-black px-4 py-2 text-sm text-white">
          + Buat Wedding / Gift
        </a>
        <a href="/dashboard/billing" className="rounded-lg border px-4 py-2 text-sm">
          Billing
        </a>
      </div>
      <div className="mt-8 rounded-2xl border p-6 text-sm opacity-70">
        Daftar wedding dari Supabase akan tampil di sini (US-011/012). Sementara gunakan demo:
        <ul className="mt-2 list-disc pl-5">
          <li><a className="underline" href="/demo-luxury-gold">demo-luxury-gold</a></li>
          <li><a className="underline" href="/demo-romantic-garden">demo-romantic-garden</a></li>
          <li><a className="underline" href="/demo-wedding-gift">demo-wedding-gift</a></li>
          <li><a className="underline" href="/demo-birthday-gift">demo-birthday-gift</a></li>
        </ul>
      </div>
    </main>
  );
}
