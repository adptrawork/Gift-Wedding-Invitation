/**
 * Katalog paket — SATU-SATUNYA sumber harga.
 *
 * `amount` TIDAK PERNAH dibaca dari request body. API order menerima `plan_id`
 * lalu mencari harga di sini, sehingga customer tidak bisa menManipulasi nominal.
 */

export interface Plan {
  id: string;
  name: string;
  /** Rupiah penuh (bukan sen). */
  amount: number;
  description: string;
  features: string[];
  maxPhotos: number;
  customDomain: boolean;
  durationDays: number;
}

export const PLANS: Plan[] = [
  {
    id: "basic",
    name: "Basic",
    amount: 49_000,
    description: "1 undangan, subdomain platform, 20 foto.",
    features: ["1 undangan", "Subdomain gratis", "20 foto", "RSVP", "Musik & countdown"],
    maxPhotos: 20,
    customDomain: false,
    durationDays: 365,
  },
  {
    id: "premium",
    name: "Premium",
    amount: 99_000,
    description: "3 undangan, custom domain, 100 foto, tanpa batas masa aktif.",
    features: [
      "3 undangan",
      "Custom domain",
      "100 foto",
      "RSVP + guestbook",
      "Video & musik",
      "Aktif selamanya",
    ],
    maxPhotos: 100,
    customDomain: true,
    durationDays: 3650,
  },
];

export function getPlan(id: string): Plan | undefined {
  return PLANS.find((p) => p.id === id);
}

export function formatIDR(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}
