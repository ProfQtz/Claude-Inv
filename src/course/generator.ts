import { Card, cardCode, fullDeck, parseCards, prettyCards, RANK_NAME, RANKS, rankValue, shuffle } from "../poker/cards";
import {
  CATEGORY_NAME,
  compareHands,
  describeHand,
  evaluate,
  HandCategory,
  type HandValue,
  score7,
} from "../poker/evaluator";
import { exactEquity } from "../poker/equity";
import { recommend, type Seat, solvePushFold } from "../poker/nash";
import {
  FACING_SETS,
  FACING_SPOTS,
  facingAction,
  handLabel,
  OPENING_RANGES,
  OPENING_SETS,
  type Position,
  POSITIONS,
  rangePercent,
} from "../poker/ranges";
import { formatPercent, hitProbability, potOdds, ruleOf2And4 } from "../poker/math";
import { rangeCombos, riverRange, topPairShare } from "../poker/rangeTools";
import { CANONICAL_FLOPS, FLOP_SPOTS, flopEquities } from "../poker/flopEdge";
import { randomSuits } from "../poker/flops";
import { COURSE, SECTIONS } from "./course";
import type { ChoiceExercise, CompareExercise, Exercise, Skill } from "./types";

type Random = () => number;

const codes = (cards: Card[]) => cards.map(cardCode).join(" ");
const pretty = (cards: Card[]) => prettyCards(codes(cards));
const ALL_CATEGORIES = Object.values(HandCategory).filter((v): v is HandCategory => typeof v === "number");

/** Right category plus its neighbours on the ladder, so the choice is non-trivial. */
function categoryOptions(correct: HandCategory, random: Random) {
  const nearby = ALL_CATEGORIES.filter((c) => c !== correct)
    .sort((a, b) => Math.abs(a - correct) - Math.abs(b - correct))
    .slice(0, 3);
  const options = shuffle([correct, ...nearby], random);
  return { options: options.map((c) => CATEGORY_NAME[c]), answer: options.indexOf(correct) };
}

/** Random two-player showdown on a full board. */
export function randomCompare(random: Random = Math.random): CompareExercise {
  const deck = shuffle(fullDeck(), random);
  return {
    type: "compare",
    board: codes(deck.slice(0, 5)),
    hands: [codes(deck.slice(5, 7)), codes(deck.slice(7, 9))],
    skill: "showdown",
  };
}

/** Deal hole cards + board and ask for the made hand's category. */
export function randomHandName(random: Random = Math.random): ChoiceExercise {
  const deck = shuffle(fullDeck(), random);
  const hand = deck.slice(0, 2);
  const board = deck.slice(2, 7);
  const value = evaluate([...hand, ...board]);
  return {
    type: "choice",
    prompt: "What's your best hand?",
    hand: codes(hand),
    board: codes(board),
    ...categoryOptions(value.category, random),
    explanation: `Your best five: ${pretty(value.cards)}. That's ${describeHand(value)}.`,
    skill: "handName",
  };
}

const BET_FRACTIONS = [0.25, 0.33, 0.5, 0.75, 1, 1.5, 2];

/** Bet-sizing → required-equity drill. */
export function randomPotOdds(random: Random = Math.random): ChoiceExercise {
  const pot = 20 * (2 + Math.floor(random() * 14));
  const fraction = BET_FRACTIONS[Math.floor(random() * BET_FRACTIONS.length)];
  const bet = Math.round(pot * fraction);
  const correct = potOdds(pot + bet, bet);

  const distractors = new Set<string>();
  for (const d of [bet / pot, bet / (pot + bet), correct + 0.1, correct - 0.08, correct + 0.18]) {
    const label = formatPercent(Math.min(Math.max(d, 0.05), 0.95));
    if (label !== formatPercent(correct)) distractors.add(label);
  }
  for (let step = 0.05; distractors.size < 3; step += 0.05) {
    const label = formatPercent(Math.min(correct + step, 0.95));
    if (label !== formatPercent(correct)) distractors.add(label);
  }
  const options = shuffle([formatPercent(correct), ...[...distractors].slice(0, 3)], random);

  return {
    type: "choice",
    prompt: "Villain bets. What equity do you need to call?",
    info: [
      { label: "Pot before bet", value: `$${pot}` },
      { label: "Villain bets", value: `$${bet}` },
    ],
    options,
    answer: options.indexOf(formatPercent(correct)),
    explanation: `You call $${bet} to win a pot of $${pot + bet}: ${bet} ÷ ${pot + 2 * bet} = ${formatPercent(correct)}.`,
    skill: "potOdds",
  };
}

