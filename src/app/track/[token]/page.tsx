import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Brand from "@/components/Brand";
import SiteFooter from "@/components/SiteFooter";
import PayNow from "@/components/PayNow";
import AutoRefresh from "@/components/AutoRefresh";
import { adminClient } from "@/lib/supabase/admin";
import { bookingByToken } from "@/lib/booking-by-token";
import { markPaid, paymentsEnabled, verifyPayment } from "@/lib/paystack";
import { formatNaira, LOAD_TYPES } from "@/lib/pricing";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Your booking · Kinma Movers", robots: { index: false } };

const STEPS = [
  { id: "requested", label: "Finding your driver" },
  { id: "assigned", label: "Driver accepted" },
  { id: "driver_en_route", label: "Driver on the way" },
  { id: "arrived_pickup", label: "Driver at pickup" },
  { id: "in_transit", label: "Goods on the move" },
  { id: "delivered", label: "Delivered" },
];

type Props = { params: Promise<{ token: string }>; searchParams: Promise<{ reference?: string }> };

export default async function TrackBooking({ params, searchParams }: Props) {
  const { token } = await params;
  const { reference } = await searchParams;
  const db = adminClient();
  if (!db) notFound();

  let found = await bookingByToken(db, token);
  if (!found) notFound();

  // Back from Paystack: confirm the payment directly with Paystack.
  if (reference && paymentsEnabled() && reference === found.booking.paystack_reference && found.booking.payment_status !== "paid") {
    try {
      const v = await verifyPayment(reference);
      if (v.status === "success") await markPaid(db, reference, v.amount, v.currency);
    } catch (e) {
      console.error("paystack verify failed", e);
    }
    found = (await bookingByToken(db, token))!;
  }

  const b = found.booking;
  const driver = b.driver as { plate_number: string | null; vehicle: string; profile: { full_name: string; phone: string } | null } | null;
  const cancelled = b.status === "cancelled";
  const current = STEPS.findIndex((s) => s.id === b.status);
  const needsPay = b.payment_required && b.payment_status !== "paid" && b.payment_status !== "refunded";
  const load = LOAD_TYPES.find((l) => l.id === b.load_type)?.name ?? b.load_type;

  return (
    <main>
      <Brand right={<Link href="/" className="muted font-semibold">Book another move</Link>} />
      {!cancelled && b.status !== "delivered" && <AutoRefresh />}
      <section className="wrap flex max-w-xl flex-col gap-4 pb-10">
        <div>
          <span className="eyebrow">Booking {b.ref}</span>
          <h1 className="display text-3xl font-extrabold">{cancelled ? "Booking cancelled" : STEPS[current]?.label}</h1>
          <p className="muted">Keep this page. It updates by itself, and only people with this link can see it.</p>
        </div>

        {!cancelled && (
          <ol className="card flex flex-col gap-2 p-4">
            {STEPS.map((s, i) => (
              <li key={s.id} className="flex items-center gap-3">
                <span className="grid h-6 w-6 place-items-center rounded-full text-xs font-bold"
                  style={{ background: i <= current ? "var(--brand)" : "var(--line)", color: i <= current ? "var(--brand-ink)" : "var(--muted)" }}>
                  {i < current ? "✓" : i + 1}
                </span>
                <span className={i === current ? "font-bold" : i < current ? "" : "muted"}>{s.label}</span>
              </li>
            ))}
          </ol>
        )}

        {driver && !cancelled && (
          <div className="card flex flex-col gap-1 p-4">
            <span className="eyebrow">Your driver</span>
            <b>{driver.profile?.full_name}</b>
            <span>{driver.vehicle} · <span className="font-mono">{driver.plate_number}</span></span>
            {driver.profile?.phone && <span>Phone: <span className="select-all font-semibold">{driver.profile.phone}</span></span>}
          </div>
        )}

        {needsPay && !cancelled && (
          <div className="card flex flex-col gap-3 p-4" style={{ borderColor: "var(--amber)", borderWidth: 2 }}>
            <span className="eyebrow">Payment</span>
            {b.status === "requested" ? (
              <p>You&apos;ll pay here as soon as a driver accepts. The driver starts driving to you once payment is made.</p>
            ) : (
              <>
                <p><b>Your driver is ready.</b> Pay now so they can start driving to you.</p>
                <PayNow token={token} total={b.total} email={b.customer_email} />
              </>
            )}
          </div>
        )}

        {b.payment_status === "paid" && (
          <div className="card flex flex-col gap-2 p-4">
            <span className="eyebrow">Paid</span>
            <p><b className="num">{formatNaira(b.paid_amount)}</b> received. It is held until your goods are delivered.</p>
          </div>
        )}
        {b.payment_status === "refunded" && (
          <p className="card p-4"><b className="num">{formatNaira(b.refunded_amount)}</b> has been refunded to your original payment method. It can take a few working days to arrive.</p>
        )}

        {!cancelled && b.status !== "delivered" && (!b.payment_required || b.payment_status === "paid") && (
          <div className="card flex flex-col gap-1 p-4">
            <span className="eyebrow">Delivery code</span>
            <b className="display num text-4xl tracking-[.3em]">{found.deliveryCode}</b>
            <p className="muted">Give this code to the driver only when all your goods have arrived safely. It confirms delivery and releases the driver&apos;s pay.</p>
          </div>
        )}

        <div className="card grid gap-1 p-4 text-sm">
          <div><span className="muted">From</span> {b.pickup_address}, {b.pickup_area}</div>
          <div><span className="muted">To</span> {b.dropoff_address}, {b.dropoff_area}</div>
          <div><span className="muted">Load</span> {load}{b.helpers ? `, ${b.helpers} helper${b.helpers > 1 ? "s" : ""}` : ""}</div>
          <div><span className="muted">Price</span> <b className="num">{formatNaira(b.total)}</b>{b.levy_paid > 0 ? <> + <span className="num">{formatNaira(b.levy_paid)}</span> area levy paid by the driver</> : null}</div>
          {!b.payment_required && <div className="muted">Pay the driver on delivery by cash or bank transfer.</div>}
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
