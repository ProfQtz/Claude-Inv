import { CalendarCheck, Check, ChevronRight, Gem, Heart, Play, Timer, Trophy } from "lucide-react";
import { type CSSProperties, useState } from "react";
import { DAILY_LENGTH, type DrillKind, SKILLS } from "../course/generator";
import type { Skill } from "../course/types";
import { NamedIcon } from "../components/Icons";
import {
  dayKey,
  DRILL_LENGTHS,
  isDailyDone,
  MAX_HEARTS,
  Progress,
  recommendSkill,
  SKILL_MIN_ATTEMPTS,
  skillAccuracy,
  skillMastery,
} from "../state/progress";

interface DrillInfo {
  title: string;
  description: string;
  icon: string;
  color: string;
}

export const DRILL_INFO: Record<DrillKind, DrillInfo> = {
  preflop: {
    title: "Open or Fold",
    description: "Preflop opening decisions from every seat.",
    icon: "hand",
    color: "#7156d9",
  },
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
  nuts: {
    title: "Find the Nuts",
    description: "Spot the best possible hand on the river.",
    icon: "crosshair",
    color: "#0f8b8d",
  },
  outs: {
    title: "Count Your Outs",
    description: "How many cards make your straight or better?",
    icon: "target",
    color: "#c8435e",
  },
  equity: {
    title: "Hand vs Hand",
    description: "Estimate your all-in equity on the flop.",
    icon: "percent",
    color: "#a14b8c",
  },
  potOdds: {
    title: "Pot Odds",
    description: "Turn bet sizes into the equity you need.",
    icon: "calculator",
    color: "#4957c9",
  },
  callFold: {
    title: "Call or Fold",
    description: "Is your draw worth the price on the turn?",
    icon: "scale",
    color: "#2f8f5b",
  },
  pushFold: {
    title: "Push or Fold",
    description: "Short-stack shoves and calls, graded by a Nash solver.",
    icon: "cpu",
    color: "#1f6f8b",
  },
  combos: {
    title: "Combos & Blockers",
    description: "Count the hands villain can still hold.",
    icon: "blocks",
    color: "#b5651d",
  },
  mixed: {
    title: "Mixed Session",
    description: "Every skill, for daily reps.",
    icon: "dice",
    color: "#0e7c58",
  },
};

/** Skills in the order they appear on the Practice tab: preflop to river to math. */
export const SKILL_ORDER: Skill[] = [
  "preflop",
  "pushFold",
  "showdown",
  "handName",
  "nuts",
  "combos",
  "outs",
  "equity",
  "potOdds",
  "callFold",
];

export const DRILL_TITLES: Record<DrillKind, string> = Object.fromEntries(
  Object.entries(DRILL_INFO).map(([k, v]) => [k, v.title]),
) as Record<DrillKind, string>;

interface Props {
  progress: Progress;
  now: number;
  onStart: (kind: DrillKind) => void;
  onStartDaily: () => void;
  onStartReview: () => void;
  onStartSpeed: () => void;
  onOpenRanges: () => void;
  onStartMix: (skills: Skill[]) => void;
  onSetLength: (length: number) => void;
}

/** Pick any combination of skills for a custom drill. */
function MixBuilder(props: {
  initial: Skill[];
  length: number;
  onClose: () => void;
  onStart: (skills: Skill[]) => void;
}) {
  const [chosen, setChosen] = useState<Set<Skill>>(() => new Set(props.initial.length ? props.initial : SKILL_ORDER));
  const toggle = (skill: Skill) =>
    setChosen((prev) => {
      const next = new Set(prev);
      if (next.has(skill)) next.delete(skill);
      else next.add(skill);
      return next;
    });
  const selected = SKILL_ORDER.filter((s) => chosen.has(s));

  return (
    <div className="modal-backdrop" onClick={props.onClose}>
      <div
        className="modal mixer"
        role="dialog"
        aria-labelledby="mixer-title"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="icon-disc brand">
          <NamedIcon name="sliders" size={28} />
        </span>
        <h3 id="mixer-title">Build a drill</h3>
        <p>Choose the skills to mix. Questions rotate through them.</p>
        <div className="mixer-actions-top">
          <button className="btn btn-ghost" onClick={() => setChosen(new Set(SKILL_ORDER))}>
            Select all
          </button>
          <button className="btn btn-ghost" onClick={() => setChosen(new Set())}>
            Clear
          </button>
        </div>
        <div className="mixer-grid">
          {SKILL_ORDER.map((skill) => {
            const d = DRILL_INFO[skill];
            const on = chosen.has(skill);
            return (
              <button
                key={skill}
                role="checkbox"
                aria-checked={on}
                className={`mixer-chip ${on ? "on" : ""}`}
                style={{ "--tile-color": d.color } as CSSProperties}
                onClick={() => toggle(skill)}
              >
                <NamedIcon name={d.icon} size={18} />
                {d.title}
                {on && <Check size={16} strokeWidth={3} className="mixer-check" aria-hidden="true" />}
              </button>
            );
          })}
        </div>
        <button className="btn btn-primary" disabled={selected.length === 0} onClick={() => props.onStart(selected)}>
          <Play size={16} fill="currentColor" aria-hidden="true" />
          Start {props.length} questions
        </button>
      </div>
    </div>
  );
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
      <span className="muted num">· {attempts}</span>
    </span>
  );
}