/** Unseen cards that lift the hand from below a straight to a straight or better. */
export function countOuts(hand: Card[], board: Card[]): Card[] {
  const seen = new Set([...hand, ...board].map(cardCode));
  return fullDeck().filter(
    (card) => !seen.has(cardCode(card)) && evaluate([...hand, ...board, card]).category >= HandCategory.Straight,
  );
}

/** Numeric options around the right answer, shown in ascending order. */
function numberOptions(correct: number, candidates: number[], min = 1): { options: string[]; answer: number } {
  const values = new Set([correct]);
  for (const c of candidates) if (c >= min && values.size < 4) values.add(c);
  for (let d = 1; values.size < 4; d++) values.add(correct + d);
  const sorted = [...values].sort((a, b) => a - b);
  return { options: sorted.map(String), answer: sorted.indexOf(correct) };
}

/** Flop with a draw: count the outs to a straight or better. */
export function randomOuts(random: Random = Math.random): ChoiceExercise {
  for (let attempt = 0; attempt < 5000; attempt++) {
    const deck = shuffle(fullDeck(), random);
    const hand = deck.slice(0, 2);
    const flop = deck.slice(2, 5);
    if (evaluate([...hand, ...flop]).category >= HandCategory.Straight) continue;
    const outs = countOuts(hand, flop);
    if (outs.length < 4 || outs.length > 15) continue;

    const byRank = RANKS.filter((r) => outs.some((c) => c.rank === r))
      .reverse()
      .map((r) => {
        const cards = outs.filter((c) => c.rank === r);
        return cards.length === 4 ? `any ${RANK_NAME[r]}` : pretty(cards);
      });
    const n = outs.length;
    const { options, answer } = numberOptions(n, shuffle([n - 1, n + 1, n - 4, n + 4, n + 2, n - 2], random));
    return {
      type: "choice",
      prompt: "How many outs do you have to make a straight or better?",
      hand: codes(hand),
      board: codes(flop),
      options,
      answer,
      explanation: `${n} outs: ${byRank.join(", ")}. With two cards to come that's about ${ruleOf2And4(n, 2)}% by the rule of 4 (exactly ${formatPercent(hitProbability(n, 2))}).`,
      skill: "outs",
    };
  }
  throw new Error("Could not deal a drawing hand");
}

/** The best possible hand on a board, and one pair of hole cards that makes it. */
export function findNuts(board: Card[]): { value: HandValue; hole: Card[] } {
  const seen = new Set(board.map(cardCode));
  const deck = fullDeck().filter((c) => !seen.has(cardCode(c)));
  let bestScore = -1;
  let bestHole: Card[] = [];
  for (let i = 0; i < deck.length; i++) {
    for (let j = i + 1; j < deck.length; j++) {
      const hole = [deck[i], deck[j]];
      const score = score7([...hole, ...board]);
      if (score > bestScore) [bestScore, bestHole] = [score, hole];
    }
  }
  return { value: evaluate([...bestHole, ...board]), hole: bestHole };
}

/** Full board: what's the best possible hand? */
export function randomNuts(random: Random = Math.random): ChoiceExercise {
  const board = shuffle(fullDeck(), random).slice(0, 5);
  const nuts = findNuts(board);
  return {
    type: "choice",
    prompt: "What's the nuts on this river?",
    board: codes(board),
    ...categoryOptions(nuts.value.category, random),
    explanation: `The best possible hand is ${describeHand(nuts.value)}, for example with ${pretty(nuts.hole)}.`,
    skill: "nuts",
  };
}

/** Pick a random element. */
const pick = <T,>(items: readonly T[], random: Random): T => items[Math.floor(random() * items.length)];

/** Folded to you: open-raise or fold, graded against the simplified opening chart. */
export function randomPreflop(random: Random = Math.random): ChoiceExercise {
  const position: Position = pick(POSITIONS, random).id;
  const range = OPENING_SETS[position];
  // Half the time deal a hand from the range so raises and folds come up about equally.
  let hand: Card[];
  let label: string;
  const wantOpen = random() < 0.5;
  do {
    hand = shuffle(fullDeck(), random).slice(0, 2);
    label = handLabel(hand[0], hand[1]);
  } while (wantOpen && !range.has(label));
  const open = range.has(label);
  const name = POSITIONS.find((p) => p.id === position)!.name;
  const pct = Math.round(rangePercent(range) * 100);
  return {
    type: "choice",
    prompt: "Everyone folds to you. Open-raise or fold?",
    hand: codes(hand),
    info: [
      { label: "Position", value: name },
      { label: "Stacks", value: "100 BB" },
    ],
    options: ["Fold", "Raise"],
    answer: open ? 1 : 0,
    explanation: `${label} is ${open ? "in" : "outside"} the ${name} opening range, which plays about ${pct}% of hands: ${OPENING_RANGES[position]}.`,
    skill: "preflop",
  };
}

