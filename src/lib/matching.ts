// Smart matching: ranks drivers for a job and says why, so the owner can
// assign with one tap and trust the choice.
import { AREA_COORDS, distanceKm, ROAD_FACTOR } from "./geo";

export type DriverCandidate = {
  id: string;
  name: string;
  plate: string | null;
  isOnline: boolean;
  area: string; // where the driver is now, or their base
  rating: number;
  tripsToday: number;
  busy: boolean; // already on a job
};

export type Match = DriverCandidate & { score: number; km: number | null; reasons: string[] };

// Weights are deliberately simple and readable. Closeness matters most,
// then being online, then quality and giving everyone a fair share of work.
const W = { perKm: 2, online: 25, perRatingStar: 8, perTripToday: 4 };

export function rankDrivers(pickupArea: string, drivers: DriverCandidate[]): Match[] {
  const pickup = AREA_COORDS[pickupArea];
  return drivers
    .filter((d) => !d.busy)
    .map((d) => {
      const here = AREA_COORDS[d.area];
      const km = pickup && here ? Math.round(distanceKm(here, pickup) * ROAD_FACTOR * 10) / 10 : null;
      const reasons: string[] = [];
      let score = 100;

      if (km !== null) {
        score -= km * W.perKm;
        reasons.push(km < 3 ? `very close (${km} km)` : `${km} km from pickup`);
      } else {
        score -= 30;
        reasons.push("location unknown");
      }
      if (d.isOnline) {
        score += W.online;
        reasons.push("online now");
      } else {
        reasons.push("offline, call first");
      }
      score += (d.rating - 4) * W.perRatingStar;
      if (d.rating >= 4.7) reasons.push(`top rated ${d.rating.toFixed(1)}★`);
      score -= d.tripsToday * W.perTripToday;
      if (d.tripsToday === 0) reasons.push("no trips yet today");

      return { ...d, km, score: Math.round(score), reasons };
    })
    .sort((a, b) => b.score - a.score);
}
