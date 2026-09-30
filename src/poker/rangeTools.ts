import { type Card, cardCode, fullDeck, rankValue } from "./cards";
import { HandCategory, score7, scoreCategory } from "./evaluator";
import { classCombos } from "./preflop";

type Random = () => number;

/** Every combination of the range's hand classes that avoids the dead cards. */
export function rangeCombos(range: Iterable<string>, dead: Card[]): Card[][] {
  const blocked = new Set(dead.map(cardCode));
  const out: Card[][] = [];
  for (const label of range) {
    for (const combo of classCombos(label)) {
      if (!blocked.has(cardCode(combo[0])) && !blocked.has(cardCode(combo[1]))) out.push(combo);
    }
  }
  return out;
}

const RUN = 0b11111;

function hasStraight(mask: number): boolean {
  for (let low = 1; low <= 10; low++) if (((mask >> low) & RUN) === RUN) return true;
  return false;
}

/** Rank bit mask with the ace also counted as a one, for wheel straights. */
function rankMask(cards: Card[]): number {
  let mask = 0;
  for (const c of cards) {
    const v = rankValue(c.rank);
    mask |= 1 << v;
    if (v === 14) mask |= 1 << 1;
  }
  return mask;
}

export type FlopDraw = "flush" | "straight";

/**
 * A strong flop draw: four to a flush using a hole card, or an open-ended or
 * double-gutshot straight draw (two ranks complete it). Made hands return null.
 */
export function flopDraw(hole: Card[], flop: Card[]): FlopDraw | null {
  const cards = [...hole, ...flop];
  for (const suit of new Set(hole.map((c) => c.suit))) {
    if (cards.filter((c) => c.suit === suit).length === 4) return "flush";
  }
  const mask = rankMask(cards);
  if (hasStraight(mask)) return null;
  let completing = 0;
  for (let v = 2; v <= 14; v++) {
    if (mask & (1 << v)) continue;
    const next = mask | (1 << v) | (v === 14 ? 1 << 1 : 0);
    if (hasStraight(next)) completing++;
  }
  return completing >= 2 ? "straight" : null;
}

export interface RiverRange {
  /** Two pair or better, grouped by category. */
  value: Partial<Record<HandCategory, number>>;
  /** Missed flop draws that ended with no pair. */
  bluffs: Record<FlopDraw, number>;
  valueTotal: number;
  bluffTotal: number;
}

/**
 * Split a range into a polarized river betting range: every combo with two pair or
 * better, plus every flop draw that missed and has no pair. One-pair hands check.
 * `dead` is the cards the range can't hold besides the board (usually hero's hand).
 */
export function riverRange(range: Iterable<string>, board: Card[], dead: Card[] = []): RiverRange {
  const flop = board.slice(0, 3);
  const out: RiverRange = { value: {}, bluffs: { flush: 0, straight: 0 }, valueTotal: 0, bluffTotal: 0 };
  for (const combo of rangeCombos(range, [...board, ...dead])) {
    const category = scoreCategory(score7([...combo, ...board]));
    if (category >= HandCategory.TwoPair) {
      out.value[category] = (out.value[category] ?? 0) + 1;
      out.valueTotal++;
    } else if (category === HandCategory.HighCard) {
      const draw = flopDraw(combo, flop);
      if (draw) {
        out.bluffs[draw]++;
        out.bluffTotal++;
      }
    }
  }
  return out;
}

/** Map every card to 0–51 so sampling can use plain integer checks. */
const cardIndex = (c: Card) => "23456789TJQKA".indexOf(c.rank) * 4 + "shdc".indexOf(c.suit);

/**
 * Monte Carlo equity of range A against range B on a flop: sample a compatible combo
 * from each range and a random turn and river. Returns A's share of the pot.
 */
export function rangeVsRangeEquity(a: Card[][], b: Card[][], flop: Card[], samples: number, random: Random = Math.random): number {
  const flopIds = new Set(flop.map(cardIndex));
  const deck = fullDeck().filter((c) => !flopIds.has(cardIndex(c)));
  const ids = deck.map(cardIndex);
  let won = 0;
  let counted = 0;
  for (let guard = 0; counted < samples && guard < samples * 20; guard++) {
    const ha = a[Math.floor(random() * a.length)];
    const hb = b[Math.floor(random() * b.length)];
    const used = [cardIndex(ha[0]), cardIndex(ha[1]), cardIndex(hb[0]), cardIndex(hb[1])];
    if (new Set(used).size < 4) continue;
    let t = -1;
    let r = -1;
    while (t < 0 || used.includes(ids[t])) t = Math.floor(random() * deck.length);
    while (r < 0 || r === t || used.includes(ids[r])) r = Math.floor(random() * deck.length);
    const board = [...flop, deck[t], deck[r]];
    const diff = score7([...ha, ...board]) - score7([...hb, ...board]);
    won += diff > 0 ? 1 : diff === 0 ? 0.5 : 0;
    counted++;
  }
  return won / counted;
}

/**
 * Top pair or better on the flop: an overpair, top pair, two pair using both hole
 * cards, a set or trips, or any straight, flush, full house or quads.
 */
export function topPairOrBetter(hole: Card[], flop: Card[]): boolean {
  if (scoreCategory(score7([...hole, ...flop])) >= HandCategory.Straight) return true;
  const board = flop.map((c) => rankValue(c.rank));
  const top = Math.max(...board);
  const [a, b] = hole.map((c) => rankValue(c.rank));
  if (a === b) return a > top || board.includes(a);
  const hits = [a, b].filter((v) => board.includes(v));
  if (hits.length === 2) return true;
  if (hits.length === 1) return hits[0] === top || board.filter((v) => v === hits[0]).length >= 2;
  return false;
}

/** Share of a range's combos with top pair or better on the flop. */
export function topPairShare(combos: Card[][], flop: Card[]): number {
  return combos.filter((c) => topPairOrBetter(c, flop)).length / combos.length;
}
