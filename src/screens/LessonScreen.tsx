import { CircleCheck, CircleX, Gem, Heart, HeartCrack, Infinity as InfinityIcon, LogOut, RotateCcw, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Exercise } from "../course/types";
import {
  Answer,
  ChoiceView,
  COMPARE_OPTIONS,
  CompareView,
  correctAnswerText,
  displayOrder,
  feedbackText,
  grade,
  isReady,
  MatchView,
  OrderView,
  ScenarioView,
} from "../components/Exercises";
import { playCue } from "../sound";
import { HEART_REFILL_GEM_COST } from "../state/progress";
import { accuracy, answer as answerSession, currentExercise, isFinished, sessionProgress, startSession } from "../state/session";

interface Props {
  title: string;
  exercises: Exercise[];
  /** null for unlimited-heart practice. */
  hearts: number | null;
  gems: number;
  soundOn: boolean;
  onLoseHeart: () => void;
  /** Called each time an exercise is graded, with its index in `exercises`. */
  onResult?: (index: number, correct: boolean) => void;
  onBuyRefill: () => void;
  onQuit: () => void;
  onFinish: (result: { accuracy: number; durationMs: number; mistakes: number }) => void;
  /** Tests ask each question once and never re-queue misses. */
  mode?: "lesson" | "test";
}

const PRAISE = ["Correct", "Nice work", "Well read", "Exactly right", "Spot on"];

