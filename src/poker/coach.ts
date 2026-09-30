import { botPolicy, STYLE_INFO } from "./bots";
import { type Card, cardCode, fullDeck } from "./cards";
import { score7 } from "./evaluator";
import { classCombos, HAND_CLASSES } from "./preflop";
import { facingAction, handLabel, OPENING_SETS, type Position, rangePercent } from "./ranges";
import { type ActionRecord, type BotStyle, formatBB, type HandState, type Situation, type TableStreet } from "./table";

type Random = () => number;

export interface WeightedCombo {
  combo: Card[];
  weight: number;
}

let allCombos: Card[][] | null = null;
const everyCombo = () => (allCombos ??= HAND_CLASSES.flatMap(classCombos));

/**
 * The hands a bot could hold after the actions it took in `log`, each weighted by how
 * likely its policy was to act exactly that way with that hand. `dead` are cards it
 * can't hold (the board and the viewer's own cards).
 */
export function inferRange(style: BotStyle, seat: number, log: ActionRecord[], dead: Card[]): WeightedCombo[] {
  const blocked = new Set(dead.map(cardCode));
  const actions = log.filter((a) => a.seat === seat);
  const out: WeightedCombo[] = [];
  for (const combo of everyCombo()) {
    if (blocked.has(cardCode(combo[0])) || blocked.has(cardCode(combo[1]))) continue;
    let weight = 1;
    for (const a of actions) {
      weight *= botPolicy(style, a.situation, combo).find((c) => c.label === a.label)?.p ?? 0;
      if (weight === 0) break;
    }
    if (weight > 0) out.push({ combo, weight });
  }
  return out;
}

/** Share of all starting hands a range covers, counting partial weights. */
export function rangeShare(range: WeightedCombo[]): number {
  return range.reduce((sum, r) => sum + r.weight, 0) / 1326;
}

function sampler(range: WeightedCombo[]) {
  const cumulative: number[] = [];
  let total = 0;
  for (const r of range) cumulative.push((total += r.weight));
  return (random: Random) => {
    const x = random() * total;
    let lo = 0;
    let hi = cumulative.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (cumulative[mid] > x) hi = mid;
      else lo = mid + 1;
    }
    return range[lo].combo;
  };
}

/** Hero's share of the pot at showdown against one hand on a complete board. */
const showdownShare = (hero: Card[], villain: Card[], board: Card[]) => {
  const diff = score7([...hero, ...board]) - score7([...villain, ...board]);
  return diff > 0 ? 1 : diff === 0 ? 0.5 : 0;
};

/**
 * Hero's equity against one or more weighted ranges, with the rest of the board dealt out.
 * Exact heads-up on the turn and river; otherwise sampled `samples` times.
 */
export function equityVsRanges(hero: Card[], board: Card[], ranges: WeightedCombo[][], random: Random = Math.random, samples = 4000): number {
  const used = new Set([...hero, ...board].map(cardCode));
  const deck = fullDeck().filter((c) => !used.has(cardCode(c)));

  if (ranges.length === 1 && board.length >= 4) {
    let won = 0;
    let total = 0;
    for (const { combo, weight } of ranges[0]) {
      const blocked = new Set(combo.map(cardCode));
      const rivers = board.length === 5 ? [null] : deck.filter((c) => !blocked.has(cardCode(c)));
      for (const river of rivers) {
        won += (weight / rivers.length) * showdownShare(hero, combo, river ? [...board, river] : board);
      }
      total += weight;
    }
    return won / total;
  }

  const draw = ranges.map(sampler);
  let share = 0;
  let counted = 0;
  for (let n = 0, guard = 0; n < samples && guard < samples * 50; guard++) {
    const combos = draw.map((d) => d(random));
    const taken = new Set(combos.flat().map(cardCode));
    if (taken.size < combos.length * 2) continue;
    const full = [...board];
    while (full.length < 5) {
      const c = deck[Math.floor(random() * deck.length)];
      if (taken.has(cardCode(c))) continue;
      taken.add(cardCode(c));
      full.push(c);
    }
    const heroScore = score7([...hero, ...full]);
    const scores = combos.map((c) => score7([...c, ...full]));
    const best = Math.max(heroScore, ...scores);
    if (heroScore === best) share += 1 / (1 + scores.filter((s) => s === best).length);
    counted++;
    n++;
  }
  return share / counted;
}

