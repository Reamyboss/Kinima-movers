import { formatNaira } from "./pricing";

// A place where a union, market or estate levy is demanded, or trucks meet a
// barrier. Linked to one of our areas, to words in the street address, or both.
export type AreaNote = {
  id: number;
  place: string;
  area: string | null;
  keywords: string[];
  levyMin: number | null;
  levyMax: number | null;
  note: string;
};

export type TripText = { pickupArea: string; dropoffArea: string; pickupAddress?: string; dropoffAddress?: string };

// Notes that apply to a trip. A note with keywords matches when the words
// appear in an address; a note with only an area matches that area.
export function notesForTrip(notes: AreaNote[], t: TripText): AreaNote[] {
  const areas = [t.pickupArea, t.dropoffArea];
  const text = `${t.pickupAddress ?? ""} ${t.dropoffAddress ?? ""}`.toLowerCase();
  return notes.filter((n) =>
    n.keywords.length
      ? n.keywords.some((k) => k && text.includes(k.toLowerCase()))
      : n.area !== null && areas.includes(n.area),
  );
}

export function levyText(n: Pick<AreaNote, "levyMin" | "levyMax">): string {
  const { levyMin: lo, levyMax: hi } = n;
  if (lo && hi && lo !== hi) return `usually ${formatNaira(lo)} to ${formatNaira(hi)}`;
  if (hi || lo) return `usually about ${formatNaira((hi || lo)!)}`;
  return "amount varies";
}
