import type { DrillKind } from "../course/generator";
import { MAX_HEARTS, Progress } from "../state/progress";

const DRILLS: { kind: DrillKind; title: string; description: string; icon: string; color: string }[] = [
  {
    kind: "showdown",
    title: "Showdown",
    description: "Random boards — pick the winning hand.",
    icon: "⚔️",
    color: "#ff9600",
  },
  {
    kind: "handName",
    title: "Name That Hand",
    description: "Find your best five cards from seven.",
    icon: "🏆",
    color: "#1cb0f6",
  },
  {
    kind: "potOdds",
    title: "Pot Odds",
    description: "Turn bet sizes into the equity you need.",
    icon: "🧮",
    color: "#2b70c9",
  },
  {
    kind: "mixed",
    title: "Mixed Session",
    description: "A bit of everything. Great for daily reps.",
    icon: "🎲",
    color: "#58cc02",
  },
];

export function PracticeScreen({ progress, onStart }: { progress: Progress; onStart: (kind: DrillKind) => void }) {
  return (
    <div className="practice">
      <h1>Practice</h1>
      <p className="muted">
        Endless, randomly dealt drills. No hearts at stake — and each one you finish restores a heart
        {progress.hearts < MAX_HEARTS ? ` (you have ${progress.hearts}/${MAX_HEARTS})` : ""}.
      </p>
      <div className="drill-grid">
        {DRILLS.map((d) => (
          <button key={d.kind} className="drill-card" onClick={() => onStart(d.kind)}>
            <span className="drill-icon" style={{ background: d.color }}>
              {d.icon}
            </span>
            <span className="drill-text">
              <strong>{d.title}</strong>
              <span>{d.description}</span>
            </span>
            <span className="drill-go">›</span>
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
