import { Card, RANK_NAME, RANKS, rankValue } from "./cards";

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

/** Evaluate exactly five cards. */
export function evaluate5(cards: Card[]): HandValue {
  if (cards.length !== 5) throw new Error("evaluate5 needs exactly 5 cards");

  const values = cards.map((c) => rankValue(c.rank)).sort((a, b) => b - a);
  const isFlush = cards.every((c) => c.suit === cards[0].suit);

  const unique = [...new Set(values)];
  let straightHigh = 0;
  if (unique.length === 5) {
    if (values[0] - values[4] === 4) straightHigh = values[0];
    // The wheel: A-2-3-4-5 plays as a five-high straight.
    else if (values.join() === "14,5,4,3,2") straightHigh = 5;
  }

  // Group by rank: larger groups first, then higher rank.
  const counts = new Map<number, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  const groups = [...counts.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0]);
  const byGroup = groups.map(([v]) => v);
  const shape = groups.map(([, n]) => n).join("");

  let category: HandCategory;
  let kickers: number[];
  if (straightHigh && isFlush) {
    category = HandCategory.StraightFlush;
    kickers = [straightHigh];
  } else if (shape === "41") {
    category = HandCategory.FourOfAKind;
    kickers = byGroup;
  } else if (shape === "32") {
    category = HandCategory.FullHouse;
    kickers = byGroup;
  } else if (isFlush) {
    category = HandCategory.Flush;
    kickers = values;
  } else if (straightHigh) {
    category = HandCategory.Straight;
    kickers = [straightHigh];
  } else if (shape === "311") {
    category = HandCategory.ThreeOfAKind;
    kickers = byGroup;
  } else if (shape === "221") {
    category = HandCategory.TwoPair;
    kickers = byGroup;
  } else if (shape === "2111") {
    category = HandCategory.OnePair;
    kickers = byGroup;
  } else {
    category = HandCategory.HighCard;
    kickers = values;
  }
  return { category, kickers, cards };
}

function combinations<T>(items: T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (items.length < k) return [];
  const [first, ...rest] = items;
  return [...combinations(rest, k - 1).map((c) => [first, ...c]), ...combinations(rest, k)];
}

/** Evaluate the best five-card hand from 5–7 cards. */
export function evaluate(cards: Card[]): HandValue {
  if (cards.length < 5 || cards.length > 7) throw new Error("evaluate needs 5 to 7 cards");
  let best: HandValue | null = null;
  for (const combo of combinations(cards, 5)) {
    const value = evaluate5(combo);
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
