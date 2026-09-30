import { type Card, cardCode, RANKS, SUITS } from "./cards";
import { CHART_RANKS, chartLabel } from "./ranges";

/** The 169 starting-hand classes in chart order (row by row, AA first, 22 last). */
export const HAND_CLASSES: string[] = CHART_RANKS.flatMap((_, row) => CHART_RANKS.map((__, col) => chartLabel(row, col)));

export const CLASS_INDEX = new Map(HAND_CLASSES.map((label, i) => [label, i]));

/** Every concrete two-card combination for a class label such as "AKs", "T9o" or "77". */
export function classCombos(label: string): Card[][] {
  const [hi, lo] = [label[0], label[1]] as [(typeof RANKS)[number], (typeof RANKS)[number]];
  const out: Card[][] = [];
  if (hi === lo) {
    for (let a = 0; a < 4; a++)
      for (let b = a + 1; b < 4; b++) out.push([{ rank: hi, suit: SUITS[a] }, { rank: lo, suit: SUITS[b] }]);
  } else if (label[2] === "s") {
    for (const s of SUITS) out.push([{ rank: hi, suit: s }, { rank: lo, suit: s }]);
  } else {
    for (const a of SUITS) for (const b of SUITS) if (a !== b) out.push([{ rank: hi, suit: a }, { rank: lo, suit: b }]);
  }
  return out;
}

const ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_";

/** Two characters per equity, 12 bits of precision (steps of about 0.02%). */
export function encodeEquity(eq: number): string {
  const v = Math.round(Math.min(1, Math.max(0, eq)) * 4095);
  return ALPHABET[v >> 6] + ALPHABET[v & 63];
}

export function decodeEquities(encoded: string): Float32Array {
  const out = new Float32Array(encoded.length / 2);
  for (let k = 0; k < out.length; k++) {
    out[k] = (ALPHABET.indexOf(encoded[2 * k]) * 64 + ALPHABET.indexOf(encoded[2 * k + 1])) / 4095;
  }
  return out;
}

/**
 * Card-removal weights: for each class pair, the average number of villain combos that
 * share no card with one of hero's combos. AA vs AKs is 6 × 2 / 6 = 2, not 4.
 */
export function blockerWeights(): Float32Array {
  const n = HAND_CLASSES.length;
  const combos = HAND_CLASSES.map((l) => classCombos(l).map((c) => c.map(cardCode)));
  const w = new Float32Array(n * n);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      let compatible = 0;
      for (const h of combos[i]) for (const v of combos[j]) if (!v.includes(h[0]) && !v.includes(h[1])) compatible++;
      w[i * n + j] = compatible / combos[i].length;
    }
  }
  return w;
}
