import { hitProbability } from "./math";
import { classEquity } from "./nash";

/** n choose k. */
export function choose(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  let r = 1;
  for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i;
  return r;
}

export interface OutsRow {
  outs: number;
  draw: string;
  /** Flop to river, two cards to come (47 unseen). */
  twoCards: number;
  /** Turn to river, one card to come (46 unseen). */
  oneCard: number;
}

const DRAW_NAMES: Record<number, string> = {
  2: "Pocket pair to a set",
  4: "Gutshot straight draw",
  6: "Two overcards",
  8: "Open-ended straight draw",
  9: "Flush draw",
  12: "Flush draw + overcard",
  15: "Flush draw + open-ender",
};

export const OUTS_TABLE: OutsRow[] = Array.from({ length: 15 }, (_, i) => i + 1).map((outs) => ({
  outs,
  draw: DRAW_NAMES[outs] ?? "",
  twoCards: hitProbability(outs, 2),
  oneCard: hitProbability(outs, 1),
}));

export interface BetSizeRow {
  label: string;
  /** Bet as a fraction of the pot. */
  size: number;
  /** Equity needed to call: bet ÷ (pot + 2 × bet). */
  callNeeds: number;
  /** Minimum defense frequency: pot ÷ (pot + bet). */
  mdf: number;
  /** How often a pure bluff must work: bet ÷ (pot + bet). */
  bluffWorks: number;
}

const SIZES: [string, number][] = [
  ["¼ pot", 0.25],
  ["⅓ pot", 1 / 3],
  ["½ pot", 0.5],
  ["⅔ pot", 2 / 3],
  ["¾ pot", 0.75],
  ["Pot", 1],
  ["1.5× pot", 1.5],
  ["2× pot", 2],
];

export const BET_SIZE_TABLE: BetSizeRow[] = SIZES.map(([label, s]) => ({
  label,
  size: s,
  callNeeds: s / (1 + 2 * s),
  mdf: 1 / (1 + s),
  bluffWorks: s / (1 + s),
}));

export interface OddsRow {
  event: string;
  probability: number;
}

const flop = choose(50, 3);

/** Everyday preflop and flop probabilities, computed exactly. */
export const ODDS_TABLE: OddsRow[] = [
  { event: "Dealt any pocket pair", probability: 78 / 1326 },
  { event: "Dealt pocket aces (or any specific pair)", probability: 6 / 1326 },
  { event: "Dealt AK (suited or offsuit)", probability: 16 / 1326 },
  { event: "Dealt suited cards", probability: 312 / 1326 },
  { event: "Pocket pair flops a set or better", probability: 1 - choose(48, 3) / flop },
  { event: "Unpaired hand pairs at least one card on the flop", probability: 1 - choose(44, 3) / flop },
  { event: "Suited hand flops a flush", probability: choose(11, 3) / flop },
  { event: "Suited hand flops a flush draw", probability: (choose(11, 2) * 39) / flop },
  {
    event: "Suited hand makes a flush by the river",
    probability: [3, 4, 5].reduce((sum, k) => sum + choose(11, k) * choose(39, 5 - k), 0) / choose(50, 5),
  },
];

export interface MatchupRow {
  name: string;
  hero: string;
  villain: string;
}

const MATCHUPS: MatchupRow[] = [
  { name: "Bigger pair vs smaller pair", hero: "AA", villain: "KK" },
  { name: "Pair vs two overcards", hero: "QQ", villain: "AKs" },
  { name: "Two overcards vs small pair", hero: "AKo", villain: "22" },
  { name: "Same ace, better kicker", hero: "AKo", villain: "AQo" },
  { name: "Pair vs one overcard", hero: "JJ", villain: "AQo" },
  { name: "Two high cards vs two low", hero: "AKo", villain: "76s" },
  { name: "Suited connectors vs a big pair", hero: "76s", villain: "AA" },
];

/** Classic all-in preflop matchups, read from the precomputed equity table. */
export function matchupTable(): (MatchupRow & { equity: number })[] {
  return MATCHUPS.map((m) => ({ ...m, equity: classEquity(m.hero, m.villain) }));
}
