import { Crown, Gem, Heart, Flame, Snowflake, Target, Timer, Trophy, Zap } from "lucide-react";
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
    <div className="complete-screen">
      <span className="complete-hero" aria-hidden="true">
        {perfect ? <Crown size={48} /> : <Trophy size={48} />}
      </span>
      <span className="eyebrow">{title}</span>
      <h1>{perfect ? "Perfect session" : "Session complete"}</h1>

      <div className="result-tiles">
        <div className="result-tile gold">
          <span className="result-label">
            <Zap size={14} aria-hidden="true" /> XP
          </span>
          <strong className="num">+{reward.xp}</strong>
        </div>
        <div className="result-tile brand">
          <span className="result-label">
            <Target size={14} aria-hidden="true" /> Accuracy
          </span>
          <strong className="num">{Math.round(accuracy * 100)}%</strong>
        </div>
        <div className="result-tile blue">
          <span className="result-label">
            <Timer size={14} aria-hidden="true" /> Time
          </span>
          <strong className="num">{formatDuration(durationMs)}</strong>
        </div>
      </div>

      <ul className="reward-list">
        <li>
          <Gem size={16} aria-hidden="true" /> +{reward.gems} gems
        </li>
        {reward.heartsRestored > 0 && (
          <li>
            <Heart size={16} fill="currentColor" aria-hidden="true" /> +{reward.heartsRestored} heart
          </li>
        )}
        {reward.streakExtended && (
          <li>
            <Flame size={16} fill="currentColor" aria-hidden="true" /> {streak}-day streak
          </li>
        )}
        {reward.freezesUsed > 0 && (
          <li>
            <Snowflake size={16} aria-hidden="true" /> {reward.freezesUsed} streak freeze
            {reward.freezesUsed > 1 ? "s" : ""} used
          </li>
        )}
      </ul>

      <button className="btn btn-primary wide" onClick={onContinue} autoFocus>
        Continue
      </button>
    </div>
  );
}
