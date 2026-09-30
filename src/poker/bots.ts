import type { Card } from "./cards";
import { facingAction, handLabel, OPENING_SETS, type Position } from "./ranges";
import { drawOf, handStrength, preflopTopShare } from "./strength";
import { BB, type BotStyle, type Situation, type TableAction, type TableStreet } from "./table";

/**
 * Simulated opponents. Each style is a policy: from the public situation and its own
 * cards it returns a probability for every action it might take. Play samples from
 * it; the coach replays it over every possible hand to rebuild the bot's range, so
 * the policy must only depend on what's passed in.
 */

export interface BotChoice {
  action: TableAction;
  label: string;
  p: number;
}

export const STYLE_INFO: Record<BotStyle, { name: string; short: string; description: string; tip: string }> = {
  nit: {
    name: "Nit",
    short: "Nit",
    description: "Plays few hands and rarely bluffs.",
    tip: "Steal their blinds, and believe them when they bet big.",
  },
  station: {
    name: "Calling Station",
    short: "Station",
    description: "Calls far too often and rarely raises.",
    tip: "Value bet thinner and bigger, and don't bluff.",
  },
  maniac: {
    name: "Maniac",
    short: "Maniac",
    description: "Raises and bluffs constantly.",
    tip: "Tighten up, call down with good hands and let them bluff.",
  },
  regular: {
    name: "Regular",
    short: "Reg",
    description: "Solid, tight and aggressive.",
    tip: "No easy exploits: play fundamentally sound poker.",
  },
};

interface PreflopStyle {
  /** Top share of hands raised first in (6-max, when not using the charts; heads-up button). */
  open: number;
  openHU: number;
  /** Top share limped first in (stations only). */
  limp: number;
  limpHU: number;
  /** Raise over limpers. */
  iso: number;
  threeBet: number;
  threeBetHU: number;
  /** Call an open in position / out of position. */
  callIP: number;
  callOOP: number;
  /** Big blind defence against a steal (late-position or heads-up open). */
  bbCall: number;
  fourBet: number;
  callThreeBet: number;
  /** Call or shove against a 4-bet or more. */
  callFourBet: number;
  /** Open size in big blinds. */
  openSize: number;
}

const PREFLOP: Record<BotStyle, PreflopStyle> = {
  nit: { open: 0.12, openHU: 0.35, limp: 0, limpHU: 0, iso: 0.06, threeBet: 0.025, threeBetHU: 0.05, callIP: 0.07, callOOP: 0.05, bbCall: 0.18, fourBet: 0.012, callThreeBet: 0.03, callFourBet: 0.012, openSize: 3 },
  station: { open: 0.04, openHU: 0.1, limp: 0.5, limpHU: 0.85, iso: 0.03, threeBet: 0.02, threeBetHU: 0.03, callIP: 0.45, callOOP: 0.4, bbCall: 0.7, fourBet: 0.009, callThreeBet: 0.25, callFourBet: 0.08, openSize: 3 },
  maniac: { open: 0.55, openHU: 0.85, limp: 0, limpHU: 0, iso: 0.45, threeBet: 0.2, threeBetHU: 0.3, callIP: 0.25, callOOP: 0.15, bbCall: 0.4, fourBet: 0.1, callThreeBet: 0.2, callFourBet: 0.1, openSize: 3.5 },
  regular: { open: 0.2, openHU: 0.8, limp: 0, limpHU: 0, iso: 0.12, threeBet: 0.06, threeBetHU: 0.12, callIP: 0.15, callOOP: 0.08, bbCall: 0.35, fourBet: 0.025, callThreeBet: 0.07, callFourBet: 0.02, openSize: 2.5 },
};

type PerStreet = Record<Exclude<TableStreet, "preflop">, number>;

