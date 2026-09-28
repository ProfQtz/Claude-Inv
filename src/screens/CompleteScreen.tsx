import type { Reward } from "../state/progress";

interface Props {
  title: string;
  reward: Reward;
  accuracy: number;
  durationMs: number;
  streak: number;
  onContinue: () => void;
}

function formatDuration(ms: number) {
  const s = Math.round(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function CompleteScreen({ title, reward, accuracy, durationMs, streak, onContinue }: Props) {
  const perfect = accuracy >= 1;
  return (
    <div className="complete">
      <div className="complete-hero">{perfect ? "💎" : "🎉"}</div>
      <h1>{perfect ? "Perfect!" : "Complete!"}</h1>
      <p className="muted">{title}</p>
      <div className="stat-tiles">
        <div className="tile-stat gold">
          <span>Total XP</span>
          <strong>⚡ {reward.xp}</strong>
        </div>
        <div className="tile-stat green">
          <span>{perfect ? "Amazing" : "Accuracy"}</span>
          <strong>🎯 {Math.round(accuracy * 100)}%</strong>
        </div>
        <div className="tile-stat blue">
          <span>Time</span>
          <strong>⏱ {formatDuration(durationMs)}</strong>
        </div>
      </div>
      <ul className="reward-list">
        <li>💎 +{reward.gems} gems</li>
        {reward.heartsRestored > 0 && <li>❤️ +{reward.heartsRestored} heart</li>}
        {reward.streakExtended && <li>🔥 {streak}-day streak!</li>}
        {reward.freezesUsed > 0 && (
          <li>
            🧊 {reward.freezesUsed} streak freeze{reward.freezesUsed > 1 ? "s" : ""} used
          </li>
        )}
      </ul>
      <button className="btn btn-green wide" onClick={onContinue} autoFocus>
        Continue
      </button>
    </div>
  );
}
