import { Timer, Trophy, X, Zap } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { generateExercise } from "../course/generator";
import type { Exercise, Skill } from "../course/types";
import { Answer, ChoiceView, COMPARE_OPTIONS, CompareView, displayOrder, grade } from "../components/Exercises";
import { playCue } from "../sound";
import { shuffle } from "../poker/cards";

export const SPEED_ROUND_MS = 60_000;
/** Skills quick enough to answer in a few seconds. */
const SPEED_SKILLS: Skill[] = ["showdown", "handName", "nuts", "potOdds", "preflop"];
const PAUSE_CORRECT_MS = 450;
const PAUSE_WRONG_MS = 1500;

interface Props {
  best: number;
  soundOn: boolean;
  onSkillResult: (skill: Skill, correct: boolean) => void;
  /** Called once when a round's timer runs out. */
  onRoundEnd: (score: number) => void;
  onQuit: () => void;
  onFinish: (result: { accuracy: number; durationMs: number }) => void;
}

function nextExercise(): Exercise {
  return generateExercise(shuffle(SPEED_SKILLS)[0]);
}

export function SpeedRoundScreen({ best, soundOn, onSkillResult, onRoundEnd, onQuit, onFinish }: Props) {
  const [phase, setPhase] = useState<"ready" | "playing" | "done">("ready");
  const [startedAt, setStartedAt] = useState(0);
  const [now, setNow] = useState(Date.now);
  const [exercise, setExercise] = useState<Exercise>(nextExercise);
  const [answer, setAnswer] = useState<Answer>(null);
  const [locked, setLocked] = useState(false);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(0);
  const [bestAtStart, setBestAtStart] = useState(best);
  const pauseTimer = useRef<number>(undefined);

  const order = useMemo(() => (exercise.type === "choice" ? displayOrder(exercise) : []), [exercise]);
  const remaining = Math.max(0, SPEED_ROUND_MS - (now - startedAt));

  const finishRound = useCallback(() => {
    setPhase("done");
    onRoundEnd(score);
    if (soundOn) playCue("complete");
  }, [onRoundEnd, score, soundOn]);

  useEffect(() => {
    if (phase !== "playing") return;
    const id = window.setInterval(() => setNow(Date.now()), 100);
    return () => window.clearInterval(id);
  }, [phase]);

  // Time's up: end now, unless feedback for the last answer is still showing.
  useEffect(() => {
    if (phase === "playing" && remaining <= 0 && !locked) finishRound();
  }, [phase, remaining, locked, finishRound]);

  useEffect(() => () => window.clearTimeout(pauseTimer.current), []);

  function start() {
    setBestAtStart(best);
    setScore(0);
    setAnswered(0);
    setExercise(nextExercise());
    setAnswer(null);
    setLocked(false);
    setStartedAt(Date.now());
    setNow(Date.now());
    setPhase("playing");
  }

  function respond(value: Answer) {
    if (locked || phase !== "playing") return;
    const correct = grade(exercise, value);
    setAnswer(value);
    setLocked(true);
    setAnswered((n) => n + 1);
    if (correct) setScore((n) => n + 1);
    if (exercise.type !== "match" && exercise.type !== "scenario" && exercise.type !== "order" && exercise.skill) {
      onSkillResult(exercise.skill, correct);
    }
    if (soundOn) playCue(correct ? "correct" : "wrong");
    pauseTimer.current = window.setTimeout(
      () => {
        setExercise(nextExercise());
        setAnswer(null);
        setLocked(false);
      },
      correct ? PAUSE_CORRECT_MS : PAUSE_WRONG_MS,
    );
  }

  // Number keys answer instantly.
  useEffect(() => {
    if (phase !== "playing") return;
    function onKey(e: KeyboardEvent) {
      const n = Number(e.key);
      if (!Number.isInteger(n) || n < 1) return;
      if (exercise.type === "choice" && n <= order.length) respond(order[n - 1]);
      if (exercise.type === "compare" && n <= COMPARE_OPTIONS.length) respond(n === 3 ? -1 : n - 1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (phase === "ready") {
    return (
      <div className="speed-intro">
        <button className="icon-button close" aria-label="Back to practice" onClick={onQuit}>
          <X size={24} aria-hidden="true" />
        </button>
        <span className="complete-hero speed" aria-hidden="true">
          <Timer size={48} />
        </span>
        <span className="eyebrow">Speed Round</span>
        <h1>60 seconds. Read fast.</h1>
        <p className="muted">
          Showdowns, hand reading, the nuts, pot odds and preflop opens, dealt one after another. Answers lock in the moment you tap,
          and number keys work too. No hearts at stake.
        </p>
        {best > 0 && (
          <span className="pill best">
            <Trophy size={14} aria-hidden="true" /> Best: <span className="num">{best}</span>
          </span>
        )}
        <button className="btn btn-primary wide" onClick={start} autoFocus>
          Start
        </button>
      </div>
    );
  }

  if (phase === "done") {
    const newBest = score > bestAtStart;
    const accuracy = answered === 0 ? 0 : score / answered;
    return (
      <div className="speed-intro">
        <span className="complete-hero" aria-hidden="true">
          {newBest ? <Trophy size={48} /> : <Zap size={48} />}
        </span>
        <span className="eyebrow">{newBest ? "New personal best" : "Time's up"}</span>
        <h1>
          <span className="num">{score}</span> correct
        </h1>
        <div className="result-tiles">
          <div className="result-tile gold">
            <span className="result-label">Best</span>
            <strong className="num">{Math.max(best, score)}</strong>
          </div>
          <div className="result-tile brand">
            <span className="result-label">Accuracy</span>
            <strong className="num">{Math.round(accuracy * 100)}%</strong>
          </div>
          <div className="result-tile blue">
            <span className="result-label">Answered</span>
            <strong className="num">{answered}</strong>
          </div>
        </div>
        <div className="speed-actions">
          <button className="btn btn-secondary" onClick={start}>
            Play again
          </button>
          <button className="btn btn-primary" onClick={() => onFinish({ accuracy, durationMs: SPEED_ROUND_MS })} autoFocus>
            Collect rewards
          </button>
        </div>
      </div>
    );
  }

  const seconds = Math.ceil(remaining / 1000);
  const correct = locked ? grade(exercise, answer) : null;

  return (
    <div className="lesson speed">
      <header className="lesson-header">
        <button className="icon-button" aria-label="End speed round" onClick={onQuit}>
          <X size={24} aria-hidden="true" />
        </button>
        <div className={`lesson-progress timer ${seconds <= 10 ? "low" : ""}`} aria-hidden="true">
          <div style={{ width: `${(remaining / SPEED_ROUND_MS) * 100}%` }} />
        </div>
        <span className="chip-stat timer-chip num" aria-label={`${seconds} seconds left`}>
          <Timer size={16} aria-hidden="true" /> {seconds}s
        </span>
        <span className="chip-stat score-chip num" aria-label={`Score ${score}`}>
          <Zap size={16} aria-hidden="true" /> {score}
        </span>
      </header>
      <main className="lesson-body" key={answered}>
        {exercise.type === "choice" && (
          <ChoiceView exercise={exercise} answer={answer} onAnswer={respond} locked={locked} order={order} />
        )}
        {exercise.type === "compare" && (
          <CompareView exercise={exercise} answer={answer} onAnswer={respond} locked={locked} />
        )}
        {correct !== null && (
          <div className={`speed-flash ${correct ? "correct" : "wrong"}`} role="status">
            {correct ? "+1" : "Missed"}
          </div>
        )}
      </main>
    </div>
  );
}
