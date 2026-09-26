import { NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";
import { markPaid, validSignature } from "@/lib/paystack";

// Paystack calls this when a payment succeeds, even if the customer closes
// the page before returning to us. Only signed calls are trusted.
export async function POST(req: Request) {
  const raw = await req.text();
  if (!validSignature(raw, req.headers.get("x-paystack-signature"))) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }
  const event = JSON.parse(raw);
  const db = adminClient();
  if (db && event?.event === "charge.success" && event.data?.status === "success") {
    await markPaid(db, event.data.reference, event.data.amount, event.data.currency);
  }
  return NextResponse.json({ received: true });
}
