import { botPolicy, STYLE_INFO } from "./bots";
import { type Card, cardCode, fullDeck } from "./cards";
import { score7 } from "./evaluator";
import { classCombos, HAND_CLASSES } from "./preflop";
import type { ChoiceExercise } from "../course/types";
import { facingAction, handLabel, OPENING_SETS, type Position, POSITIONS, rangePercent } from "./ranges";
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
export type DecisionKind = "preflop" | "call" | "fold" | "raise" | "bet" | "check";

export interface DecisionCheck {
  street: TableStreet;
  /** Index of the hero's action in the hand log. */
  index: number;
  title: string;
  verdict: Verdict;
  detail: string;
  kind: DecisionKind;
  /** Styles of the opponents still in the hand; empty for preflop chart checks. */
  styles: BotStyle[];
  /** For mistakes: the spot as a review question. */
  exercise?: ChoiceExercise;
}

const pct = (x: number) => `${Math.round(x * 100)}%`;
const STREET_NAME: Record<TableStreet, string> = { preflop: "Preflop", flop: "Flop", turn: "Turn", river: "River" };
const codes = (cards: Card[]) => cards.map(cardCode).join(" ");
const FROM_TABLE = "From your practice table.";
const POSITION_NAME: Record<string, string> = {
  ...Object.fromEntries(POSITIONS.map((p) => [p.id, p.name])),
  BTN: "Button",
  BB: "Big Blind",
};

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
  const position = POSITION_NAME[sit.position] ?? sit.position;

  if (sit.raises === 0 && sit.limpers === 0 && sit.toCall > 0) {
    const chart = OPENING_SETS[sit.position as Position];
    if (!chart) return null;
    const open = chart.has(label);
    const good = open ? a.kind === "raise" : a.kind === "fold";
    const range = `the ${sit.position} opening range (${Math.round(rangePercent(chart) * 100)}% of hands)`;
    const detail =
      a.kind === "call"
        ? `Limping gives up the initiative. ${label} is ${open ? "in" : "outside"} ${range}: ${open ? "raise" : "fold"} it.`
        : `${label} is ${open ? "in" : "outside"} ${range}, so the chart ${open ? "raises" : "folds"}.`;
    return {
      street: "preflop",
      index,
      title,
      verdict: good ? "good" : "mistake",
      detail,
      kind: "preflop",
      styles: [],
      exercise: good
        ? undefined
        : {
            type: "choice",
            prompt: "Everyone folds to you. Open-raise or fold?",
            hand: codes(hole),
            info: [
              { label: "Position", value: position },
              { label: "Table", value: "6-max, 100 BB" },
            ],
            options: ["Fold", "Raise"],
            answer: open ? 1 : 0,
            explanation: `${FROM_TABLE} ${detail}`,
          },
    };
  }

  if (sit.raises === 1 && sit.callers === 0) {
    const spot = FACING_CHART[`${sit.position}<${sit.raiserPosition}`];
    if (!spot) return null;
    const chart = facingAction(spot, label);
    const mine = a.kind === "raise" ? "3-bet" : a.kind === "call" ? "Call" : "Fold";
    const good = mine === chart;
    const detail = `Facing a ${sit.raiserPosition} open from the ${sit.position}, the chart says ${chart.toLowerCase()} with ${label}.`;
    const options = ["Fold", "Call", "3-bet"];
    return {
      street: "preflop",
      index,
      title,
      verdict: good ? "good" : "mistake",
      detail,
      kind: "preflop",
      styles: [],
      exercise: good
        ? undefined
        : {
            type: "choice",
            prompt: `${POSITION_NAME[sit.raiserPosition!] ?? sit.raiserPosition} raises. Your move?`,
            hand: codes(hole),
            info: [
              { label: "Position", value: position },
              { label: "Action", value: `${sit.raiserPosition} raised to ${formatBB(sit.currentBet)}` },
            ],
            options,
            answer: options.indexOf(chart),
            explanation: `${FROM_TABLE} ${detail}`,
          },
    };
  }
  return null;
}

const liveOpponents = (state: HandState, hero: number, index: number) =>
  state.seats.flatMap((_, i) =>
    i !== hero && !state.log.slice(0, index).some((a) => a.seat === i && a.kind === "fold") ? [i] : [],
  );

const styleOf = (state: HandState, seat: number) => state.seats[seat].style!;

/** "the Maniac's range" heads-up, "your opponents' ranges" multiway. */
function rangesOf(state: HandState, seats: number[]): string {
  if (seats.length !== 1) return "your opponents' ranges";
  return `the ${STYLE_INFO[styleOf(state, seats[0])].name}'s range`;
}

const styleName = (state: HandState, seat: number) => `the ${STYLE_INFO[styleOf(state, seat)].name}`;
const styleList = (state: HandState, seats: number[]) => seats.map((i) => STYLE_INFO[styleOf(state, i)].name).join(", ");

