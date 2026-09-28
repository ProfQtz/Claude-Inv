export const RANKS = ["2", "3", "4", "5", "6", "7", "8", "9", "T", "J", "Q", "K", "A"] as const;
export const SUITS = ["s", "h", "d", "c"] as const;

export type Rank = (typeof RANKS)[number];
export type Suit = (typeof SUITS)[number];

export interface Card {
  rank: Rank;
  suit: Suit;
}

export const SUIT_SYMBOL: Record<Suit, string> = { s: "♠", h: "♥", d: "♦", c: "♣" };
export const SUIT_NAME: Record<Suit, string> = { s: "spades", h: "hearts", d: "diamonds", c: "clubs" };
export const RANK_NAME: Record<Rank, string> = {
  "2": "Two",
  "3": "Three",
  "4": "Four",
  "5": "Five",
  "6": "Six",
  "7": "Seven",
  "8": "Eight",
  "9": "Nine",
  T: "Ten",
  J: "Jack",
  Q: "Queen",
  K: "King",
  A: "Ace",
};

/** Numeric value of a rank: 2 → 2 … A → 14. */
export function rankValue(rank: Rank): number {
  return RANKS.indexOf(rank) + 2;
}

/** Parse "As" / "Td" into a card. Throws on malformed input. */
export function parseCard(code: string): Card {
  const rank = code[0]?.toUpperCase() as Rank;
  const suit = code[1]?.toLowerCase() as Suit;
  if (code.length !== 2 || !RANKS.includes(rank) || !SUITS.includes(suit)) {
    throw new Error(`Invalid card: ${code}`);
  }
  return { rank, suit };
}

/** Parse a whitespace-separated list such as "As Kd 7h". */
export function parseCards(codes: string): Card[] {
  return codes.trim().split(/\s+/).filter(Boolean).map(parseCard);
}

export function cardCode(card: Card): string {
  return card.rank + card.suit;
}

export function isRed(card: Card): boolean {
  return card.suit === "h" || card.suit === "d";
}

export function fullDeck(): Card[] {
  return RANKS.flatMap((rank) => SUITS.map((suit) => ({ rank, suit })));
}

/** Fisher–Yates shuffle returning a new array. */
export function shuffle<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
