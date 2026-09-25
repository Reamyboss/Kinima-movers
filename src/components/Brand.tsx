import Link from "next/link";

export default function Brand({ right }: { right?: React.ReactNode }) {
  return (
    <header className="wrap flex items-center justify-between py-5">
      <Link href="/" className="display flex items-center gap-2 text-2xl font-extrabold">
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-[var(--amber)]" aria-hidden>
          <svg width="22" height="16" viewBox="0 0 22 16"><rect x="0" y="2" width="13" height="9" rx="1.5" fill="#1B1400" /><path d="M13 5h4.5l3 3.5V11H13z" fill="#1B1400" /><circle cx="4.5" cy="13" r="2.4" fill="#1B1400" /><circle cx="16.5" cy="13" r="2.4" fill="#1B1400" /></svg>
        </span>
        CarryGo
      </Link>
      {right}
    </header>
  );
}
