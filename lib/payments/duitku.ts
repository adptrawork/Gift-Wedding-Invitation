import { hmacSha256Hex, safeEqual } from "./crypto";

/**
 * Pembayaran Duitku — satu-satunya payment gateway di MVP.
 *
 * Tiga formula signature berbeda; jangan dicampur:
 *   - Inquiry  (request transaksi): merchantCode + merchantOrderId + paymentAmount
 *   - Callback (notifikasi):        merchantCode + amount + merchantOrderId
 *   - Check status (cek transaksi): merchantCode + merchantOrderId
 * semuanya `HMAC_SHA256(stringToSign, apiKey)` dengan output hex lowercase.
 *
 * Docs: https://docs.duitku.com/api/en
 * (Metode signature MD5 lama sudah obsolete — jangan dipakai.)
 */

const SANDBOX_BASE = "https://sandbox.duitku.com";
const PRODUCTION_BASE = "https://passport.duitku.com";

/** `statusCode` 00 = sukses, baik di respons inquiry maupun check status. */
export const DUITKU_SUCCESS_CODE = "00";

/** Duitku menolak transaksi di bawah nominal ini. */
export const DUITKU_MIN_AMOUNT = 10_000;

export interface DuitkuConfig {
  merchantCode: string;
  apiKey: string;
  /** true = produksi (passport.duitku.com), default sandbox. */
  production: boolean;
  /** Kode metode pembayaran 2 karakter, default "*". */
  paymentMethod: string;
  /** Masa berlaku invoice dalam menit. Duitku membatasi per channel. */
  expiryMinutes: number;
}

/** Fail closed: tanpa merchant code + API key, tidak ada yang bisa diverifikasi. */
export function readDuitkuConfig(): DuitkuConfig | null {
  const merchantCode = process.env.DUITKU_MERCHANT_CODE?.trim();
  const apiKey = process.env.DUITKU_API_KEY?.trim();
  if (!merchantCode || !apiKey) return null;

  return {
    merchantCode,
    apiKey,
    production: process.env.DUITKU_IS_PRODUCTION === "true",
    // "*" memunculkan halaman Choosing Payment Duitku (VA/QRIS/e-wallet/ritel).
    // Kalau project merchant tidak mendukung "*", set kode konkret, mis. "BC"
    // (BCA VA) atau "SP" (ShopeePay QRIS).
    paymentMethod: process.env.DUITKU_PAYMENT_METHOD?.trim() || "*",
    // VA/ritel/e-wallet mengizinkan sampai 1440 menit; QRIS hanya 60. Nilai
    // 1440 aman karena channel sempit mengabaikan nilai di luar batasnya.
    expiryMinutes: clampExpiry(process.env.DUITKU_EXPIRY_MINUTES),
  };
}

function clampExpiry(raw: string | undefined): number {
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return 1440;
  return Math.min(Math.floor(parsed), 1440);
}

export function duitkuBaseUrl(config: DuitkuConfig): string {
  return config.production ? PRODUCTION_BASE : SANDBOX_BASE;
}

// ==================== signature ====================

export function inquirySignature(
  merchantCode: string,
  merchantOrderId: string,
  amount: number,
  apiKey: string
): string {
  return hmacSha256Hex(`${merchantCode}${merchantOrderId}${amount}`, apiKey);
}

export function callbackSignature(
  merchantCode: string,
  amount: string,
  merchantOrderId: string,
  apiKey: string
): string {
  return hmacSha256Hex(`${merchantCode}${amount}${merchantOrderId}`, apiKey);
}

export function checkStatusSignature(
  merchantCode: string,
  merchantOrderId: string,
  apiKey: string
): string {
  return hmacSha256Hex(`${merchantCode}${merchantOrderId}`, apiKey);
}

// ==================== callback ====================

/** Bentuk notifikasi yang dikirim Duitku (x-www-form-urlencoded). */
export interface DuitkuCallback {
  merchantCode?: string;
  amount?: string;
  merchantOrderId?: string;
  productDetail?: string;
  additionalParam?: string;
  paymentCode?: string;
  resultCode?: string;
  merchantUserId?: string;
  reference?: string;
  signature?: string;
  publisherOrderId?: string;
  settlementDate?: string;
  issuerCode?: string;
  customerName?: string;
}

export interface CallbackVerification {
  ok: boolean;
  reason?: string;
  orderId?: string;
  amount: number | null;
  paid: boolean;
  reference: string | null;
  /** `publisherOrderId` = nomor transaksi unik dari Duitku. */
  transactionId: string | null;
  paymentCode: string | null;
}

function reject(reason: string): CallbackVerification {
  return {
    ok: false,
    reason,
    amount: null,
    paid: false,
    reference: null,
    transactionId: null,
    paymentCode: null,
  };
}

/**
 * Verifikasi notifikasi Duitku.
 *
 * `amount` dipakai apa adanya dari body (string) saat menghitung signature —
 * mem-parse ke number dulu bisa menghasilkan string berbeda dan menolak
 * callback yang sah.
 */
