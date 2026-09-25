import BookingForm from "@/components/BookingForm";
import { formatNaira } from "@/lib/pricing";
import { loadPricing } from "@/lib/pricing-db";

export const revalidate = 60;

export default async function Home() {
  const pricing = await loadPricing();

  return (
    <main>
      <header className="wrap flex items-center justify-between py-5">
        <span className="display flex items-center gap-2 text-2xl font-extrabold">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-[var(--amber)]" aria-hidden>
            <svg width="22" height="16" viewBox="0 0 22 16"><rect x="0" y="2" width="13" height="9" rx="1.5" fill="#1B1400" /><path d="M13 5h4.5l3 3.5V11H13z" fill="#1B1400" /><circle cx="4.5" cy="13" r="2.4" fill="#1B1400" /><circle cx="16.5" cy="13" r="2.4" fill="#1B1400" /></svg>
          </span>
          CarryGo
        </span>
        <span className="muted font-semibold">Ikorodu, Lagos</span>
      </header>

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
        <BookingForm pricing={pricing} />
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
    </main>
  );
}