export const EQUITY_BUCKETS = [
  { label: "Under 25%", max: 0.25 },
  { label: "25–45%", max: 0.45 },
  { label: "45–55%", max: 0.55 },
  { label: "55–75%", max: 0.75 },
  { label: "Over 75%", max: 1.01 },
];
const bucketOf = (e: number) => EQUITY_BUCKETS.findIndex((b) => e < b.max);
/** Keep answers clear of bucket edges so rounding never decides the right answer. */
const nearEdge = (e: number) => EQUITY_BUCKETS.some((b) => Math.abs(e - b.max) < 0.025);

/** Hand vs hand on the flop: estimate hero's equity. */
export function randomEquity(random: Random = Math.random): ChoiceExercise {
  const target = Math.floor(random() * EQUITY_BUCKETS.length);
  let chosen: { hero: Card[]; villain: Card[]; flop: Card[]; equity: ReturnType<typeof exactEquity> } | null = null;
  for (let attempt = 0; attempt < 12; attempt++) {
    const deck = shuffle(fullDeck(), random);
    const [hero, villain, flop] = [deck.slice(0, 2), deck.slice(2, 4), deck.slice(4, 7)];
    const equity = exactEquity(hero, villain, flop);
    if (nearEdge(equity.equity)) continue;
    chosen = { hero, villain, flop, equity };
    if (bucketOf(equity.equity) === target) break;
  }
  if (!chosen) return randomEquity(random);
  const { hero, villain, flop, equity } = chosen;
  const heroNow = evaluate([...hero, ...flop]);
  const villainNow = evaluate([...villain, ...flop]);
  return {
    type: "choice",
    prompt: "All-in on the flop. What's your equity?",
    hand: codes(hero),
    board: codes(flop),
    villain: codes(villain),
    options: EQUITY_BUCKETS.map((b) => b.label),
    answer: bucketOf(equity.equity),
    explanation: `Exactly ${formatPercent(equity.equity)} over every turn and river (win ${formatPercent(equity.win)}, tie ${formatPercent(equity.tie)}). You have ${describeHand(heroNow)}; villain has ${describeHand(villainNow)}.`,
    skill: "equity",
  };
}

const CALL_BET_FRACTIONS = [0.33, 0.5, 0.75, 1, 1.5];

/** Turn decision with a draw: call or fold, graded by exact river equity against the price. */
export function randomCallFold(random: Random = Math.random): ChoiceExercise {
  for (let attempt = 0; attempt < 500; attempt++) {
    const deck = shuffle(fullDeck(), random);
    const [hero, villain, turn] = [deck.slice(0, 2), deck.slice(2, 4), deck.slice(4, 8)];
    // Hero must be behind right now, so the question is whether the draw is worth the price.
    if (score7([...hero, ...turn]) >= score7([...villain, ...turn])) continue;
    const eq = exactEquity(hero, villain, turn);
    if (eq.equity < 0.04 || eq.equity > 0.5) continue;

    const pot = 10 * (4 + Math.floor(random() * 16));
    const bet = Math.round(pot * pick(CALL_BET_FRACTIONS, random));
    const required = potOdds(pot + bet, bet);
    // Skip close spots: the lesson is the clear-cut math, not a coin flip.
    if (Math.abs(eq.equity - required) < 0.04) continue;

    const call = eq.equity > required;
    const rivers = 52 - 8;
    const wins = Math.round(eq.win * rivers);
    const ties = Math.round(eq.tie * rivers);
    return {
      type: "choice",
      prompt: "Turn. Villain bets with their cards face up. Call or fold?",
      hand: codes(hero),
      board: codes(turn),
      villain: codes(villain),
      info: [
        { label: "Pot before bet", value: `$${pot}` },
        { label: "Villain bets", value: `$${bet}` },
      ],
      options: ["Fold", "Call"],
      answer: call ? 1 : 0,
      explanation:
        `You win on ${wins} of ${rivers} rivers${ties ? ` and tie on ${ties}` : ""}: ${formatPercent(eq.equity)} equity. ` +
        `Calling $${bet} to win $${pot + bet} needs ${formatPercent(required)}. ` +
        (call ? "Call: the price is right." : "Fold: the price is too high."),
      skill: "callFold",
    };
  }
  throw new Error("Could not deal a call-or-fold spot");
}

/** Villain holdings matching a label ("KK", "AKs", "AKo", or "AK" for any suits) given the cards you can see. */
export function countCombos(label: string, visible: Card[]): number {
  const seen = new Set(visible.map(cardCode));
  const deck = fullDeck().filter((c) => !seen.has(cardCode(c)));
  let n = 0;
  for (let i = 0; i < deck.length; i++) {
    for (let j = i + 1; j < deck.length; j++) {
      const l = handLabel(deck[i], deck[j]);
      if (l === label || (label.length === 2 && label[0] !== label[1] && l.slice(0, 2) === label)) n++;
    }
  }
  return n;
}