export type Verdict = "good" | "close" | "mistake" | "info";

export interface DecisionCheck {
  street: TableStreet;
  /** Index of the hero's action in the hand log. */
  index: number;
  title: string;
  verdict: Verdict;
  detail: string;
}

const pct = (x: number) => `${Math.round(x * 100)}%`;
const STREET_NAME: Record<TableStreet, string> = { preflop: "Preflop", flop: "Flop", turn: "Turn", river: "River" };

const FACING_CHART: Record<string, string> = {
  "BTN<UTG": "btn-vs-utg",
  "BTN<CO": "btn-vs-co",
  "BB<BTN": "bb-vs-btn",
  "SB<BTN": "sb-vs-btn",
};

function describe(a: ActionRecord): string {
  switch (a.kind) {
    case "fold":
      return "folded";
    case "check":
      return "checked";
    case "call":
      return `called ${formatBB(a.amount)}`;
    case "bet":
      return `bet ${formatBB(a.to)}`;
    case "raise":
      return `raised to ${formatBB(a.to)}`;
  }
}

/** Preflop decisions against the 6-max charts, where a chart covers the spot. */
function preflopCheck(a: ActionRecord, hole: Card[], index: number): DecisionCheck | null {
  const sit = a.situation;
  if (sit.players !== 6 || sit.street !== "preflop") return null;
  const label = handLabel(hole[0], hole[1]);
  const title = `Preflop: you ${describe(a)} with ${label}`;

  if (sit.raises === 0 && sit.limpers === 0 && sit.toCall > 0) {
    const chart = OPENING_SETS[sit.position as Position];
    if (!chart) return null;
    const open = chart.has(label);
    const good = open ? a.kind === "raise" : a.kind === "fold";
    const range = `the ${sit.position} opening range (${Math.round(rangePercent(chart) * 100)}% of hands)`;
    return {
      street: "preflop",
      index,
      title,
      verdict: good ? "good" : "mistake",
      detail:
        a.kind === "call"
          ? `Limping gives up the initiative. ${label} is ${open ? "in" : "outside"} ${range}: ${open ? "raise" : "fold"} it.`
          : `${label} is ${open ? "in" : "outside"} ${range}, so the chart ${open ? "raises" : "folds"}.`,
    };
  }

  if (sit.raises === 1 && sit.callers === 0) {
    const spot = FACING_CHART[`${sit.position}<${sit.raiserPosition}`];
    if (!spot) return null;
    const chart = facingAction(spot, label);
    const mine = a.kind === "raise" ? "3-bet" : a.kind === "call" ? "Call" : "Fold";
    return {
      street: "preflop",
      index,
      title,
      verdict: mine === chart ? "good" : "mistake",
      detail: `Facing a ${sit.raiserPosition} open from the ${sit.position}, the chart says ${chart.toLowerCase()} with ${label}.`,
    };
  }
  return null;
}

const liveOpponents = (state: HandState, hero: number, index: number) =>
  state.seats.flatMap((_, i) =>
    i !== hero && !state.log.slice(0, index).some((a) => a.seat === i && a.kind === "fold") ? [i] : [],
  );

/** "the Maniac's range" heads-up, "your opponents' ranges" multiway. */
function rangesOf(state: HandState, seats: number[]): string {
  if (seats.length !== 1) return "your opponents' ranges";
  return `the ${STYLE_INFO[state.seats[seats[0]].style!].name}'s range`;
}

/** "the Maniac" for describing reactions. */
const styleName = (state: HandState, seat: number) => `the ${STYLE_INFO[state.seats[seat].style!].name}`;

