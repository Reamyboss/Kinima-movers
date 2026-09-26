import Link from "next/link";
import Brand from "@/components/Brand";
import BookingForm from "@/components/BookingForm";
import SiteFooter from "@/components/SiteFooter";
import { formatNaira } from "@/lib/pricing";
import { loadPricing } from "@/lib/pricing-db";
import { loadAreaNotes } from "@/lib/area-notes-db";

export const revalidate = 60;

export default async function Home() {
  const [pricing, areaNotes] = await Promise.all([loadPricing(), loadAreaNotes()]);

  return (
    <main>
      <Brand right={<Link href="/driver" className="muted font-semibold">Drive with us</Link>} />

      <section className="wrap grid items-start gap-8 py-6 lg:grid-cols-[1fr_1.1fr]">
        <div className="flex flex-col gap-4 lg:sticky lg:top-6">
          <span className="eyebrow">Mini truck moves · Ikorodu hub</span>
          <h1 className="display text-4xl font-extrabold leading-tight sm:text-5xl" style={{ fontStretch: "80%", textWrap: "balance" }}>
            No matter the size of load you wan move, <span className="highlight">your size of motto dey.</span>
          </h1>
          <p className="max-w-prose text-[var(--muted)]">
            Household items, furniture and goods moved in and out of Ikorodu to anywhere in Lagos. Get your price now, book in a minute, and pay on delivery.
          </p>
          <ul className="grid gap-2 text-sm">
            <li>✓ Price shown before you book, no haggling</li>
            <li>✓ Vetted drivers with Suzuki Carry trucks</li>
            <li>✓ Loading helpers available</li>
          </ul>
        </div>
        <BookingForm pricing={pricing} areaNotes={areaNotes} />
      </section>

      <section className="wrap py-10">
        <span className="eyebrow">Our prices from Ikorodu</span>
        <div className="mt-3 overflow-x-auto card">
          <table className="w-full min-w-[520px] text-sm num">
            <thead>
              <tr className="text-left"><th className="eyebrow p-3">Zone</th><th className="eyebrow p-3">Areas</th><th className="eyebrow p-3 text-right">From</th></tr>
            </thead>
            <tbody>
              {pricing.zones.map((z) => (
                <tr key={z.id} className="border-t border-[var(--line)]">
                  <td className="p-3"><b>{z.id}</b> · {z.name}</td>
                  <td className="p-3">{z.areas.join(", ")}</td>
                  <td className="p-3 text-right font-semibold">{formatNaira(z.fare)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="muted mt-3 max-w-prose">
          Your price is the zone fare times the load size, plus {formatNaira(pricing.extras.helperFee)} per loading helper and {formatNaira(pricing.extras.stairsFeePerFloor)} per floor of stairs at pickup or drop-off.
        </p>
      </section>
      <SiteFooter />
    </main>
  );
}
