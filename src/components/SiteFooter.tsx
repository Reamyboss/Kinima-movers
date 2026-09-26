import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="wrap flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-[var(--line)] py-6 text-sm muted">
      <span>© {new Date().getFullYear()} Kinma Movers · Ikorodu, Lagos</span>
      <nav aria-label="Policies" className="flex flex-wrap gap-x-4 gap-y-1">
        <Link href="/terms" className="underline">Customer terms</Link>
        <Link href="/driver-terms" className="underline">Driver terms</Link>
        <Link href="/complaints" className="underline">Complaints</Link>
        <Link href="/privacy" className="underline">Privacy</Link>
      </nav>
    </footer>
  );
}