/** Calls and folds against a bet: equity against the bettors' ranges versus the price. */
function facingBetCheck(state: HandState, hero: number, a: ActionRecord, index: number, random: Random): DecisionCheck {
  const sit = a.situation;
  const opponents = liveOpponents(state, hero, index);
  const dead = [...state.seats[hero].hole, ...sit.board];
  const ranges = opponents.map((i) => inferRange(state.seats[i].style!, i, state.log.slice(0, index), dead));
  const title = `${STREET_NAME[sit.street]}: you ${describe(a)}`;
  if (ranges.some((r) => r.length === 0)) {
    return { street: sit.street, index, title, verdict: "info", detail: "This line couldn't be matched to a range." };
  }
  const equity = equityVsRanges(state.seats[hero].hole, sit.board, ranges, random);
  const need = sit.toCall / (sit.pot + sit.toCall);
  const margin = equity - need;
  const band = sit.street === "river" ? 0.03 : 0.05;
  const facts = `Calling ${formatBB(sit.toCall)} into ${formatBB(sit.pot)} needed ${pct(need)}. Against ${rangesOf(state, opponents)} for this line you had about ${pct(equity)}.`;
  const later = sit.street === "river" ? "" : " Later bets can change this, so treat close spots as close.";

  if (a.kind === "raise") return { street: sit.street, index, title, verdict: "info", detail: `${facts}${later}` };
  const verdict: Verdict = Math.abs(margin) < band ? "close" : (margin > 0) === (a.kind === "call") ? "good" : "mistake";
  const advice =
    verdict === "close"
      ? "Either play is reasonable."
      : margin > 0
        ? verdict === "good"
          ? "Calling was right."
          : "You had the price to call."
        : verdict === "good"
          ? "Folding was right."
          : "This call loses money over time.";
  return { street: sit.street, index, title, verdict, detail: `${facts} ${advice}${later}` };
}

/** The villain's view after hero bets `bet` on the river: built from its own last river situation. */
function facingHeroBet(villainSit: Situation, bet: number): Situation {
  const toCall = Math.min(bet, villainSit.stack);
  return {
    ...villainSit,
    pot: villainSit.pot + bet,
    toCall,
    currentBet: bet,
    ownBet: 0,
    raises: 1,
    callers: 0,
    canBet: false,
    canRaise: villainSit.stack > bet,
    minTo: Math.min(2 * bet, villainSit.stack),
    maxTo: villainSit.stack,
    lastToAct: true,
  };
}

interface BetOutcome {
  ev: number;
  fold: number;
  call: number;
  raise: number;
  /** Hero's showdown share when called. */
  winWhenCalled: number;
}

function betOutcome(style: BotStyle, villainSit: Situation, range: WeightedCombo[], hero: Card[], board: Card[], pot: number, bet: number): BetOutcome {
  const sit = facingHeroBet(villainSit, bet);
  const called = Math.min(bet, villainSit.stack);
  let [total, ev, fold, call, raise, won] = [0, 0, 0, 0, 0, 0];
  for (const { combo, weight } of range) {
    const choices = botPolicy(style, sit, combo);
    const pf = choices.filter((c) => c.action.kind === "fold").reduce((s, c) => s + c.p, 0);
    const pr = choices.filter((c) => c.action.kind === "raise").reduce((s, c) => s + c.p, 0);
    const pc = 1 - pf - pr;
    const share = showdownShare(hero, combo, board);
    // Folds win the pot; calls go to showdown; against a raise, assume hero folds.
    ev += weight * (pf * pot + pc * (share * (pot + bet + called) - bet) - pr * bet);
    total += weight;
    fold += weight * pf;
    call += weight * pc;
    raise += weight * pr;
    won += weight * pc * share;
  }
  return { ev: ev / total, fold: fold / total, call: call / total, raise: raise / total, winWhenCalled: call > 0 ? won / call : 0 };
}

