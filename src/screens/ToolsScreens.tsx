import { RefreshCw, X } from "lucide-react";
import { useMemo, useState } from "react";
import { PlayingCard } from "../components/PlayingCard";
import { seededRandom } from "../course/generator";
import { calculateEquity, SIM_SAMPLES } from "../poker/calculator";
import { parseCard, RANKS, SUIT_SYMBOL, SUITS } from "../poker/cards";
import { FACING_SPOTS, OPENING_RANGES, parseRange, rangePercent } from "../poker/ranges";
import { simulatePaths, varianceSummary } from "../poker/variance";

/* ---------------------------------------------------------------- Equity calculator */

type Slot = "hero" | "villain" | "board";
const LIMITS: Record<Slot, number> = { hero: 2, villain: 2, board: 5 };
const SLOT_LABEL: Record<Slot, string> = { hero: "Your hand", villain: "Villain's hand", board: "Board" };
const GRID_RANKS = [...RANKS].reverse();

const ANY_TWO =
  "22+, A2s+, K2s+, Q2s+, J2s+, T2s+, 92s+, 82s+, 72s+, 62s+, 52s+, 42s+, 32s, A2o+, K2o+, Q2o+, J2o+, T2o+, 92o+, 82o+, 72o+, 62o+, 52o+, 42o+, 32o";
const spot = (id: string) => FACING_SPOTS.find((s) => s.id === id)!;

const RANGE_PRESETS: { label: string; range: string }[] = [
  { label: "UTG open", range: OPENING_RANGES.UTG },
  { label: "CO open", range: OPENING_RANGES.CO },
  { label: "BTN open", range: OPENING_RANGES.BTN },
  { label: "BB defends vs BTN", range: spot("bb-vs-btn").call },
  { label: "BTN 3-bets vs CO", range: spot("btn-vs-co").threeBet },
  { label: "Any two cards", range: ANY_TWO },
];

const pct1 = (x: number) => `${(x * 100).toFixed(1)}%`;

function parseRangeText(text: string): { range: Set<string> | null; error: string | null } {
  if (!text.trim()) return { range: null, error: "Enter a range, like QQ+, AKs, AKo." };
  try {
    return { range: parseRange(text.toUpperCase().replace(/S\b/g, "s").replace(/O\b/g, "o")), error: null };
  } catch {
    return { range: null, error: "Couldn't read that range. Use hands like 99+, AJs+, KQo or T9s-65s." };
  }
}

