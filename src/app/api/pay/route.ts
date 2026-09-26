import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { adminClient } from "@/lib/supabase/admin";
import { bookingByToken } from "@/lib/booking-by-token";
import { paymentsEnabled, startPayment } from "@/lib/paystack";

const Pay = z.object({ token: z.string(), email: z.string().trim().email("Enter a valid email for your receipt") });

// Starts a Paystack payment for an assigned booking and returns the page to pay on.
export async function POST(req: Request) {
  const parsed = Pay.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Check the form" }, { status: 400 });
  const db = adminClient();
  if (!db || !paymentsEnabled()) return NextResponse.json({ error: "Online payment is not switched on yet." }, { status: 503 });

  const found = await bookingByToken(db, parsed.data.token);
  if (!found) return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  const b = found.booking;
  if (b.payment_status === "paid") return NextResponse.json({ error: "This booking is already paid." }, { status: 409 });
  if (b.status !== "assigned") return NextResponse.json({ error: "You can pay once a driver has accepted your booking." }, { status: 409 });

  const reference = `${b.ref}-${randomBytes(3).toString("hex")}`;
  const origin = new URL(req.url).origin;
  try {
    const { authorization_url } = await startPayment({
      email: parsed.data.email,
      amountNaira: b.total,
      reference,
      callbackUrl: `${origin}/track/${parsed.data.token}`,
      bookingRef: b.ref,
    });
    await db.from("bookings").update({ paystack_reference: reference, payment_status: "pending", customer_email: parsed.data.email }).eq("id", b.id);
    return NextResponse.json({ url: authorization_url });
  } catch (e) {
    console.error("paystack initialize failed", e);
    return NextResponse.json({ error: "We couldn't start the payment. Please try again." }, { status: 502 });
  }
}