/** Heads-up river decisions when hero is last to act and villain checked: bet or check, by EV. */
function riverBetCheck(state: HandState, hero: number, a: ActionRecord, index: number): DecisionCheck | null {
  const sit = a.situation;
  const opponents = liveOpponents(state, hero, index);
  if (sit.street !== "river" || sit.toCall > 0 || !sit.lastToAct || opponents.length !== 1) return null;
  const villain = opponents[0];
  const villainCheck = [...state.log.slice(0, index)].reverse().find((x) => x.seat === villain && x.street === "river");
  if (!villainCheck || villainCheck.kind !== "check") return null;

  const style = state.seats[villain].style!;
  const holeCards = state.seats[hero].hole;
  const range = inferRange(style, villain, state.log.slice(0, index), [...holeCards, ...sit.board]);
  if (range.length === 0) return null;
  const total = range.reduce((s, r) => s + r.weight, 0);
  const showdown = range.reduce((s, r) => s + r.weight * showdownShare(holeCards, r.combo, sit.board), 0) / total;
  const checkEV = showdown * sit.pot;
  const who = styleName(state, villain);
  const title = `River: you ${describe(a)}`;
  const describeBet = (b: number, o: BetOutcome) =>
    `A ${formatBB(b)} bet: ${who} folds ${pct(o.fold)}, calls ${pct(o.call)}${o.raise > 0.01 ? `, raises ${pct(o.raise)}` : ""}; you win ${pct(o.winWhenCalled)} of the calls. On average that earns ${formatBB(Math.round(o.ev))}, against ${formatBB(Math.round(checkEV))} for checking.`;
  // Small differences are close calls; a mistake costs at least a tenth of the pot.
  const small = Math.max(10, sit.pot * 0.05);
  const large = Math.max(10, sit.pot * 0.1);

  if (a.kind === "bet" || a.kind === "raise") {
    const o = betOutcome(style, villainCheck.situation, range, holeCards, sit.board, sit.pot, a.to);
    const gain = o.ev - checkEV;
    const verdict: Verdict = gain >= 0 ? "good" : gain > -small ? "close" : gain <= -large ? "mistake" : "close";
    return { street: "river", index, title, verdict, detail: describeBet(a.to, o) };
  }

  // Hero checked: compare with a half-pot and a pot-size bet.
  const sizes = [Math.round(sit.pot / 2 / 5) * 5, Math.round(sit.pot / 5) * 5].filter((b) => b >= 10 && b <= sit.maxTo);
  const options = sizes.map((b) => ({ b, o: betOutcome(style, villainCheck.situation, range, holeCards, sit.board, sit.pot, b) }));
  const best = options.reduce((x, y) => (y.o.ev > x.o.ev ? y : x), options[0]);
  if (!best) return null;
  const gain = best.o.ev - checkEV;
  if (gain < small) {
    return {
      street: "river",
      index,
      title,
      verdict: "good",
      detail: `Checking was right: you win ${pct(showdown)} at showdown, and betting didn't earn more. ${describeBet(best.b, best.o)}`,
    };
  }
  return {
    street: "river",
    index,
    title,
    verdict: gain >= large ? "mistake" : "close",
    detail: `Betting would have earned more. ${describeBet(best.b, best.o)}`,
  };
}

/** Coach's review of the hero's decisions in a finished hand. */
export function reviewHand(state: HandState, hero: number, random: Random = Math.random): DecisionCheck[] {
  const checks: DecisionCheck[] = [];
  state.log.forEach((a, index) => {
    if (a.seat !== hero) return;
    const pre = preflopCheck(a, state.seats[hero].hole, index);
    if (pre) return checks.push(pre);
    if (a.street === "preflop") return;
    if (a.situation.toCall > 0) return checks.push(facingBetCheck(state, hero, a, index, random));
    const river = riverBetCheck(state, hero, a, index);
    if (river) checks.push(river);
  });
  return checks;
}
