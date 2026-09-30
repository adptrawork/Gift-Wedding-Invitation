import { z } from "zod";

export const slugSchema = z
  .string()
  .min(3)
  .max(80)
  .regex(/^[a-z0-9-]+$/, "Slug hanya boleh huruf kecil, angka, dan strip");

export const createWeddingSchema = z.object({
  title: z.string().min(3).max(120),
  template_slug: z.string().min(2),
  slug: slugSchema,
});

export const rsvpSchema = z.object({
  wedding_id: z.string().uuid(),
  name: z.string().min(2).max(100),
  attendance: z.enum(["yes", "no"]),
  guests_count: z.coerce.number().int().min(1).max(20).default(1),
  message: z.string().max(500).optional().default(""),
});

export const orderSchema = z.object({
  wedding_id: z.string().uuid(),
  amount: z.coerce.number().int().positive(),
  currency: z.string().default("IDR"),
});
