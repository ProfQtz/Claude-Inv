import { Card, RANKS, rankValue } from "./cards";

/** Ranks from Ace down, the order used by range charts. */
export const CHART_RANKS = [...RANKS].reverse();

/** Starting-hand label such as "AKs", "T9o" or "77" (higher rank first). */
export function handLabel(a: Card, b: Card): string {
  const [hi, lo] = rankValue(a.rank) >= rankValue(b.rank) ? [a, b] : [b, a];
  if (hi.rank === lo.rank) return hi.rank + lo.rank;
  return hi.rank + lo.rank + (hi.suit === lo.suit ? "s" : "o");
}

/** Label for chart cell (row, col): pairs on the diagonal, suited above it, offsuit below. */
export function chartLabel(row: number, col: number): string {
  const r = CHART_RANKS[row];
  const c = CHART_RANKS[col];
  if (row === col) return r + c;
  return row < col ? r + c + "s" : c + r + "o";
}

/** Number of card combinations a label covers: 6 for pairs, 4 suited, 12 offsuit. */
export function combos(label: string): number {
  return label.length === 2 ? 6 : label.endsWith("s") ? 4 : 12;
}

const idx = (rank: string) => RANKS.indexOf(rank as (typeof RANKS)[number]);

/**
 * Parse range shorthand: "66+", "A9s+", "AJo+", "A5s-A3s", "T9s", "22-55".
 * A "+" on a pair means that pair and higher; on a non-pair it raises the kicker up to one below the top card.
 */
export function parseRange(text: string): Set<string> {
  const out = new Set<string>();
  for (const raw of text.split(",").map((t) => t.trim()).filter(Boolean)) {
    const [from, to] = raw.split("-");
    const plus = from.endsWith("+");
    const token = plus ? from.slice(0, -1) : from;
    const hi = token[0];
    const lo = token[1];
    const kind = token.slice(2); // "s", "o" or "" for pairs
    if (idx(hi) < 0 || idx(lo) < 0) throw new Error(`Bad range token: ${raw}`);

    if (hi === lo) {
      const top = to ? idx(to[0]) : plus ? RANKS.length - 1 : idx(hi);
      const [a, b] = [Math.min(idx(hi), top), Math.max(idx(hi), top)];
      for (let i = a; i <= b; i++) out.add(RANKS[i] + RANKS[i]);
      continue;
    }

    let [first, last] = [idx(lo), idx(lo)];
    if (plus) last = idx(hi) - 1;
    if (to) [first, last] = [Math.min(idx(lo), idx(to[1])), Math.max(idx(lo), idx(to[1]))];
    for (let i = first; i <= last; i++) out.add(hi + RANKS[i] + kind);
  }
  return out;
}

/** Share of all 1,326 starting combinations a range covers. */
export function rangePercent(range: Set<string>): number {
  let total = 0;
  for (const label of range) total += combos(label);
  return total / 1326;
}

export type Position = "UTG" | "HJ" | "CO" | "BTN" | "SB";

export const POSITIONS: { id: Position; name: string }[] = [
  { id: "UTG", name: "Under the Gun" },
  { id: "HJ", name: "Hijack" },
  { id: "CO", name: "Cutoff" },
  { id: "BTN", name: "Button" },
  { id: "SB", name: "Small Blind" },
];

/**
 * Simplified 6-max raise-first-in ranges at 100 BB with no ante. Real solver charts
 * mix some hands; these are the pure-raise versions that are easy to memorize.
 */
export const OPENING_RANGES: Record<Position, string> = {
  UTG: "66+, A9s+, A5s-A4s, KTs+, QTs+, JTs, T9s, AJo+, KQo",
  HJ: "55+, A7s+, A5s-A3s, K9s+, Q9s+, J9s+, T9s, 98s, ATo+, KJo+",
  CO: "33+, A2s+, K7s+, Q8s+, J8s+, T8s+, 97s+, 87s, 76s, A9o+, KTo+, QTo+, JTo",
  BTN: "22+, A2s+, K3s+, Q5s+, J7s+, T7s+, 96s+, 85s+, 75s+, 64s+, 54s, A5o+, K9o+, Q9o+, J9o+, T9o, 98o",
  SB: "22+, A2s+, K5s+, Q7s+, J7s+, T7s+, 97s+, 86s+, 75s+, 65s, 54s, A7o+, K9o+, QTo+, JTo",
};

