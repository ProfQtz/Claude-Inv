import { Dumbbell, Flame, Gem, Heart, House, LibraryBig, Play, Snowflake, Store, Target, UserRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { findLesson } from "../course/course";
import {
  currentStreak,
  level,
  MAX_HEARTS,
  nextHeartIn,
  nextLessonId,
  Progress,
  xpToday,
} from "../state/progress";

export type Tab = "learn" | "practice" | "library" | "shop" | "profile";

export const TABS: { id: Tab; label: string; icon: LucideIcon }[] = [
  { id: "learn", label: "Learn", icon: House },
  { id: "practice", label: "Practice", icon: Dumbbell },
  { id: "library", label: "Library", icon: LibraryBig },
  { id: "shop", label: "Shop", icon: Store },
  { id: "profile", label: "Profile", icon: UserRound },
];

function Brand() {
  return (
    <span className="brand">
      <span className="brand-mark" aria-hidden="true">
        ♠
      </span>
      PokerLingo
    </span>
  );
}

interface NavProps {
  tab: Tab;
  onTab: (tab: Tab) => void;
}

/** Desktop navigation. */
export function Sidebar({ tab, onTab }: NavProps) {
  return (
    <aside className="sidebar">
      <Brand />
      <nav className="side-nav" aria-label="Main">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} className={tab === id ? "active" : ""} aria-current={tab === id ? "page" : undefined} onClick={() => onTab(id)}>
            <Icon size={20} aria-hidden="true" />
            {label}
          </button>
        ))}
      </nav>
    </aside>
  );
}

/** Mobile navigation. */
export function BottomNav({ tab, onTab }: NavProps) {
  return (
    <nav className="bottom-nav" aria-label="Main">
      {TABS.map(({ id, label, icon: Icon }) => (
        <button key={id} className={tab === id ? "active" : ""} aria-current={tab === id ? "page" : undefined} onClick={() => onTab(id)}>
          <Icon size={22} aria-hidden="true" />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}

function formatWait(ms: number) {
  return `${Math.ceil(ms / 60_000)}m`;
}

export function StatChips({ progress, now }: { progress: Progress; now: number }) {
  const streak = currentStreak(progress, now);
  const wait = nextHeartIn(progress, now);
  return (
    <div className="stat-chips">
      <span className={`chip-stat streak ${streak > 0 ? "on" : ""}`} title="Day streak">
        <Flame size={18} aria-hidden="true" fill={streak > 0 ? "currentColor" : "none"} />
        <span className="num">{streak}</span>
        <span className="sr-only">day streak</span>
      </span>
      <span className="chip-stat gems" title="Gems">
        <Gem size={18} aria-hidden="true" />
        <span className="num">{progress.gems}</span>
        <span className="sr-only">gems</span>
      </span>
      <span className="chip-stat hearts" title={wait === null ? "Hearts full" : `Next heart in ${formatWait(wait)}`}>
        <Heart size={18} aria-hidden="true" fill="currentColor" />
        <span className="num">{progress.hearts}</span>
        <span className="sr-only">hearts</span>
        {progress.hearts < MAX_HEARTS && wait !== null && <small>{formatWait(wait)}</small>}
      </span>
    </div>
  );
}

export function TopBar({ progress, now }: { progress: Progress; now: number }) {
  return (
    <header className="top-bar">
      <Brand />
      <StatChips progress={progress} now={now} />
    </header>
  );
}

export function DailyGoalCard({ progress, now }: { progress: Progress; now: number }) {
  const today = xpToday(progress, now);
  const pct = Math.min(1, today / progress.dailyGoal);
  return (
    <section className="panel daily-goal">
      <div className="panel-head">
        <span className="icon-tile gold">
          <Target size={18} aria-hidden="true" />
        </span>
        <div>
          <strong>Daily goal</strong>
          <span className="muted">{pct >= 1 ? "Done for today" : `${progress.dailyGoal - today} XP to go`}</span>
        </div>
        <span className="num goal-num">
          {today}/{progress.dailyGoal}
        </span>
      </div>
      <div className="meter gold" role="progressbar" aria-valuenow={today} aria-valuemax={progress.dailyGoal}>
        <div style={{ width: `${pct * 100}%` }} />
      </div>
    </section>
  );
}

export function RightRail({
  progress,
  now,
  onContinue,
}: {
  progress: Progress;
  now: number;
  onContinue: (lessonId: string) => void;
}) {
  const nextId = nextLessonId(progress);
  const next = nextId ? findLesson(nextId) : undefined;
  const lvl = level(progress);
  const streak = currentStreak(progress, now);

  return (
    <aside className="right-rail">
      <StatChips progress={progress} now={now} />

      {next && nextId && (
        <section className="panel up-next">
          <span className="eyebrow">Up next · {next.unit.title}</span>
          <strong className="up-next-title">{next.lesson.title}</strong>
          <button className="btn btn-primary" onClick={() => onContinue(nextId)}>
            <Play size={16} fill="currentColor" aria-hidden="true" />
            Continue
          </button>
        </section>
      )}

      <DailyGoalCard progress={progress} now={now} />

      <section className="panel">
        <div className="panel-head">
          <span className="icon-tile orange">
            <Flame size={18} aria-hidden="true" />
          </span>
          <div>
            <strong>{streak}-day streak</strong>
            <span className="muted">{streak > 0 ? "Play today to keep it going" : "Finish a lesson to start one"}</span>
          </div>
        </div>
        {progress.streakFreezes > 0 && (
          <p className="panel-note">
            <Snowflake size={14} aria-hidden="true" /> {progress.streakFreezes} streak freeze
            {progress.streakFreezes > 1 ? "s" : ""} equipped
          </p>
        )}
      </section>

      <section className="panel">
        <div className="panel-head">
          <span className="level-badge num">{lvl.level}</span>
          <div>
            <strong>Level {lvl.level}</strong>
            <span className="muted">
              {lvl.needed - lvl.into} XP to level {lvl.level + 1}
            </span>
          </div>
        </div>
        <div className="meter brand" aria-hidden="true">
          <div style={{ width: `${(lvl.into / lvl.needed) * 100}%` }} />
        </div>
      </section>
    </aside>
  );
}
