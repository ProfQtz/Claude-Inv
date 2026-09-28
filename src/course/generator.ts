import { Card, cardCode, fullDeck, parseCards, shuffle } from "../poker/cards";
import { CATEGORY_NAME, compareHands, evaluate, HandCategory, type HandValue } from "../poker/evaluator";
import { formatPercent, potOdds } from "../poker/math";
import type { ChoiceExercise, CompareExercise, Exercise } from "./types";

type Random = () => number;

const codes = (cards: Card[]) => cards.map(cardCode).join(" ");

/** Random two-player showdown on a full board. */
export function randomCompare(random: Random = Math.random): CompareExercise {
  const deck = shuffle(fullDeck(), random);
  return { type: "compare", board: codes(deck.slice(0, 5)), hands: [codes(deck.slice(5, 7)), codes(deck.slice(7, 9))] };
}

/** Deal hole cards + board and ask for the made hand's category. */
export function randomHandName(random: Random = Math.random): ChoiceExercise {
  const deck = shuffle(fullDeck(), random);
  const hand = deck.slice(0, 2);
  const board = deck.slice(2, 7);
  const value = evaluate([...hand, ...board]);

  // Offer the right category plus its neighbours on the ladder so the choice is non-trivial.
  const all = Object.values(HandCategory).filter((v): v is HandCategory => typeof v === "number");
  const nearby = all
    .filter((c) => c !== value.category)
    .sort((a, b) => Math.abs(a - value.category) - Math.abs(b - value.category))
    .slice(0, 3);
  const options = shuffle([value.category, ...nearby], random);

  return {
    type: "choice",
    prompt: "What's your best hand?",
    hand: codes(hand),
    board: codes(board),
    options: options.map((c) => CATEGORY_NAME[c]),
    answer: options.indexOf(value.category),
    explanation: `Your best five: ${codes(value.cards)} — ${CATEGORY_NAME[value.category]}.`,
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
  };
}

export type DrillKind = "showdown" | "handName" | "potOdds" | "mixed";

export function generateDrill(kind: DrillKind, count = 8, random: Random = Math.random): Exercise[] {
  const makers = {
    showdown: randomCompare,
    handName: randomHandName,
    potOdds: randomPotOdds,
  };
  const kinds = Object.keys(makers) as (keyof typeof makers)[];
  return Array.from({ length: count }, (_, i) => {
    const k = kind === "mixed" ? kinds[i % kinds.length] : kind;
    return makers[k](random);
  });
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
