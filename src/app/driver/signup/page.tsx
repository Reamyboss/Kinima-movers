"use client";

import Link from "next/link";
import { useState } from "react";
import Brand from "@/components/Brand";
import { browserClient, supabaseConfigured } from "@/lib/supabase/client";

export default function DriverSignup() {
  const [f, setF] = useState({ full_name: "", phone: "", email: "", password: "", plate_number: "", licence_number: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF((p) => ({ ...p, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabaseConfigured) return setError("Applications open once the database is connected.");
    setBusy(true);
    setError("");
    const { email, password, ...meta } = f;
    const { error } = await browserClient().auth.signUp({
      email,
      password,
      options: { data: { ...meta, role: "driver" }, emailRedirectTo: `${location.origin}/driver` },
    });
    setBusy(false);
    if (error) return setError(error.message);
    setDone(true);
  }

  return (
    <main>
      <Brand />
      <section className="wrap max-w-lg py-6">
        {done ? (
          <div className="card flex flex-col gap-3 p-6">
            <h1 className="display text-2xl font-extrabold">Application received</h1>
            <p>Check {f.email} for a link to confirm your email. The CarryGo team will review your details and approve your account, then you can go online and take jobs.</p>
            <Link href="/login" className="btn btn-brand justify-center">Go to sign in</Link>
          </div>
        ) : (
          <form className="card flex flex-col gap-4 p-6" onSubmit={submit}>
            <div>
              <span className="eyebrow">Drive with CarryGo</span>
              <h1 className="display text-2xl font-extrabold">Apply to drive</h1>
              <p className="muted">For owners and drivers of Suzuki Carry mini trucks. We check every driver before approval.</p>
            </div>
            <label className="field"><span>Full name</span><input id="full_name" className="input" required value={f.full_name} onChange={set("full_name")} /></label>
            <label className="field"><span>Phone number</span><input id="phone" className="input" required inputMode="tel" placeholder="0803 123 4567" value={f.phone} onChange={set("phone")} /></label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="field"><span>Plate number</span><input id="plate_number" className="input" required placeholder="IKD 482 XA" value={f.plate_number} onChange={set("plate_number")} /></label>
              <label className="field"><span>Driver&apos;s licence number</span><input id="licence_number" className="input" required value={f.licence_number} onChange={set("licence_number")} /></label>
            </div>
            <label className="field"><span>Email</span><input id="email" className="input" type="email" required autoComplete="email" value={f.email} onChange={set("email")} /></label>
            <label className="field"><span>Password</span><input id="password" className="input" type="password" required minLength={8} autoComplete="new-password" value={f.password} onChange={set("password")} /></label>
            {error && <p role="alert" className="font-semibold text-[var(--danger)]">{error}</p>}
            <button className="btn btn-amber justify-center" disabled={busy}>{busy ? "Sending…" : "Send application"}</button>
            <p className="muted">Already approved? <Link href="/login" className="font-semibold underline">Sign in</Link></p>
          </form>
        )}
      </section>
    </main>
  );
}