export const OPENING_SETS: Record<Position, Set<string>> = Object.fromEntries(
  Object.entries(OPENING_RANGES).map(([pos, text]) => [pos, parseRange(text)]),
) as Record<Position, Set<string>>;

export type FacingAction = "3-bet" | "Call" | "Fold";

export interface FacingSpot {
  id: string;
  /** Short label for tabs, e.g. "BTN vs UTG". */
  short: string;
  title: string;
  /** Hero's seat, as shown on the table. */
  seat: string;
  /** What happened before hero acts. */
  action: string;
  threeBet: string;
  call: string;
  note: string;
}

/**
 * Simplified 6-max responses to a 2.5 BB open at 100 BB: pure 3-bet / call / fold
 * baselines that are easy to learn. They are not solver output.
 */
export const FACING_SPOTS: FacingSpot[] = [
  {
    id: "btn-vs-utg",
    short: "BTN vs UTG",
    title: "Button facing an under-the-gun open",
    seat: "Button",
    action: "UTG raised to 2.5 BB",
    threeBet: "QQ+, AKs, AKo, A5s-A4s",
    call: "JJ-66, AQs-ATs, KQs-KJs, QJs, JTs, T9s, 98s, AQo",
    note: "UTG's range is strong, so continue tightly. Hands like KJo and ATo are dominated and fold.",
  },
  {
    id: "btn-vs-co",
    short: "BTN vs CO",
    title: "Button facing a cutoff open",
    seat: "Button",
    action: "Cutoff raised to 2.5 BB",
    threeBet: "TT+, AJs+, KQs, AQo+, A5s-A3s",
    call: "99-22, ATs-A6s, KJs-KTs, QJs-QTs, JTs-J9s, T9s, 98s, 87s, 76s, 65s, AJo, KQo",
    note: "A cutoff open is wider, so you can 3-bet more and call a lot of suited hands in position.",
  },
  {
    id: "bb-vs-btn",
    short: "BB vs BTN",
    title: "Big blind facing a button open",
    seat: "Big Blind",
    action: "Button raised to 2.5 BB",
    threeBet: "TT+, AJs+, KQs, AQo+, A5s-A4s",
    call:
      "99-22, ATs-A6s, A3s-A2s, KJs-K2s, Q4s+, J6s+, T6s+, 95s+, 85s+, 74s+, 63s+, 53s+, 43s, AJo-A2o, K8o+, Q9o+, J9o+, T8o+, 98o, 87o, 76o",
    note: "You close the action and need only about 27% equity, so defend widely. Suited hands and connected cards call; the worst offsuit hands fold.",
  },
  {
    id: "sb-vs-btn",
    short: "SB vs BTN",
    title: "Small blind facing a button open",
    seat: "Small Blind",
    action: "Button raised to 2.5 BB",
    threeBet: "88+, ATs+, KTs+, QTs+, JTs, T9s, 98s, A5s-A2s, AJo+, KQo",
    call: "",
    note: "Out of position with the big blind still to act, the small blind 3-bets or folds. Calling invites a squeeze.",
  },
];

export interface FacingSets {
  threeBet: Set<string>;
  call: Set<string>;
}

export const FACING_SETS: Record<string, FacingSets> = Object.fromEntries(
  FACING_SPOTS.map((s) => {
    const threeBet = parseRange(s.threeBet);
    // A hand listed in both ranges is a 3-bet.
    const call = new Set([...parseRange(s.call)].filter((h) => !threeBet.has(h)));
    return [s.id, { threeBet, call }];
  }),
);

export function facingAction(spotId: string, label: string): FacingAction {
  const sets = FACING_SETS[spotId];
  return sets.threeBet.has(label) ? "3-bet" : sets.call.has(label) ? "Call" : "Fold";
}
