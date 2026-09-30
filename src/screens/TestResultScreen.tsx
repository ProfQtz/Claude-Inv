import { Lock, Trophy } from "lucide-react";

interface Props {
  passed: boolean;
  correct: number;
  total: number;
  needed: number;
  /** Title of the section the test unlocks. */
  sectionTitle: string;
  onContinue: () => void;
  onRetry: () => void;
}

export function TestResultScreen({ passed, correct, total, needed, sectionTitle, onContinue, onRetry }: Props) {
  return (
    <div className="complete-screen">
      <span className={`complete-hero ${passed ? "" : "muted-hero"}`} aria-hidden="true">
        {passed ? <Trophy size={48} /> : <Lock size={44} />}
      </span>
      <span className="eyebrow">Placement test</span>
      <h1>{passed ? `${sectionTitle} unlocked` : "Not this time"}</h1>
      <p className="muted result-copy">
        You got <strong className="num">{correct}</strong> of {total} right
        {passed
          ? ". Everything before it is marked complete, and you can still replay any of those lessons."
          : `; ${needed} were needed. The lessons before it will get you there, or you can try again.`}
      </p>
      <div className="speed-actions">
        {!passed && (
          <button className="btn btn-secondary" onClick={onRetry}>
            Try again
          </button>
        )}
        <button className="btn btn-primary" onClick={onContinue} autoFocus>
          {passed ? "Start learning" : "Keep learning"}
        </button>
      </div>
    </div>
  );
}
