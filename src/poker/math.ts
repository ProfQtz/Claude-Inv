/** Fraction of the final pot you must contribute to call: toCall / (pot + toCall). */
export function potOdds(pot: number, toCall: number): number {
  return toCall / (pot + toCall);
}

/** Rule of 2 and 4: approximate % equity from outs with one or two cards to come. */
export function ruleOf2And4(outs: number, cardsToCome: 1 | 2): number {
  return outs * (cardsToCome === 2 ? 4 : 2);
}

/** Exact probability of hitting at least one of `outs` with `cardsToCome` cards from `unseen`. */
export function hitProbability(outs: number, cardsToCome: 1 | 2, unseen = cardsToCome === 2 ? 47 : 46): number {
  if (cardsToCome === 1) return outs / unseen;
  const missBoth = ((unseen - outs) / unseen) * ((unseen - 1 - outs) / (unseen - 1));
  return 1 - missBoth;
}

/** A call is profitable (ignoring implied odds) when equity exceeds the pot-odds price. */
export function isProfitableCall(equity: number, pot: number, toCall: number): boolean {
  return equity > potOdds(pot, toCall);
}

export function formatPercent(fraction: number): string {
  return `${Math.round(fraction * 100)}%`;
}
