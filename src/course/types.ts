/** Card lists use compact codes separated by spaces, e.g. "As Kd". */
export type CardList = string;

export interface TableInfo {
  label: string;
  value: string;
}

/** Pick one answer from a list. Used for trivia, hand reading, and fold/call/raise decisions. */
export interface ChoiceExercise {
  type: "choice";
  prompt: string;
  hand?: CardList;
  board?: CardList;
  info?: TableInfo[];
  options: string[];
  answer: number;
  explanation: string;
}

/** Two players at showdown: pick the winner. The answer is computed by the hand evaluator. */
export interface CompareExercise {
  type: "compare";
  prompt?: string;
  board: CardList;
  hands: [CardList, CardList];
  explanation?: string;
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

export type Exercise = ChoiceExercise | CompareExercise | OrderExercise | MatchExercise;

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
