import { Card, RANK_NAME, RANKS } from "./cards";

export enum HandCategory {
  HighCard = 0,
  OnePair,
  TwoPair,
  ThreeOfAKind,
  Straight,
  Flush,
  FullHouse,
  FourOfAKind,
  StraightFlush,
}

export const CATEGORY_NAME: Record<HandCategory, string> = {
  [HandCategory.HighCard]: "High Card",
  [HandCategory.OnePair]: "One Pair",
  [HandCategory.TwoPair]: "Two Pair",
  [HandCategory.ThreeOfAKind]: "Three of a Kind",
  [HandCategory.Straight]: "Straight",
  [HandCategory.Flush]: "Flush",
  [HandCategory.FullHouse]: "Full House",
  [HandCategory.FourOfAKind]: "Four of a Kind",
  [HandCategory.StraightFlush]: "Straight Flush",
};

export interface HandValue {
  category: HandCategory;
  /** Rank values used to break ties, most significant first. */
  kickers: number[];
  /** The five cards that make the hand. */
  cards: Card[];
}

const valueName = (v: number) => RANK_NAME[RANKS[v - 2]];
const plural = (v: number) => (v === 6 ? "Sixes" : valueName(v) + "s");

const RANK_VALUE = Object.fromEntries(RANKS.map((r, i) => [r, i + 2])) as Record<Card["rank"], number>;
const WHEEL_MASK = (1 << 14) | (1 << 5) | (1 << 4) | (1 << 3) | (1 << 2);

/** Evaluate exactly five cards. */
export function evaluate5(cards: Card[]): HandValue {
  if (cards.length !== 5) throw new Error("evaluate5 needs exactly 5 cards");

  const counts = new Array<number>(15).fill(0);
  let mask = 0;
  let isFlush = true;
  for (const c of cards) {
    const v = RANK_VALUE[c.rank];
    counts[v]++;
    mask |= 1 << v;
    if (c.suit !== cards[0].suit) isFlush = false;
  }

  // Group ranks by multiplicity, highest rank first within each group.
  const quads: number[] = [];
  const trips: number[] = [];
  const pairs: number[] = [];
  const singles: number[] = [];
  for (let v = 14; v >= 2; v--) {
    const n = counts[v];
    if (n === 4) quads.push(v);
    else if (n === 3) trips.push(v);
    else if (n === 2) pairs.push(v);
    else if (n === 1) singles.push(v);
  }

  let straightHigh = 0;
  if (singles.length === 5) {
    if (singles[0] - singles[4] === 4) straightHigh = singles[0];
    // The wheel: A-2-3-4-5 plays as a five-high straight.
    else if (mask === WHEEL_MASK) straightHigh = 5;
  }

  const byGroup = [...quads, ...trips, ...pairs, ...singles];
  let category: HandCategory;
  let kickers: number[];
  if (straightHigh && isFlush) {
    category = HandCategory.StraightFlush;
    kickers = [straightHigh];
  } else if (quads.length) {
    category = HandCategory.FourOfAKind;
    kickers = byGroup;
  } else if (trips.length && pairs.length) {
    category = HandCategory.FullHouse;
    kickers = byGroup;
  } else if (isFlush) {
    category = HandCategory.Flush;
    kickers = singles;
  } else if (straightHigh) {
    category = HandCategory.Straight;
    kickers = [straightHigh];
  } else if (trips.length) {
    category = HandCategory.ThreeOfAKind;
    kickers = byGroup;
  } else if (pairs.length === 2) {
    category = HandCategory.TwoPair;
    kickers = byGroup;
  } else if (pairs.length === 1) {
    category = HandCategory.OnePair;
    kickers = byGroup;
  } else {
    category = HandCategory.HighCard;
    kickers = singles;
  }
  return { category, kickers, cards };
}

/** Index subsets of size k from 0..n-1, cached because evaluation runs them constantly. */
const comboCache = new Map<string, number[][]>();
function indexCombinations(n: number, k: number): number[][] {
  const key = `${n}/${k}`;
  let combos = comboCache.get(key);
  if (!combos) {
    combos = [];
    const pick = (start: number, chosen: number[]) => {
      if (chosen.length === k) {
        combos!.push(chosen);
        return;
      }
      for (let i = start; i < n; i++) pick(i + 1, [...chosen, i]);
    };
    pick(0, []);
    comboCache.set(key, combos);
  }
  return combos;
}

/** Evaluate the best five-card hand from 5–7 cards. */
export function evaluate(cards: Card[]): HandValue {
  if (cards.length < 5 || cards.length > 7) throw new Error("evaluate needs 5 to 7 cards");
  let best: HandValue | null = null;
  for (const combo of indexCombinations(cards.length, 5)) {
    const value = evaluate5(combo.map((i) => cards[i]));
    if (!best || compareHands(value, best) > 0) best = value;
  }
  return best!;
}

/** Positive if a beats b, negative if b beats a, 0 for a tie. */
export function compareHands(a: HandValue, b: HandValue): number {
  if (a.category !== b.category) return a.category - b.category;
  for (let i = 0; i < Math.max(a.kickers.length, b.kickers.length); i++) {
    const diff = (a.kickers[i] ?? 0) - (b.kickers[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

/** Human-readable description, e.g. "Full House, Kings full of Sevens". */
export function describeHand(hand: HandValue): string {
  const k = hand.kickers;
  switch (hand.category) {
    case HandCategory.StraightFlush:
      return k[0] === 14 ? "Royal Flush" : `Straight Flush, ${valueName(k[0])} high`;
    case HandCategory.FourOfAKind:
      return `Four of a Kind, ${plural(k[0])}`;
    case HandCategory.FullHouse:
      return `Full House, ${plural(k[0])} full of ${plural(k[1])}`;
    case HandCategory.Flush:
      return `Flush, ${valueName(k[0])} high`;
    case HandCategory.Straight:
      return `Straight, ${valueName(k[0])} high`;
    case HandCategory.ThreeOfAKind:
      return `Three of a Kind, ${plural(k[0])}`;
    case HandCategory.TwoPair:
      return `Two Pair, ${plural(k[0])} and ${plural(k[1])}`;
    case HandCategory.OnePair:
      return `Pair of ${plural(k[0])}`;
    case HandCategory.HighCard:
      return `${valueName(k[0])} High`;
  }
}
