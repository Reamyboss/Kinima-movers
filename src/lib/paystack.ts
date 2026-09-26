import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

// Paystack (card, transfer, USSD). Payments switch on only when the secret
// key is set in Vercel; until then customers pay the driver on delivery.
const SECRET = process.env.PAYSTACK_SECRET_KEY;
const API = "https://api.paystack.co";

export const paymentsEnabled = () => Boolean(SECRET);

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(API + path, {
    ...init,
    headers: { Authorization: `Bearer ${SECRET}`, "Content-Type": "application/json", ...init?.headers },
    cache: "no-store",
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.status === false) throw new Error(body.message || `Paystack error ${res.status}`);
  return body.data as T;
}

export function startPayment(p: { email: string; amountNaira: number; reference: string; callbackUrl: string; bookingRef: string }) {
  return call<{ authorization_url: string; reference: string }>("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify({
      email: p.email,
      amount: Math.round(p.amountNaira * 100), // kobo
      currency: "NGN",
      reference: p.reference,
      callback_url: p.callbackUrl,
      metadata: { booking_ref: p.bookingRef },
    }),
  });
}

export function verifyPayment(reference: string) {
  return call<{ status: string; amount: number; currency: string; reference: string }>(`/transaction/verify/${encodeURIComponent(reference)}`);
}

export function refundPayment(reference: string, amountNaira: number) {
  return call<{ id: number }>("/refund", {
    method: "POST",
    body: JSON.stringify({ transaction: reference, amount: Math.round(amountNaira * 100) }),
  });
}

// Paystack signs every webhook with HMAC-SHA512 of the raw body.
export function validSignature(rawBody: string, signature: string | null): boolean {
  if (!SECRET || !signature) return false;
  const expected = createHmac("sha512", SECRET).update(rawBody).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}

// Marks a booking paid once Paystack confirms the full amount. Safe to call
// twice (from the return page and the webhook).
export async function markPaid(db: SupabaseClient, reference: string, amountKobo: number, currency = "NGN"): Promise<boolean> {
  const { data: b } = await db.from("bookings").select("id, total, payment_status, status").eq("paystack_reference", reference).maybeSingle();
  if (!b) return false;
  if (b.payment_status === "paid") return true;
  if (currency !== "NGN" || amountKobo < b.total * 100) {
    console.error("paystack amount mismatch", reference, amountKobo, b.total);
    return false;
  }
  const { data } = await db.from("bookings")
    .update({ payment_status: "paid", paid_amount: Math.round(amountKobo / 100), paid_at: new Date().toISOString() })
    .eq("id", b.id).neq("payment_status", "paid").select("id");
  if (data?.length) await db.from("booking_events").insert({ booking_id: b.id, status: b.status, note: `Paid online ₦${Math.round(amountKobo / 100).toLocaleString("en-NG")} (Paystack ${reference})` });
  return true;
}