export function verifyCallback(
  payload: DuitkuCallback,
  config: DuitkuConfig
): CallbackVerification {
  const { merchantCode, amount, merchantOrderId, signature, resultCode } = payload;

  if (!merchantCode || !amount || !merchantOrderId || !signature || !resultCode) {
    return reject("Field notifikasi Duitku tidak lengkap");
  }

  if (!safeEqual(merchantCode, config.merchantCode)) {
    return reject("merchantCode tidak cocok dengan project server");
  }

  const expected = callbackSignature(merchantCode, amount, merchantOrderId, config.apiKey);
  if (!safeEqual(expected, signature)) {
    return reject("signature tidak cocok");
  }

  return {
    ok: true,
    orderId: merchantOrderId,
    amount: toRupiah(amount),
    paid: resultCode === DUITKU_SUCCESS_CODE,
    reference: payload.reference ?? null,
    transactionId: payload.publisherOrderId ?? null,
    paymentCode: payload.paymentCode ?? null,
  };
}

function toRupiah(raw: string): number | null {
  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

// ==================== inquiry ====================

export interface InquiryInput {
  /** `merchantOrderId` — maksimal 50 karakter dan wajib unik per transaksi. */
  orderId: string;
  /** Rupiah penuh, selalu dari katalog server (lib/plans). */
  amount: number;
  customerName: string;
  customerEmail: string;
  productDetails: string;
  returnUrl: string;
  callbackUrl: string;
}

export interface InquiryResult {
  /** Nomor referensi Duitku — simpan untuk rekonsiliasi. */
  reference: string;
  paymentUrl: string;
}

/** Buat transaksi lewat Duitku Inquiry API v2. */
export async function createInquiry(
  input: InquiryInput,
  config: DuitkuConfig
): Promise<InquiryResult> {
  const amount = Math.round(input.amount);
  if (amount < DUITKU_MIN_AMOUNT) {
    throw new Error(`Nominal minimal Duitku Rp${DUITKU_MIN_AMOUNT.toLocaleString("id-ID")}`);
  }

  const res = await fetch(`${duitkuBaseUrl(config)}/webapi/api/merchant/v2/inquiry`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      merchantCode: config.merchantCode,
      paymentAmount: amount,
      merchantOrderId: input.orderId,
      productDetails: truncate(input.productDetails, 255),
      email: input.customerEmail,
      paymentMethod: config.paymentMethod,
      // Maks 20 karakter; nama ini yang muncul di sisi bank.
      customerVaName: truncate(input.customerName, 20),
      returnUrl: input.returnUrl,
      callbackUrl: input.callbackUrl,
      signature: inquirySignature(config.merchantCode, input.orderId, amount, config.apiKey),
      expiryPeriod: config.expiryMinutes,
    }),
  });

  const json = (await res.json().catch(() => null)) as InquiryResponse | null;

  if (!res.ok || json?.statusCode !== DUITKU_SUCCESS_CODE || !json?.paymentUrl) {
    throw new Error(
      json?.statusMessage || `Duitku menolak transaksi (HTTP ${res.status})`
    );
  }

  return {
    reference: String(json.reference ?? ""),
    paymentUrl: String(json.paymentUrl),
  };
}

interface InquiryResponse {
  merchantCode?: string;
  reference?: string;
  paymentUrl?: string;
  vaNumber?: string;
  amount?: string;
  statusCode?: string;
  statusMessage?: string;
}

// ==================== check status ====================

export interface TransactionStatus {
  statusCode: string;
  statusMessage: string;
  reference: string | null;
  amount: number | null;
}

/**
 * Cek status transaksi langsung ke Duitku.
 *
 * HANYA untuk pemicu manual (tombol "Cek status" di halaman billing).
 * Duitku membatasi rate limit API ini dan menblokir IP sekitar 1 jam kalau
 * dipanggil berulang otomatis — jangan dijadikan cron atau poller.
 */
export async function checkTransaction(
  orderId: string,
  config: DuitkuConfig
): Promise<TransactionStatus> {
  const res = await fetch(`${duitkuBaseUrl(config)}/webapi/api/merchant/transactionStatus`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      merchantCode: config.merchantCode,
      merchantOrderId: orderId,
      signature: checkStatusSignature(config.merchantCode, orderId, config.apiKey),
    }),
  });

  const json = (await res.json().catch(() => null)) as {
    merchantOrderId?: string;
    reference?: string;
    amount?: string;
    statusCode?: string;
    statusMessage?: string;
  } | null;

  if (!res.ok || !json?.statusCode) {
    throw new Error(json?.statusMessage || `Duitku tidak menjawab (HTTP ${res.status})`);
  }

  return {
    statusCode: json.statusCode,
    statusMessage: String(json.statusMessage ?? ""),
    reference: json.reference ?? null,
    amount: json.amount ? toRupiah(json.amount) : null,
  };
}

function truncate(value: string, max: number): string {
  return value.length <= max ? value : value.slice(0, max);
}
