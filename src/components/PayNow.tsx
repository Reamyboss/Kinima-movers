"use client";

import { useState } from "react";
import { formatNaira } from "@/lib/pricing";

export default function PayNow({ token, total, email: initial }: { token: string; total: number; email?: string | null }) {
  const [email, setEmail] = useState(initial ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function pay(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/pay", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, email }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      location.href = data.url;
    } catch (err) {
      setError((err as Error).message || "Something went wrong. Please try again.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={pay} className="flex flex-col gap-3">
      <label className="field"><span>Email for your receipt</span>
        <input id="payEmail" type="email" required className="input" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      {error && <p role="alert" className="font-semibold text-[var(--danger)]">{error}</p>}
      <button className="btn btn-amber" disabled={busy}>
        <span>{busy ? "Opening Paystack…" : "Pay now"}</span><span className="display">{formatNaira(total)}</span>
      </button>
      <p className="muted">Card, bank transfer or USSD through Paystack. Your money is held until your goods are delivered.</p>
    </form>
  );
}
