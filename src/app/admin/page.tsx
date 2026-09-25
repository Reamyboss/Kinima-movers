import Link from "next/link";
import Brand from "@/components/Brand";
import { requireAdmin } from "@/lib/admin-auth";
import { formatNaira } from "@/lib/pricing";
import { assignDriver, cancelBooking, savePrices, setDriverStatus } from "./actions";

export const dynamic = "force-dynamic";

const TABS = [
  { id: "jobs", label: "Jobs" },
  { id: "drivers", label: "Drivers" },
  { id: "prices", label: "Prices" },
] as const;

const STATUS: Record<string, { label: string; tone: string }> = {
  requested: { label: "Needs driver", tone: "var(--amber)" },
  assigned: { label: "Accepted", tone: "var(--soft)" },
  driver_en_route: { label: "To pickup", tone: "var(--soft)" },
  arrived_pickup: { label: "At pickup", tone: "var(--soft)" },
  in_transit: { label: "In transit", tone: "var(--soft)" },
  delivered: { label: "Delivered", tone: "var(--ok)" },
  cancelled: { label: "Cancelled", tone: "var(--line)" },
};

type SearchParams = Promise<{ tab?: string }>;

export default async function AdminPage({ searchParams }: { searchParams: SearchParams }) {
  const { db, me } = await requireAdmin();
  const tab = (await searchParams).tab ?? "jobs";

  return (
    <main>
      <Brand right={<span className="muted font-semibold">Admin · {me?.full_name ?? "Owner"}</span>} />
      <nav className="wrap flex gap-2 pb-4" aria-label="Admin sections">
        {TABS.map((t) => (
          <Link key={t.id} href={`/admin?tab=${t.id}`} className="chip" aria-pressed={tab === t.id}>
            <b>{t.label}</b>
          </Link>
        ))}
      </nav>
      <section className="wrap pb-12">
        {tab === "drivers" ? <Drivers db={db} /> : tab === "prices" ? <Prices db={db} /> : <Jobs db={db} />}
      </section>
    </main>
  );
}

type Db = Awaited<ReturnType<typeof requireAdmin>>["db"];