export function LessonScreen({
  title,
  exercises,
  hearts,
  gems,
  soundOn,
  onLoseHeart,
  onResult,
  onBuyRefill,
  onQuit,
  onFinish,
  mode = "lesson",
}: Props) {
  const [session, setSession] = useState(() => startSession(exercises.length));
  const [answer, setAnswer] = useState<Answer>(null);
  const [checked, setChecked] = useState<null | { correct: boolean }>(null);
  const [attempt, setAttempt] = useState(0);
  const [confirmQuit, setConfirmQuit] = useState(false);
  const startedAt = useRef(Date.now());

  const index = currentExercise(session);
  const exercise = index === undefined ? undefined : exercises[index];
  // Re-shuffle choice options each time an exercise comes up.
  const order = useMemo(
    () => (exercise?.type === "choice" ? displayOrder(exercise) : []),
    [exercise, attempt],
  );
  const praise = useMemo(() => PRAISE[Math.floor(Math.random() * PRAISE.length)], [attempt]);

  const outOfHearts = hearts !== null && hearts <= 0 && checked === null;

  const check = useCallback(
    (forceCorrect?: boolean) => {
      if (!exercise || checked) return;
      const correct = forceCorrect ?? grade(exercise, answer);
      setChecked({ correct });
      // Scenarios already played a cue for each street.
      if (soundOn && exercise.type !== "scenario") playCue(correct ? "correct" : "wrong");
      if (!correct && hearts !== null) onLoseHeart();
      onResult?.(index!, correct);
    },
    [exercise, checked, answer, hearts, index, soundOn, onLoseHeart, onResult],
  );

  const next = useCallback(() => {
    if (!checked) return;
    const updated = answerSession(session, checked.correct, mode !== "test");
    setChecked(null);
    setAnswer(null);
    setAttempt((a) => a + 1);
    if (isFinished(updated)) {
      onFinish({
        accuracy: accuracy(updated),
        durationMs: Date.now() - startedAt.current,
        mistakes: updated.mistakes,
      });
    }
    setSession(updated);
  }, [checked, session, onFinish, mode]);

  // Keyboard: Enter to check / continue, number keys to pick an option.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (confirmQuit || outOfHearts || !exercise) return;
      if (e.key === "Enter") {
        if (checked) {
          e.preventDefault();
          next();
        } else if (isReady(exercise, answer)) {
          e.preventDefault();
          check();
        }
        return;
      }
      const n = Number(e.key);
      if (checked || !Number.isInteger(n) || n < 1) return;
      if (exercise.type === "choice" && n <= order.length) setAnswer(order[n - 1]);
      if (exercise.type === "compare" && n <= COMPARE_OPTIONS.length) setAnswer(n === 3 ? -1 : n - 1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [answer, check, checked, confirmQuit, exercise, next, order, outOfHearts]);

  if (!exercise) return null;

  // Count the current exercise once it's checked: always in tests, only when right in lessons.
  const progress = sessionProgress(session) + (checked && (checked.correct || mode === "test") ? 1 / session.total : 0);
  const retry = session.missed.includes(index!) && !checked;

  return (
    <div className="lesson">
      <header className="lesson-header">
        <button className="icon-button" aria-label="Quit lesson" onClick={() => setConfirmQuit(true)}>
          <X size={24} aria-hidden="true" />
        </button>
        <div
          className="lesson-progress"
          role="progressbar"
          aria-valuenow={Math.round(progress * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Lesson progress"
        >
          <div style={{ width: `${progress * 100}%` }} />
        </div>
        {hearts !== null ? (
          <span className="chip-stat hearts" title="Hearts">
            <Heart size={18} fill="currentColor" aria-hidden="true" />
            <span className="num">{hearts}</span>
          </span>
        ) : (
          <span className="chip-stat hearts" title="Practice mode: unlimited hearts">
            <Heart size={18} fill="currentColor" aria-hidden="true" />
            <InfinityIcon size={18} aria-label="unlimited" />
          </span>
        )}
      </header>

      <main className="lesson-body" key={attempt}>
        <p className="lesson-title">
          {title}
          {retry && (
            <span className="retry-badge">
              <RotateCcw size={12} aria-hidden="true" /> Previous mistake
            </span>
          )}
        </p>
        {exercise.type === "choice" && (
          <ChoiceView exercise={exercise} answer={answer} onAnswer={setAnswer} locked={!!checked} order={order} />
        )}
        {exercise.type === "compare" && (
          <CompareView exercise={exercise} answer={answer} onAnswer={setAnswer} locked={!!checked} />
        )}
        {exercise.type === "order" && (
          <OrderView exercise={exercise} answer={answer} onAnswer={setAnswer} locked={!!checked} />
        )}
        {exercise.type === "match" && <MatchView exercise={exercise} onComplete={() => check(true)} />}
        {exercise.type === "scenario" && (
          <ScenarioView
            exercise={exercise}
            onStepResult={(correct) => soundOn && playCue(correct ? "correct" : "wrong")}
            onComplete={(correct) => check(correct)}
          />
        )}
      </main>

      <footer className={`lesson-footer ${checked ? (checked.correct ? "correct" : "wrong") : ""}`}>
        <div className="footer-inner">
          {checked ? (
            <div className="feedback" role="status">
              <span className="feedback-icon" aria-hidden="true">
                {checked.correct ? <CircleCheck size={28} /> : <CircleX size={28} />}
              </span>
              <div className="feedback-text">
              <strong>
                {checked.correct
                  ? exercise.type === "scenario"
                    ? "Well played"
                    : praise
                  : exercise.type === "scenario"
                    ? "Some decisions to review. This hand will come back."
                    : "Not quite"}
              </strong>
              {!checked.correct && correctAnswerText(exercise) && (
                <p className="correct-answer">Correct answer: {correctAnswerText(exercise)}</p>
              )}
              <p>{feedbackText(exercise)}</p>
              </div>
            </div>
          ) : (
            <span className="footer-hint">
              {exercise.type === "match"
                ? "Tap the matching pairs"
                : exercise.type === "scenario"
                  ? "Make a decision on each street"
                  : "Press Enter to check"}
            </span>
          )}
          {checked ? (
            <button className={`btn ${checked.correct ? "btn-primary" : "btn-danger"}`} onClick={next} autoFocus>
              Continue
            </button>
          ) : (
            exercise.type !== "match" &&
            exercise.type !== "scenario" && (
              <button className="btn btn-primary" disabled={!isReady(exercise, answer)} onClick={() => check()}>
                Check
              </button>
            )
          )}
        </div>
      </footer>

      {confirmQuit && (
        <div className="modal-backdrop">
          <div className="modal">
            <span className="icon-disc brand">
              <LogOut size={28} aria-hidden="true" />
            </span>
            <h3>Leave this lesson?</h3>
            <p>Your progress in this lesson won't be saved.</p>
            <button className="btn btn-primary" onClick={() => setConfirmQuit(false)} autoFocus>
              Keep learning
            </button>
            <button className="btn btn-ghost danger" onClick={onQuit}>
              Leave lesson
            </button>
          </div>
        </div>
      )}

      {outOfHearts && (
        <div className="modal-backdrop">
          <div className="modal">
            <span className="icon-disc red">
              <HeartCrack size={28} aria-hidden="true" />
            </span>
            <h3>You ran out of hearts</h3>
            <p>Refill them with gems, or go to Practice. Every drill you finish restores a heart.</p>
            <button className="btn btn-primary" disabled={gems < HEART_REFILL_GEM_COST} onClick={onBuyRefill}>
              Refill hearts for <Gem size={16} aria-hidden="true" /> {HEART_REFILL_GEM_COST}
            </button>
            <button className="btn btn-ghost" onClick={onQuit}>
              Quit lesson
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
