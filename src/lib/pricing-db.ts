import "server-only";
import { adminClient } from "./supabase";
import { DEFAULT_PRICING, type PricingConfig, type ZoneId } from "./pricing";

// Reads the admin-editable price list. Falls back to the built-in list when
// Supabase is not configured yet.
export async function loadPricing(): Promise<PricingConfig> {
  const db = adminClient();
  if (!db) return DEFAULT_PRICING;

  const [zones, areas, loads, settings] = await Promise.all([
    db.from("pricing_zones").select("id,name,fare").order("sort"),
    db.from("pricing_areas").select("name,zone_id").order("name"),
    db.from("pricing_load_types").select("id,name,description,multiplier").order("sort"),
    db.from("pricing_settings").select("*").single(),
  ]);
  if (zones.error || areas.error || loads.error || settings.error) {
    console.error("pricing load failed", zones.error ?? areas.error ?? loads.error ?? settings.error);
    return DEFAULT_PRICING;
  }

  return {
    zones: zones.data.map((z) => ({
      id: z.id as ZoneId,
      name: z.name,
      fare: z.fare,
      areas: areas.data.filter((a) => a.zone_id === z.id).map((a) => a.name),
    })),
    loadTypes: loads.data.map((l) => ({ ...l, multiplier: Number(l.multiplier) })),
    extras: {
      ...DEFAULT_PRICING.extras,
      helperFee: settings.data.helper_fee,
      stairsFeePerFloor: settings.data.stairs_fee_per_floor,
      outOfHubPickupShare: Number(settings.data.out_of_hub_pickup_share),
      driverShare: Number(settings.data.driver_share),
    },
  };
}
