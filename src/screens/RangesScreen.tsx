import { ArrowLeft, Cpu } from "lucide-react";
import { type CSSProperties, useMemo, useState } from "react";
import { rangeEquity, recommend, type Seat, solvePushFold } from "../poker/nash";
import { CLASS_INDEX } from "../poker/preflop";
import {
  CHART_RANKS,
  chartLabel,
  combos,
  FACING_SETS,
  FACING_SPOTS,
  type FacingAction,
  facingAction,
  OPENING_RANGES,
  OPENING_SETS,
  type Position,
  POSITIONS,
  rangePercent,
} from "../poker/ranges";

type ChartTab = "opening" | "facing" | "pushfold";

interface CellLook {
  /** Extra classes: "open", "mixed", "threebet", "call"… */
  state: string;
  /** Screen-reader description of the cell's action. */
  describe: string;
  /** Action frequency for shading mixed cells, 0..1. */
  freq?: number;
}

/** Shading for single-action charts: full cells for pure actions, tinted cells for mixes. */
function freqLook(f: number, action: string): CellLook {
  return {
    state: f >= 1 ? "open" : f > 0 ? `mixed ${f >= 0.5 ? "hi" : ""}` : "",
    describe: f >= 1 ? action : f > 0 ? `${action} ${Math.round(f * 100)}%` : "fold",
    freq: f,
  };
}

