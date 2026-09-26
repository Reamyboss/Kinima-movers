import Link from "next/link";
import Brand from "./Brand";
import SiteFooter from "./SiteFooter";
import { TERMS_VERSION } from "@/lib/company";

export default function LegalPage({ title, intro, children }: { title: string; intro: string; children: React.ReactNode }) {
  const updated = new Date(TERMS_VERSION.slice(0, 10)).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" });
  return (
    <main>
      <Brand right={<Link href="/" className="muted font-semibold">Book a truck</Link>} />
      <article className="wrap legal pb-12">
        <span className="eyebrow">Last updated {updated}</span>
        <h1>{title}</h1>
        <p className="text-[var(--muted)]">{intro}</p>
        {children}
      </article>
      <SiteFooter />
    </main>
  );
}
