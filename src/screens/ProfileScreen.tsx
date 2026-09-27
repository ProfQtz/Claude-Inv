import { useState } from "react";
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
    <div className="profile">
      <section className="profile-head">
        <div className="avatar">🂡</div>
        <div>
          <h1>Level {lvl.level}</h1>
          <div className="progress-track small">
            <div className="progress-fill blue" style={{ width: `${(lvl.into / lvl.needed) * 100}%` }} />
          </div>
          <span className="muted">
            {lvl.into} / {lvl.needed} XP to level {lvl.level + 1}
          </span>
        </div>
      </section>

      <h2>Statistics</h2>
      <div className="stats-grid">
        <div className="stat-box">
          <span>🔥</span>
          <strong>{currentStreak(progress, now)}</strong>
          <small>Day streak</small>
        </div>
        <div className="stat-box">
          <span>⚡</span>
          <strong>{progress.xp}</strong>
          <small>Total XP</small>
        </div>
        <div className="stat-box">
          <span>📚</span>
          <strong>
            {completed}/{LESSON_ORDER.length}
          </strong>
          <small>Lessons</small>
        </div>
        <div className="stat-box">
          <span>🏅</span>
          <strong>{progress.longestStreak}</strong>
          <small>Best streak</small>
        </div>
      </div>

      <h2>This week</h2>
      <div className="week-chart" role="img" aria-label="XP earned over the last 7 days">
        {week.map((w) => (
          <div key={w.day} className="week-col" title={`${w.xp} XP`}>
            <span className="week-value">{w.xp || ""}</span>
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

      <h2>Achievements</h2>
      <div className="achievements">
        {achievements(progress).map((a) => (
          <div key={a.id} className={`achievement ${a.unlocked ? "unlocked" : ""}`}>
            <span className="achievement-icon">{a.unlocked ? a.icon : "🔒"}</span>
            <div>
              <strong>{a.title}</strong>
              <small>{a.description}</small>
            </div>
          </div>
        ))}
      </div>

      <h2>Daily goal</h2>
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

      <h2>Settings</h2>
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
            <div className="modal-icon">⚠️</div>
            <h3>Reset everything?</h3>
            <p>Your XP, streak, gems and lesson progress will be erased. This can't be undone.</p>
            <button className="btn btn-blue" onClick={() => setConfirmReset(false)} autoFocus>
              Keep my progress
            </button>
            <button
              className="btn btn-ghost danger"
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
