import { ChevronRight, Heart, Play, Timer, Trophy } from "lucide-react";
import type { CSSProperties } from "react";
import { type DrillKind, SKILLS } from "../course/generator";
import type { Skill } from "../course/types";
import { NamedIcon } from "../components/Icons";
import {
  DRILL_LENGTHS,
  MAX_HEARTS,
  Progress,
  recommendSkill,
  SKILL_MIN_ATTEMPTS,
  skillAccuracy,
} from "../state/progress";

interface DrillInfo {
  title: string;
  description: string;
  icon: string;
  color: string;
}

export const DRILL_INFO: Record<DrillKind, DrillInfo> = {
  showdown: {
    title: "Showdown",
    description: "Random boards. Pick the winning hand.",
    icon: "swords",
    color: "#d27a14",
  },
  handName: {
    title: "Name That Hand",
    description: "Find your best five cards from seven.",
    icon: "trophy",
    color: "#2f6fde",
  },
  potOdds: {
    title: "Pot Odds",
    description: "Turn bet sizes into the equity you need.",
    icon: "calculator",
    color: "#4957c9",
  },
  outs: {
    title: "Count Your Outs",
    description: "How many cards make your straight or better?",
    icon: "target",
    color: "#c8435e",
  },
  nuts: {
    title: "Find the Nuts",
    description: "Spot the best possible hand on the river.",
    icon: "crosshair",
    color: "#0f8b8d",
  },
  mixed: {
    title: "Mixed Session",
    description: "All five skills, for daily reps.",
    icon: "dice",
    color: "#0e7c58",
  },
};

export const DRILL_TITLES: Record<DrillKind, string> = Object.fromEntries(
  Object.entries(DRILL_INFO).map(([k, v]) => [k, v.title]),
) as Record<DrillKind, string>;

interface Props {
  progress: Progress;
  onStart: (kind: DrillKind) => void;
  onStartReview: () => void;
  onStartSpeed: () => void;
  onSetLength: (length: number) => void;
}

function SkillMeter({ progress, skill }: { progress: Progress; skill: Skill }) {
  const accuracy = skillAccuracy(progress, skill);
  const attempts = progress.skills[skill]?.attempts ?? 0;
  if (accuracy === null) {
    return (
      <span className="skill-meter new">
        {attempts === 0 ? "New" : `${attempts}/${SKILL_MIN_ATTEMPTS} answers`}
      </span>
    );
  }
  const tone = accuracy >= 0.8 ? "strong" : accuracy >= 0.6 ? "ok" : "weak";
  return (
    <span className={`skill-meter ${tone}`}>
      <span className="skill-bar" aria-hidden="true">
        <span style={{ width: `${accuracy * 100}%` }} />
      </span>
      <span className="num">{Math.round(accuracy * 100)}%</span>
    </span>
  );
}

export function PracticeScreen({ progress, onStart, onStartReview, onStartSpeed, onSetLength }: Props) {
  const reviewCount = progress.reviewQueue.length;
  const focus = recommendSkill(progress, SKILLS);
  const focusInfo = DRILL_INFO[focus];
  const focusAccuracy = skillAccuracy(progress, focus);
  const focusAttempts = progress.skills[focus]?.attempts ?? 0;

  return (
    <div className="page">
      <header className="page-head">
        <h1>Practice</h1>
        <p>Endless, randomly dealt drills. No hearts at stake, and every drill you finish restores one.</p>
        {progress.hearts < MAX_HEARTS && (
          <span className="pill hearts">
            <Heart size={14} fill="currentColor" aria-hidden="true" /> {progress.hearts}/{MAX_HEARTS} hearts
          </span>
        )}
      </header>

      <section className="focus-card" style={{ "--tile-color": focusInfo.color } as CSSProperties}>
        <div className="focus-text">
          <span className="eyebrow">Recommended for you</span>
          <h2>{focusInfo.title}</h2>
          <p>
            {focusAccuracy === null
              ? focusAttempts === 0
                ? "You haven't tried this skill yet. Start here to measure it."
                : `A few more answers to measure this skill (${focusAttempts} of ${SKILL_MIN_ATTEMPTS}).`
              : `Your weakest skill right now, at ${Math.round(focusAccuracy * 100)}% accuracy.`}
          </p>
        </div>
        <button className="btn btn-light" onClick={() => onStart(focus)}>
          <Play size={16} fill="currentColor" aria-hidden="true" />
          Practice {progress.drillLength}
        </button>
      </section>

      <div className="practice-row">
        <button className="review-card speed-card" onClick={onStartSpeed}>
          <span className="icon-tile gold lg">
            <Timer size={24} aria-hidden="true" />
          </span>
          <span className="row-text">
            <strong>Speed Round</strong>
            <span>As many correct reads as you can in 60 seconds.</span>
          </span>
          {progress.speedBest > 0 && (
            <span className="best-badge num" title="Personal best">
              <Trophy size={14} aria-hidden="true" /> {progress.speedBest}
            </span>
          )}
        </button>

        <button className="review-card" disabled={reviewCount === 0} onClick={onStartReview}>
          <span className="icon-tile orange lg">
            <NamedIcon name="repeat" size={24} />
          </span>
          <span className="row-text">
            <strong>Review mistakes</strong>
            <span>
              {reviewCount === 0
                ? "Questions you miss in lessons show up here."
                : `${reviewCount} to revisit. A correct answer clears it.`}
            </span>
          </span>
          {reviewCount > 0 ? <span className="count-badge num">{reviewCount}</span> : null}
        </button>
      </div>

      <div className="section-bar">
        <h2 className="section-title">Skill drills</h2>
        <div className="segmented" role="radiogroup" aria-label="Questions per drill">
          {DRILL_LENGTHS.map((n) => (
            <button
              key={n}
              role="radio"
              aria-checked={progress.drillLength === n}
              className={progress.drillLength === n ? "on" : ""}
              onClick={() => onSetLength(n)}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <div className="drill-grid">
        {SKILLS.map((skill) => {
          const d = DRILL_INFO[skill];
          return (
            <button
              key={skill}
              className="drill-card"
              style={{ "--tile-color": d.color } as CSSProperties}
              onClick={() => onStart(skill)}
            >
              <span className="icon-tile tinted lg">
                <NamedIcon name={d.icon} size={24} />
              </span>
              <span className="row-text">
                <strong>{d.title}</strong>
                <span>{d.description}</span>
                <SkillMeter progress={progress} skill={skill} />
              </span>
            </button>
          );
        })}
        <button
          className="drill-card"
          style={{ "--tile-color": DRILL_INFO.mixed.color } as CSSProperties}
          onClick={() => onStart("mixed")}
        >
          <span className="icon-tile tinted lg">
            <NamedIcon name={DRILL_INFO.mixed.icon} size={24} />
          </span>
          <span className="row-text">
            <strong>{DRILL_INFO.mixed.title}</strong>
            <span>{DRILL_INFO.mixed.description}</span>
          </span>
          <ChevronRight className="row-chevron" size={20} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
