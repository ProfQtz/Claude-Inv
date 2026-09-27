import { useMemo, useState } from "react";
import { resolveCompare } from "../course/generator";
import type { ChoiceExercise, CompareExercise, Exercise, MatchExercise, OrderExercise } from "../course/types";
import { describeHand } from "../poker/evaluator";
import { shuffle } from "../poker/cards";
import { CardRow } from "./PlayingCard";

/** The learner's in-progress answer for a gradable exercise. */
export type Answer = number | string[] | null;

export const COMPARE_OPTIONS = ["Player A", "Player B", "Split pot"];
/** Compare answers are stored as 0 / 1 for a player and -1 for a split, matching resolveCompare. */
const compareValue = (option: number) => (option === 2 ? -1 : option);

/** Options that read naturally in authored order (actions, players, numbers) stay unshuffled. */
const FIXED_ORDER = /^(Fold|Call|Raise|Check|Player [AB]|Split|\$?\d|[¼½])/;

export function displayOrder(exercise: ChoiceExercise): number[] {
  const indexes = exercise.options.map((_, i) => i);
  return exercise.options.some((o) => FIXED_ORDER.test(o)) ? indexes : shuffle(indexes);
}

export function isReady(exercise: Exercise, answer: Answer): boolean {
  if (exercise.type === "order") return Array.isArray(answer) && answer.length === exercise.items.length;
  return typeof answer === "number";
}

export function grade(exercise: Exercise, answer: Answer): boolean {
  switch (exercise.type) {
    case "choice":
      return answer === exercise.answer;
    case "compare":
      return answer === resolveCompare(exercise).winner;
    case "order":
      return Array.isArray(answer) && answer.every((item, i) => item === exercise.items[i]);
    case "match":
      return true;
  }
}

export function feedbackText(exercise: Exercise): string {
  switch (exercise.type) {
    case "choice":
    case "order":
      return exercise.explanation;
    case "match":
      return "All pairs matched!";
    case "compare": {
      const { winner, hands } = resolveCompare(exercise);
      const summary = `A: ${describeHand(hands[0])} · B: ${describeHand(hands[1])}.`;
      const verdict = winner === -1 ? "Split pot." : `Player ${winner === 0 ? "A" : "B"} wins.`;
      return [summary, verdict, exercise.explanation].filter(Boolean).join(" ");
    }
  }
}

export function correctAnswerText(exercise: Exercise): string | null {
  switch (exercise.type) {
    case "choice":
      return exercise.options[exercise.answer];
    case "compare":
      return COMPARE_OPTIONS[[0, 1, -1].indexOf(resolveCompare(exercise).winner)];
    case "order":
      return exercise.items.join(" › ");
    case "match":
      return null;
  }
}

interface ViewProps<E extends Exercise> {
  exercise: E;
  answer: Answer;
  onAnswer: (a: Answer) => void;
  /** True once the answer has been checked. */
  locked: boolean;
}

function OptionButton(props: {
  label: string;
  index: number;
  selected: boolean;
  state?: "correct" | "wrong";
  disabled: boolean;
  onClick: () => void;
}) {
  const cls = ["option", props.selected && "selected", props.state].filter(Boolean).join(" ");
  return (
    <button className={cls} disabled={props.disabled} onClick={props.onClick}>
      <span className="option-key">{props.index + 1}</span>
      <span>{props.label}</span>
    </button>
  );
}

export function ChoiceView({ exercise, answer, onAnswer, locked, order }: ViewProps<ChoiceExercise> & { order: number[] }) {
  return (
    <div className="exercise">
      <h2 className="prompt">{exercise.prompt}</h2>
      {(exercise.hand || exercise.board || exercise.info) && (
        <div className="felt">
          {exercise.info && (
            <dl className="table-info">
              {exercise.info.map((i) => (
                <div key={i.label}>
                  <dt>{i.label}</dt>
                  <dd>{i.value}</dd>
                </div>
              ))}
            </dl>
          )}
          {exercise.board && (
            <div className="felt-section">
              {exercise.hand && <span className="felt-label">Board</span>}
              <CardRow cards={exercise.board} />
            </div>
          )}
          {exercise.hand && (
            <div className="felt-section">
              {exercise.board && <span className="felt-label">Your hand</span>}
              <CardRow cards={exercise.hand} />
            </div>
          )}
        </div>
      )}
      <div className="options">
        {order.map((optionIndex, i) => (
          <OptionButton
            key={optionIndex}
            index={i}
            label={exercise.options[optionIndex]}
            selected={answer === optionIndex}
            disabled={locked}
            state={
              locked && optionIndex === exercise.answer
                ? "correct"
                : locked && answer === optionIndex
                  ? "wrong"
                  : undefined
            }
            onClick={() => onAnswer(optionIndex)}
          />
        ))}
      </div>
    </div>
  );
}