async function Jobs({ db }: { db: Db }) {
  const [{ data: bookings }, { data: drivers }] = await Promise.all([
    db.from("bookings").select("*, driver:drivers(id, plate_number, profile:profiles(full_name, phone))").order("created_at", { ascending: false }).limit(100),
    db.from("drivers").select("id, plate_number, is_online, profile:profiles(full_name)").eq("status", "approved"),
  ]);
  const list = bookings ?? [];
  const open = list.filter((b) => b.status === "requested").length;
  const moving = list.filter((b) => !["requested", "delivered", "cancelled"].includes(b.status)).length;
  const start = new Date(); start.setHours(0, 0, 0, 0);
  const revenue = list.filter((b) => b.status === "delivered" && new Date(b.created_at) >= start).reduce((s, b) => s + b.total, 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="card p-4"><b className="display num text-2xl">{open}</b><div className="muted">Need a driver</div></div>
        <div className="card p-4"><b className="display num text-2xl">{moving}</b><div className="muted">On the road</div></div>
        <div className="card p-4"><b className="display num text-2xl">{formatNaira(revenue)}</b><div className="muted">Delivered today</div></div>
      </div>
      {list.length === 0 && <p className="card muted p-6 text-center">No bookings yet. New bookings from the website appear here.</p>}
      {list.map((b) => {
        const s = STATUS[b.status];
        const d = b.driver as unknown as { plate_number: string; profile: { full_name: string; phone: string } } | null;
        return (
          <div key={b.id} className="card flex flex-col gap-2 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-mono text-sm">{b.ref}</span>
              <span className="rounded-full px-3 py-1 text-xs font-bold" style={{ background: s.tone, color: b.status === "delivered" ? "#fff" : "var(--ink)" }}>{s.label}</span>
            </div>
            <b>{b.pickup_area} → {b.dropoff_area} <span className="display num float-right">{formatNaira(b.total)}</span></b>
            <div className="muted">
              {b.customer_name} · <span className="select-all">{b.customer_phone}</span> · {b.load_type}, {b.helpers} helpers, {b.pickup_floors + b.dropoff_floors} floors ·{" "}
              {b.scheduled_for ? `for ${new Date(b.scheduled_for).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })}` : `booked ${new Date(b.created_at).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })}`}
            </div>
            <div className="muted">{b.pickup_address} → {b.dropoff_address}{b.load_notes ? ` · ${b.load_notes}` : ""}</div>
            {d && <div className="text-sm">Driver: <b>{d.profile?.full_name}</b> · {d.plate_number} · {d.profile?.phone}</div>}
            {["requested", "assigned"].includes(b.status) && (
              <div className="flex flex-wrap gap-2">
                <form action={assignDriver} className="flex flex-wrap gap-2">
                  <input type="hidden" name="booking" value={b.id} />
                  <select name="driver" id={`driver-${b.id}`} className="input w-auto" defaultValue="" required>
                    <option value="" disabled>Choose driver</option>
                    {(drivers ?? []).map((x) => {
                      const p = x.profile as unknown as { full_name: string } | null;
                      return <option key={x.id} value={x.id}>{p?.full_name} · {x.plate_number}{x.is_online ? " · online" : ""}</option>;
                    })}
                  </select>
                  <button className="btn btn-brand">{b.status === "requested" ? "Assign" : "Reassign"}</button>
                </form>
                <form action={cancelBooking}>
                  <input type="hidden" name="booking" value={b.id} />
                  <button className="btn btn-ghost">Cancel booking</button>
                </form>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

async function Drivers({ db }: { db: Db }) {
  const { data } = await db.from("drivers").select("*, profile:profiles(full_name, phone)").order("created_at", { ascending: false });
  const list = data ?? [];
  if (!list.length) return <p className="card muted p-6 text-center">No drivers yet. Share the link /driver/signup with the drivers in your circle.</p>;
  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[640px] text-sm">
        <thead><tr className="text-left">{["Driver", "Phone", "Plate", "Licence", "Status", ""].map((h) => <th key={h} className="eyebrow p-3">{h}</th>)}</tr></thead>
        <tbody>
          {list.map((d) => {
            const p = d.profile as unknown as { full_name: string; phone: string } | null;
            return (
              <tr key={d.id} className="border-t border-[var(--line)]">
                <td className="p-3 font-semibold">{p?.full_name}{d.is_online && <span className="muted"> · online</span>}</td>
                <td className="p-3 select-all">{p?.phone}</td>
                <td className="p-3 font-mono">{d.plate_number}</td>
                <td className="p-3">{d.licence_number}</td>
                <td className="p-3">{d.status}</td>
                <td className="p-3">
                  <form action={setDriverStatus} className="flex gap-2">
                    <input type="hidden" name="id" value={d.id} />
                    {d.status !== "approved" && <button name="status" value="approved" className="btn btn-brand px-3 py-2">Approve</button>}
                    {d.status === "approved" && <button name="status" value="suspended" className="btn btn-ghost px-3 py-2">Suspend</button>}
                  </form>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

async function Prices({ db }: { db: Db }) {
  const [{ data: zones }, { data: loads }, { data: settings }] = await Promise.all([
    db.from("pricing_zones").select("*").order("sort"),
    db.from("pricing_load_types").select("*").order("sort"),
    db.from("pricing_settings").select("*").single(),
  ]);
  return (
    <form action={savePrices} className="flex max-w-2xl flex-col gap-6">
      <fieldset className="card flex flex-col gap-3 p-5">
        <legend className="eyebrow px-1">Zone fares from Ikorodu (₦)</legend>
        {(zones ?? []).map((z) => (
          <label key={z.id} className="flex items-center justify-between gap-3">
            <span><b>{z.id}</b> · {z.name}</span>
            <input id={`zone-${z.id}`} name={`zone:${z.id}`} type="number" min={0} step={500} defaultValue={z.fare} className="input num w-40 text-right" />
          </label>
        ))}
      </fieldset>
      <fieldset className="card flex flex-col gap-3 p-5">
        <legend className="eyebrow px-1">Load size multipliers</legend>
        {(loads ?? []).map((l) => (
          <label key={l.id} className="flex items-center justify-between gap-3">
            <span>{l.name} <span className="muted">{l.description}</span></span>
            <input id={`load-${l.id}`} name={`load:${l.id}`} type="number" min={0.1} max={9.99} step={0.05} defaultValue={l.multiplier} className="input num w-28 text-right" />
          </label>
        ))}
      </fieldset>
      <fieldset className="card flex flex-col gap-3 p-5">
        <legend className="eyebrow px-1">Extras</legend>
        <label className="flex items-center justify-between gap-3"><span>Per loading helper (₦)</span><input id="helper_fee" name="helper_fee" type="number" min={0} step={500} defaultValue={settings?.helper_fee} className="input num w-40 text-right" /></label>
        <label className="flex items-center justify-between gap-3"><span>Per floor of stairs (₦)</span><input id="stairs_fee_per_floor" name="stairs_fee_per_floor" type="number" min={0} step={500} defaultValue={settings?.stairs_fee_per_floor} className="input num w-40 text-right" /></label>
        <label className="flex items-center justify-between gap-3"><span>Pickup outside Ikorodu (% of that zone&apos;s fare)</span><input id="out_of_hub_pickup_share" name="out_of_hub_pickup_share" type="number" min={0} max={100} defaultValue={Math.round(Number(settings?.out_of_hub_pickup_share) * 100)} className="input num w-28 text-right" /></label>
        <label className="flex items-center justify-between gap-3"><span>Driver keeps (%)</span><input id="driver_share" name="driver_share" type="number" min={0} max={100} defaultValue={Math.round(Number(settings?.driver_share) * 100)} className="input num w-28 text-right" /></label>
      </fieldset>
      <button className="btn btn-brand justify-center">Save prices</button>
      <p className="muted">New prices apply to the website within a minute. Bookings already made keep the price the customer saw.</p>
    </form>
  );
}
