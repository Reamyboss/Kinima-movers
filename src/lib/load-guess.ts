// Free load estimator used when the Claude API key isn't set (or the API is
// unavailable). It reads common English and Pidgin words for household items
// and works out the same answer shape the AI assistant returns.

type LoadType = "small" | "household" | "furniture" | "full";
export type LoadGuess = { loadType: LoadType; helpers: number; tripsNeeded: number; summary: string; tips: string[] };

// weight: rough share of a Suzuki Carry bed (1.0 = full truck); heavy: needs an extra pair of hands.
const ITEMS: { words: RegExp; label: string; weight: number; heavy?: boolean; tip?: string }[] = [
  { words: /fridge|refrigerator|freezer/, label: "fridge or freezer", weight: 0.2, heavy: true, tip: "Keep the fridge or freezer upright and defrost it the night before." },
  { words: /wardrobe|cupboard|closet/, label: "wardrobe", weight: 0.25, heavy: true, tip: "Take the wardrobe doors off and pack shelves separately." },
  { words: /\bbeds?\b|mattress|bed ?frame/, label: "bed or mattress", weight: 0.2, tip: "Wrap the mattress in nylon so dust and rain don't touch it." },
  { words: /sofa|couch|settee|chair/, label: "sofa or chairs", weight: 0.2, heavy: true },
  { words: /generator|gen\b|gen set|i ?better ?pass ?my ?neighbou?r/, label: "generator", weight: 0.1, heavy: true, tip: "Drain the fuel from the generator before loading." },
  { words: /washing machine|washer/, label: "washing machine", weight: 0.15, heavy: true },
  { words: /tv|television|standing fan|fan\b/, label: "TV or fans", weight: 0.05, tip: "Wrap the TV screen in a blanket and keep it standing up." },
  { words: /table|desk|dining/, label: "table", weight: 0.15 },
  { words: /carton|box|bag|ghana must go|sack/, label: "boxes and bags", weight: 0.03 },
  { words: /cement|blocks?\b|tiles|rods?\b|iron/, label: "building materials", weight: 0.05, heavy: true, tip: "Building materials are heavy, so keep the total under one tonne per trip." },
  { words: /shop|goods|stock|market/, label: "shop goods", weight: 0.4 },
];

const FLAT = /(\d+)\s*(bed ?room|room|br)\b|self ?con|room and parlou?r|whole (flat|house|apartment)|everything/;

export function guessLoad(text: string): LoadGuess {
  const t = text.toLowerCase();
  let weight = 0;
  let heavy = 0;
  const found: string[] = [];
  const tips: string[] = [];

  for (const item of ITEMS) {
    if (!item.words.test(t)) continue;
    const n = Number(t.match(new RegExp(`(\\d+)\\s*(?:\\w+\\s){0,2}(?:${item.words.source})`))?.[1] ?? 1);
    weight += item.weight * Math.min(n, 20);
    if (item.heavy) heavy++;
    found.push(item.label);
    if (item.tip) tips.push(item.tip);
  }

  const flat = t.match(FLAT);
  if (flat) {
    const rooms = Number(flat[1]) || (/self ?con/.test(t) ? 1 : /room and parlou?r/.test(t) ? 2 : 3);
    weight = Math.max(weight, 0.6 * rooms);
    heavy = Math.max(heavy, rooms);
    found.unshift(`${rooms}-room home`);
  }

  if (!found.length) {
    return {
      loadType: "household",
      helpers: 1,
      tripsNeeded: 1,
      summary: "We couldn't recognise the items, so we picked a household load with one helper. Change it below if needed.",
      tips: [],
    };
  }

  const loadType: LoadType = flat ? (weight >= 0.8 ? "full" : "household") : weight >= 0.8 ? "full" : heavy > 0 && weight >= 0.15 ? "furniture" : weight >= 0.25 ? "household" : "small";
  const tripsNeeded = Math.max(1, Math.ceil(weight));
  const helpers = Math.min(4, heavy >= 3 ? 2 : heavy > 0 ? 1 : weight >= 0.5 ? 1 : 0);
  const names = { small: "a small load", household: "a household load", furniture: "a furniture load", full: "a full truck" };

  return {
    loadType,
    helpers,
    tripsNeeded,
    summary: `That sounds like ${names[loadType]} (${found.slice(0, 3).join(", ")})${helpers ? ` with ${helpers} loading helper${helpers > 1 ? "s" : ""}` : ""}.`,
    tips: tips.slice(0, 3),
  };
}