export function EquityCalculator() {
  const [cards, setCards] = useState<Record<Slot, string[]>>({ hero: [], villain: [], board: [] });
  const [active, setActive] = useState<Slot>("hero");
  const [mode, setMode] = useState<"hand" | "range">("hand");
  const [rangeText, setRangeText] = useState("QQ+, AKs, AKo");
  const [run, setRun] = useState(0);

  const slots: Slot[] = mode === "hand" ? ["hero", "villain", "board"] : ["hero", "board"];
  const owner = new Map<string, Slot>();
  for (const s of slots) for (const code of cards[s]) owner.set(code, s);

  function pick(code: string) {
    const current = owner.get(code);
    if (current) {
      setCards((c) => ({ ...c, [current]: c[current].filter((x) => x !== code) }));
      setActive(current);
      return;
    }
    const target = [active, ...slots].find((s) => slots.includes(s) && cards[s].length < LIMITS[s]);
    if (!target) return;
    const next = { ...cards, [target]: [...cards[target], code] };
    setCards(next);
    if (next[target].length >= LIMITS[target]) {
      const open = slots.find((s) => next[s].length < LIMITS[s]);
      if (open) setActive(open);
    }
  }

  function clear() {
    setCards({ hero: [], villain: [], board: [] });
    setActive("hero");
  }

  const parsed = parseRangeText(rangeText);
  const hero = cards.hero.map(parseCard);
  const board = cards.board.map(parseCard);
  const boardOk = [0, 3, 4, 5].includes(board.length);
  const villainReady = mode === "hand" ? cards.villain.length === 2 : parsed.range !== null && parsed.range.size > 0;
  const ready = hero.length === 2 && boardOk && villainReady;

  const result = useMemo(() => {
    if (!ready) return null;
    const villain =
      mode === "hand"
        ? { kind: "hand" as const, cards: cards.villain.map(parseCard) }
        : { kind: "range" as const, range: parsed.range! };
    return calculateEquity(hero, villain, board);
    // Everything derives from these; `run` re-runs a simulation on demand.
  }, [ready, mode, cards, rangeText, run]);

  const hint = !ready
    ? hero.length < 2
      ? "Pick your two cards."
      : mode === "hand" && cards.villain.length < 2
        ? "Pick villain's two cards, or switch to a range."
        : mode === "range" && !parsed.range
          ? parsed.error
          : !boardOk
            ? "A board needs 3, 4 or 5 cards, or none for preflop."
            : null
    : null;

  return (
    <div className="calc">
      <div className="segmented wide" role="radiogroup" aria-label="Villain">
        {(["hand", "range"] as const).map((m) => (
          <button
            key={m}
            role="radio"
            aria-checked={mode === m}
            className={mode === m ? "on" : ""}
            onClick={() => {
              setMode(m);
              if (m === "range") {
                // Villain's hole cards don't apply to a range; free them for the other slots.
                setCards((c) => ({ ...c, villain: [] }));
                if (active === "villain") setActive(cards.hero.length < 2 ? "hero" : "board");
              }
            }}
          >
            {m === "hand" ? "Against a hand" : "Against a range"}
          </button>
        ))}
      </div>

      <div className="calc-slots">
        {slots.map((s) => (
          <button
            key={s}
            className={`calc-slot ${active === s ? "active" : ""} ${s}`}
            onClick={() => setActive(s)}
            aria-pressed={active === s}
          >
            <span className="eyebrow">{SLOT_LABEL[s]}</span>
            <span className="calc-slot-cards">
              {Array.from({ length: LIMITS[s] }, (_, i) =>
                cards[s][i] ? (
                  <PlayingCard key={cards[s][i]} card={parseCard(cards[s][i])} size="sm" />
                ) : (
                  <span key={i} className="card-placeholder" aria-hidden="true" />
                ),
              )}
            </span>
          </button>
        ))}
      </div>

      {mode === "range" && (
        <div className="calc-range">
          <label className="eyebrow" htmlFor="calc-range-input">
            Villain's range
          </label>
          <input
            id="calc-range-input"
            className="text-input"
            value={rangeText}
            onChange={(e) => setRangeText(e.target.value)}
            spellCheck={false}
            autoComplete="off"
          />
          <div className="preset-chips">
            {RANGE_PRESETS.map((p) => (
              <button
                key={p.label}
                className={`preset-chip ${rangeText === p.range ? "on" : ""}`}
                aria-pressed={rangeText === p.range}
                onClick={() => setRangeText(p.range)}
              >
                {p.label}
              </button>
            ))}
          </div>
          {parsed.range ? (
            <span className="muted range-note">
              {Math.round(rangePercent(parsed.range) * 1000) / 10}% of starting hands
              {result?.combos !== undefined && ` · ${result.combos} combos left after card removal`}
            </span>
          ) : (
            <span className="form-error">{parsed.error}</span>
          )}
        </div>
      )}

      <div className="card-picker" role="group" aria-label="Pick cards">
        {SUITS.map((suit) => (
          <div key={suit} className="card-picker-row">
            {GRID_RANKS.map((rank) => {
              const code = rank + suit;
              const taken = owner.get(code);
              return (
                <button
                  key={code}
                  className={`pick ${suit === "h" || suit === "d" ? "red" : "black"} ${taken ? `taken ${taken}` : ""}`}
                  onClick={() => pick(code)}
                  aria-pressed={Boolean(taken)}
                  aria-label={`${rank === "T" ? "10" : rank} of ${suit === "s" ? "spades" : suit === "h" ? "hearts" : suit === "d" ? "diamonds" : "clubs"}`}
                >
                  <span>{rank === "T" ? "10" : rank}</span>
                  <span>{SUIT_SYMBOL[suit]}</span>
                </button>
              );
            })}
          </div>
        ))}
      </div>
      <button className="btn btn-ghost calc-clear" onClick={clear}>
        <X size={16} aria-hidden="true" /> Clear cards
      </button>

      <section className="calc-result" aria-live="polite">
        {hint ? (
          <p className="muted">{hint}</p>
        ) : result === null ? (
          <p className="muted">Villain can't hold any hand in that range with these cards showing.</p>
        ) : (
          result && (
            <>
              <div className="calc-headline">
                <div>
                  <span className="eyebrow">Your equity</span>
                  <strong className="num">{pct1(result.equity)}</strong>
                </div>
                <div className="calc-villain">
                  <span className="eyebrow">Villain</span>
                  <strong className="num">{pct1(1 - result.equity)}</strong>
                </div>
              </div>
              <div className="equity-bar" aria-hidden="true">
                <div style={{ width: `${result.equity * 100}%` }} />
              </div>
              <p className="muted calc-detail num">
                Win {pct1(result.win)} · Tie {pct1(result.tie)} ·{" "}
                {result.exact
                  ? `Exact: every runout counted (${result.deals.toLocaleString()} deals)`
                  : `Simulated over ${SIM_SAMPLES.toLocaleString()} deals, accurate to about ±0.5%`}
              </p>
              {!result.exact && (
                <button className="btn btn-secondary" onClick={() => setRun((r) => r + 1)}>
                  <RefreshCw size={16} aria-hidden="true" /> Run again
                </button>
              )}
            </>
          )
        )}
      </section>
    </div>
  );
}

