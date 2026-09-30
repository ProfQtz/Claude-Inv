import { type Card, RANKS, rankValue, type Suit, SUITS } from "./cards";
import type { Position } from "./ranges";

/**
 * Preflop spots with precomputed flop equities: an open and a flat call. Opening and
 * calling ranges don't depend on suits, so a flop's equity only depends on its
 * canonical form under suit relabeling.
 */
export const FLOP_SPOTS: { id: string; raiser: Position; facing: string; caller: string; text: string }[] = [
  { id: "btn-bb", raiser: "BTN", facing: "bb-vs-btn", caller: "Big Blind", text: "The button opens and the big blind calls" },
  { id: "co-btn", raiser: "CO", facing: "btn-vs-co", caller: "Button", text: "The cutoff opens and the button calls" },
  { id: "utg-btn", raiser: "UTG", facing: "btn-vs-utg", caller: "Button", text: "UTG opens and the button calls" },
];

export interface CanonicalFlop {
  cards: Card[];
  /** How many of the 22,100 real flops share this form. */
  weight: number;
}

const card = (rank: (typeof RANKS)[number], suit: Suit): Card => ({ rank, suit });

/**
 * The 1,755 strategically distinct flops, highest rank first: suit patterns are
 * monotone, two-tone (three variants by which card is off-suit) and rainbow for
 * unpaired flops; paired flops have the kicker matching a pair suit or not.
 */
export const CANONICAL_FLOPS: CanonicalFlop[] = (() => {
  const out: CanonicalFlop[] = [];
  const ranks = [...RANKS].reverse();
  for (let i = 0; i < 13; i++) {
    for (let j = i; j < 13; j++) {
      for (let k = j; k < 13; k++) {
        const [a, b, c] = [ranks[i], ranks[j], ranks[k]];
        if (a === b && b === c) {
          out.push({ cards: [card(a, "s"), card(b, "h"), card(c, "d")], weight: 4 });
        } else if (a === b || b === c) {
          const [pair, single] = a === b ? [a, c] : [b, a];
          const pairCards = [card(pair, "s"), card(pair, "h")];
          const order = (x: Card[]) => x.sort((p, q) => rankValue(q.rank) - rankValue(p.rank));
          out.push({ cards: order([...pairCards, card(single, "s")]), weight: 12 });
          out.push({ cards: order([...pairCards, card(single, "d")]), weight: 12 });
        } else {
          out.push({ cards: [card(a, "s"), card(b, "s"), card(c, "s")], weight: 4 });
          out.push({ cards: [card(a, "s"), card(b, "s"), card(c, "h")], weight: 12 });
          out.push({ cards: [card(a, "s"), card(b, "h"), card(c, "s")], weight: 12 });
          out.push({ cards: [card(a, "h"), card(b, "s"), card(c, "s")], weight: 12 });
          out.push({ cards: [card(a, "s"), card(b, "h"), card(c, "d")], weight: 24 });
        }
      }
    }
  }
  return out;
})();

const SUIT_PERMS: Suit[][] = (() => {
  const perms: Suit[][] = [];
  const build = (prefix: Suit[], rest: Suit[]) => {
    if (!rest.length) perms.push(prefix);
    rest.forEach((s, i) => build([...prefix, s], [...rest.slice(0, i), ...rest.slice(i + 1)]));
  };
  build([], [...SUITS]);
  return perms;
})();

/** A key shared by every flop that is the same up to suit relabeling and card order. */
export function flopKey(flop: Card[]): string {
  let best = "";
  for (const perm of SUIT_PERMS) {
    const key = flop
      .map((c) => ({ rank: c.rank, suit: perm[SUITS.indexOf(c.suit)] }))
      .sort((p, q) => rankValue(q.rank) - rankValue(p.rank) || p.suit.localeCompare(q.suit))
      .map((c) => c.rank + c.suit)
      .join("");
    if (!best || key < best) best = key;
  }
  return best;
}

let index: Map<string, number> | null = null;

/** Position of a flop's canonical form in CANONICAL_FLOPS. */
export function flopIndex(flop: Card[]): number {
  index ??= new Map(CANONICAL_FLOPS.map((f, i) => [flopKey(f.cards), i]));
  const i = index.get(flopKey(flop));
  if (i === undefined) throw new Error("Not a flop");
  return i;
}

/** The same flop with its suits relabeled at random, so displays vary. */
export function randomSuits(flop: Card[], random: () => number = Math.random): Card[] {
  const perm = SUIT_PERMS[Math.floor(random() * SUIT_PERMS.length)];
  return flop.map((c) => ({ rank: c.rank, suit: perm[SUITS.indexOf(c.suit)] }));
}
