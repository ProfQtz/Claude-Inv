import { currentStreak, MAX_HEARTS, nextHeartIn, Progress } from "../state/progress";

function formatWait(ms: number) {
  const minutes = Math.ceil(ms / 60_000);
  return `${minutes} min`;
}

export function TopBar({ progress, now }: { progress: Progress; now: number }) {
  const streak = currentStreak(progress, now);
  const wait = nextHeartIn(progress, now);
  return (
    <header className="top-bar">
      <span className="brand">
        <span className="brand-mark">♠</span> PokerLingo
      </span>
      <div className="top-stats">
        <span className={`stat ${streak > 0 ? "streak-on" : "muted"}`} title="Day streak">
          🔥 {streak}
        </span>
        <span className="stat gems" title="Gems">
          💎 {progress.gems}
        </span>
        <span
          className="stat hearts"
          title={wait === null ? "Hearts full" : `Next heart in ${formatWait(wait)}`}
        >
          ❤️ {progress.hearts}
          {progress.hearts < MAX_HEARTS && wait !== null && <small>{formatWait(wait)}</small>}
        </span>
      </div>
    </header>
  );
}
