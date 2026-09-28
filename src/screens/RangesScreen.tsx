import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import {
  CHART_RANKS,
  chartLabel,
  combos,
  OPENING_RANGES,
  OPENING_SETS,
  type Position,
  POSITIONS,
  rangePercent,
} from "../poker/ranges";

export function RangesScreen({ onBack }: { onBack: () => void }) {
  const [position, setPosition] = useState<Position>("BTN");
  const [hover, setHover] = useState<string | null>(null);
  const range = OPENING_SETS[position];
  const name = POSITIONS.find((p) => p.id === position)!.name;

  return (
    <div className="page ranges">
      <button className="btn btn-ghost back" onClick={onBack}>
        <ArrowLeft size={18} aria-hidden="true" /> Practice
      </button>
      <header className="page-head">
        <h1>Opening ranges</h1>
        <p>
          Which hands to raise when everyone folds to you, at a 6-max table with 100 BB stacks. These are simplified
          charts: easy to memorize and close to what strong players use.
        </p>
      </header>

      <div className="segmented wide" role="tablist" aria-label="Position">
        {POSITIONS.map((p) => (
          <button
            key={p.id}
            role="tab"
            aria-selected={position === p.id}
            className={position === p.id ? "on" : ""}
            onClick={() => setPosition(p.id)}
          >
            {p.id}
          </button>
        ))}
      </div>

      <div className="range-summary">
        <div>
          <span className="eyebrow">{name}</span>
          <strong className="num">{Math.round(rangePercent(range) * 100)}% of hands</strong>
        </div>
        <span className="range-hover num" aria-live="polite">
          {hover ? `${hover} · ${combos(hover)} combos · ${range.has(hover) ? "Raise" : "Fold"}` : "Tap a hand for details"}
        </span>
      </div>

      <div className="range-grid-wrap">
        <div className="range-grid" role="grid" aria-label={`${name} opening range`}>
          {CHART_RANKS.map((_, row) => (
            <div key={row} role="row" className="range-row">
              {CHART_RANKS.map((__, col) => {
                const label = chartLabel(row, col);
                const kind = row === col ? "pair" : row < col ? "suited" : "offsuit";
                const open = range.has(label);
                return (
                  <button
                    key={col}
                    role="gridcell"
                    aria-label={`${label}: ${open ? "raise" : "fold"}`}
                    className={`range-cell ${kind} ${open ? "open" : ""} ${hover === label ? "focus" : ""}`}
                    onMouseEnter={() => setHover(label)}
                    onFocus={() => setHover(label)}
                    onClick={() => setHover(label)}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="range-legend">
        <span>
          <i className="swatch open" /> Raise
        </span>
        <span>
          <i className="swatch fold" /> Fold
        </span>
        <span className="muted">Pairs on the diagonal · suited above · offsuit below</span>
      </div>

      <p className="range-text">
        <span className="eyebrow">Shorthand</span>
        <code>{OPENING_RANGES[position]}</code>
      </p>
    </div>
  );
}
