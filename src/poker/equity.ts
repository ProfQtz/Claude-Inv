import { Card, cardCode, fullDeck } from "./cards";
import { score7 } from "./evaluator";

export interface Equity {
  win: number;
  tie: number;
  /** Win share plus half the ties: the fraction of the pot hero expects. */
  equity: number;
}

/** Exact heads-up equity by enumerating every remaining runout of the board. */
export function exactEquity(hero: Card[], villain: Card[], board: Card[]): Equity {
  const seen = new Set([...hero, ...villain, ...board].map(cardCode));
  const deck = fullDeck().filter((c) => !seen.has(cardCode(c)));
  const need = 5 - board.length;
  if (need < 0 || need > 2) throw new Error("exactEquity supports flop, turn or river boards");

  let wins = 0;
  let ties = 0;
  let total = 0;
  const score = (runout: Card[]) => {
    const full = [...board, ...runout];
    const diff = score7([...hero, ...full]) - score7([...villain, ...full]);
    if (diff > 0) wins++;
    else if (diff === 0) ties++;
    total++;
  };

  if (need === 0) score([]);
  else if (need === 1) deck.forEach((c) => score([c]));
  else for (let i = 0; i < deck.length; i++) for (let j = i + 1; j < deck.length; j++) score([deck[i], deck[j]]);

  return { win: wins / total, tie: ties / total, equity: (wins + ties / 2) / total };
}