/** Calls and folds against a bet: equity against the bettors' ranges versus the price. */
function facingBetCheck(state: HandState, hero: number, a: ActionRecord, index: number, random: Random): DecisionCheck {
  const sit = a.situation;
  const opponents = liveOpponents(state, hero, index);
  const holeCards = state.seats[hero].hole;
  const dead = [...holeCards, ...sit.board];
  const ranges = opponents.map((i) => inferRange(styleOf(state, i), i, state.log.slice(0, index), dead));
  const title = `${STREET_NAME[sit.street]}: you ${describe(a)}`;
  const kind: DecisionKind = a.kind === "raise" ? "raise" : a.kind === "call" ? "call" : "fold";
  const styles = opponents.map((i) => styleOf(state, i));
  if (ranges.some((r) => r.length === 0)) {
    return { street: sit.street, index, title, verdict: "info", detail: "This line couldn't be matched to a range.", kind, styles };
  }
  const equity = equityVsRanges(holeCards, sit.board, ranges, random);
  const need = sit.toCall / (sit.pot + sit.toCall);
  const margin = equity - need;
  const band = sit.street === "river" ? 0.03 : 0.05;
  const facts = `Calling ${formatBB(sit.toCall)} into ${formatBB(sit.pot)} needed ${pct(need)}. Against ${rangesOf(state, opponents)} for this line you had about ${pct(equity)}.`;
  const later = sit.street === "river" ? "" : " Later bets can change this, so treat close spots as close.";

  if (a.kind === "raise") return { street: sit.street, index, title, verdict: "info", detail: `${facts}${later}`, kind, styles };
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
  return {
    street: sit.street,
    index,
    title,
    verdict,
    detail: `${facts} ${advice}${later}`,
    kind,
    styles,
    exercise:
      verdict !== "mistake"
        ? undefined
        : {
            type: "choice",
            prompt: `${STREET_NAME[sit.street]}. ${opponents.length === 1 ? `${capitalize(styleName(state, opponents[0]))} bets` : "You face a bet"}. Call or fold?`,
            hand: codes(holeCards),
            board: codes(sit.board),
            info: [
              { label: "Against", value: styleList(state, opponents) },
              { label: "Pot", value: formatBB(sit.pot) },
              { label: "To call", value: formatBB(sit.toCall) },
            ],
            options: ["Fold", "Call"],
            answer: margin > 0 ? 1 : 0,
            explanation: `${FROM_TABLE} ${facts} ${margin > 0 ? "Call." : "Fold."}${later}`,
          },
  };
}

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/** The villain's view after hero bets `bet`: built from its own last situation on this street. */
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
  /** Hero's share of the pot against the hands that call. */
  winWhenCalled: number;
}

/**
 * Expected result of betting `bet` into `pot`, from the villain's responses under its policy.
 * On the river showdowns are exact; earlier, equity with cards to come stands in for the
 * rest of the hand. Against a raise, hero continues only when that beats folding.
 */
function betOutcome(
  style: BotStyle,
  villainSit: Situation,
  range: WeightedCombo[],
  hero: Card[],
  board: Card[],
  pot: number,
  bet: number,
  random: Random,
): BetOutcome {
  const sit = facingHeroBet(villainSit, bet);
  const finalPot = pot + bet + Math.min(bet, villainSit.stack);
  const calls: WeightedCombo[] = [];
  const raises: WeightedCombo[] = [];
  let [total, fold, call, raise] = [0, 0, 0, 0];
  for (const { combo, weight } of range) {
    const choices = botPolicy(style, sit, combo);
    const pf = choices.filter((c) => c.action.kind === "fold").reduce((sum, c) => sum + c.p, 0);
    const pr = choices.filter((c) => c.action.kind === "raise").reduce((sum, c) => sum + c.p, 0);
    const pc = Math.max(0, 1 - pf - pr);
    total += weight;
    fold += weight * pf;
    call += weight * pc;
    raise += weight * pr;
    if (pc > 0) calls.push({ combo, weight: weight * pc });
    if (pr > 0) raises.push({ combo, weight: weight * pr });
  }
  const share = (r: WeightedCombo[]) => (r.length === 0 ? 0 : equityVsRanges(hero, board, [r], random, board.length === 5 ? 1 : 2500));
  const [F, C, R] = [fold / total, call / total, raise / total];
  const eqCall = C > 0.005 ? share(calls) : 0;
  const eqRaise = R > 0.005 ? share(raises) : 0;
  const ev = F * pot + C * (eqCall * finalPot - bet) + R * Math.max(-bet, eqRaise * finalPot - bet);
  return { ev, fold: F, call: C, raise: R, winWhenCalled: eqCall };
}

/**
 * Bet or check when hero is last to act heads-up and villain checked: compare the EV of
 * betting with checking. Exact on the river; a one-street estimate on the flop and turn.
 */
