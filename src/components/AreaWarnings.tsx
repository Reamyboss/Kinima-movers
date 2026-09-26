import { levyText, type AreaNote } from "@/lib/area-notes";

// Heads-up box for places where levies are demanded or trucks meet barriers.
export default function AreaWarnings({ notes, audience }: { notes: AreaNote[]; audience: "customer" | "driver" }) {
  if (!notes.length) return null;
  return (
    <div role="note" className="flex flex-col gap-2 rounded-2xl border-2 border-[var(--amber)] bg-[var(--soft)] p-4 text-sm">
      <b>Heads-up: area levy {notes.length > 1 ? "points" : "point"} on this trip</b>
      <ul className="flex flex-col gap-1">
        {notes.map((n) => (
          <li key={n.id}><b>{n.place}</b> ({levyText(n)}). {n.note}</li>
        ))}
      </ul>
      <p className="muted">
        {audience === "customer"
          ? "If a levy is demanded, the driver pays it and records it in the app, and you refund exactly that amount at delivery. We add no commission to levies. If it's above the usual amount, the driver calls you before paying."
          : "Pay only what is demanded and record it in the app straight away with where you paid. The customer refunds it at cost. If it's above the usual amount, call the customer before paying."}
      </p>
    </div>
  );
}
