import { type Card, cardCode, fullDeck } from "./cards";
import { exactEquity } from "./equity";
import { score7 } from "./evaluator";
import { rangeCombos } from "./rangeTools";

type Random = () => number;

export type Villain = { kind: "hand"; cards: Card[] } | { kind: "range"; range: Set<string> };

export interface CalcResult {
  win: number;
  tie: number;
  /** Win share plus half the ties. */
  equity: number;
  /** True when every runout was counted; false for a simulation. */
  exact: boolean;
  /** Deals counted: every villain hand and runout when exact, the samples otherwise. */
  deals: number;
  /** Villain combos left after card removal (ranges only). */
  combos?: number;
}

export const SIM_SAMPLES = 40_000;

/** Hero's equity against a hand or a range. Returns null when villain has no possible hands. */
export function calculateEquity(
  hero: Card[],
  villain: Villain,
  board: Card[],
  random: Random = Math.random,
  samples = SIM_SAMPLES,
): CalcResult | null {
  if (hero.length !== 2 || ![0, 3, 4, 5].includes(board.length)) throw new Error("Need two hole cards and a board of 0, 3, 4 or 5 cards");
  const need = 5 - board.length;

  if (villain.kind === "hand") {
    if (need <= 2) {
      const eq = exactEquity(hero, villain.cards, board);
      const deals = need === 0 ? 1 : need === 1 ? 44 : 990;
      return { ...eq, exact: true, deals };
    }
    return simulate(hero, [villain.cards], board, random, samples);
  }

  const combos = rangeCombos(villain.range, [...hero, ...board]);
  if (combos.length === 0) return null;
  if (need <= 1) return { ...enumerate(hero, combos, board), combos: combos.length };
  return { ...simulate(hero, combos, board, random, samples), combos: combos.length };
}

/** Every villain combo against every remaining river (or the complete board). */
function enumerate(hero: Card[], combos: Card[][], board: Card[]): CalcResult {
  const used = new Set([...hero, ...board].map(cardCode));
  const deck = fullDeck().filter((c) => !used.has(cardCode(c)));
  let wins = 0;
  let ties = 0;
  let deals = 0;
  for (const combo of combos) {
    const blocked = new Set(combo.map(cardCode));
    const rivers = board.length === 5 ? [null] : deck.filter((c) => !blocked.has(cardCode(c)));
    for (const river of rivers) {
      const full = river ? [...board, river] : board;
      const diff = score7([...hero, ...full]) - score7([...combo, ...full]);
      if (diff > 0) wins++;
      else if (diff === 0) ties++;
      deals++;
    }
  }
  return { win: wins / deals, tie: ties / deals, equity: (wins + ties / 2) / deals, exact: true, deals };
}

/** Sample a villain combo and the rest of the board, `samples` times. */
function simulate(hero: Card[], combos: Card[][], board: Card[], random: Random, samples: number): CalcResult {
  const used = new Set([...hero, ...board].map(cardCode));
  const deck = fullDeck().filter((c) => !used.has(cardCode(c)));
  const codes = deck.map(cardCode);
  let wins = 0;
  let ties = 0;
  for (let n = 0; n < samples; n++) {
    const combo = combos[Math.floor(random() * combos.length)];
    const taken = new Set(combo.map(cardCode));
    const full = [...board];
    while (full.length < 5) {
      const i = Math.floor(random() * deck.length);
      if (taken.has(codes[i])) continue;
      taken.add(codes[i]);
      full.push(deck[i]);
    }
    const diff = score7([...hero, ...full]) - score7([...combo, ...full]);
    if (diff > 0) wins++;
    else if (diff === 0) ties++;
  }
  return { win: wins / samples, tie: ties / samples, equity: (wins + ties / 2) / samples, exact: false, deals: samples };
}
