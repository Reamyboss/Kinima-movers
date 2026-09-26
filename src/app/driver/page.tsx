"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Brand from "@/components/Brand";
import AreaWarnings from "@/components/AreaWarnings";
import { notesForTrip, type AreaNote } from "@/lib/area-notes";
import { SECTORS, sectorName } from "@/lib/sectors";

const TripMap = dynamic(() => import("@/components/TripMap"), { ssr: false });
import { formatNaira, LOAD_TYPES, ZONES } from "@/lib/pricing";
import { browserClient, supabaseConfigured } from "@/lib/supabase/client";

type Driver = { status: "pending" | "approved" | "suspended"; is_online: boolean; plate_number: string | null; current_area: string | null; base_area: string };
type OpenJob = {
  id: string; ref: string; pickup_area: string; dropoff_area: string; load_type: string; helpers: number;
  pickup_floors: number; dropoff_floors: number; driver_earning: number; scheduled_for: string | null; created_at: string;
};
type Job = OpenJob & {
  status: string; customer_name: string; customer_phone: string; pickup_address: string; dropoff_address: string;
  load_notes: string | null; total: number; levy_paid?: number;
};

const NEXT_ACTION: Record<string, string> = {
  assigned: "Start driving to pickup",
  driver_en_route: "I've arrived at pickup",
  arrived_pickup: "Load secured, start trip",
  in_transit: "Mark as delivered",
};
const STATUS_LABEL: Record<string, string> = {
  assigned: "Accepted",
  driver_en_route: "On the way to pickup",
  arrived_pickup: "At pickup",
  in_transit: "In transit",
};
const loadName = (id: string) => LOAD_TYPES.find((l) => l.id === id)?.name ?? id;
const mapsLink = (address: string, area: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${address}, ${area}, Lagos`)}`;

export default function DriverHome() {
  const supabase = useMemo(() => (supabaseConfigured ? browserClient() : null), []);
  const [state, setState] = useState<"loading" | "signed-out" | "ready">("loading");
  const [name, setName] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [driver, setDriver] = useState<Driver | null>(null);
  const [jobs, setJobs] = useState<OpenJob[]>([]);
  const [active, setActive] = useState<Job | null>(null);
  const [today, setToday] = useState({ trips: 0, earned: 0 });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [notes, setNotes] = useState<AreaNote[]>([]);
  const [sector, setSector] = useState<string | null>(null);
  const [levy, setLevy] = useState({ amount: "", note: "" });

  const refresh = useCallback(async () => {
    if (!supabase) return setState("signed-out");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return setState("signed-out");

    const [{ data: profile }, { data: d }] = await Promise.all([
      supabase.from("profiles").select("full_name, role").eq("id", user.id).single(),
      supabase.from("drivers").select("status,is_online,plate_number,current_area,base_area").eq("id", user.id).maybeSingle(),
    ]);
    setName(profile?.full_name?.split(" ")[0] ?? "");
    setIsAdmin(profile?.role === "admin");
    setDriver(d);
    // Read separately so the page still works before the sectors update is run.
    const { data: sec } = await supabase.from("drivers").select("sector").eq("id", user.id).maybeSingle();
    setSector((sec as { sector?: string } | null)?.sector ?? null);
    if (d?.status === "approved") {
      const start = new Date(); start.setHours(0, 0, 0, 0);
      const [{ data: mine }, { data: open }] = await Promise.all([
        supabase.from("bookings").select("*").eq("driver_id", user.id).gte("created_at", new Date(Date.now() - 7 * 864e5).toISOString()),
        d.is_online ? supabase.rpc("list_open_jobs") : Promise.resolve({ data: [] as OpenJob[] }),
      ]);
      const list = (mine ?? []) as Job[];
      setActive(list.find((j) => !["delivered", "cancelled"].includes(j.status)) ?? null);
      const done = list.filter((j) => j.status === "delivered" && new Date(j.created_at) >= start);
      setToday({ trips: done.length, earned: done.reduce((s, j) => s + j.driver_earning, 0) });
      setJobs((open ?? []) as OpenJob[]);
    }
    setState("ready");
  }, [supabase]);

  useEffect(() => {
    // Levy notes change rarely, so load them once per visit.
    supabase?.from("area_notes").select("id,place,area,keywords,levy_min,levy_max,note").eq("active", true).then(({ data }) =>
      setNotes((data ?? []).map((n) => ({ id: n.id, place: n.place, area: n.area, keywords: n.keywords ?? [], levyMin: n.levy_min, levyMax: n.levy_max, note: n.note }))));
  }, [supabase]);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 10_000);
    return () => clearInterval(t);
  }, [refresh]);

  async function run(fn: () => PromiseLike<{ error: { message: string } | null }>) {
    setBusy(true);
    setError("");
    const { error } = await fn();
    if (error) setError(error.message);
    await refresh();
    setBusy(false);
  }

  if (state === "loading") return <main><Brand /><p className="wrap muted">Loading…</p></main>;

  if (state === "signed-out") {
    return (
      <main>
        <Brand />
        <section className="wrap max-w-md py-6">
          <div className="card flex flex-col gap-3 p-6">
            <h1 className="display text-2xl font-extrabold">Drive with Kinma Movers</h1>
            <p>Get moving jobs from Ikorodu to anywhere in Lagos. Keep {Math.round(0.8 * 100)}% of every trip.</p>
            <Link href="/driver/signup" className="btn btn-amber justify-center">Apply to drive</Link>
            <Link href="/login" className="btn btn-ghost justify-center">Sign in</Link>
          </div>
        </section>
      </main>
    );
  }

  const adminLink = isAdmin ? <Link href="/admin" className="btn btn-amber justify-center">Open admin dashboard</Link> : null;
  const signOut = <button className="muted font-semibold" onClick={async () => { await supabase?.auth.signOut(); refresh(); }}>Sign out</button>;

  if (!driver || driver.status !== "approved") {
    return (
      <main>
        <Brand right={signOut} />
        <section className="wrap max-w-md py-6">
          <div className="card flex flex-col gap-2 p-6">
            <h1 className="display text-2xl font-extrabold">{driver?.status === "suspended" ? "Account paused" : "Waiting for approval"}</h1>
            <p>{driver?.status === "suspended"
              ? "Your driver account is paused. Please call the Kinma Movers office."
              : isAdmin
                ? "You're the admin. To take jobs as a driver too, approve yourself in the Drivers tab of your dashboard."
                : "Thanks for applying. The Kinma Movers team is checking your details. Once you're approved you can go online here."}</p>
            {adminLink}
          </div>
        </section>
      </main>
    );
  }

  return (
    <main>
      <Brand right={signOut} />
      <section className="wrap flex max-w-xl flex-col gap-4 pb-10">
        {adminLink}
        <div className="flex items-center justify-between">
          <h1 className="display text-2xl font-extrabold">Hi{name ? `, ${name}` : ""}</h1>
          <span className="muted font-mono">{driver.plate_number}</span>
        </div>
        {sector && (
          <p className="muted -mt-2">Your sector: <b>{sectorName(sector)}</b>. {SECTORS.find((s) => s.id === sector)?.description}. Call the office to change it.</p>
        )}

        <div className="card flex items-center justify-between gap-3 p-4" style={{ background: "var(--soft)" }}>
          <div>
            <b>{driver.is_online ? "You're online" : "You're offline"}</b>
            <div className="muted">{driver.is_online ? "New jobs show below" : "Go online to see jobs"}</div>
          </div>
          <button
            id="online"
            role="switch"
            aria-checked={driver.is_online}
            disabled={busy || !!active}
            onClick={() => run(() => supabase!.rpc("set_driver_online", { p_online: !driver.is_online }))}
            className="btn"
            style={{ background: driver.is_online ? "var(--ok)" : "var(--line)", color: driver.is_online ? "#fff" : "var(--ink)" }}
          >
            {driver.is_online ? "Online" : "Go online"}
          </button>
        </div>

        <label className="card flex items-center justify-between gap-3 p-4">
          <span><b>Where are you now?</b><span className="muted block">Closer drivers get matched first</span></span>
          <select
            id="current_area"
            className="input w-auto"
            value={driver.current_area ?? driver.base_area}
            disabled={busy}
            onChange={(e) => run(() => supabase!.rpc("set_driver_area", { p_area: e.target.value }))}
          >
            {ZONES.map((z) => (
              <optgroup key={z.id} label={z.name}>{z.areas.map((a) => <option key={a}>{a}</option>)}</optgroup>
            ))}
          </select>
        </label>

        <div className="grid grid-cols-2 gap-3">
          <div className="card p-3"><b className="display num text-xl">{formatNaira(today.earned)}</b><div className="muted">Earned today</div></div>
          <div className="card p-3"><b className="display num text-xl">{today.trips}</b><div className="muted">Trips today</div></div>
        </div>

        {error && <p role="alert" className="font-semibold text-[var(--danger)]">{error}</p>}

        {active ? (
          <div className="card flex flex-col gap-3 p-4" style={{ borderColor: "var(--amber)", borderWidth: 2 }}>
            <div className="flex items-center justify-between">
              <span className="font-mono text-sm">{active.ref}</span>
              <span className="rounded-full bg-[var(--amber)] px-3 py-1 text-xs font-bold text-[var(--amber-ink)]">{STATUS_LABEL[active.status]}</span>
            </div>
            <TripMap from={active.pickup_area} to={active.dropoff_area} height={200} />
            <div className="grid gap-1 text-sm">
              <div><span className="muted">Customer</span> <b>{active.customer_name}</b> · <span className="select-all">{active.customer_phone}</span></div>
              <div><span className="muted">Pickup</span> {active.pickup_address}, {active.pickup_area} {active.pickup_floors ? `(${active.pickup_floors} floors up)` : ""}</div>
              <div><span className="muted">Drop-off</span> {active.dropoff_address}, {active.dropoff_area} {active.dropoff_floors ? `(${active.dropoff_floors} floors up)` : ""}</div>
              <div><span className="muted">Load</span> {loadName(active.load_type)}{active.helpers ? `, ${active.helpers} helper${active.helpers > 1 ? "s" : ""}` : ""}{active.load_notes ? ` · ${active.load_notes}` : ""}</div>
              <div><span className="muted">Collect</span> <b className="num">{formatNaira(active.total + (active.levy_paid ?? 0))}</b> <span className="muted">(you keep {formatNaira(active.driver_earning)}{active.levy_paid ? `, plus ${formatNaira(active.levy_paid)} levy refund` : ""})</span></div>
            </div>
            <AreaWarnings notes={notesForTrip(notes, { pickupArea: active.pickup_area, dropoffArea: active.dropoff_area, pickupAddress: active.pickup_address, dropoffAddress: active.dropoff_address })} audience="driver" />
            <details className="rounded-xl bg-[var(--soft)] p-3 text-sm">
              <summary className="font-semibold">Paid an area levy? Record it</summary>
              <form
                className="mt-2 flex flex-col gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  run(async () => {
                    const r = await supabase!.rpc("record_levy", { p_booking: active.id, p_amount: Math.round(Number(levy.amount)), p_note: levy.note });
                    if (!r.error) setLevy({ amount: "", note: "" });
                    return r;
                  });
                }}
              >
                <input id="levy_amount" className="input" type="number" min={1} max={100000} required placeholder="Amount paid (₦)" value={levy.amount} onChange={(e) => setLevy((p) => ({ ...p, amount: e.target.value }))} />
                <input id="levy_note" className="input" required maxLength={200} placeholder="Where, and who collected it (e.g. Alaba gate, market union)" value={levy.note} onChange={(e) => setLevy((p) => ({ ...p, note: e.target.value }))} />
                <button className="btn btn-ghost justify-center" disabled={busy}>Save levy</button>
                <p className="muted">The customer refunds this at cost when you deliver. Take a photo of any ticket or receipt.</p>
              </form>
            </details>
            <a
              className="btn btn-ghost justify-center"
              target="_blank"
              rel="noreferrer"
              href={["assigned", "driver_en_route"].includes(active.status) ? mapsLink(active.pickup_address, active.pickup_area) : mapsLink(active.dropoff_address, active.dropoff_area)}
            >
              Open directions in Google Maps
            </a>
            <button className="btn btn-brand" disabled={busy} onClick={() => run(() => supabase!.rpc("advance_booking", { p_booking: active.id }))}>
              <span>{NEXT_ACTION[active.status]}</span><span>›</span>
            </button>
          </div>
        ) : driver.is_online ? (
          jobs.length ? (
            <div className="flex flex-col gap-3">
              <span className="eyebrow">New jobs</span>
              {jobs.map((j) => (
                <div key={j.id} className="card flex flex-col gap-2 p-4">
                  <div className="flex items-center justify-between">
                    <b>{j.pickup_area} → {j.dropoff_area}</b>
                    <b className="display num text-lg">{formatNaira(j.driver_earning)}</b>
                  </div>
                  <div className="muted">
                    {loadName(j.load_type)} · {j.helpers} helper{j.helpers === 1 ? "" : "s"} · {j.pickup_floors + j.dropoff_floors} floors of stairs
                    {j.scheduled_for ? ` · ${new Date(j.scheduled_for).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })}` : " · now"}
                  </div>
                  <AreaWarnings notes={notesForTrip(notes, { pickupArea: j.pickup_area, dropoffArea: j.dropoff_area })} audience="driver" />
                  <button className="btn btn-amber justify-center" disabled={busy} onClick={() => run(async () => {
                    const r = await supabase!.rpc("accept_booking", { p_booking: j.id });
                    return r.data === false ? { error: { message: "Another driver took this job." } } : r;
                  })}>Accept job</button>
                </div>
              ))}
            </div>
          ) : (
            <p className="card muted p-6 text-center">No jobs right now. This page checks for new ones every 10 seconds.</p>
          )
        ) : null}
      </section>
    </main>
  );
}
