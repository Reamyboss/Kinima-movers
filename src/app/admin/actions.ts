"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";

const str = (f: FormData, k: string) => String(f.get(k) ?? "");

export async function setDriverStatus(form: FormData) {
  const { db } = await requireAdmin();
  const status = str(form, "status");
  if (!["approved", "suspended", "pending"].includes(status)) return;
  await db.from("drivers").update({ status, ...(status !== "approved" && { is_online: false }) }).eq("id", str(form, "id"));
  revalidatePath("/admin");
}

export async function assignDriver(form: FormData) {
  const { db, user } = await requireAdmin();
  const id = str(form, "booking");
  const driver = str(form, "driver");
  if (!driver) return;
  const { data } = await db.from("bookings").update({ driver_id: driver, status: "assigned" })
    .eq("id", id).in("status", ["requested", "assigned"]).select("id");
  if (data?.length) await db.from("booking_events").insert({ booking_id: id, status: "assigned", actor_id: user.id, note: "Assigned by admin" });
  revalidatePath("/admin");
}

export async function cancelBooking(form: FormData) {
  const { db, user } = await requireAdmin();
  const id = str(form, "booking");
  const { data } = await db.from("bookings").update({ status: "cancelled" }).eq("id", id).not("status", "in", "(delivered,cancelled)").select("id");
  if (data?.length) await db.from("booking_events").insert({ booking_id: id, status: "cancelled", actor_id: user.id, note: "Cancelled by admin" });
  revalidatePath("/admin");
}

export async function savePrices(form: FormData) {
  const { db } = await requireAdmin();
  const naira = (k: string) => Math.max(0, Math.round(Number(str(form, k)) || 0));
  const updates: PromiseLike<unknown>[] = [];
  for (const [k, v] of form.entries()) {
    if (k.startsWith("zone:")) updates.push(db.from("pricing_zones").update({ fare: naira(k) }).eq("id", k.slice(5)));
    if (k.startsWith("load:")) {
      const m = Number(v);
      if (m > 0 && m < 10) updates.push(db.from("pricing_load_types").update({ multiplier: m }).eq("id", k.slice(5)));
    }
  }
  const share = (k: string, max: number) => Math.min(max, Math.max(0, Number(str(form, k)) / 100));
  updates.push(db.from("pricing_settings").update({
    helper_fee: naira("helper_fee"),
    stairs_fee_per_floor: naira("stairs_fee_per_floor"),
    out_of_hub_pickup_share: share("out_of_hub_pickup_share", 1),
    driver_share: share("driver_share", 1),
  }).eq("id", true));
  await Promise.all(updates);
  revalidatePath("/admin");
  revalidatePath("/");
}

export async function saveAreaNote(form: FormData) {
  const { db } = await requireAdmin();
  const naira = (k: string) => (str(form, k).trim() === "" ? null : Math.max(0, Math.round(Number(str(form, k)) || 0)));
  const place = str(form, "place").trim();
  const note = str(form, "note").trim();
  if (!place || !note) return;
  const row = {
    place,
    note,
    area: str(form, "area") || null,
    keywords: str(form, "keywords").split(",").map((k) => k.trim().toLowerCase()).filter(Boolean),
    levy_min: naira("levy_min"),
    levy_max: naira("levy_max"),
    active: form.get("active") === "on",
  };
  const id = str(form, "id");
  const { error } = id ? await db.from("area_notes").update(row).eq("id", Number(id)) : await db.from("area_notes").insert(row);
  if (error) console.error("area note save failed", error.message);
  revalidatePath("/admin");
  revalidatePath("/");
}

export async function deleteAreaNote(form: FormData) {
  const { db } = await requireAdmin();
  await db.from("area_notes").delete().eq("id", Number(str(form, "id")));
  revalidatePath("/admin");
  revalidatePath("/");
}