function formatDay(day: string, today: string) {
  if (day === today) return "Today";
  const [y, m, d] = day.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function PracticeScreen(props: Props) {
  const { progress, now, onStart, onStartDaily, onStartReview, onStartSpeed, onOpenRanges, onStartMix, onSetLength } =
    props;
  const [mixerOpen, setMixerOpen] = useState(false);
  const reviewCount = progress.reviewQueue.length;
  const focus = recommendSkill(progress, SKILLS);
  const focusInfo = DRILL_INFO[focus];
  const focusAccuracy = skillAccuracy(progress, focus);
  const focusAttempts = progress.skills[focus]?.attempts ?? 0;
  const dailyDone = isDailyDone(progress, now);
  const todayDate = new Date(now);
  const todayKey = dayKey(now);

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

      <section className={`daily-card ${dailyDone ? "done" : ""}`}>
        <span className="daily-date" aria-hidden="true">
          <span>{todayDate.toLocaleDateString(undefined, { month: "short" })}</span>
          <strong className="num">{todayDate.getDate()}</strong>
        </span>
        <div className="daily-text">
          <span className="eyebrow">Daily Challenge</span>
          <strong>{dailyDone ? "Completed for today" : `${DAILY_LENGTH} hands, every skill`}</strong>
          <span>
            {dailyDone
              ? "New hands tomorrow. Everyone gets the same deal each day."
              : "Everyone gets the same deal today."}
          </span>
        </div>
        {dailyDone ? (
          <span className="daily-check" aria-label="Completed">
            <Check size={22} strokeWidth={3} aria-hidden="true" />
          </span>
        ) : (
          <button className="btn btn-primary" onClick={onStartDaily}>
            Play
            <span className="btn-reward">
              <Gem size={14} aria-hidden="true" /> 20
            </span>
          </button>
        )}
      </section>

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

      <div className="tool-grid">
        <button className="tool-card" onClick={onStartSpeed}>
          <span className="icon-tile gold">
            <Timer size={20} aria-hidden="true" />
          </span>
          <strong>Speed Round</strong>
          <span>60 seconds of quick reads</span>
          {progress.speedBest > 0 && (
            <span className="best-badge num" title="Personal best">
              <Trophy size={12} aria-hidden="true" /> {progress.speedBest}
            </span>
          )}
        </button>
        <button className="tool-card" disabled={reviewCount === 0} onClick={onStartReview}>
          <span className="icon-tile orange">
            <NamedIcon name="repeat" size={20} />
          </span>
          <strong>Review mistakes</strong>
          <span>{reviewCount === 0 ? "Nothing to review" : `${reviewCount} to revisit`}</span>
          {reviewCount > 0 && <span className="count-badge num">{reviewCount}</span>}
        </button>
        <button className="tool-card" onClick={onOpenRanges}>
          <span className="icon-tile brand">
            <NamedIcon name="grid" size={20} />
          </span>
          <strong>Strategy charts</strong>
          <span>Push/fold solver and opening ranges</span>
        </button>
        <button className="tool-card" onClick={() => setMixerOpen(true)}>
          <span className="icon-tile blue">
            <NamedIcon name="sliders" size={20} />
          </span>
          <strong>Build a drill</strong>
          <span>Mix the skills you choose</span>
        </button>
      </div>

      {mixerOpen && (
        <MixBuilder
          initial={progress.customMix}
          length={progress.drillLength}
          onClose={() => setMixerOpen(false)}
          onStart={(skills) => {
            setMixerOpen(false);
            onStartMix(skills);
          }}
        />
      )}

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
        {SKILL_ORDER.map((skill) => {
          const d = DRILL_INFO[skill];
          const mastery = skillMastery(progress, skill);
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
                <span className="drill-title">
                  <strong>{d.title}</strong>
                  {mastery !== "Learning" && <span className={`mastery ${mastery.toLowerCase()}`}>{mastery}</span>}
                </span>
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
      <p className="mastery-note">
        Mastery: <span className="mastery bronze">Bronze</span> 10 answers at 60%,{" "}
        <span className="mastery silver">Silver</span> 25 at 75%, <span className="mastery gold">Gold</span> 50 at 90%.
      </p>

      {progress.history.length > 0 && (
        <>
          <h2 className="section-title">Recent sessions</h2>
          <ul className="history">
            {progress.history.slice(0, 8).map((h, i) => (
              <li key={i}>
                <span className="history-title">
                  {h.title === "Daily Challenge" && <CalendarCheck size={16} aria-hidden="true" />}
                  {h.title}
                </span>
                <span className="muted">{formatDay(h.day, todayKey)}</span>
                <span className={`history-acc num ${h.accuracy >= 0.8 ? "strong" : h.accuracy >= 0.6 ? "ok" : "weak"}`}>
                  {Math.round(h.accuracy * 100)}%
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