function betOrCheckReview(state: HandState, hero: number, a: ActionRecord, index: number, random: Random): DecisionCheck | null {
  const sit = a.situation;
  if (sit.street === "preflop" || sit.toCall > 0 || !sit.lastToAct) return null;
  const opponents = liveOpponents(state, hero, index);
  if (opponents.length !== 1) return null;
  const villain = opponents[0];
  const villainCheck = [...state.log.slice(0, index)].reverse().find((x) => x.seat === villain && x.street === sit.street);
  if (!villainCheck || villainCheck.kind !== "check") return null;

  const style = styleOf(state, villain);
  const holeCards = state.seats[hero].hole;
  const range = inferRange(style, villain, state.log.slice(0, index), [...holeCards, ...sit.board]);
  if (range.length === 0) return null;
  const river = sit.street === "river";
  const checkShare = equityVsRanges(holeCards, sit.board, [range], random, river ? 1 : 3000);
  const checkEV = checkShare * sit.pot;
  const who = styleName(state, villain);
  const street = STREET_NAME[sit.street];
  const title = `${street}: you ${describe(a)}`;
  const kind: DecisionKind = a.kind === "check" ? "check" : "bet";
  const styles = [style];
  const estimate = river ? "" : " This street only: later bets are ignored.";
  const describeBet = (b: number, o: BetOutcome) =>
    `A ${formatBB(b)} bet: ${who} folds ${pct(o.fold)}, calls ${pct(o.call)}${o.raise > 0.01 ? `, raises ${pct(o.raise)}` : ""}; ` +
    `${river ? `you win ${pct(o.winWhenCalled)} of the calls` : `against the calls you have ${pct(o.winWhenCalled)} equity`}. ` +
    `Betting earns about ${formatBB(Math.round(o.ev))} on average, against ${formatBB(Math.round(checkEV))} for checking.${estimate}`;
  // Earlier streets are estimates, so they need a bigger difference before calling a mistake.
  const small = Math.max(10, sit.pot * (river ? 0.05 : 0.1));
  const large = Math.max(river ? 10 : 15, sit.pot * (river ? 0.1 : 0.15));
  // Below this, a check that gives up a little is still fine.
  const tiny = Math.max(3, sit.pot * 0.03);
  const spot = (betSize: number, betBetter: boolean, detail: string): ChoiceExercise => ({
    type: "choice",
    prompt: `${street}. ${capitalize(who)} checks to you. Check or bet?`,
    hand: codes(holeCards),
    board: codes(sit.board),
    info: [
      { label: "Against", value: STYLE_INFO[style].name },
      { label: "Pot", value: formatBB(sit.pot) },
    ],
    options: ["Check", `Bet ${formatBB(betSize)}`],
    answer: betBetter ? 1 : 0,
    explanation: `${FROM_TABLE} ${detail}`,
  });

  if (a.kind === "bet" || a.kind === "raise") {
    const o = betOutcome(style, villainCheck.situation, range, holeCards, sit.board, sit.pot, a.to, random);
    const gain = o.ev - checkEV;
    const verdict: Verdict = gain >= 0 ? "good" : gain > -small ? "close" : gain <= -large ? "mistake" : "close";
    const detail = describeBet(a.to, o);
    return { street: sit.street, index, title, verdict, detail, kind, styles, exercise: verdict === "mistake" ? spot(a.to, false, detail) : undefined };
  }

  // Hero checked: compare with a smaller and a larger bet.
  const fractions = river ? [0.5, 1] : [1 / 3, 2 / 3];
  const sizes = fractions.map((f) => Math.round((sit.pot * f) / 5) * 5).filter((b) => b >= 10 && b <= sit.maxTo);
  const options = sizes.map((b) => ({ b, o: betOutcome(style, villainCheck.situation, range, holeCards, sit.board, sit.pot, b, random) }));
  const best = options.reduce((x, y) => (y.o.ev > x.o.ev ? y : x), options[0]);
  if (!best) return null;
  const gain = best.o.ev - checkEV;
  if (gain < tiny) {
    const why = river ? `you win ${pct(checkShare)} at showdown` : `you have ${pct(checkShare)} equity`;
    const verdictText = gain > 0 ? `Checking was fine: ${why}, and betting earns only a little more.` : `Checking was right: ${why}, and betting didn't earn more.`;
    return { street: sit.street, index, title, verdict: "good", detail: `${verdictText} ${describeBet(best.b, best.o)}`, kind, styles };
  }
  const verdict: Verdict = gain >= large ? "mistake" : "close";
  const detail = `Betting would have earned more. ${describeBet(best.b, best.o)}`;
  return { street: sit.street, index, title, verdict, detail, kind, styles, exercise: verdict === "mistake" ? spot(best.b, true, detail) : undefined };
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
    const betCheck = betOrCheckReview(state, hero, a, index, random);
    if (betCheck) checks.push(betCheck);
  });
  return checks;
}
