import { z } from "zod";

export const slugSchema = z
  .string()
  .min(3)
  .max(80)
  .regex(/^[a-z0-9-]+$/, "Slug hanya boleh huruf kecil, angka, dan strip")
  .refine((s) => !s.startsWith("-") && !s.endsWith("-"), "Slug tidak boleh diawali/diakhiri strip");

export const createWeddingSchema = z.object({
  title: z.string().min(3).max(120),
  template_slug: z.string().min(2),
  slug: slugSchema,
});

/**
 * Catatan: `amount` sengaja TIDUK ada di sini. Harga selalu diambil dari
 * katalog server (lib/plans.ts) berdasarkan `plan_id`, supaya customer tidak
 * bisa mengirim nominal sendiri.
 */
export const orderSchema = z.object({
  wedding_id: z.string().uuid("wedding_id tidak valid"),
  plan_id: z.string().min(1).max(40),
});

export const saveDraftSchema = z.object({
  title: z.string().min(3).max(120).optional(),
  /** Di-merge dengan default schema sebelum disimpan. */
  draft_content: z.record(z.string(), z.unknown()).optional(),
});

export const rsvpSchema = z.object({
  wedding_id: z.string().uuid("wedding_id tidak valid"),
  name: z.string().min(2).max(100),
  attendance: z.enum(["yes", "no"]),
  guests_count: z.coerce.number().int().min(1).max(20).default(1),
  message: z.string().max(500).optional().default(""),
});
