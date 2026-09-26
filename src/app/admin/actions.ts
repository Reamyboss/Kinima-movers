"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { refundPayment } from "@/lib/paystack";

const str = (f: FormData, k: string) => String(f.get(k) ?? "");

export async function setDriverStatus(form: FormData) {
  const { db } = await requireAdmin();
  const status = str(form, "status");
  if (!["approved", "suspended", "pending"].includes(status)) return;
  await db.from("drivers").update({ status, ...(status !== "approved" && { is_online: false }) }).eq("id", str(form, "id"));
  revalidatePath("/admin");
}

export async function setDriverSector(form: FormData) {
  const { db } = await requireAdmin();
  const sector = str(form, "sector");
  if (!["local", "lagos", "far"].includes(sector)) return;
  await db.from("drivers").update({ sector }).eq("id", str(form, "id"));
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
  const { data: b } = await db.from("bookings").select("*").eq("id", id).single();
  if (!b || ["delivered", "cancelled"].includes(b.status)) return;

  // Paid online: refund in full before the driver sets off; after that the
  // call-out fee in the customer terms (20% of the fare) goes to the driver.
  let refundNote = "";
  const update: Record<string, unknown> = { status: "cancelled" };
  if (b.payment_status === "paid" && b.paystack_reference) {
    const refund = b.status === "assigned" ? b.paid_amount : Math.round(b.paid_amount * 0.8);
    try {
      await refundPayment(b.paystack_reference, refund);
    } catch (e) {
      console.error("refund failed", e);
      redirect(`/admin?error=${encodeURIComponent(`Refund failed for ${b.ref}: ${(e as Error).message}. The booking was not cancelled.`)}`);
    }
    const callOut = b.paid_amount - refund;
    Object.assign(update, { payment_status: "refunded", refunded_amount: refund },
      callOut > 0 && b.driver_id ? { driver_payout: callOut, driver_payout_status: "owed" } : {});
    refundNote = `; refunded ₦${refund.toLocaleString("en-NG")}${callOut > 0 ? `, call-out fee ₦${callOut.toLocaleString("en-NG")} to driver` : ""}`;
  }
  const { data } = await db.from("bookings").update(update).eq("id", id).not("status", "in", "(delivered,cancelled)").select("id");
  if (data?.length) await db.from("booking_events").insert({ booking_id: id, status: "cancelled", actor_id: user.id, note: `Cancelled by admin${refundNote}` });
  revalidatePath("/admin");
}

export async function markDriverPaid(form: FormData) {
  const { db, user } = await requireAdmin();
  const id = str(form, "booking");
  const { data } = await db.from("bookings").update({ driver_payout_status: "paid" }).eq("id", id).eq("driver_payout_status", "owed").select("status, driver_payout");
  if (data?.length) await db.from("booking_events").insert({ booking_id: id, status: data[0].status, actor_id: user.id, note: `Driver paid ₦${Number(data[0].driver_payout).toLocaleString("en-NG")}` });
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
