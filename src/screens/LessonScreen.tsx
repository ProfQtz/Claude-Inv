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
} from "../components/Exercises";
import { HEART_REFILL_GEM_COST } from "../state/progress";
import { accuracy, answer as answerSession, currentExercise, isFinished, sessionProgress, startSession } from "../state/session";

interface Props {
  title: string;
  exercises: Exercise[];
  /** null for unlimited-heart practice. */
  hearts: number | null;
  gems: number;
  onLoseHeart: () => void;
  onBuyRefill: () => void;
  onQuit: () => void;
  onFinish: (result: { accuracy: number; durationMs: number; mistakes: number }) => void;
}

const PRAISE = ["Nice!", "Great job!", "Correct!", "Nailed it!", "Ship it!", "Excellent!"];

export function LessonScreen({ title, exercises, hearts, gems, onLoseHeart, onBuyRefill, onQuit, onFinish }: Props) {
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
      if (!correct && hearts !== null) onLoseHeart();
    },
    [exercise, checked, answer, hearts, onLoseHeart],
  );

  const next = useCallback(() => {
    if (!checked) return;
    const updated = answerSession(session, checked.correct);
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
  }, [checked, session, onFinish]);

  // Keyboard: Enter to check / continue, number keys to pick an option.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (confirmQuit || outOfHearts || !exercise) return;
      if (e.key === "Enter") {
        e.preventDefault();
        if (checked) next();
        else if (isReady(exercise, answer)) check();
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

  const progress = sessionProgress(session) + (checked?.correct ? 1 / session.total : 0);
  const retry = session.missed.includes(index!) && !checked;

  return (
    <div className="lesson">
      <header className="lesson-header">
        <button className="icon-button" aria-label="Quit lesson" onClick={() => setConfirmQuit(true)}>
          ✕
        </button>
        <div className="progress-track" aria-label={`${Math.round(progress * 100)}% complete`}>
          <div className="progress-fill" style={{ width: `${progress * 100}%` }} />
        </div>
        {hearts !== null ? (
          <span className="stat hearts" title="Hearts">
            ❤️ {hearts}
          </span>
        ) : (
          <span className="stat" title="Practice mode: unlimited hearts">
            ❤️ ∞
          </span>
        )}
      </header>

      <main className="lesson-body" key={attempt}>
        <p className="lesson-title">
          {title}
          {retry && <span className="retry-badge">↻ Previous mistake</span>}
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
      </main>

      <footer className={`lesson-footer ${checked ? (checked.correct ? "correct" : "wrong") : ""}`}>
        <div className="footer-inner">
          {checked ? (
            <div className="feedback" role="status">
              <strong>{checked.correct ? `✔ ${praise}` : "✘ Not quite"}</strong>
              {!checked.correct && correctAnswerText(exercise) && (
                <p className="correct-answer">Correct answer: {correctAnswerText(exercise)}</p>
              )}
              <p>{feedbackText(exercise)}</p>
            </div>
          ) : (
            <span className="footer-hint">
              {exercise.type === "match" ? "Tap the matching pairs" : "Press Enter to check"}
            </span>
          )}
          {checked ? (
            <button className={`btn ${checked.correct ? "btn-green" : "btn-red"}`} onClick={next} autoFocus>
              Continue
            </button>
          ) : (
            exercise.type !== "match" && (
              <button className="btn btn-green" disabled={!isReady(exercise, answer)} onClick={() => check()}>
                Check
              </button>
            )
          )}
        </div>
      </footer>

      {confirmQuit && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-icon">🃏</div>
            <h3>Wait, don't fold yet!</h3>
            <p>You'll lose your progress in this lesson if you quit now.</p>
            <button className="btn btn-blue" onClick={() => setConfirmQuit(false)} autoFocus>
              Keep learning
            </button>
            <button className="btn btn-ghost danger" onClick={onQuit}>
              End session
            </button>
          </div>
        </div>
      )}

      {outOfHearts && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-icon">💔</div>
            <h3>You ran out of hearts</h3>
            <p>Refill with gems, or head to Practice — each drill restores a heart.</p>
            <button className="btn btn-blue" disabled={gems < HEART_REFILL_GEM_COST} onClick={onBuyRefill}>
              Refill hearts · 💎 {HEART_REFILL_GEM_COST}
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
