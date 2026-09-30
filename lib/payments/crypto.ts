import { createHmac, timingSafeEqual } from "crypto";

/**
 * Helper kriptografi untuk integrasi payment gateway.
 *
 * Semua perbandingan signature WAJIB lewat `safeEqual` — `===` membocorkan
 * informasi lewat timing dan tidak boleh dipakai untuk nilai rahasia.
 */

/** HMAC-SHA256, output hex lowercase (format yang diminta Duitku). */
export function hmacSha256Hex(stringToSign: string, key: string): string {
  return createHmac("sha256", key).update(stringToSign, "utf8").digest("hex");
}

/** Constant-time string compare yang aman terhadap panjang berbeda. */
export function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}
