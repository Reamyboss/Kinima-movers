"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Brand from "@/components/Brand";
import { browserClient, supabaseConfigured } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabaseConfigured) return setError("Sign-in opens once the database is connected.");
    setBusy(true);
    setError("");
    const supabase = browserClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setBusy(false);
      return setError(error.message === "Invalid login credentials" ? "That email and password don't match. Try again." : error.message);
    }
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).single();
    router.replace(profile?.role === "admin" ? "/admin" : "/driver");
    router.refresh();
  }

  return (
    <main>
      <Brand />
      <section className="wrap max-w-md py-6">
        <form className="card flex flex-col gap-4 p-6" onSubmit={submit}>
          <h1 className="display text-2xl font-extrabold">Sign in</h1>
          <label className="field"><span>Email</span><input id="email" className="input" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
          <label className="field"><span>Password</span><input id="password" className="input" type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
          {error && <p role="alert" className="font-semibold text-[var(--danger)]">{error}</p>}
          <button className="btn btn-brand justify-center" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
          <p className="muted">New driver? <Link href="/driver/signup" className="font-semibold underline">Apply to drive</Link></p>
        </form>
      </section>
    </main>
  );
}