const RANK_ORDER = (r: string) => RANKS.indexOf(r as (typeof RANKS)[number]);

/** Count villain's possible combinations of a hand, with your cards and the board as blockers. */
export function randomCombos(random: Random = Math.random): ChoiceExercise {
  const deck = shuffle(fullDeck(), random);
  const hand = deck.slice(0, 2);
  const flop = deck.slice(2, 5);
  const visible = [...hand, ...flop];
  // Most questions use ranks you can see, which is where blockers matter.
  const pickRank = () => (random() < 0.7 ? pick(visible, random).rank : pick(RANKS, random));
  const kind = pick(["pair", "any", "suited"] as const, random);

  let a = pickRank();
  let b = pickRank();
  while (kind !== "pair" && a === b) b = pick(RANKS, random);
  if (RANK_ORDER(a) < RANK_ORDER(b)) [a, b] = [b, a];
  const seenOf = (r: string) => visible.filter((c) => c.rank === r).length;
  const left = 4 - seenOf(a);

  const question = {
    pair: {
      label: a + a,
      unblocked: 6,
      prompt: `How many ways can villain hold pocket ${RANK_NAME[a]}s?`,
      why: `${seenOf(a)} of the four ${RANK_NAME[a]}s ${seenOf(a) === 1 ? "is" : "are"} visible, leaving ${left}. Pairs from ${left} cards: ${left} × ${Math.max(left - 1, 0)} ÷ 2.`,
    },
    any: {
      label: a + b,
      unblocked: 16,
      prompt: `How many ${a}${b} combinations (any suits) can villain hold?`,
      why: `${4 - seenOf(a)} ${RANK_NAME[a]}s × ${4 - seenOf(b)} ${RANK_NAME[b]}s left. With nothing visible it would be 16.`,
    },
    suited: {
      label: a + b + "s",
      unblocked: 4,
      prompt: `How many suited ${a}${b} combinations can villain hold?`,
      why: "Only suits where both cards are still unseen count. With nothing visible it would be 4.",
    },
  }[kind];

  const n = countCombos(question.label, visible);
  const { options, answer } = numberOptions(n, shuffle([question.unblocked, n + 1, n - 1, n + 2, n * 2, n + 4], random), 0);
  return {
    type: "choice",
    prompt: question.prompt,
    hand: codes(hand),
    board: codes(flop),
    options,
    answer,
    explanation: `${n} combinations. ${question.why}`,
    skill: "combos",
  };
}

/** Stacks the push/fold drill deals; the solver runs once per stack and is cached. */
export const PUSH_FOLD_STACKS = [3, 5, 7, 10, 12, 15, 20];

/**
 * Heads-up push/fold spot graded by the Nash solver. Only clear spots are dealt: the
 * equilibrium plays the hand purely and the EV gap to the other action is at least 0.05 BB.
 */
export function randomPushFold(random: Random = Math.random): ChoiceExercise {
  const stack = pick(PUSH_FOLD_STACKS, random);
  const seat: Seat = random() < 0.5 ? "SB" : "BB";
  const solution = solvePushFold(stack);
  for (let attempt = 0; attempt < 500; attempt++) {
    const hand = shuffle(fullDeck(), random).slice(0, 2);
    const rec = recommend(solution, handLabel(hand[0], hand[1]), seat);
    const pure = rec.frequency === 0 || rec.frequency === 1;
    if (!pure || Math.abs(rec.margin) < 0.05) continue;

    const go = rec.frequency === 1;
    const verb = seat === "SB" ? "Shove" : "Call";
    const edge = `${Math.abs(rec.margin).toFixed(2)} BB`;
    return {
      type: "choice",
      prompt:
        seat === "SB"
          ? `Heads-up with ${stack} BB. You're in the small blind. Shove or fold?`
          : `Heads-up with ${stack} BB. The small blind shoves. Call or fold?`,
      hand: codes(hand),
      info: [
        { label: "Seat", value: seat === "SB" ? "Small blind" : "Big blind" },
        { label: "Effective stack", value: `${stack} BB` },
      ],
      options: ["Fold", verb],
      answer: go ? 1 : 0,
      explanation:
        `At the Nash equilibrium for ${stack} BB, ${rec.hand} ${go ? (seat === "SB" ? "shoves" : "calls") : "folds"}: ` +
        `${go ? verb.toLowerCase() + "ing" : "folding"} is worth ${edge} more. ` +
        `The small blind shoves ${Math.round(solution.pushPercent * 100)}% of hands and the big blind calls ${Math.round(solution.callPercent * 100)}%.`,
      skill: "pushFold",
    };
  }
  throw new Error("Could not deal a clear push/fold spot");
}

