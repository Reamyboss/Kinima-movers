"use client";

import { useMemo, useState } from "react";
import { computeQuote, formatNaira, type PricingConfig } from "@/lib/pricing";

type Step = "trip" | "details" | "done";

function Stepper({ id, value, onChange, max, label }: { id: string; value: number; onChange: (n: number) => void; max: number; label: string }) {
  return (
    <span className="stepper" id={id}>
      <button type="button" aria-label={`Fewer ${label}`} onClick={() => onChange(Math.max(0, value - 1))}>−</button>
      {value}
      <button type="button" aria-label={`More ${label}`} onClick={() => onChange(Math.min(max, value + 1))}>+</button>
    </span>
  );
}

function AreaSelect({ id, value, onChange, pricing }: { id: string; value: string; onChange: (v: string) => void; pricing: PricingConfig }) {
  return (
    <select id={id} className="input" value={value} onChange={(e) => onChange(e.target.value)}>
      {pricing.zones.map((z) => (
        <optgroup key={z.id} label={`Zone ${z.id} · ${z.name}`}>
          {z.areas.map((a) => <option key={a}>{a}</option>)}
        </optgroup>
      ))}
    </select>
  );
}

export default function BookingForm({ pricing }: { pricing: PricingConfig }) {
  const [step, setStep] = useState<Step>("trip");
  const [f, setF] = useState({
    pickupArea: "Ikorodu Garage",
    dropoffArea: "Lekki Phase 1",
    loadType: "furniture",
    helpers: 1,
    pickupFloors: 0,
    dropoffFloors: 0,
    customerName: "",
    customerPhone: "",
    pickupAddress: "",
    dropoffAddress: "",
    loadNotes: "",
    when: "now" as "now" | "later",
    scheduledFor: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [booked, setBooked] = useState<{ ref: string; total: number } | null>(null);
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((p) => ({ ...p, [k]: v }));

  const quote = useMemo(() => {
    try { return computeQuote(f, pricing); } catch { return null; }
  }, [f, pricing]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...f,
          scheduledFor: f.when === "later" && f.scheduledFor ? new Date(f.scheduledFor).toISOString() : "",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong. Please try again.");
      setBooked(data);
      setStep("done");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (step === "done" && booked) {
    return (
      <div className="card p-6 flex flex-col gap-3">
        <span className="eyebrow">Booking received</span>
        <h2 className="display text-2xl font-extrabold">We&apos;re finding your driver</h2>
        <p>Your booking number is <b className="num">{booked.ref}</b>. We&apos;ll call or text {f.customerPhone} as soon as a driver accepts, with their name and plate number.</p>
        <p className="muted">Total to pay on delivery: <b className="num">{formatNaira(booked.total)}</b> by cash or bank transfer.</p>
        <button className="btn btn-ghost justify-center" onClick={() => { setStep("trip"); setBooked(null); }}>Book another move</button>
      </div>
    );
  }

  return (
    <form className="card p-5 flex flex-col gap-5" onSubmit={step === "details" ? submit : (e) => { e.preventDefault(); if (quote) setStep("details"); }}>
      {step === "trip" && (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="field"><span>Pickup area</span><AreaSelect id="pickupArea" value={f.pickupArea} onChange={(v) => set("pickupArea", v)} pricing={pricing} /></label>
            <label className="field"><span>Drop-off area</span><AreaSelect id="dropoffArea" value={f.dropoffArea} onChange={(v) => set("dropoffArea", v)} pricing={pricing} /></label>
          </div>

          <fieldset className="flex flex-col gap-2">
            <legend className="eyebrow mb-2">What are you moving?</legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {pricing.loadTypes.map((l) => (
                <button type="button" key={l.id} className="chip" aria-pressed={f.loadType === l.id} onClick={() => set("loadType", l.id)}>
                  <b>{l.name}</b><span className="muted">{l.description}</span>
                </button>
              ))}
            </div>
          </fieldset>

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <span>Loading helpers <span className="muted">{formatNaira(pricing.extras.helperFee)} each</span></span>
              <Stepper id="helpers" label="helpers" value={f.helpers} max={pricing.extras.maxHelpers} onChange={(n) => set("helpers", n)} />
            </div>
            <div className="flex items-center justify-between gap-3">
              <span>Stairs at pickup <span className="muted">floors up, 0 = ground</span></span>
              <Stepper id="pickupFloors" label="pickup floors" value={f.pickupFloors} max={pricing.extras.maxFloors} onChange={(n) => set("pickupFloors", n)} />
            </div>
            <div className="flex items-center justify-between gap-3">
              <span>Stairs at drop-off <span className="muted">{formatNaira(pricing.extras.stairsFeePerFloor)} per floor</span></span>
              <Stepper id="dropoffFloors" label="drop-off floors" value={f.dropoffFloors} max={pricing.extras.maxFloors} onChange={(n) => set("dropoffFloors", n)} />
            </div>
          </div>
        </>
      )}

      {step === "details" && (
        <>
          <button type="button" className="muted self-start" onClick={() => setStep("trip")}>‹ Edit trip</button>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="field"><span>Your name</span><input id="customerName" className="input" required value={f.customerName} onChange={(e) => set("customerName", e.target.value)} /></label>
            <label className="field"><span>Phone number</span><input id="customerPhone" className="input" required inputMode="tel" placeholder="0803 123 4567" value={f.customerPhone} onChange={(e) => set("customerPhone", e.target.value)} /></label>
            <label className="field sm:col-span-2"><span>Pickup address in {f.pickupArea}</span><input id="pickupAddress" className="input" required placeholder="House number, street, landmark" value={f.pickupAddress} onChange={(e) => set("pickupAddress", e.target.value)} /></label>
            <label className="field sm:col-span-2"><span>Drop-off address in {f.dropoffArea}</span><input id="dropoffAddress" className="input" required placeholder="House number, street, landmark" value={f.dropoffAddress} onChange={(e) => set("dropoffAddress", e.target.value)} /></label>
            <label className="field sm:col-span-2"><span>What&apos;s in the load? (optional)</span><textarea id="loadNotes" className="input" rows={2} placeholder="e.g. 3-seater sofa, double bed, 10 cartons" value={f.loadNotes} onChange={(e) => set("loadNotes", e.target.value)} /></label>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className="chip" aria-pressed={f.when === "now"} onClick={() => set("when", "now")}><b>Now</b></button>
            <button type="button" className="chip" aria-pressed={f.when === "later"} onClick={() => set("when", "later")}><b>Schedule</b></button>
            {f.when === "later" && <input id="scheduledFor" type="datetime-local" className="input w-auto" required value={f.scheduledFor} onChange={(e) => set("scheduledFor", e.target.value)} />}
          </div>
          <p className="muted">Pay the driver on delivery by cash or bank transfer.</p>
        </>
      )}

      {quote && (
        <div className="rounded-2xl border border-dashed border-[var(--line)] p-4 flex flex-col gap-1 num">
          {quote.lines.map((l) => (
            <div key={l.label} className="flex justify-between gap-3"><span className="muted">{l.label}</span><span>{formatNaira(l.amount)}</span></div>
          ))}
          <div className="flex justify-between gap-3 border-t border-[var(--line)] pt-2 mt-1 font-bold text-lg">
            <span>Total</span><span className="display">{formatNaira(quote.total)}</span>
          </div>
        </div>
      )}

      {error && <p role="alert" className="text-[var(--danger)] font-semibold">{error}</p>}

      <button className={`btn ${step === "details" ? "btn-amber" : "btn-brand"}`} disabled={busy || !quote}>
        <span>{step === "details" ? (busy ? "Booking…" : "Book truck") : "Continue"}</span>
        <span className="display">{quote ? formatNaira(quote.total) : ""}</span>
      </button>
    </form>
  );
}
