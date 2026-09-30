/** Card lists use compact codes separated by spaces, e.g. "As Kd". */
export type CardList = string;

export interface TableInfo {
  label: string;
  value: string;
}

/** Practice skills tracked for generated drill exercises. */
export type Skill =
  | "showdown"
  | "handName"
  | "potOdds"
  | "outs"
  | "nuts"
  | "preflop"
  | "equity"
  | "callFold"
  | "combos"
  | "pushFold";

/** Pick one answer from a list. Used for trivia, hand reading, and fold/call/raise decisions. */
export interface ChoiceExercise {
  type: "choice";
  prompt: string;
  hand?: CardList;
  board?: CardList;
  /** An opponent's revealed hole cards, shown on the table. */
  villain?: CardList;
  info?: TableInfo[];
  options: string[];
  answer: number;
  explanation: string;
  skill?: Skill;
}

/** Two players at showdown: pick the winner. The answer is computed by the hand evaluator. */
export interface CompareExercise {
  type: "compare";
  prompt?: string;
  board: CardList;
  hands: [CardList, CardList];
  explanation?: string;
  skill?: Skill;
}

/** Tap items into the right order. `items` is listed in the correct order. */
export interface OrderExercise {
  type: "order";
  prompt: string;
  items: string[];
  explanation: string;
}

/** Match each term to its partner. */
export interface MatchExercise {
  type: "match";
  prompt: string;
  pairs: [string, string][];
}

export type Street = "Preflop" | "Flop" | "Turn" | "River";

/** One decision point in a hand. `board` is the full board so far on that street. */
export interface ScenarioStep {
  street: Street;
  board?: CardList;
  info?: TableInfo[];
  prompt: string;
  options: string[];
  answer: number;
  explanation: string;
}

/** Play a hand street by street, making a decision at each step. */
export interface ScenarioExercise {
  type: "scenario";
  prompt: string;
  hand: CardList;
  /** Shown throughout the hand, e.g. position and stack sizes. */
  setup: TableInfo[];
  steps: ScenarioStep[];
  /** Takeaway shown once the hand is over. */
  summary: string;
}

export type Exercise = ChoiceExercise | CompareExercise | OrderExercise | MatchExercise | ScenarioExercise;

export interface Lesson {
  id: string;
  title: string;
  exercises: Exercise[];
}

export interface Unit {
  id: string;
  title: string;
  description: string;
  color: string;
  icon: string;
  /** Short guidebook shown before starting: each entry is a paragraph. */
  guidebook: { heading: string; body: string }[];
  lessons: Lesson[];
}
