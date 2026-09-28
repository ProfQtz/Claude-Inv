import { ChevronRight, Heart } from "lucide-react";
import type { CSSProperties } from "react";
import type { DrillKind } from "../course/generator";
import { NamedIcon } from "../components/Icons";
import { MAX_HEARTS, Progress } from "../state/progress";

const DRILLS: { kind: DrillKind; title: string; description: string; icon: string; color: string }[] = [
  {
    kind: "showdown",
    title: "Showdown",
    description: "Random boards. Pick the winning hand.",
    icon: "swords",
    color: "#d27a14",
  },
  {
    kind: "handName",
    title: "Name That Hand",
    description: "Find your best five cards from seven.",
    icon: "trophy",
    color: "#2f6fde",
  },
  {
    kind: "potOdds",
    title: "Pot Odds",
    description: "Turn bet sizes into the equity you need.",
    icon: "calculator",
    color: "#4957c9",
  },
  {
    kind: "mixed",
    title: "Mixed Session",
    description: "A bit of everything, for daily reps.",
    icon: "dice",
    color: "#0e7c58",
  },
];

interface Props {
  progress: Progress;
  onStart: (kind: DrillKind) => void;
  onStartReview: () => void;
}

export function PracticeScreen({ progress, onStart, onStartReview }: Props) {
  const reviewCount = progress.reviewQueue.length;
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

      <button className="review-card" disabled={reviewCount === 0} onClick={onStartReview}>
        <span className="icon-tile orange lg">
          <NamedIcon name="repeat" size={24} />
        </span>
        <span className="row-text">
          <strong>Review mistakes</strong>
          <span>
            {reviewCount === 0
              ? "Questions you miss in lessons show up here."
              : `${reviewCount} question${reviewCount === 1 ? "" : "s"} to revisit. Answer one correctly to clear it.`}
          </span>
        </span>
        {reviewCount > 0 ? <span className="count-badge num">{reviewCount}</span> : null}
      </button>

      <h2 className="section-title">Drills</h2>
      <div className="drill-grid">
        {DRILLS.map((d) => (
          <button
            key={d.kind}
            className="drill-card"
            style={{ "--tile-color": d.color } as CSSProperties}
            onClick={() => onStart(d.kind)}
          >
            <span className="icon-tile tinted lg">
              <NamedIcon name={d.icon} size={24} />
            </span>
            <span className="row-text">
              <strong>{d.title}</strong>
              <span>{d.description}</span>
            </span>
            <ChevronRight className="row-chevron" size={20} aria-hidden="true" />
          </button>
        ))}
      </div>
    </div>
  );
}

export const DRILL_TITLES: Record<DrillKind, string> = Object.fromEntries(DRILLS.map((d) => [d.kind, d.title])) as Record<
  DrillKind,
  string
>;