interface PostflopStyle {
  /** Bet for value at or above this hand strength. */
  value: PerStreet;
  valueFreq: number;
  /** Thin value: bet sometimes at or above this. */
  thin: PerStreet;
  thinFreq: number;
  /** Below this is air: no showdown value, only bluffs. */
  air: PerStreet;
  /** Bluff frequency with air as the last aggressor (c-bets and barrels), and when not. */
  barrel: PerStreet;
  stab: number;
  semiBluff: number;
  /** Continue when strength ≥ base + slope × price. */
  callBase: PerStreet;
  callSlope: number;
  /** Call with a draw when the price is at most this. */
  drawPrice: number;
  /** Raise for value at or above this. */
  raise: PerStreet;
  raiseFreq: number;
  semiRaise: number;
  bluffRaise: number;
  /** Bet size as a fraction of the pot. */
  size: number;
}

const POSTFLOP: Record<BotStyle, PostflopStyle> = {
  nit: {
    value: { flop: 0.92, turn: 0.9, river: 0.86 },
    valueFreq: 0.9,
    thin: { flop: 2, turn: 2, river: 2 },
    thinFreq: 0,
    air: { flop: 0.6, turn: 0.5, river: 0.4 },
    barrel: { flop: 0.3, turn: 0.12, river: 0.05 },
    stab: 0.03,
    semiBluff: 0.2,
    callBase: { flop: 0.72, turn: 0.7, river: 0.64 },
    callSlope: 0.6,
    drawPrice: 0.25,
    raise: { flop: 0.98, turn: 0.97, river: 0.96 },
    raiseFreq: 0.7,
    semiRaise: 0,
    bluffRaise: 0,
    size: 0.6,
  },
  station: {
    value: { flop: 0.93, turn: 0.92, river: 0.9 },
    valueFreq: 0.45,
    thin: { flop: 2, turn: 2, river: 2 },
    thinFreq: 0,
    air: { flop: 0.5, turn: 0.4, river: 0.3 },
    barrel: { flop: 0.15, turn: 0.08, river: 0.04 },
    stab: 0.05,
    semiBluff: 0.05,
    callBase: { flop: 0.35, turn: 0.32, river: 0.28 },
    callSlope: 0.3,
    drawPrice: 1,
    raise: { flop: 0.99, turn: 0.98, river: 0.97 },
    raiseFreq: 0.5,
    semiRaise: 0,
    bluffRaise: 0,
    size: 0.5,
  },
  maniac: {
    value: { flop: 0.8, turn: 0.76, river: 0.7 },
    valueFreq: 0.95,
    thin: { flop: 0.62, turn: 0.55, river: 0.45 },
    thinFreq: 0.6,
    air: { flop: 0.62, turn: 0.55, river: 0.45 },
    barrel: { flop: 0.8, turn: 0.65, river: 0.5 },
    stab: 0.5,
    semiBluff: 0.85,
    callBase: { flop: 0.52, turn: 0.5, river: 0.44 },
    callSlope: 0.5,
    drawPrice: 0.45,
    raise: { flop: 0.9, turn: 0.88, river: 0.85 },
    raiseFreq: 0.6,
    semiRaise: 0.35,
    bluffRaise: 0.15,
    size: 0.85,
  },
  regular: {
    value: { flop: 0.88, turn: 0.86, river: 0.8 },
    valueFreq: 0.85,
    thin: { flop: 0.78, turn: 0.74, river: 0.68 },
    thinFreq: 0.3,
    air: { flop: 0.6, turn: 0.5, river: 0.4 },
    barrel: { flop: 0.55, turn: 0.35, river: 0.25 },
    stab: 0.15,
    semiBluff: 0.6,
    callBase: { flop: 0.52, turn: 0.48, river: 0.42 },
    callSlope: 0.6,
    drawPrice: 0.34,
    raise: { flop: 0.96, turn: 0.95, river: 0.93 },
    raiseFreq: 0.6,
    semiRaise: 0.15,
    bluffRaise: 0.03,
    size: 0.66,
  },
};