const dollars = (v: number) => `${v < 0 ? "−" : "+"}$${Math.abs(v)}`;

/** Distinct percentage options (rounded) around a correct fraction, ascending. */
function percentOptions(correct: number, distractors: number[], random: Random) {
  const label = (x: number) => formatPercent(Math.min(Math.max(x, 0.01), 0.99));
  const values = new Map<string, number>([[label(correct), correct]]);
  for (const d of shuffle(distractors, random)) {
    if (values.size >= 4) break;
    if (!values.has(label(d))) values.set(label(d), d);
  }
  for (let step = 0.07; values.size < 4; step += 0.07) {
    const d = correct + (values.size % 2 ? step : -step);
    if (d > 0.02 && d < 0.98 && !values.has(label(d))) values.set(label(d), d);
  }
  const sorted = [...values.entries()].sort((a, b) => a[1] - b[1]).map(([l]) => l);
  return { options: sorted, answer: sorted.indexOf(label(correct)) };
}

const BET_MATH_POTS = [60, 80, 100, 120, 150, 200, 240, 300];
const BET_MATH_FRACTIONS = [0.25, 1 / 3, 0.5, 2 / 3, 0.75, 1, 1.5, 2];

/** Betting math with exact answers: MDF, bluff break-even, bluff share, EV of a call, implied odds. */
export function randomBetMath(random: Random = Math.random): ChoiceExercise {
  const kind = Math.floor(random() * 5);
  const pot = pick(BET_MATH_POTS, random);
  const bet = Math.round(pot * pick(BET_MATH_FRACTIONS, random));
  const potInfo = [
    { label: "Pot before bet", value: `$${pot}` },
    { label: kind === 1 || kind === 2 ? "Your bet" : "Villain bets", value: `$${bet}` },
  ];
  const mdf = pot / (pot + bet);
  const alpha = bet / (pot + bet);
  const bluffShare = bet / (pot + 2 * bet);

  if (kind === 0) {
    return {
      type: "choice",
      prompt: "Villain bets. What's your minimum defense frequency?",
      info: potInfo,
      ...percentOptions(mdf, [alpha, bluffShare, 1 - bluffShare], random),
      explanation: `MDF = pot ÷ (pot + bet) = ${pot} ÷ ${pot + bet} = ${formatPercent(mdf)}. Fold more often than that and any two cards can bluff you profitably.`,
      skill: "betMath",
    };
  }
  if (kind === 1) {
    return {
      type: "choice",
      prompt: "You bet as a pure bluff. How often must villain fold for it to break even?",
      info: potInfo,
      ...percentOptions(alpha, [mdf, bluffShare, bet / pot], random),
      explanation: `Folds needed = bet ÷ (pot + bet) = ${bet} ÷ ${pot + bet} = ${formatPercent(alpha)}.`,
      skill: "betMath",
    };
  }
  if (kind === 2) {
    return {
      type: "choice",
      prompt: "River bet. For a balanced range, what share of your bets can be bluffs?",
      info: potInfo,
      ...percentOptions(bluffShare, [alpha, mdf, bet / (2 * pot + 2 * bet)], random),
      explanation: `Bluff share = bet ÷ (pot + 2 × bet) = ${bet} ÷ ${pot + 2 * bet} = ${formatPercent(bluffShare)}. That equals the equity villain needs to call, so calling breaks even.`,
      skill: "betMath",
    };
  }

  // Calls: the pot includes villain's bet; equity in whole percents.
  const equity = pick([0.15, 0.2, 0.25, 0.3, 0.35, 0.4], random);
  const potWithBet = pot + bet;
  const callInfo = [
    { label: "Pot (incl. bet)", value: `$${potWithBet}` },
    { label: "To call", value: `$${bet}` },
    { label: "Your equity", value: formatPercent(equity) },
  ];
  if (kind === 3) {
    const ev = Math.round(equity * potWithBet - (1 - equity) * bet);
    const wrong = [
      Math.round(equity * potWithBet - bet), // forgets you only lose the call when you miss
      Math.round(equity * (potWithBet + bet)), // ignores the cost of calling
      -ev, // sign error
      Math.round(equity * pot - (1 - equity) * bet), // leaves villain's bet out of the pot
    ].filter((v) => v !== ev);
    const values = [...new Set([ev, ...shuffle(wrong, random)])].slice(0, 4);
    for (let d = 5; values.length < 4; d += 5) if (!values.includes(ev + d)) values.push(ev + d);
    const options = shuffle(values, random).map(dollars);
    return {
      type: "choice",
      prompt: "No more betting after this call. What's the EV of calling?",
      info: callInfo,
      options,
      answer: options.indexOf(dollars(ev)),
      explanation: `EV = equity × pot − (1 − equity) × call = ${equity} × $${potWithBet} − ${(1 - equity).toFixed(2)} × $${bet} = ${dollars(ev)}.${ev < 0 ? " Fold unless you expect to win more later." : ""}`,
      skill: "betMath",
    };
  }

  // Implied odds: extra winnings needed when you hit, so that equity × (pot + X) = (1 − equity) × call.
  const needed = Math.round(((1 - equity) * bet) / equity - potWithBet);
  if (needed <= 0) {
    const ev = Math.round(equity * potWithBet - (1 - equity) * bet);
    return {
      type: "choice",
      prompt: "Do you need implied odds to call here?",
      info: callInfo,
      options: ["No, the pot odds are enough", "Yes, you need to win more later"],
      answer: 0,
      explanation: `You need ${formatPercent(bet / (potWithBet + bet))} equity and have ${formatPercent(equity)}, so calling is already +EV (${dollars(ev)}) with no future winnings.`,
      skill: "betMath",
    };
  }
  const { options, answer } = numberOptions(
    needed,
    shuffle([Math.round(bet / equity - potWithBet), Math.round(((1 - equity) * bet) / equity), needed * 2, Math.round(needed / 2)], random),
  );
  return {
    type: "choice",
    prompt: "How much more must you win on later streets when you hit, to break even?",
    info: callInfo,
    options: options.map((o) => `$${o}`),
    answer,
    explanation: `Break even when ${equity} × ($${potWithBet} + X) = ${(1 - equity).toFixed(2)} × $${bet}, so X ≈ $${needed}. If villain will pay you that much when you hit, the call is fine.`,
    skill: "betMath",
  };
}

