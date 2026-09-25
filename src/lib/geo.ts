// Approximate centre points for every area we serve. Good enough for
// distance estimates and map pins; street-level precision comes later with
// a geocoding service.
export const AREA_COORDS: Record<string, [number, number]> = {
  // Zone A · Ikorodu town
  "Ikorodu Garage": [6.6194, 3.5105],
  "Ikorodu Town": [6.615, 3.507],
  Agric: [6.603, 3.487],
  Ijede: [6.57, 3.595],
  Igbogbo: [6.585, 3.538],
  Ebute: [6.603, 3.463],
  Owutu: [6.62, 3.495],
  Odogunyan: [6.66, 3.51],
  // Zone B · Near corridor
  "Mile 12": [6.605, 3.395],
  Ketu: [6.596, 3.392],
  Ojota: [6.587, 3.38],
  Isheri: [6.63, 3.37],
  Magodo: [6.62, 3.38],
  Maryland: [6.57, 3.367],
  // Zone C · Mainland
  Ikeja: [6.6018, 3.3515],
  Yaba: [6.5095, 3.3711],
  Surulere: [6.5, 3.35],
  Oshodi: [6.555, 3.343],
  Ogba: [6.627, 3.34],
  Gbagada: [6.555, 3.39],
  // Zone D · Island and Lekki
  "Victoria Island": [6.4281, 3.4219],
  Ikoyi: [6.45, 3.435],
  "Lekki Phase 1": [6.4474, 3.472],
  Ajah: [6.468, 3.57],
  Sangotedo: [6.47, 3.63],
  // Zone E · Far Lagos
  Badagry: [6.415, 2.881],
  Epe: [6.584, 3.983],
  "Ibeju-Lekki": [6.47, 3.88],
  Ikotun: [6.55, 3.26],
};

export const HUB: [number, number] = AREA_COORDS["Ikorodu Garage"];

// Straight-line distance in km.
export function distanceKm(a: [number, number], b: [number, number]): number {
  const R = 6371;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b[0] - a[0]);
  const dLng = rad(b[1] - a[1]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Lagos roads wind around the lagoon, so road distance runs well above the
// straight line. 1.4 is a working estimate until we use a routing service.
export const ROAD_FACTOR = 1.4;

export function roadKmBetween(fromArea: string, toArea: string): number | null {
  const a = AREA_COORDS[fromArea];
  const b = AREA_COORDS[toArea];
  if (!a || !b) return null;
  return Math.round(distanceKm(a, b) * ROAD_FACTOR * 10) / 10;
}
