import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

// Looks up a booking from the private link token the customer was given.
export async function bookingByToken(db: SupabaseClient, token: string) {
  if (!/^[a-f0-9]{32}$/.test(token)) return null;
  const { data: secret } = await db.from("booking_secrets").select("booking_id, delivery_code").eq("access_token", token).maybeSingle();
  if (!secret) return null;
  const { data: booking } = await db
    .from("bookings")
    .select("*, driver:drivers(plate_number, vehicle, profile:profiles(full_name, phone))")
    .eq("id", secret.booking_id)
    .single();
  return booking ? { booking, deliveryCode: secret.delivery_code as string } : null;
}
