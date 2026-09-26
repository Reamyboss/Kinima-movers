import { zoneForArea, type PricingConfig } from "./pricing";

// Which trips a driver takes, by how far from the Ikorodu hub.
export const SECTORS = [
  { id: "local", name: "Ikorodu local", description: "Trips within Ikorodu town (zone A)" },
  { id: "lagos", name: "Lagos-wide", description: "Anywhere up to the Island and Lekki (zones A to D)" },
  { id: "far", name: "Far Lagos", description: "Everywhere, including Badagry, Epe and Ibeju-Lekki (zone E)" },
] as const;
export type SectorId = (typeof SECTORS)[number]["id"];

const RANK: Record<SectorId, number> = { local: 1, lagos: 2, far: 3 };
const zoneRank = (zoneId?: string) => (zoneId === "A" ? 1 : zoneId === "E" ? 3 : 2);

export const sectorName = (id?: string | null) => SECTORS.find((s) => s.id === id)?.name ?? "Far Lagos";

// Same rule as the database: the farthest end of the trip decides.
export function sectorCovers(sector: string | null | undefined, pickupArea: string, dropoffArea: string, cfg?: PricingConfig): boolean {
  const need = Math.max(zoneRank(zoneForArea(pickupArea, cfg)?.id), zoneRank(zoneForArea(dropoffArea, cfg)?.id));
  return need <= (RANK[(sector ?? "far") as SectorId] ?? 3);
}
