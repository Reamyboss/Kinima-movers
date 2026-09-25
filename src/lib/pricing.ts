// Quote engine. Ikorodu is the hub: every trip is priced by the farthest
// zone it touches, because the truck has to come back to Ikorodu.
// These values seed the database; the live app reads them from `pricing_*` tables.

export type ZoneId = "A" | "B" | "C" | "D" | "E";

export type Zone = { id: ZoneId; name: string; fare: number; areas: string[] };
export type LoadType = { id: string; name: string; description: string; multiplier: number };

export const ZONES: Zone[] = [
  { id: "A", name: "Ikorodu town", fare: 15_000, areas: ["Ikorodu Garage", "Agric", "Ijede", "Igbogbo", "Ebute", "Owutu", "Odogunyan", "Ikorodu Town"] },
  { id: "B", name: "Near corridor", fare: 50_000, areas: ["Mile 12", "Ketu", "Ojota", "Isheri", "Magodo", "Maryland"] },
  { id: "C", name: "Mainland", fare: 60_000, areas: ["Ikeja", "Yaba", "Surulere", "Oshodi", "Ogba", "Gbagada"] },
  { id: "D", name: "Island and Lekki", fare: 100_000, areas: ["Victoria Island", "Ikoyi", "Lekki Phase 1", "Ajah", "Sangotedo"] },
  { id: "E", name: "Far Lagos", fare: 120_000, areas: ["Badagry", "Epe", "Ibeju-Lekki", "Ikotun"] },
];

export const LOAD_TYPES: LoadType[] = [
  { id: "small", name: "Small load", description: "Boxes, bags, a few items", multiplier: 1 },
  { id: "household", name: "Household", description: "Room or shop items", multiplier: 1.3 },
  { id: "furniture", name: "Furniture", description: "Beds, sofas, fridges", multiplier: 1.5 },
  { id: "full", name: "Full truck", description: "Whole flat, one trip", multiplier: 1.8 },
];

export const EXTRAS = {
  helperFee: 5_000,
  stairsFeePerFloor: 2_000,
  // Share of the pickup zone fare added when pickup is outside Ikorodu town.
  outOfHubPickupShare: 0.4,
  driverShare: 0.8,
  maxHelpers: 4,
  maxFloors: 20,
};

export type PricingConfig = { zones: Zone[]; loadTypes: LoadType[]; extras: typeof EXTRAS };
export const DEFAULT_PRICING: PricingConfig = { zones: ZONES, loadTypes: LOAD_TYPES, extras: EXTRAS };

export type QuoteInput = {
  pickupArea: string;
  dropoffArea: string;
  loadType: string;
  helpers: number;
  pickupFloors: number;
  dropoffFloors: number;
};

export type QuoteLine = { label: string; amount: number };
export type Quote = {
  zone: Zone;
  lines: QuoteLine[];
  total: number;
  driverEarning: number;
};

export function zoneForArea(area: string, cfg: PricingConfig = DEFAULT_PRICING): Zone | undefined {
  return cfg.zones.find((z) => z.areas.includes(area));
}

const clampInt = (n: number, max: number) => Math.max(0, Math.min(max, Math.floor(n || 0)));
const roundNaira = (n: number) => Math.round(n / 100) * 100;

export function computeQuote(input: QuoteInput, cfg: PricingConfig = DEFAULT_PRICING): Quote {
  const from = zoneForArea(input.pickupArea, cfg);
  const to = zoneForArea(input.dropoffArea, cfg);
  if (!from || !to) throw new Error("We don't cover that area yet. Pick an area from the list.");
  const load = cfg.loadTypes.find((l) => l.id === input.loadType);
  if (!load) throw new Error("Choose what you are moving.");

  const { extras } = cfg;
  const zone = to.fare >= from.fare ? to : from;
  const helpers = clampInt(input.helpers, extras.maxHelpers);
  const floors = clampInt(input.pickupFloors, extras.maxFloors) + clampInt(input.dropoffFloors, extras.maxFloors);

  const lines: QuoteLine[] = [{ label: `Zone ${zone.id} fare × ${load.name.toLowerCase()}`, amount: roundNaira(zone.fare * load.multiplier) }];
  if (from.id !== "A") lines.push({ label: "Truck to pickup", amount: roundNaira(from.fare * extras.outOfHubPickupShare) });
  if (helpers) lines.push({ label: `${helpers} loading helper${helpers === 1 ? "" : "s"}`, amount: helpers * extras.helperFee });
  if (floors) lines.push({ label: `${floors} floor${floors === 1 ? "" : "s"} of stairs`, amount: floors * extras.stairsFeePerFloor });

  const total = lines.reduce((s, l) => s + l.amount, 0);
  return { zone, lines, total, driverEarning: roundNaira(total * extras.driverShare) };
}

export const formatNaira = (n: number) => "₦" + Math.round(n).toLocaleString("en-NG");