/** Facing an open raise: 3-bet, call or fold, graded by the simplified charts. */
export function randomVsOpen(random: Random = Math.random): ChoiceExercise {
  const spot = pick(FACING_SPOTS, random);
  const sets = FACING_SETS[spot.id];
  // Deal a third of hands from each answer so 3-bets and calls come up often enough.
  const roll = random();
  const target = roll < 0.35 ? sets.threeBet : roll < 0.7 && sets.call.size > 0 ? sets.call : null;
  let hand: Card[];
  let label: string;
  do {
    hand = shuffle(fullDeck(), random).slice(0, 2);
    label = handLabel(hand[0], hand[1]);
  } while (target && !target.has(label));

  const action = facingAction(spot.id, label);
  const detail =
    action === "3-bet"
      ? `3-bet range here: ${spot.threeBet}.`
      : action === "Call"
        ? `Calling range here: ${spot.call}.`
        : `It's outside both the 3-bet range (${spot.threeBet})${spot.call ? " and the calling range" : ""}.`;
  return {
    type: "choice",
    prompt: `${spot.action.replace(" to 2.5 BB", "")}. Your move?`,
    hand: codes(hand),
    info: [
      { label: "Position", value: spot.seat },
      { label: "Action", value: spot.action },
    ],
    options: ["Fold", "Call", "3-bet"],
    answer: ["Fold", "Call", "3-bet"].indexOf(action),
    explanation: `${label}: ${action.toLowerCase()} in the ${spot.short} chart. ${detail} ${spot.note}`,
    skill: "vsOpen",
  };
}

const RIVER_POTS = [40, 60, 80, 100, 120, 150, 200];
const RIVER_BETS = [0.5, 2 / 3, 0.75, 1, 1.5];

const VALUE_NAMES: [HandCategory, string, string][] = [
  [HandCategory.StraightFlush, "straight flush", "straight flushes"],
  [HandCategory.Flush, "flush", "flushes"],
  [HandCategory.Straight, "straight", "straights"],
  [HandCategory.ThreeOfAKind, "set", "sets"],
  [HandCategory.TwoPair, "two pair", "two pair"],
];

const count = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** The minimum gap between equity and price for a river call to be dealt. */
export const RIVER_MARGIN = 0.06;

/**
 * River bluff-catching: villain opened and bets a polarized range on the river (two
 * pair or better, or a missed flop draw). Hero called preflop with a hand from the
 * matching calling range and holds one pair, which beats every bluff and loses to
 * every value hand, so the equity is bluffs ÷ all combos.
 */