const round5 = (chips: number) => Math.round(chips / 5) * 5;

/** A bet or raise to `to`, clamped to the legal range; shoves when little would be left behind. */
function sized(sit: Situation, kind: "bet" | "raise", to: number, tag: string): BotChoice {
  let target = Math.max(sit.minTo, Math.min(sit.maxTo, round5(to)));
  if (target >= 0.6 * sit.maxTo) target = sit.maxTo;
  const allIn = target === sit.maxTo;
  return { action: { kind, to: target }, label: allIn ? "allin" : `${kind}:${tag}`, p: 0 };
}

const choice = (c: BotChoice, p: number): BotChoice => ({ ...c, p });
const FOLD: BotChoice = { action: { kind: "fold" }, label: "fold", p: 0 };
const CHECK: BotChoice = { action: { kind: "check" }, label: "check", p: 0 };
const CALL: BotChoice = { action: { kind: "call" }, label: "call", p: 0 };

/** Combine duplicate labels and drop zero-probability entries. */
function normalize(choices: BotChoice[]): BotChoice[] {
  const merged = new Map<string, BotChoice>();
  for (const c of choices) {
    if (c.p <= 0) continue;
    const prev = merged.get(c.label);
    merged.set(c.label, prev ? { ...prev, p: prev.p + c.p } : c);
  }
  const total = [...merged.values()].reduce((sum, c) => sum + c.p, 0);
  return [...merged.values()].map((c) => ({ ...c, p: c.p / total }));
}

/** Aggressive action when allowed, otherwise the passive fallback. */
function aggressive(sit: Situation, to: number, tag: string): BotChoice | null {
  if (sit.canBet) return sized(sit, "bet", to, tag);
  if (sit.canRaise) return sized(sit, "raise", to, tag);
  return null;
}

const giveUp = (sit: Situation) => (sit.toCall > 0 ? FOLD : CHECK);

/** Raise or bet with probability `p`, else take `otherwise`. */
function mix(sit: Situation, p: number, to: number, tag: string, otherwise: BotChoice): BotChoice[] {
  const agg = aggressive(sit, to, tag);
  if (!agg || p <= 0) return [choice(otherwise, 1)];
  return [choice(agg, p), choice(otherwise, 1 - p)];
}

const FACING_CHART: Record<string, string> = {
  "BTN<UTG": "btn-vs-utg",
  "BTN<CO": "btn-vs-co",
  "BB<BTN": "bb-vs-btn",
  "SB<BTN": "sb-vs-btn",
};

