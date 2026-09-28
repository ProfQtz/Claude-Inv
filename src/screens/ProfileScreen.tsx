import { BookOpen, Flame, Lock, Medal, TriangleAlert, Zap } from "lucide-react";
import { useState } from "react";
import { NamedIcon } from "../components/Icons";
import { LESSON_ORDER } from "../course/course";
import { achievements, addDays, currentStreak, dayKey, isLessonComplete, level, Progress } from "../state/progress";

interface Props {
  progress: Progress;
  now: number;
  onSetGoal: (xp: number) => void;
  onToggleSound: () => void;
  onReset: () => void;
}

const GOALS = [
  { xp: 15, label: "Casual" },
  { xp: 30, label: "Regular" },
  { xp: 50, label: "Serious" },
  { xp: 100, label: "Grinder" },
];

const WEEKDAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function ProfileScreen({ progress, now, onSetGoal, onToggleSound, onReset }: Props) {
  const [confirmReset, setConfirmReset] = useState(false);
  const lvl = level(progress);
  const completed = LESSON_ORDER.filter((id) => isLessonComplete(progress, id)).length;

  const today = dayKey(now);
  const week = Array.from({ length: 7 }, (_, i) => {
    const day = addDays(today, i - 6);
    const [y, m, d] = day.split("-").map(Number);
    return { day, label: WEEKDAY[new Date(y, m - 1, d).getDay()], xp: progress.xpByDay[day] ?? 0 };
  });
  const maxXp = Math.max(progress.dailyGoal, ...week.map((w) => w.xp));

  return (
    <div className="page profile">
      <section className="profile-head">
        <span className="avatar" aria-hidden="true">
          ♠
        </span>
        <div className="profile-level">
          <span className="eyebrow">Player level</span>
          <h1>Level {lvl.level}</h1>
          <div className="meter brand" aria-hidden="true">
            <div style={{ width: `${(lvl.into / lvl.needed) * 100}%` }} />
          </div>
          <span className="muted num">
            {lvl.into} / {lvl.needed} XP to level {lvl.level + 1}
          </span>
        </div>
      </section>

      <h2 className="section-title">Statistics</h2>
      <div className="stats-grid">
        <div className="stat-box">
          <span className="icon-tile orange">
            <Flame size={18} aria-hidden="true" />
          </span>
          <strong className="num">{currentStreak(progress, now)}</strong>
          <small>Day streak</small>
        </div>
        <div className="stat-box">
          <span className="icon-tile gold">
            <Zap size={18} aria-hidden="true" />
          </span>
          <strong className="num">{progress.xp}</strong>
          <small>Total XP</small>
        </div>
        <div className="stat-box">
          <span className="icon-tile brand">
            <BookOpen size={18} aria-hidden="true" />
          </span>
          <strong className="num">
            {completed}/{LESSON_ORDER.length}
          </strong>
          <small>Lessons</small>
        </div>
        <div className="stat-box">
          <span className="icon-tile blue">
            <Medal size={18} aria-hidden="true" />
          </span>
          <strong className="num">{progress.longestStreak}</strong>
          <small>Best streak</small>
        </div>
      </div>

      <h2 className="section-title">Last 7 days</h2>
      <div className="week-chart" role="img" aria-label="XP earned over the last 7 days">
        {week.map((w) => (
          <div key={w.day} className="week-col" title={`${w.xp} XP`}>
            <span className="week-value num">{w.xp || ""}</span>
            <div className="week-bar-track">
              <div
                className={`week-bar ${w.xp >= progress.dailyGoal ? "met" : ""}`}
                style={{ height: `${(w.xp / maxXp) * 100}%` }}
              />
            </div>
            <span className={`week-label ${w.day === today ? "today" : ""}`}>{w.label}</span>
          </div>
        ))}
      </div>

      <p className="chart-note">
        <span className="swatch met" aria-hidden="true" /> Met your {progress.dailyGoal} XP daily goal
      </p>

      <h2 className="section-title">Achievements</h2>
      <div className="achievements">
        {achievements(progress).map((a) => (
          <div key={a.id} className={`achievement ${a.unlocked ? "unlocked" : ""}`}>
            <span className={`icon-tile ${a.unlocked ? "gold" : "muted"}`}>
              {a.unlocked ? <NamedIcon name={a.icon} size={20} /> : <Lock size={18} aria-hidden="true" />}
            </span>
            <div>
              <strong>{a.title}</strong>
              <small>{a.description}</small>
            </div>
          </div>
        ))}
      </div>

      <h2 className="section-title">Daily goal</h2>
      <div className="goal-options">
        {GOALS.map((g) => (
          <button
            key={g.xp}
            className={`goal-option ${progress.dailyGoal === g.xp ? "selected" : ""}`}
            onClick={() => onSetGoal(g.xp)}
          >
            <strong>{g.label}</strong>
            <span>{g.xp} XP / day</span>
          </button>
        ))}
      </div>

      <h2 className="section-title">Settings</h2>
      <label className="toggle-row">
        <span>
          <strong>Sound effects</strong>
          <small>Chimes for right and wrong answers</small>
        </span>
        <input type="checkbox" role="switch" checked={progress.soundOn} onChange={onToggleSound} />
      </label>

      <button className="btn btn-ghost danger reset" onClick={() => setConfirmReset(true)}>
        Reset all progress
      </button>

      {confirmReset && (
        <div className="modal-backdrop">
          <div className="modal">
            <span className="icon-disc red">
              <TriangleAlert size={28} aria-hidden="true" />
            </span>
            <h3>Reset everything?</h3>
            <p>Your XP, streak, gems and lesson progress will be erased. This can't be undone.</p>
            <button className="btn btn-secondary" onClick={() => setConfirmReset(false)} autoFocus>
              Keep my progress
            </button>
            <button
              className="btn btn-danger"
              onClick={() => {
                onReset();
                setConfirmReset(false);
              }}
            >
              Reset
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
