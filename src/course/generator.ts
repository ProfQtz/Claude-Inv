import { Card, cardCode, fullDeck, parseCards, RANK_NAME, RANKS, shuffle, SUIT_SYMBOL } from "../poker/cards";
import { CATEGORY_NAME, compareHands, describeHand, evaluate, HandCategory, type HandValue, score7 } from "../poker/evaluator";
import { exactEquity } from "../poker/equity";
import { handLabel, OPENING_RANGES, OPENING_SETS, type Position, POSITIONS, rangePercent } from "../poker/ranges";
import { formatPercent, hitProbability, potOdds, ruleOf2And4 } from "../poker/math";
import type { ChoiceExercise, CompareExercise, Exercise, Skill } from "./types";

type Random = () => number;

const codes = (cards: Card[]) => cards.map(cardCode).join(" ");
const pretty = (cards: Card[]) => cards.map((c) => (c.rank === "T" ? "10" : c.rank) + SUIT_SYMBOL[c.suit]).join(" ");
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