/** 13×13 hand grid, colored by `look` for each hand label. */
function HandGrid(props: {
  ariaLabel: string;
  look: (label: string) => CellLook;
  selected: string | null;
  onSelect: (label: string) => void;
}) {
  return (
    <div className="range-grid-wrap">
      <div className="range-grid" role="grid" aria-label={props.ariaLabel}>
        {CHART_RANKS.map((_, row) => (
          <div key={row} role="row" className="range-row">
            {CHART_RANKS.map((__, col) => {
              const label = chartLabel(row, col);
              const kind = row === col ? "pair" : row < col ? "suited" : "offsuit";
              const look = props.look(label);
              return (
                <button
                  key={col}
                  role="gridcell"
                  aria-label={`${label}: ${look.describe}`}
                  className={`range-cell ${kind} ${look.state} ${props.selected === label ? "focus" : ""}`}
                  style={{ "--freq": `${(look.freq ?? 0) * 100}%` } as CSSProperties}
                  onMouseEnter={() => props.onSelect(label)}
                  onFocus={() => props.onSelect(label)}
                  onClick={() => props.onSelect(label)}
                >
                  {label}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function OpeningCharts() {
  const [position, setPosition] = useState<Position>("BTN");
  const [hover, setHover] = useState<string | null>(null);
  const range = OPENING_SETS[position];
  const name = POSITIONS.find((p) => p.id === position)!.name;

  return (
    <>
      <p className="chart-intro">
        Which hands to raise when everyone folds to you, at a 6-max table with 100 BB stacks. These are simplified,
        pure-raise charts written for PokerLingo, not solver output: easy to memorize and close to what strong players
        use.
      </p>
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

      <HandGrid
        ariaLabel={`${name} opening range`}
        look={(l) => freqLook(range.has(l) ? 1 : 0, "raise")}
        selected={hover}
        onSelect={setHover}
      />

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
    </>
  );
}

const ANTES = [
  { value: 0, label: "No ante" },
  { value: 0.125, label: "Ante 12.5%" },
];

function formatBB(v: number) {
  return `${v >= 0 ? "+" : "−"}${Math.abs(v).toFixed(2)} BB`;
}

function PushFoldCharts() {
  const [stack, setStack] = useState(10);
  const [ante, setAnte] = useState(0);
  const [seat, setSeat] = useState<Seat>("SB");
  const [selected, setSelected] = useState<string | null>("K7o");

  const solution = useMemo(() => solvePushFold(stack, ante), [stack, ante]);
  const freqs = seat === "SB" ? solution.push : solution.call;
  const rec = selected ? recommend(solution, selected, seat) : null;
  // Equity when the chips go in: hero's class against the other seat's continuing range.
  const allInEquity = selected ? rangeEquity(selected, seat === "SB" ? solution.call : solution.push) : null;

  return (
    <>
      <p className="chart-intro">
        Heads-up, the small blind either shoves all-in or folds, and the big blind calls or folds. At short stacks this is
        the whole game, so PokerLingo solves it exactly: a Nash equilibrium computed live in your browser from a
        precomputed all-in equity table for all 169 × 169 hand matchups.
      </p>

      <div className="solver-controls">
        <label className="stack-control" htmlFor="stack-slider">
          <span className="eyebrow">Effective stack</span>
          <strong className="num">{stack} BB</strong>
          <input
            id="stack-slider"
            type="range"
            min={1}
            max={25}
            step={1}
            value={stack}
            onChange={(e) => setStack(Number(e.target.value))}
          />
        </label>
        <div className="solver-toggles">
          <div className="segmented" role="radiogroup" aria-label="Seat">
            {(["SB", "BB"] as const).map((s) => (
              <button key={s} role="radio" aria-checked={seat === s} className={seat === s ? "on" : ""} onClick={() => setSeat(s)}>
                {s === "SB" ? "SB shoves" : "BB calls"}
              </button>
            ))}
          </div>
          <div className="segmented" role="radiogroup" aria-label="Ante">
            {ANTES.map((a) => (
              <button
                key={a.value}
                role="radio"
                aria-checked={ante === a.value}
                className={ante === a.value ? "on" : ""}
                onClick={() => setAnte(a.value)}
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="solver-summary">
        <div>
          <span className="eyebrow">Small blind shoves</span>
          <strong className="num">{Math.round(solution.pushPercent * 100)}%</strong>
        </div>
        <div>
          <span className="eyebrow">Big blind calls</span>
          <strong className="num">{Math.round(solution.callPercent * 100)}%</strong>
        </div>
      </div>

      <HandGrid
        ariaLabel={seat === "SB" ? `Small blind shoving range at ${stack} BB` : `Big blind calling range at ${stack} BB`}
        look={(l) => freqLook(freqs[CLASS_INDEX.get(l)!], seat === "SB" ? "shove" : "call")}
        selected={selected}
        onSelect={setSelected}
      />

      <div className="range-legend">
        <span>
          <i className="swatch open" /> {seat === "SB" ? "Shove" : "Call"}
        </span>
        <span>
          <i className="swatch mixed" /> Mixed
        </span>
        <span>
          <i className="swatch fold" /> Fold
        </span>
      </div>

      {rec && (
        <section className="solver-card" aria-live="polite">
          <span className="icon-tile brand">
            <Cpu size={18} aria-hidden="true" />
          </span>
          <div>
            <span className="eyebrow">Solver recommendation</span>
            <strong>
              {rec.hand} in the {seat === "SB" ? "small blind" : "big blind"} at {stack} BB:{" "}
              <span className={rec.action === "Fold" ? "rec-fold" : "rec-go"}>
                {rec.frequency > 0 && rec.frequency < 1
                  ? `${rec.action === "Fold" ? (seat === "SB" ? "Shove" : "Call") : rec.action} ${Math.round(rec.frequency * 100)}% of the time`
                  : rec.action}
              </span>
            </strong>
            <p>
              {seat === "SB" ? "Shoving" : "Calling"} is worth {formatBB(rec.margin)} compared with folding
              {allInEquity !== null && (
                <>
                  . When the chips go in, {rec.hand} has {Math.round(allInEquity * 100)}% equity against the{" "}
                  {seat === "SB" ? "big blind's calling" : "small blind's shoving"} range
                </>
              )}
              .
            </p>
          </div>
        </section>
      )}
    </>
  );
}

const FACING_LOOK: Record<FacingAction, CellLook> = {
  "3-bet": { state: "threebet", describe: "3-bet" },
  Call: { state: "open", describe: "call" },
  Fold: { state: "", describe: "fold" },
};

function FacingCharts() {
  const [spotId, setSpotId] = useState(FACING_SPOTS[0].id);
  const [hover, setHover] = useState<string | null>(null);
  const spot = FACING_SPOTS.find((s) => s.id === spotId)!;
  const sets = FACING_SETS[spotId];
  const threeBetPct = rangePercent(sets.threeBet);
  const callPct = rangePercent(sets.call);

  return (
    <>
      <p className="chart-intro">
        What to do when someone opens for 2.5 BB in front of you, at a 6-max table with 100 BB stacks. These are
        simplified baselines written for PokerLingo, not solver output: every hand has one clear action.
      </p>
      <div className="segmented wide" role="tablist" aria-label="Spot">
        {FACING_SPOTS.map((s) => (
          <button
            key={s.id}
            role="tab"
            aria-selected={spotId === s.id}
            className={spotId === s.id ? "on" : ""}
            onClick={() => setSpotId(s.id)}
          >
            {s.short}
          </button>
        ))}
      </div>

      <div className="range-summary">
        <div>
          <span className="eyebrow">{spot.title}</span>
          <strong className="num">
            3-bet {Math.round(threeBetPct * 100)}% · call {Math.round(callPct * 100)}%
          </strong>
        </div>
        <span className="range-hover num" aria-live="polite">
          {hover ? `${hover} · ${combos(hover)} combos · ${facingAction(spotId, hover)}` : "Tap a hand for details"}
        </span>
      </div>

      <HandGrid
        ariaLabel={spot.title}
        look={(l) => FACING_LOOK[facingAction(spotId, l)]}
        selected={hover}
        onSelect={setHover}
      />

      <div className="range-legend">
        <span>
          <i className="swatch threebet" /> 3-bet
        </span>
        {spot.call && (
          <span>
            <i className="swatch open" /> Call
          </span>
        )}
        <span>
          <i className="swatch fold" /> Fold
        </span>
      </div>

      <p className="chart-note-text">{spot.note}</p>
      <p className="range-text">
        <span className="eyebrow">3-bet</span>
        <code>{spot.threeBet}</code>
      </p>
      {spot.call && (
        <p className="range-text">
          <span className="eyebrow">Call</span>
          <code>{spot.call}</code>
        </p>
      )}
    </>
  );
}

const CHART_TABS: { id: ChartTab; label: string }[] = [
  { id: "pushfold", label: "Push/fold solver" },
  { id: "opening", label: "Opening" },
  { id: "facing", label: "Facing a raise" },
];

export function RangesScreen({ onBack, backLabel = "Practice" }: { onBack: () => void; backLabel?: string }) {
  const [tab, setTab] = useState<ChartTab>("pushfold");
  return (
    <div className="page ranges">
      <button className="btn btn-ghost back" onClick={onBack}>
        <ArrowLeft size={18} aria-hidden="true" /> {backLabel}
      </button>
      <header className="page-head">
        <h1>Strategy charts</h1>
      </header>
      <div className="tabs" role="tablist" aria-label="Chart type">
        {CHART_TABS.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} className={tab === t.id ? "on" : ""} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>
      {tab === "pushfold" ? <PushFoldCharts /> : tab === "opening" ? <OpeningCharts /> : <FacingCharts />}
    </div>
  );
}
