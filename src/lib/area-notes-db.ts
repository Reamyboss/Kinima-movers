import "server-only";
import { adminClient } from "./supabase/admin";
import type { AreaNote } from "./area-notes";

// Active area notes. Empty until the database update that adds them is run.
export async function loadAreaNotes(): Promise<AreaNote[]> {
  const db = adminClient();
  if (!db) return [];
  const { data, error } = await db.from("area_notes").select("id,place,area,keywords,levy_min,levy_max,note").eq("active", true).order("place");
  if (error) {
    console.error("area notes load failed", error.message);
    return [];
  }
  return data.map((n) => ({ id: n.id, place: n.place, area: n.area, keywords: n.keywords ?? [], levyMin: n.levy_min, levyMax: n.levy_max, note: n.note }));
}
