import {
  HEART_REFILL_GEM_COST,
  MAX_HEARTS,
  MAX_STREAK_FREEZES,
  Progress,
  STREAK_FREEZE_GEM_COST,
} from "../state/progress";

interface Props {
  progress: Progress;
  onBuyFreeze: () => void;
  onBuyRefill: () => void;
}

export function ShopScreen({ progress, onBuyFreeze, onBuyRefill }: Props) {
  const freezesFull = progress.streakFreezes >= MAX_STREAK_FREEZES;
  const heartsFull = progress.hearts >= MAX_HEARTS;
  return (
    <div className="shop">
      <h1>Shop</h1>
      <p className="muted">
        You have <strong className="gem-count">💎 {progress.gems}</strong>. Earn gems by finishing lessons (+10 for a
        perfect one) and practice drills.
      </p>

      <div className="shop-item">
        <span className="shop-icon">🧊</span>
        <div className="shop-text">
          <strong>Streak Freeze</strong>
          <span>
            Keeps your streak alive if you miss a day. Equipped: {progress.streakFreezes}/{MAX_STREAK_FREEZES}
          </span>
        </div>
        <button
          className="btn btn-blue"
          disabled={freezesFull || progress.gems < STREAK_FREEZE_GEM_COST}
          onClick={onBuyFreeze}
        >
          {freezesFull ? "Full" : `💎 ${STREAK_FREEZE_GEM_COST}`}
        </button>
      </div>

      <div className="shop-item">
        <span className="shop-icon">❤️</span>
        <div className="shop-text">
          <strong>Refill Hearts</strong>
          <span>
            Get all {MAX_HEARTS} hearts back right now. You have {progress.hearts}/{MAX_HEARTS}.
          </span>
        </div>
        <button
          className="btn btn-blue"
          disabled={heartsFull || progress.gems < HEART_REFILL_GEM_COST}
          onClick={onBuyRefill}
        >
          {heartsFull ? "Full" : `💎 ${HEART_REFILL_GEM_COST}`}
        </button>
      </div>
    </div>
  );
}