function preflopPolicy(style: BotStyle, sit: Situation, hole: Card[]): BotChoice[] {
  const P = PREFLOP[style];
  const label = handLabel(hole[0], hole[1]);
  const top = preflopTopShare(label);
  const hu = sit.players === 2;
  const blinds = sit.position === "SB" || sit.position === "BB";

  if (sit.raises === 0) {
    // Unopened pot, possibly with limpers.
    const openTo = (P.openSize + sit.limpers) * BB;
    if (sit.toCall === 0) {
      // Big blind option after limps.
      return top <= P.iso ? mix(sit, 1, openTo + BB, "iso", CHECK) : [choice(CHECK, 1)];
    }
    if (sit.limpers > 0) {
      if (top <= P.iso) return mix(sit, 1, openTo, "iso", CALL);
      return [choice(top <= (hu ? P.limpHU : P.limp) ? CALL : FOLD, 1)];
    }
    const chart = style === "regular" && !hu ? OPENING_SETS[sit.position as Position] : undefined;
    const opens = chart ? chart.has(label) : top <= (hu ? P.openHU : P.open);
    if (opens) return mix(sit, 1, openTo, "open", FOLD);
    return [choice(top <= (hu ? P.limpHU : P.limp) ? CALL : FOLD, 1)];
  }

  if (sit.raises === 1) {
    const spot = style === "regular" && !hu && sit.callers === 0 ? FACING_CHART[`${sit.position}<${sit.raiserPosition}`] : undefined;
    const threeBetTo = sit.currentBet * (blinds ? 4 : 3) + sit.callers * sit.currentBet;
    if (spot) {
      const action = facingAction(spot, label);
      if (action === "3-bet") return mix(sit, 1, threeBetTo, "3bet", CALL);
      return [choice(action === "Call" ? CALL : FOLD, 1)];
    }
    const steal = sit.position === "BB" && (hu || ["BTN", "CO", "SB"].includes(sit.raiserPosition ?? ""));
    if (top <= (hu ? P.threeBetHU : P.threeBet)) return mix(sit, 1, threeBetTo, "3bet", CALL);
    const callShare = steal ? P.bbCall : blinds ? P.callOOP : P.callIP;
    return [choice(top <= callShare ? CALL : FOLD, 1)];
  }

  if (sit.raises === 2) {
    if (top <= P.fourBet) return mix(sit, 1, sit.currentBet * 2.3, "4bet", CALL);
    return [choice(top <= P.callThreeBet ? CALL : FOLD, 1)];
  }

  // Facing a 4-bet or more: get it in or fold.
  if (top <= P.callFourBet) return sit.canRaise ? [choice(sized(sit, "raise", sit.maxTo, "jam"), 1)] : [choice(CALL, 1)];
  return [choice(FOLD, 1)];
}

function postflopPolicy(style: BotStyle, sit: Situation, hole: Card[]): BotChoice[] {
  const P = POSTFLOP[style];
  const street = sit.street as Exclude<TableStreet, "preflop">;
  const hs = handStrength(hole, sit.board);
  const draw = drawOf(hole, sit.board);
  const crowd = Math.max(1, sit.opponents);
  const betTo = sit.ownBet + sit.pot * P.size;

  if (sit.toCall === 0) {
    if (hs >= P.value[street]) return mix(sit, P.valueFreq, betTo, "value", CHECK);
    if (draw) return mix(sit, P.semiBluff / crowd, betTo, "value", CHECK);
    if (hs >= P.thin[street]) return mix(sit, P.thinFreq, betTo, "value", CHECK);
    if (hs < P.air[street]) {
      const bluff = (sit.aggressor ? P.barrel[street] : P.stab) / crowd;
      return mix(sit, bluff, betTo, "value", CHECK);
    }
    return [choice(CHECK, 1)];
  }

  // Facing a bet: price is the share of the final pot we'd put in.
  const price = sit.toCall / (sit.pot + sit.toCall);
  const raiseTo = sit.currentBet * 3 + sit.callers * sit.currentBet;
  if (hs >= P.raise[street]) return mix(sit, P.raiseFreq, raiseTo, "raise", CALL);
  if (hs >= P.callBase[street] + P.callSlope * price) return [choice(CALL, 1)];
  if (draw && price <= P.drawPrice) return mix(sit, P.semiRaise / crowd, raiseTo, "raise", CALL);
  if (hs < P.air[street] && P.bluffRaise > 0) return mix(sit, P.bluffRaise / crowd, raiseTo, "raise", FOLD);
  return [choice(giveUp(sit), 1)];
}

/** Every action the bot might take here, with its probability. */
export function botPolicy(style: BotStyle, sit: Situation, hole: Card[]): BotChoice[] {
  return normalize(sit.street === "preflop" ? preflopPolicy(style, sit, hole) : postflopPolicy(style, sit, hole));
}

/** Pick an action from the policy. */
export function chooseBotAction(style: BotStyle, sit: Situation, hole: Card[], random: () => number = Math.random): BotChoice {
  const choices = botPolicy(style, sit, hole);
  let r = random();
  for (const c of choices) {
    r -= c.p;
    if (r <= 0) return c;
  }
  return choices[choices.length - 1];
}

