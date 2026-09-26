import { NextResponse } from "next/server";
import { z } from "zod";
import { computeQuote } from "@/lib/pricing";
import { loadPricing } from "@/lib/pricing-db";
import { adminClient } from "@/lib/supabase/admin";
import { loadAreaNotes } from "@/lib/area-notes-db";
import { notesForTrip, levyText } from "@/lib/area-notes";
import { TERMS_VERSION } from "@/lib/company";
import { paymentsEnabled } from "@/lib/paystack";

const Booking = z.object({
  customerName: z.string().trim().min(2, "Enter your name"),
  customerPhone: z.string().transform((s) => s.replace(/[\s-]/g, "")).pipe(z.string().regex(/^(\+?234|0)[789][01]\d{8}$/, "Enter a Nigerian phone number, e.g. 0803 123 4567")),
  pickupArea: z.string(),
  pickupAddress: z.string().trim().min(5, "Enter the pickup street address"),
  pickupFloors: z.coerce.number().int().min(0).max(20),
  dropoffArea: z.string(),
  dropoffAddress: z.string().trim().min(5, "Enter the drop-off street address"),
  dropoffFloors: z.coerce.number().int().min(0).max(20),
  loadType: z.string(),
  loadNotes: z.string().trim().max(500).optional(),
  helpers: z.coerce.number().int().min(0).max(4),
  scheduledFor: z.string().datetime({ offset: true }).optional().or(z.literal("")),
  termsAccepted: z.literal(true, { error: "Please agree to the terms to book" }),
});

export async function POST(req: Request) {
  const parsed = Booking.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Check the form" }, { status: 400 });
  }
  const b = parsed.data;

  // Never trust a price from the browser: recompute from the live price list.
  let quote;
  try {
    quote = computeQuote(b, await loadPricing());
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }

  const db = adminClient();
  if (!db) {
    return NextResponse.json({ error: "Bookings open once the database is connected." }, { status: 503 });
  }

  // Record which levy warnings the customer saw, so a dispute can be settled.
  const warnings = notesForTrip(await loadAreaNotes(), b).map((n) => ({ place: n.place, levy: levyText(n), note: n.note }));
  const row = {
    customer_name: b.customerName,
    customer_phone: b.customerPhone,
    pickup_area: b.pickupArea,
    pickup_address: b.pickupAddress,
    pickup_floors: b.pickupFloors,
    dropoff_area: b.dropoffArea,
    dropoff_address: b.dropoffAddress,
    dropoff_floors: b.dropoffFloors,
    load_type: b.loadType,
    load_notes: b.loadNotes || null,
    helpers: b.helpers,
    scheduled_for: b.scheduledFor || null,
    quote_lines: quote.lines,
    total: quote.total,
    driver_earning: quote.driverEarning,
  };
  const extra = {
    terms_version: TERMS_VERSION,
    terms_accepted_at: new Date().toISOString(),
    area_warnings: warnings,
    ...(paymentsEnabled() && { payment_required: true }),
  };

  let { data, error } = await db.from("bookings").insert({ ...row, ...extra }).select("id, ref, total").single();
  if (error?.code === "PGRST204") {
    // The database update that adds these columns hasn't been run yet; still take the booking.
    console.warn("bookings missing newer columns; run the latest supabase/migrations");
    ({ data, error } = await db.from("bookings").insert(row).select("id, ref, total").single());
  }

  if (error || !data) {
    console.error("booking insert failed", error);
    return NextResponse.json({ error: "We couldn't save your booking. Please try again." }, { status: 500 });
  }
  await db.from("booking_events").insert({ booking_id: data.id, status: "requested" });

  // The customer's private booking page link (pay, track, delivery code).
  const { data: secret } = await db.from("booking_secrets").insert({ booking_id: data.id }).select("access_token").single();
  return NextResponse.json({ ref: data.ref, total: data.total, token: secret?.access_token ?? null, payFirst: paymentsEnabled() });
}
