import { BookOpen, Check, Copy, Download, Flame, Lock, Medal, Mountain, TriangleAlert, Upload, Zap } from "lucide-react";
import { useState } from "react";
import { NamedIcon } from "../components/Icons";
import { LESSON_ORDER } from "../course/course";
import {
  achievements,
  addDays,
  currentStreak,
  dayKey,
  decodeBackup,
  encodeBackup,
  isLessonComplete,
  level,
  Progress,
  topTrack,
} from "../state/progress";
import { GOALS } from "./OnboardingScreen";

interface Props {
  progress: Progress;
  now: number;
  onSetGoal: (xp: number) => void;
  onToggleSound: () => void;
  onReset: () => void;
  onRestore: (p: Progress) => void;
}

const WEEKDAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function TopTrack({ progress }: { progress: Progress }) {
  const milestones = topTrack(progress);
  const done = milestones.filter((m) => m.value >= m.target).length;
  return (
    <section className="track-card">
      <div className="track-head">
        <span className="icon-tile gold lg">
          <Mountain size={24} aria-hidden="true" />
        </span>
        <div>
          <span className="eyebrow">Path to top 10%</span>
          <strong className="num">
            {done} of {milestones.length} milestones
          </strong>
        </div>
      </div>
      <div className="meter gold" aria-hidden="true">
        <div style={{ width: `${(done / milestones.length) * 100}%` }} />
      </div>
      <ul className="track-list">
        {milestones.map((m) => {
          const complete = m.value >= m.target;
          return (
            <li key={m.id} className={complete ? "done" : ""}>
              <span className="track-check" aria-hidden="true">
                {complete && <Check size={14} strokeWidth={3} />}
              </span>
              <span className="row-text">
                <strong>{m.title}</strong>
                <span>{m.description}</span>
              </span>
              <span className="track-value num">
                {m.value}/{m.target}
              </span>
            </li>
          );
        })}
      </ul>
      <p className="track-note">
        The track covers what strong regulars know and practice. Winning at real tables also takes experience, bankroll
        discipline and good game selection.
      </p>
    </section>
  );
}

function Backup({ progress, onRestore }: { progress: Progress; onRestore: (p: Progress) => void }) {
  const [shown, setShown] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [paste, setPaste] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<Progress | null>(null);

  async function copy() {
    const code = encodeBackup(progress);
    setShown(code);
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
    } catch {
      // Clipboard can be blocked; the code is shown so it can be copied by hand.
      setCopied(false);
    }
  }

  function download() {
    const blob = new Blob([encodeBackup(progress)], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pokerlingo-backup-${dayKey(Date.now())}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function restore() {
    const p = decodeBackup(paste);
    if (!p) {
      setError("That isn't a PokerLingo backup code. It should start with PL1.");
      return;
    }
    setError(null);
    setPending(p);
  }

  return (
    <div className="panel backup">
      <div className="panel-head">
        <div>
          <strong>Back up your progress</strong>
          <span className="muted">Progress lives only in this browser. Save a code to move it or keep it safe.</span>
        </div>
      </div>
      <div className="backup-actions">
        <button className="btn btn-secondary" onClick={copy}>
          <Copy size={16} aria-hidden="true" /> {copied ? "Copied" : "Copy backup code"}
        </button>
        <button className="btn btn-secondary" onClick={download}>
          <Download size={16} aria-hidden="true" /> Download file
        </button>
      </div>
      {shown && (
        <textarea
          className="code-box"
          readOnly
          value={shown}
          aria-label="Backup code"
          onFocus={(e) => e.currentTarget.select()}
          rows={3}
        />
      )}
      <label className="restore-label" htmlFor="restore-code">
        <strong>Restore from a code</strong>
      </label>
      <textarea
        id="restore-code"
        className="code-box"
        placeholder="Paste a backup code starting with PL1."
        value={paste}
        onChange={(e) => setPaste(e.target.value)}
        rows={3}
      />
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <button className="btn btn-secondary restore-btn" disabled={!paste.trim()} onClick={restore}>
        <Upload size={16} aria-hidden="true" /> Restore
      </button>

      {pending && (
        <div className="modal-backdrop">
          <div className="modal">
            <span className="icon-disc brand">
              <Upload size={28} aria-hidden="true" />
            </span>
            <h3>Replace your progress?</h3>
            <p>
              The backup has {pending.xp} XP and {Object.keys(pending.lessons).length} lessons. Your current progress
              on this device will be replaced.
            </p>
            <button className="btn btn-secondary" onClick={() => setPending(null)} autoFocus>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={() => {
                onRestore(pending);
                setPending(null);
                setPaste("");
              }}
            >
              Restore backup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function About() {
  return (
    <div className="about">
      <div className="panel">
        <strong>About PokerLingo</strong>
        <p>
          PokerLingo teaches poker strategy. There is no real-money gambling here, and it isn't affiliated with any poker
          site. Math drills and the push/fold solver are computed exactly; opening and facing-a-raise charts are
          simplified baselines for learning.
        </p>
      </div>
      <div className="panel">
        <strong>Play responsibly</strong>
        <p>
          Poker for real money is gambling. Only play where it's legal and you're old enough, and never with money you
          can't afford to lose. If gambling stops being fun, free and confidential help is available:
        </p>
        <ul className="help-links">
          <li>
            <a href="https://www.ncpgambling.org/" target="_blank" rel="noopener noreferrer">
              National Council on Problem Gambling
            </a>{" "}
            <span className="muted">(US)</span>
          </li>
          <li>
            <a href="https://www.gamcare.org.uk/" target="_blank" rel="noopener noreferrer">
              GamCare
            </a>{" "}
            <span className="muted">(UK)</span>
          </li>
          <li>
            <a href="https://www.gamblersanonymous.org/" target="_blank" rel="noopener noreferrer">
              Gamblers Anonymous
            </a>{" "}
            <span className="muted">(worldwide)</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

export function ProfileScreen({ progress, now, onSetGoal, onToggleSound, onReset, onRestore }: Props) {
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

      <TopTrack progress={progress} />

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

      <Backup progress={progress} onRestore={onRestore} />

      <h2 className="section-title">About</h2>
      <About />

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
            <p>Your XP, streak, gems, lesson progress and hand history will be erased. This can't be undone.</p>
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