export function CompareView({ exercise, answer, onAnswer, locked }: ViewProps<CompareExercise>) {
  const result = useMemo(() => resolveCompare(exercise), [exercise]);
  return (
    <div className="exercise">
      <h2 className="prompt">{exercise.prompt ?? "Who wins at showdown?"}</h2>
      <div className="felt">
        <div className="felt-section">
          <span className="felt-label">Board</span>
          <CardRow cards={exercise.board} />
        </div>
        <div className="players">
          {exercise.hands.map((hand, i) => {
            const best = locked ? new Set(result.hands[i].cards.map((c) => c.rank + c.suit)) : undefined;
            return (
              <div key={i} className={`player ${locked && (result.winner === i || result.winner === -1) ? "winner" : ""}`}>
                <span className="felt-label">Player {i === 0 ? "A" : "B"}</span>
                <CardRow cards={hand} highlight={best} />
                {locked && <span className="hand-name">{describeHand(result.hands[i])}</span>}
              </div>
            );
          })}
        </div>
      </div>
      <div className="options row">
        {COMPARE_OPTIONS.map((label, i) => {
          const value = compareValue(i);
          return (
            <OptionButton
              key={label}
              index={i}
              label={label}
              selected={answer === value}
              disabled={locked}
              state={locked && value === result.winner ? "correct" : locked && answer === value ? "wrong" : undefined}
              onClick={() => onAnswer(value)}
            />
          );
        })}
      </div>
    </div>
  );
}

export function OrderView({ exercise, answer, onAnswer, locked }: ViewProps<OrderExercise>) {
  const bank = useMemo(() => {
    let s = shuffle(exercise.items);
    // Never present the items already in the right order.
    while (s.every((item, i) => item === exercise.items[i])) s = shuffle(exercise.items);
    return s;
  }, [exercise]);
  const picked = Array.isArray(answer) ? answer : [];

  return (
    <div className="exercise">
      <h2 className="prompt">{exercise.prompt}</h2>
      <ol className="order-slots">
        {exercise.items.map((_, i) => (
          <li key={i} className={picked[i] ? "filled" : ""}>
            <span className="slot-number">{i + 1}</span>
            {picked[i] && (
              <button
                className="chip"
                disabled={locked}
                onClick={() => onAnswer(picked.filter((item) => item !== picked[i]))}
              >
                {picked[i]}
              </button>
            )}
          </li>
        ))}
      </ol>
      <div className="chip-bank">
        {bank.map((item) => {
          const used = picked.includes(item);
          return (
            <button
              key={item}
              className={`chip ${used ? "used" : ""}`}
              disabled={locked || used}
              onClick={() => onAnswer([...picked, item])}
            >
              {item}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function MatchView({ exercise, onComplete }: { exercise: MatchExercise; onComplete: () => void }) {
  const left = useMemo(() => shuffle(exercise.pairs.map((p) => p[0])), [exercise]);
  const right = useMemo(() => shuffle(exercise.pairs.map((p) => p[1])), [exercise]);
  const partner = useMemo(() => new Map(exercise.pairs), [exercise]);

  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [selLeft, setSelLeft] = useState<string | null>(null);
  const [selRight, setSelRight] = useState<string | null>(null);
  const [wrong, setWrong] = useState<string[]>([]);

  function attempt(l: string | null, r: string | null) {
    if (!l || !r) return;
    if (partner.get(l) === r) {
      const next = new Set(matched).add(l).add(r);
      setMatched(next);
      if (next.size === exercise.pairs.length * 2) onComplete();
    } else {
      setWrong([l, r]);
      setTimeout(() => setWrong([]), 500);
    }
    setSelLeft(null);
    setSelRight(null);
  }

  const tile = (value: string, side: "l" | "r") => {
    const selected = side === "l" ? selLeft === value : selRight === value;
    const cls = ["tile", selected && "selected", matched.has(value) && "matched", wrong.includes(value) && "wrong"];
    return (
      <button
        key={value}
        className={cls.filter(Boolean).join(" ")}
        disabled={matched.has(value)}
        onClick={() => {
          if (side === "l") {
            setSelLeft(value);
            attempt(value, selRight);
          } else {
            setSelRight(value);
            attempt(selLeft, value);
          }
        }}
      >
        {value}
      </button>
    );
  };

  return (
    <div className="exercise">
      <h2 className="prompt">{exercise.prompt}</h2>
      <div className="match-grid">
        <div className="match-col">{left.map((v) => tile(v, "l"))}</div>
        <div className="match-col">{right.map((v) => tile(v, "r"))}</div>
      </div>
    </div>
  );
}