export function randomBluffCatch(random: Random = Math.random): ChoiceExercise {
  const wantCall = random() < 0.5;
  for (let attempt = 0; attempt < 400; attempt++) {
    const spot = pick(FLOP_SPOTS, random);
    const board = shuffle(fullDeck(), random).slice(0, 5);
    const boardRanks = board.map((c) => rankValue(c.rank)).sort((a, b) => b - a);
    if (new Set(boardRanks).size < 5) continue;
    const hero = pick(rangeCombos(FACING_SETS[spot.facing].call, board), random);
    const heroValue = evaluate([...hero, ...board]);
    if (heroValue.category !== HandCategory.OnePair) continue;
    // A pair worth calling with: an overpair, top pair or second pair.
    if (heroValue.kickers[0] < boardRanks[1]) continue;

    const position = spot.raiser;
    const range = OPENING_SETS[position];
    const read = riverRange(range, board, hero);
    if (read.valueTotal === 0 || read.bluffTotal === 0) continue;
    const pot = pick(RIVER_POTS, random);
    const bet = Math.round(pot * pick(RIVER_BETS, random));
    const need = potOdds(pot + bet, bet);
    const total = read.valueTotal + read.bluffTotal;
    const equity = read.bluffTotal / total;
    if (Math.abs(equity - need) < RIVER_MARGIN) continue;
    const call = equity > need;
    if (attempt < 300 && call !== wantCall) continue;

    const valueParts = VALUE_NAMES.filter(([c]) => read.value[c]).map(([c, one, many]) => count(read.value[c]!, one, many));
    const bluffParts = [
      read.bluffs.flush && count(read.bluffs.flush, "missed flush draw", "missed flush draws"),
      read.bluffs.straight && count(read.bluffs.straight, "missed straight draw", "missed straight draws"),
    ].filter(Boolean);
    const open = riverRange(range, board);
    const blocked = [
      open.valueTotal > read.valueTotal && count(open.valueTotal - read.valueTotal, "value combo", "value combos"),
      open.bluffTotal > read.bluffTotal && count(open.bluffTotal - read.bluffTotal, "bluff", "bluffs"),
    ].filter(Boolean);
    const name = POSITIONS.find((p) => p.id === position)!.name;

    return {
      type: "choice",
      prompt: "River. Villain bets two pair or better, or a missed draw. Call or fold?",
      hand: codes(hero),
      board: codes(board),
      info: [
        { label: "Villain opened", value: name },
        { label: "Pot before bet", value: `$${pot}` },
        { label: "Villain bets", value: `$${bet}` },
      ],
      options: ["Fold", "Call"],
      answer: call ? 1 : 0,
      explanation:
        `Value: ${read.valueTotal} (${valueParts.join(", ")}). Bluffs: ${read.bluffTotal} (${bluffParts.join(", ")}). ` +
        `Your ${describeHand(heroValue).toLowerCase()} beats only the bluffs: ${read.bluffTotal} ÷ ${total} = ${formatPercent(equity)}. ` +
        `Calling $${bet} to win $${pot + bet} needs ${formatPercent(need)}, so ${call ? "call" : "fold"}.` +
        (blocked.length ? ` Your cards block ${blocked.join(" and ")}.` : ""),
      skill: "bluffCatch",
    };
  }
  throw new Error("Could not deal a river bluff-catch spot");
}

/** Minimum difference in the raiser's equity between the two flops. */
export const EDGE_GAP = 0.05;

let flopCumulative: number[] | null = null;

/** A canonical flop index, weighted by how many real flops share its form. */
function randomFlopIndex(random: Random): number {
  flopCumulative ??= CANONICAL_FLOPS.reduce<number[]>((acc, f) => [...acc, (acc.at(-1) ?? 0) + f.weight], []);
  const target = random() * flopCumulative[flopCumulative.length - 1];
  let lo = 0;
  let hi = flopCumulative.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (flopCumulative[mid] > target) hi = mid;
    else lo = mid + 1;
  }
  return lo;
}

/**
 * Two flops: on which does the preflop raiser have the bigger edge? Graded by the
 * precomputed range-vs-range equity table with a clear gap, and only dealt when the
 * share of top pair or better points the same way.
 */
