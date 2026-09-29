import { Gem, Heart, Snowflake } from "lucide-react";
import type { ReactNode } from "react";
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

function ShopItem(props: {
  icon: ReactNode;
  tone: string;
  title: string;
  description: string;
  status: string;
  cost: number;
  full: boolean;
  gems: number;
  onBuy: () => void;
}) {
  const affordable = props.gems >= props.cost;
  return (
    <div className="shop-item">
      <span className={`icon-tile lg ${props.tone}`}>{props.icon}</span>
      <div className="row-text">
        <strong>{props.title}</strong>
        <span>{props.description}</span>
        <span className="shop-status">{props.status}</span>
      </div>
      <button className="btn btn-secondary price" disabled={props.full || !affordable} onClick={props.onBuy}>
        {props.full ? (
          "Full"
        ) : (
          <>
            <Gem size={16} aria-hidden="true" />
            <span className="num">{props.cost}</span>
          </>
        )}
      </button>
    </div>
  );
}

export function ShopScreen({ progress, onBuyFreeze, onBuyRefill }: Props) {
  return (
    <div className="page">
      <header className="page-head">
        <h1>Shop</h1>
        <p>Earn gems by finishing lessons (10 for a perfect one) and practice drills.</p>
        <span className="pill gems">
          <Gem size={14} aria-hidden="true" /> <span className="num">{progress.gems}</span> gems
        </span>
      </header>

      <div className="shop-list">
        <ShopItem
          icon={<Snowflake size={24} aria-hidden="true" />}
          tone="blue"
          title="Streak Freeze"
          description="Keeps your streak alive through a missed day. Used automatically."
          status={`Equipped ${progress.streakFreezes} of ${MAX_STREAK_FREEZES}`}
          cost={STREAK_FREEZE_GEM_COST}
          full={progress.streakFreezes >= MAX_STREAK_FREEZES}
          gems={progress.gems}
          onBuy={onBuyFreeze}
        />
        <ShopItem
          icon={<Heart size={24} fill="currentColor" aria-hidden="true" />}
          tone="red"
          title="Refill Hearts"
          description={`Get all ${MAX_HEARTS} hearts back right away.`}
          status={`${progress.hearts} of ${MAX_HEARTS} hearts`}
          cost={HEART_REFILL_GEM_COST}
          full={progress.hearts >= MAX_HEARTS}
          gems={progress.gems}
          onBuy={onBuyRefill}
        />
      </div>
    </div>
  );
}
