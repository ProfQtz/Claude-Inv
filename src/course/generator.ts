import { Card, cardCode, fullDeck, parseCards, RANK_NAME, RANKS, shuffle, SUIT_SYMBOL } from "../poker/cards";
import { CATEGORY_NAME, compareHands, describeHand, evaluate, HandCategory, type HandValue } from "../poker/evaluator";
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
  let best: { value: HandValue; hole: Card[] } | null = null;
  for (let i = 0; i < deck.length; i++) {
    for (let j = i + 1; j < deck.length; j++) {
      const hole = [deck[i], deck[j]];
      const value = evaluate([...hole, ...board]);
      if (!best || compareHands(value, best.value) > 0) best = { value, hole };
    }
  }
  return best!;
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

const MAKERS: Record<Skill, (random: Random) => Exercise> = {
  showdown: randomCompare,
  handName: randomHandName,
  potOdds: randomPotOdds,
  outs: randomOuts,
  nuts: randomNuts,
};

export const SKILLS = Object.keys(MAKERS) as Skill[];

export type DrillKind = Skill | "mixed";

export function generateExercise(skill: Skill, random: Random = Math.random): Exercise {
  return MAKERS[skill](random);
}

export function generateDrill(kind: DrillKind, count = 8, random: Random = Math.random): Exercise[] {
  // Mixed drills cycle through the skills from a random starting point.
  const offset = Math.floor(random() * SKILLS.length);
  return Array.from({ length: count }, (_, i) =>
    generateExercise(kind === "mixed" ? SKILLS[(offset + i) % SKILLS.length] : kind, random),
  );
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
