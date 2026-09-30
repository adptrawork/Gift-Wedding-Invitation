import { Suspense } from "react";
import BillingClient from "./billing-client";

export const dynamic = "force-dynamic";

/**
 * useSearchParams() butuh Suspense boundary saat prerender. Halaman ini juga
 * melakukan fetch ke API sendiri setelah mount, jadi tetap force-dynamic.
 */
export default function BillingPage() {
  return (
    <Suspense fallback={<main className="mx-auto max-w-4xl px-6 py-12">Memuat…</main>}>
      <BillingClient />
    </Suspense>
  );
}
