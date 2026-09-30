import { type Card, cardCode, fullDeck } from "./cards";
import { score7 } from "./evaluator";
import { rangeEquity } from "./nash";
import { classCombos, HAND_CLASSES } from "./preflop";
import { flopDraw, type FlopDraw } from "./rangeTools";

let preflopTop: Map<string, number> | null = null;

const CHEN_HIGH: Record<string, number> = { A: 10, K: 8, Q: 7, J: 6 };
const RANK_ORDER = "23456789TJQKA";

/**
 * Bill Chen's preflop score: high card, doubled for pairs, +2 suited, minus a gap
 * penalty, +1 for small connected cards, rounded up to a whole number.
 */
export function chenScore(label: string): number {
  const [hi, lo] = [label[0], label[1]];
  const value = (r: string) => CHEN_HIGH[r] ?? (RANK_ORDER.indexOf(r) + 2) / 2;
  let score = value(hi);
  if (hi === lo) return Math.ceil(Math.max(5, score * 2));
  if (label[2] === "s") score += 2;
  const gap = RANK_ORDER.indexOf(hi) - RANK_ORDER.indexOf(lo) - 1;
  score -= [0, 1, 2, 4][gap] ?? 5;
  if (gap <= 1 && RANK_ORDER.indexOf(hi) < RANK_ORDER.indexOf("Q")) score += 1;
  return Math.ceil(score);
}

/**
 * Preflop rank of a hand class: the share of all 1,326 combos at least as strong,
 * ordered by Chen score, then equity against a random hand. AA is about 0.5%;
 * "top 20%" means ≤ 0.2.
 */
export function preflopTopShare(label: string): number {
  if (!preflopTop) {
    const ones = new Float32Array(HAND_CLASSES.length).fill(1);
    const ranked = HAND_CLASSES.map((l) => ({ l, chen: chenScore(l), eq: rangeEquity(l, ones)!, n: classCombos(l).length })).sort(
      (a, b) => b.chen - a.chen || b.eq - a.eq,
    );
    let cumulative = 0;
    preflopTop = new Map();
    for (const r of ranked) {
      cumulative += r.n;
      preflopTop.set(r.l, cumulative / 1326);
    }
  }
  const share = preflopTop.get(label);
  if (share === undefined) throw new Error(`Unknown hand class ${label}`);
  return share;
}

export const comboKey = (a: Card, b: Card) => [cardCode(a), cardCode(b)].sort().join("");

const tables = new Map<string, Map<string, number>>();

/**
 * Hand strength on a board: for every two-card holding, the share of other holdings it
 * beats right now (ties count half), ignoring cards still to come. Cached per board.
 */
export function strengthTable(board: Card[]): Map<string, number> {
  const key = board.map(cardCode).join("");
  let table = tables.get(key);
  if (table) return table;
  const seen = new Set(board.map(cardCode));
  const deck = fullDeck().filter((c) => !seen.has(cardCode(c)));
  const scored: { key: string; score: number }[] = [];
  for (let i = 0; i < deck.length; i++) {
    for (let j = i + 1; j < deck.length; j++) scored.push({ key: comboKey(deck[i], deck[j]), score: score7([deck[i], deck[j], ...board]) });
  }
  scored.sort((a, b) => a.score - b.score);
  table = new Map();
  for (let i = 0; i < scored.length; ) {
    let j = i;
    while (j < scored.length && scored[j].score === scored[i].score) j++;
    // Tied holdings share the average position.
    const percentile = ((i + j - 1) / 2) / (scored.length - 1);
    for (let k = i; k < j; k++) table.set(scored[k].key, percentile);
    i = j;
  }
  if (tables.size > 24) tables.delete(tables.keys().next().value!);
  tables.set(key, table);
  return table;
}

export function handStrength(hole: Card[], board: Card[]): number {
  return strengthTable(board).get(comboKey(hole[0], hole[1]))!;
}

/** A strong draw (flush draw or open-ended) on the flop or turn; none on the river. */
export function drawOf(hole: Card[], board: Card[]): FlopDraw | null {
  return board.length >= 3 && board.length <= 4 ? flopDraw(hole, board) : null;
}
