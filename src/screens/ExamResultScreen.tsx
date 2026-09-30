import { BadgeCheck, Check, Gem, Target, X } from "lucide-react";
import type { Skill } from "../course/types";
import { DRILL_INFO } from "./PracticeScreen";

export interface SkillScore {
  skill: Skill;
  correct: number;
  total: number;
}

interface Props {
  passed: boolean;
  correct: number;
  total: number;
  needed: number;
  bySkill: SkillScore[];
  /** Bonus gems for a first pass. */
  gems: number;
  onPractice: (skill: Skill) => void;
  onRetry: () => void;
  onContinue: () => void;
}

export function ExamResultScreen({ passed, correct, total, needed, bySkill, gems, onPractice, onRetry, onContinue }: Props) {
  const sorted = [...bySkill].sort((a, b) => a.correct / a.total - b.correct / b.total);
  const weakest = sorted.find((s) => s.correct < s.total);
  return (
    <div className="complete-screen exam-result">
      <span className={`complete-hero ${passed ? "" : "muted-hero"}`} aria-hidden="true">
        {passed ? <BadgeCheck size={50} /> : <Target size={46} />}
      </span>
      <span className="eyebrow">Final exam</span>
      <h1>{passed ? "You passed" : "Not yet"}</h1>
      <p className="muted result-copy">
        You got <strong className="num">{correct}</strong> of {total} right
        {passed
          ? ". You've shown the decisions strong regulars make every session."
          : `; ${needed} are needed to pass. Practice the skills you missed and try again.`}
      </p>
      {gems > 0 && (
        <span className="pill gems">
          <Gem size={16} aria-hidden="true" /> +{gems} gems
        </span>
      )}

      <ul className="exam-skills" aria-label="Score by skill">
        {sorted.map((s) => (
          <li key={s.skill} className={s.correct === s.total ? "full" : ""}>
            <span className="row-text">
              <strong>{DRILL_INFO[s.skill].title}</strong>
            </span>
            <span className="exam-marks" aria-label={`${s.correct} of ${s.total}`}>
              {Array.from({ length: s.total }, (_, i) =>
                i < s.correct ? <Check key={i} size={16} strokeWidth={3} className="mark ok" /> : <X key={i} size={16} strokeWidth={3} className="mark miss" />,
              )}
            </span>
          </li>
        ))}
      </ul>

      <div className="speed-actions">
        {!passed && weakest && (
          <button className="btn btn-secondary" onClick={() => onPractice(weakest.skill)}>
            Practice {DRILL_INFO[weakest.skill].title}
          </button>
        )}
        {!passed && (
          <button className="btn btn-secondary" onClick={onRetry}>
            Try again
          </button>
        )}
        <button className="btn btn-primary" onClick={onContinue} autoFocus>
          Done
        </button>
      </div>
    </div>
  );
}