export function randomRangeEdge(random: Random = Math.random): ChoiceExercise {
  for (let attempt = 0; attempt < 500; attempt++) {
    const spot = pick(FLOP_SPOTS, random);
    const table = flopEquities(spot.id);
    const picks = [randomFlopIndex(random), randomFlopIndex(random)];
    const equities = picks.map((i) => table[i]);
    if (Math.abs(equities[0] - equities[1]) < EDGE_GAP) continue;

    const flops = picks.map((i) => randomSuits(CANONICAL_FLOPS[i].cards, random));
    // Relabel the second flop's suits so the two boards never show the same card.
    const shared = () => flops[1].some((c) => flops[0].some((d) => d.rank === c.rank && d.suit === c.suit));
    for (let k = 0; k < 24 && shared(); k++) flops[1] = randomSuits(CANONICAL_FLOPS[picks[1]].cards, random);
    if (shared()) continue;
    const hits = flops.map((flop) => ({
      raiser: topPairShare(rangeCombos(OPENING_SETS[spot.raiser], flop), flop),
      caller: topPairShare(rangeCombos(FACING_SETS[spot.facing].call, flop), flop),
    }));
    const best = equities[0] > equities[1] ? 0 : 1;
    const edge = (i: number) => hits[i].raiser - hits[i].caller;
    if (edge(best) < edge(1 - best)) continue;

    const line = (i: number) =>
      `${pretty(flops[i])}: the raiser wins about ${formatPercent(equities[i])} and has top pair or better ${formatPercent(hits[i].raiser)} of the time, vs ${formatPercent(hits[i].caller)} for the caller`;
    return {
      type: "choice",
      prompt: `${spot.text}. On which flop does the raiser have the bigger edge?`,
      info: [
        { label: "Raiser", value: POSITIONS.find((p) => p.id === spot.raiser)!.name },
        { label: "Caller", value: spot.caller },
      ],
      options: flops.map(codes),
      cardOptions: true,
      answer: best,
      explanation:
        `${line(best)}. ${line(1 - best)}. ` +
        "Flops that hit the raiser's big cards and big pairs let them bet often; flops that hit the caller's pairs and suited connectors call for more checking.",
      skill: "rangeEdge",
    };
  }
  throw new Error("Could not deal two flops with a clear range edge");
}

const MAKERS: Record<Skill, (random: Random) => Exercise> = {
  showdown: randomCompare,
  handName: randomHandName,
  potOdds: randomPotOdds,
  outs: randomOuts,
  nuts: randomNuts,
  preflop: randomPreflop,
  equity: randomEquity,
  callFold: randomCallFold,
  combos: randomCombos,
  pushFold: randomPushFold,
  betMath: randomBetMath,
  vsOpen: randomVsOpen,
  bluffCatch: randomBluffCatch,
  rangeEdge: randomRangeEdge,
};

export const SKILLS = Object.keys(MAKERS) as Skill[];

export type DrillKind = Skill | "mixed";

export function generateExercise(skill: Skill, random: Random = Math.random): Exercise {
  return MAKERS[skill](random);
}

/** A drill cycling through the given skills from a random starting point. */
export function generateMix(skills: readonly Skill[], count = 8, random: Random = Math.random): Exercise[] {
  if (skills.length === 0) throw new Error("generateMix needs at least one skill");
  const offset = Math.floor(random() * skills.length);
  return Array.from({ length: count }, (_, i) => generateExercise(skills[(offset + i) % skills.length], random));
}

export function generateDrill(kind: DrillKind, count = 8, random: Random = Math.random): Exercise[] {
  return generateMix(kind === "mixed" ? SKILLS : [kind], count, random);
}

export interface CompareResult {
  /** 0 or 1 for the winning player, -1 for a split pot. */
  winner: number;
  hands: [HandValue, HandValue];
}

export function resolveCompare(exercise: CompareExercise): CompareResult {
  const board = parseCards(exercise.board);
  const [a, b] = exercise.hands.map((h) => evaluate([...parseCards(h), ...board]));
  const diff = compareHands(a, b);
  return { winner: diff > 0 ? 0 : diff < 0 ? 1 : -1, hands: [a, b] };
}

/** Deterministic random numbers from a string seed (mulberry32 over an FNV-1a hash). */
export function seededRandom(seed: string): Random {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  let a = h >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const DAILY_LENGTH = 10;

/** The same ten hands for everyone on a given day. */
export function dailyChallenge(day: string): Exercise[] {
  return generateDrill("mixed", DAILY_LENGTH, seededRandom(`pokerlingo-daily-${day}`));
}

/** Exercise types that grade one answer quickly; matches and scenarios are left out of tests. */
const TESTABLE = new Set(["choice", "compare", "order"]);

/**
 * A test-out covering every unit before `sectionIndex`: exercises are drawn round-robin
 * across those units so each topic is represented.
 */
export function sectionTest(sectionIndex: number, length: number, random: Random = Math.random): Exercise[] {
  const units = SECTIONS.slice(0, sectionIndex)
    .flatMap((s) => s.unitIds)
    .map((id) => COURSE.find((u) => u.id === id)!);
  const pools = shuffle(units, random).map((u) =>
    shuffle(
      u.lessons.flatMap((l) => l.exercises).filter((e) => TESTABLE.has(e.type)),
      random,
    ),
  );
  const picked: Exercise[] = [];
  for (let round = 0; picked.length < length && pools.some((p) => p.length > round); round++) {
    for (const pool of pools) {
      if (picked.length >= length) break;
      if (pool[round]) picked.push(pool[round]);
    }
  }
  return shuffle(picked, random);
}