/* ---------------------------------------------------------------- Variance and bankroll */

const HAND_STEPS = [1_000, 5_000, 10_000, 25_000, 50_000, 100_000, 250_000, 500_000];
const POINTS = 61;
const PATHS = 20;

const signed = (v: number) => `${v < 0 ? "−" : "+"}${Math.abs(Math.round(v)).toLocaleString()}`;
const handsLabel = (n: number) => (n >= 1000 ? `${n / 1000}k` : String(n));

function Slider(props: {
  id: string;
  label: string;
  value: number;
  display: string;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="stack-control" htmlFor={props.id}>
      <span className="eyebrow">{props.label}</span>
      <strong className="num">{props.display}</strong>
      <input
        id={props.id}
        type="range"
        min={props.min}
        max={props.max}
        step={props.step}
        value={props.value}
        onChange={(e) => props.onChange(Number(e.target.value))}
      />
    </label>
  );
}

export function VarianceTool() {
  const [winRate, setWinRate] = useState(5);
  const [stdDev, setStdDev] = useState(90);
  const [handsIndex, setHandsIndex] = useState(2);
  const [buyIns, setBuyIns] = useState(30);
  const [run, setRun] = useState(1);
  const hands = HAND_STEPS[handsIndex];
  const s = varianceSummary({ winRate, stdDev, hands, bankroll: buyIns * 100 });

  const paths = useMemo(
    () => simulatePaths({ winRate, stdDev, hands }, PATHS, POINTS, seededRandom(`variance-${run}`)),
    [winRate, stdDev, hands, run],
  );

  // Chart scale: every path plus the 95% band, and always zero.
  const band = Array.from({ length: POINTS }, (_, i) => {
    const blocks = ((i / (POINTS - 1)) * hands) / 100;
    const mean = winRate * blocks;
    const spread = 1.96 * stdDev * Math.sqrt(blocks);
    return [mean - spread, mean + spread];
  });
  const values = [0, ...paths.flat(), ...band.flat()];
  const yMax = Math.max(...values);
  const yMin = Math.min(...values);
  const y = (v: number) => ((yMax - v) / (yMax - yMin || 1)) * 100;
  const x = (i: number) => (i / (POINTS - 1)) * 100;
  const line = (pts: number[]) => pts.map((v, i) => `${x(i).toFixed(2)},${y(v).toFixed(2)}`).join(" ");
  const bandPath =
    band.map(([, hi], i) => `${x(i).toFixed(2)},${y(hi).toFixed(2)}`).join(" ") +
    " " +
    [...band]
      .reverse()
      .map(([lo], i) => `${x(POINTS - 1 - i).toFixed(2)},${y(lo).toFixed(2)}`)
      .join(" ");
  const behind = paths.filter((p) => p[POINTS - 1] < 0).length;

  return (
    <div className="variance">
      <div className="variance-controls">
        <Slider
          id="win-rate"
          label="Win rate"
          value={winRate}
          display={`${winRate > 0 ? "+" : ""}${winRate} bb/100`}
          min={-5}
          max={20}
          step={0.5}
          onChange={setWinRate}
        />
        <Slider id="std-dev" label="Standard deviation" value={stdDev} display={`${stdDev} bb/100`} min={50} max={150} step={5} onChange={setStdDev} />
        <Slider
          id="hands"
          label="Hands"
          value={handsIndex}
          display={hands.toLocaleString()}
          min={0}
          max={HAND_STEPS.length - 1}
          step={1}
          onChange={setHandsIndex}
        />
        <Slider id="bankroll" label="Bankroll" value={buyIns} display={`${buyIns} buy-ins`} min={5} max={100} step={5} onChange={setBuyIns} />
      </div>

      <div className="tool-stats">
        <div>
          <span className="eyebrow">Expected result</span>
          <strong className="num">{signed(s.expected)} bb</strong>
          <small className="num">{signed(s.expected / 100)} buy-ins</small>
        </div>
        <div>
          <span className="eyebrow">95% of results</span>
          <strong className="num">
            {signed(s.low95)} to {signed(s.high95)}
          </strong>
          <small>big blinds</small>
        </div>
        <div>
          <span className="eyebrow">Chance you're down</span>
          <strong className="num">{Math.round(s.probLoss * 100)}%</strong>
          <small>after {hands.toLocaleString()} hands</small>
        </div>
        <div>
          <span className="eyebrow">Risk of ruin</span>
          <strong className="num">{s.riskOfRuin >= 0.995 ? "100%" : `${(s.riskOfRuin * 100).toFixed(1)}%`}</strong>
          <small>with {buyIns} buy-ins</small>
        </div>
        <div>
          <span className="eyebrow">For 5% risk of ruin</span>
          <strong className="num">{Number.isFinite(s.bankrollFor5) ? `${Math.ceil(s.bankrollFor5 / 100)} buy-ins` : "—"}</strong>
          <small>{Number.isFinite(s.bankrollFor5) ? "of 100 big blinds" : "Only winners can avoid ruin"}</small>
        </div>
      </div>

      <figure className="var-chart">
        <div className="var-plot">
          <div className="var-y" aria-hidden="true">
            <span style={{ top: "0%" }}>{signed(yMax)}</span>
            <span style={{ top: `${y(0)}%` }}>0</span>
            <span style={{ top: "100%" }}>{signed(yMin)}</span>
          </div>
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label={`${PATHS} simulated results over ${hands.toLocaleString()} hands`}>
            <polygon className="var-band" points={bandPath} />
            <line className="var-zero" x1="0" x2="100" y1={y(0)} y2={y(0)} vectorEffect="non-scaling-stroke" />
            {paths.map((p, i) => (
              <polyline key={i} className={p[POINTS - 1] >= 0 ? "var-path up" : "var-path down"} points={line(p)} vectorEffect="non-scaling-stroke" />
            ))}
            <line className="var-expected" x1="0" y1={y(0)} x2="100" y2={y(s.expected)} vectorEffect="non-scaling-stroke" />
          </svg>
        </div>
        <div className="var-x" aria-hidden="true">
          <span>0</span>
          <span>{handsLabel(hands / 2)}</span>
          <span>{handsLabel(hands)} hands</span>
        </div>
        <figcaption className="muted">
          {behind} of {PATHS} simulated players with the same skill are behind after {hands.toLocaleString()} hands. The
          dashed line is the expected result; the shaded area holds 95% of outcomes.
        </figcaption>
      </figure>

      <button className="btn btn-secondary" onClick={() => setRun((r) => r + 1)}>
        <RefreshCw size={16} aria-hidden="true" /> Simulate again
      </button>

      <p className="muted tool-note">
        Results per 100 hands are modelled as normally distributed with your win rate and standard deviation. 6-max cash
        games usually run around 80 to 100 bb/100. Risk of ruin assumes you keep playing the same stakes forever, and your
        true win rate is never known exactly, so leave a margin.
      </p>
    </div>
  );
}

