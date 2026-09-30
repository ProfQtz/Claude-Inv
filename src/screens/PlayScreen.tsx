import { ArrowLeft, Check, ChevronRight, CircleAlert, Eye, FastForward, Info, Minus, Users, X } from "lucide-react";
import { type CSSProperties, type Ref, useEffect, useMemo, useRef, useState } from "react";
import { CardBack, CardRow, PlayingCard } from "../components/PlayingCard";
import type { ChoiceExercise } from "../course/types";
import { chooseBotAction, STYLE_INFO } from "../poker/bots";
import { type DecisionCheck, type DecisionKind, reviewHand, type Verdict } from "../poker/coach";
import { loadHands, saveHand, storedHand, type StoredHand } from "../state/handHistory";
import { mergeCounts, type PlayStats, type VerdictCounts } from "../state/progress";
import {
  act,
  type ActionRecord,
  BB,
  type BotStyle,
  formatBB,
  type HandState,
  legalActions,
  newHand,
  type PlayerConfig,
  potSize,
  seatLabel,
  situation,
  type TableAction,
  type TableStreet,
} from "../poker/table";

export type TableSetup = { kind: "hu"; style: BotStyle } | { kind: "6max" };

/** A session's results: lifetime play stats plus close calls and mistakes. */
export interface PlaySummary extends Omit<PlayStats, "checked"> {
  title: string;
  close: number;
  mistakes: number;
}

type SessionStats = Omit<PlaySummary, "title">;

const EMPTY_SESSION: SessionStats = {
  hands: 0,
  net: 0,
  good: 0,
  close: 0,
  mistakes: 0,
  hands6: 0,
  vpip6: 0,
  pfr6: 0,
  byKind: {},
  byStyle: {},
};

/** One finished hand as session stats: result, preflop habits and verdicts. */
function handStats(hand: HandState, checks: DecisionCheck[]): SessionStats {
  const preflop = hand.log.filter((a) => a.seat === 0 && a.street === "preflop");
  const six = hand.seats.length === 6 ? 1 : 0;
  const byKind: Partial<Record<DecisionKind, VerdictCounts>> = {};
  const byStyle: Partial<Record<BotStyle, VerdictCounts>> = {};
  const add = <K extends string>(record: Partial<Record<K, VerdictCounts>>, key: K, verdict: Verdict) => {
    const x = record[key] ?? { good: 0, close: 0, mistakes: 0 };
    record[key] = {
      good: x.good + (verdict === "good" ? 1 : 0),
      close: x.close + (verdict === "close" ? 1 : 0),
      mistakes: x.mistakes + (verdict === "mistake" ? 1 : 0),
    };
  };
  for (const c of checks) {
    if (c.verdict === "info") continue;
    add(byKind, c.kind, c.verdict);
    if (c.styles.length === 1) add(byStyle, c.styles[0], c.verdict);
  }
  return {
    hands: 1,
    net: hand.result!.net[0],
    good: checks.filter((c) => c.verdict === "good").length,
    close: checks.filter((c) => c.verdict === "close").length,
    mistakes: checks.filter((c) => c.verdict === "mistake").length,
    hands6: six,
    vpip6: six && preflop.some((a) => a.kind === "call" || a.kind === "raise") ? 1 : 0,
    pfr6: six && preflop.some((a) => a.kind === "raise") ? 1 : 0,
    byKind,
    byStyle,
  };
}

function addStats(a: SessionStats, b: SessionStats): SessionStats {
  return {
    hands: a.hands + b.hands,
    net: a.net + b.net,
    good: a.good + b.good,
    close: a.close + b.close,
    mistakes: a.mistakes + b.mistakes,
    hands6: a.hands6 + b.hands6,
    vpip6: a.vpip6 + b.vpip6,
    pfr6: a.pfr6 + b.pfr6,
    byKind: mergeCounts(a.byKind, b.byKind),
    byStyle: mergeCounts(a.byStyle, b.byStyle),
  };
}

const STYLE_COLOR: Record<BotStyle, string> = { nit: "#475569", station: "#0369a1", maniac: "#be123c", regular: "#0f766e" };
const BOT_NAME: Record<BotStyle, string> = { nit: "Nora", station: "Stan", maniac: "Max", regular: "Rhea" };
const STYLES: BotStyle[] = ["station", "nit", "maniac", "regular"];

function lineup(setup: TableSetup): PlayerConfig[] {
  const you: PlayerConfig = { name: "You", human: true };
  if (setup.kind === "hu") return [you, { name: BOT_NAME[setup.style], human: false, style: setup.style }];
  return [
    you,
    { name: "Rhea", human: false, style: "regular" },
    { name: "Stan", human: false, style: "station" },
    { name: "Nora", human: false, style: "nit" },
    { name: "Max", human: false, style: "maniac" },
    { name: "Ray", human: false, style: "regular" },
  ];
}

export const setupTitle = (setup: TableSetup) =>
  setup.kind === "hu" ? `Heads-up vs the ${STYLE_INFO[setup.style].name}` : "6-max table";

/* ------------------------------------------------------------------ Your game */

const KIND_LABEL: Record<DecisionKind, string> = {
  preflop: "Preflop charts",
  call: "Calls",
  fold: "Folds",
  bet: "Bets",
  check: "Checks",
  raise: "Raises",
};

const KIND_TIP: Record<DecisionKind, string> = {
  preflop: "Your preflop play strays from the charts. Review them in the Library.",
  call: "You call when you're behind too often. Count their value hands before you call.",
  fold: "You fold when the price is right. Compare your equity with the price before folding.",
  bet: "Some of your bets lose money. Bet when worse hands call or better hands fold.",
  check: "You check when a bet earns more. Value bet more, and bluff players who fold too much.",
  raise: "Raise for value with strong hands, and as a bluff only when folds are likely.",
};

const graded = (c: VerdictCounts) => c.good + c.mistakes;
const rightShare = (c: VerdictCounts) => c.good / Math.max(1, graded(c));
/** Leaks need a few graded decisions and under 80% right. */
const LEAK_MIN = 6;

function weakest<K extends string>(record: Partial<Record<K, VerdictCounts>>): [K, VerdictCounts] | null {
  const rows = (Object.entries(record) as [K, VerdictCounts][]).filter(([, c]) => graded(c) >= LEAK_MIN && rightShare(c) < 0.8);
  return rows.sort((a, b) => rightShare(a[1]) - rightShare(b[1]))[0] ?? null;
}

function AccuracyRows<K extends string>({ record, label }: { record: Partial<Record<K, VerdictCounts>>; label: (k: K) => string }) {
  const rows = (Object.entries(record) as [K, VerdictCounts][]).filter(([, c]) => graded(c) + c.close > 0);
  if (rows.length === 0) return <p className="muted play-note">No graded decisions yet.</p>;
  return (
    <ul className="accuracy-rows">
      {rows.map(([key, c]) => (
        <li key={key}>
          <span className="accuracy-label">{label(key)}</span>
          <span className="accuracy-bar" aria-hidden="true">
            <span style={{ width: `${rightShare(c) * 100}%` }} />
          </span>
          <span className="accuracy-value num">
            {graded(c) > 0 ? `${Math.round(rightShare(c) * 100)}%` : "—"}
            <small>
              {c.good}/{graded(c)}
              {c.close ? ` · ${c.close} close` : ""}
            </small>
          </span>
        </li>
      ))}
    </ul>
  );
}

function YourGame({ stats }: { stats: PlayStats }) {
  if (stats.hands === 0) return null;
  const kindLeak = weakest(stats.byKind);
  const styleLeak = weakest(stats.byStyle);
  const checkedAll = Object.values(stats.byKind).reduce((sum, c) => sum + graded(c!), 0);
  return (
    <section className="your-game" aria-labelledby="your-game-title">
      <h2 className="section-title" id="your-game-title">
        Your game
      </h2>
      <div className="tool-stats">
        <div>
          <span className="eyebrow">Hands</span>
          <strong className="num">{stats.hands}</strong>
        </div>
        <div>
          <span className="eyebrow">Result</span>
          <strong className="num">{signedBB(stats.net)}</strong>
          {stats.hands >= 20 && <small className="num">{((stats.net / BB / stats.hands) * 100).toFixed(1)} bb/100</small>}
        </div>
        <div>
          <span className="eyebrow">Decisions right</span>
          <strong className="num">{checkedAll ? `${Math.round((stats.good / checkedAll) * 100)}%` : "—"}</strong>
          <small className="num">{checkedAll} graded</small>
        </div>
      </div>
      {stats.hands6 >= 20 && (
        <p className="play-note">
          At 6-max you play <strong className="num">{Math.round((stats.vpip6 / stats.hands6) * 100)}%</strong> of hands and raise{" "}
          <strong className="num">{Math.round((stats.pfr6 / stats.hands6) * 100)}%</strong> before the flop. Solid winning players are
          usually around 20 to 26% and 16 to 22%.
        </p>
      )}
      {(kindLeak || styleLeak) && (
        <div className="leak-card">
          <span className="icon-tile red">
            <CircleAlert size={18} aria-hidden="true" />
          </span>
          <div>
            <strong>Biggest leak{kindLeak && styleLeak ? "s" : ""}</strong>
            {kindLeak && (
              <p>
                {KIND_LABEL[kindLeak[0]]}: {Math.round(rightShare(kindLeak[1]) * 100)}% right. {KIND_TIP[kindLeak[0]]}
              </p>
            )}
            {styleLeak && (
              <p>
                Against the {STYLE_INFO[styleLeak[0]].name}: {Math.round(rightShare(styleLeak[1]) * 100)}% right. {STYLE_INFO[styleLeak[0]].tip}
              </p>
            )}
          </div>
        </div>
      )}
      <div className="your-game-grid">
        <div>
          <h3>By decision</h3>
          <AccuracyRows record={stats.byKind} label={(k) => KIND_LABEL[k as DecisionKind]} />
        </div>
        <div>
          <h3>By opponent (heads-up)</h3>
          <AccuracyRows record={stats.byStyle} label={(k) => STYLE_INFO[k as BotStyle].name} />
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ Hand history */

const STREET_ORDER: TableStreet[] = ["preflop", "flop", "turn", "river"];
const STREET_TITLE: Record<TableStreet, string> = { preflop: "Preflop", flop: "Flop", turn: "Turn", river: "River" };
const BOARD_AT: Record<TableStreet, number> = { preflop: 0, flop: 3, turn: 4, river: 5 };

const handTime = (id: number) =>
  new Date(id).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

function HandDetail({ hand, onBack }: { hand: StoredHand; onBack: () => void }) {
  useEffect(() => window.scrollTo(0, 0), []);
  const n = hand.players.length;
  const hero = hand.players.findIndex((p) => p.human);
  const board = hand.board.split(" ").filter(Boolean);
  const streets = STREET_ORDER.map((street) => ({ street, actions: hand.actions.filter((a) => a.street === street) })).filter(
    (x) => x.actions.length > 0,
  );
  const name = (i: number) => (hand.players[i].human ? "You" : hand.players[i].name);
  const lastStreet = streets[streets.length - 1]?.street ?? "preflop";
  return (
    <div className="play-lobby">
      <header className="play-top">
        <button className="icon-button" onClick={onBack} aria-label="Back to the lobby">
          <ArrowLeft size={22} />
        </button>
        <span className="play-title">Hand review</span>
      </header>
      <div className="play-lobby-body">
        <header className="page-head">
          <h1>{hand.table}</h1>
          <p className="num">
            {handTime(hand.id)} · <strong className={hand.net[hero] > 0 ? "won" : hand.net[hero] < 0 ? "lost" : ""}>{signedBB(hand.net[hero])}</strong>
          </p>
        </header>

        <ul className="history-players">
          {hand.players.map((p, i) => (
            <li key={i} className={p.human ? "hero" : ""}>
              <span className="seat-pos">{seatLabel(n, hand.button, i)}</span>
              <span className="row-text">
                <strong>{p.human ? "You" : p.name}</strong>
                {p.style && <span>{STYLE_INFO[p.style].name}</span>}
              </span>
              <CardRow cards={p.hole} size="sm" />
              <span className={`history-net num ${hand.net[i] > 0 ? "won" : hand.net[i] < 0 ? "lost" : ""}`}>{signedBB(hand.net[i])}</span>
            </li>
          ))}
        </ul>

        {streets.map(({ street, actions }) => (
          <section key={street} className="history-street">
            <div className="history-street-head">
              <strong>{STREET_TITLE[street]}</strong>
              <span className="muted num">pot {formatBB(actions[0].pot)}</span>
            </div>
            {BOARD_AT[street] > 0 && <CardRow cards={board.slice(0, BOARD_AT[street]).join(" ")} size="sm" />}
            <ol className="history-actions">
              {actions.map((a, i) => (
                <li key={i} className={hand.players[a.seat].human ? "hero" : ""}>
                  {actionText(a, name(a.seat), hand.players[a.seat].human)}
                </li>
              ))}
            </ol>
          </section>
        ))}
        {board.length > BOARD_AT[lastStreet] && (
          <section className="history-street">
            <div className="history-street-head">
              <strong>Board run out</strong>
            </div>
            <CardRow cards={board.join(" ")} size="sm" />
          </section>
        )}
        {hand.showdown && (
          <section className="history-street">
            <div className="history-street-head">
              <strong>Showdown</strong>
            </div>
            <ul className="history-actions">
              {hand.players.map((p, i) =>
                hand.hands[i] ? (
                  <li key={i} className={p.human ? "hero" : ""}>
                    {name(i)}: {hand.hands[i]!.toLowerCase()}
                    {hand.won[i] > 0 ? ` · won ${formatBB(hand.won[i])}` : ""}
                  </li>
                ) : null,
              )}
            </ul>
          </section>
        )}

        <section className="play-review static">
          <h2>Coach's review</h2>
          <ReviewList checks={hand.review} />
        </section>
      </div>
    </div>
  );
}

/** "Won with a flush, nine high", "Folded on the turn" or "Won without showdown". */
function outcome(h: StoredHand, hero: number): string {
  const fold = h.actions.find((a) => a.seat === hero && a.kind === "fold");
  if (fold) return fold.street === "preflop" ? "Folded preflop" : `Folded on the ${fold.street}`;
  if (!h.showdown) return "Won without showdown";
  const verb = h.net[hero] > 0 ? "Won" : h.net[hero] < 0 ? "Lost" : "Split the pot";
  return h.hands[hero] ? `${verb} with ${handPhrase(h.hands[hero]!)}` : verb;
}

function RecentHands({ hands, onOpen }: { hands: StoredHand[]; onOpen: (h: StoredHand) => void }) {
  const [all, setAll] = useState(false);
  if (hands.length === 0) return null;
  const shown = all ? hands : hands.slice(0, 8);
  return (
    <section aria-labelledby="recent-hands-title">
      <h2 className="section-title" id="recent-hands-title">
        Recent hands
      </h2>
      <ul className="history-list">
        {shown.map((h) => {
          const hero = h.players.findIndex((p) => p.human);
          const mistakes = h.review.filter((r) => r.verdict === "mistake").length;
          return (
            <li key={h.id}>
              <button className="history-row" onClick={() => onOpen(h)}>
                <CardRow cards={h.players[hero].hole} size="xs" />
                <span className="row-text">
                  <strong>{outcome(h, hero)}</strong>
                  <span>
                    {h.players.length === 2 ? `vs ${h.players[1 - hero].name}` : "6-max"} · {handTime(h.id)}
                    {mistakes > 0 ? ` · ${mistakes} ${mistakes === 1 ? "mistake" : "mistakes"}` : ""}
                  </span>
                </span>
                <span className={`history-net num ${h.net[hero] > 0 ? "won" : h.net[hero] < 0 ? "lost" : ""}`}>{signedBB(h.net[hero])}</span>
              </button>
            </li>
          );
        })}
      </ul>
      {hands.length > shown.length && (
        <button className="btn btn-ghost history-more" onClick={() => setAll(true)}>
          Show all {hands.length}
        </button>
      )}
      <p className="muted play-note">Hand history stays on this device and isn't part of backups.</p>
    </section>
  );
}

/* ------------------------------------------------------------------ Lobby */

function Lobby({ onPick, onBack, lifetime }: { onPick: (s: TableSetup) => void; onBack: () => void; lifetime: PlayStats }) {
  useEffect(() => window.scrollTo(0, 0), []);
  const [hands] = useState(loadHands);
  const [viewing, setViewing] = useState<StoredHand | null>(null);
  if (viewing) return <HandDetail hand={viewing} onBack={() => setViewing(null)} />;
  return (
    <div className="play-lobby">
      <header className="play-top">
        <button className="icon-button" onClick={onBack} aria-label="Back to Practice">
          <X size={22} />
        </button>
        <span className="play-title">Play</span>
      </header>
      <div className="play-lobby-body">
        <header className="page-head">
          <h1>Practice table</h1>
          <p>
            Play full hands against simulated opponents. After each hand, the coach checks your key decisions against the
            price and against the hands that opponent plays that way.
          </p>
        </header>
        <YourGame stats={lifetime} />

        <h2 className="section-title">Heads-up</h2>
        <p className="muted play-note">One opponent, every hand. Learn how to beat each type of player.</p>
        <div className="play-styles">
          {STYLES.map((style) => (
            <button
              key={style}
              className="play-style"
              style={{ "--tile-color": STYLE_COLOR[style] } as CSSProperties}
              onClick={() => onPick({ kind: "hu", style })}
            >
              <span className="play-avatar" aria-hidden="true">
                {BOT_NAME[style][0]}
              </span>
              <span className="row-text">
                <strong>
                  {BOT_NAME[style]}, the {STYLE_INFO[style].name}
                </strong>
                <span>{STYLE_INFO[style].description}</span>
                <span className="play-tip">{STYLE_INFO[style].tip}</span>
              </span>
              <ChevronRight className="row-chevron" size={20} aria-hidden="true" />
            </button>
          ))}
        </div>

        <h2 className="section-title">6-max table</h2>
        <button className="play-style six" onClick={() => onPick({ kind: "6max" })}>
          <span className="play-avatar" aria-hidden="true">
            <Users size={20} />
          </span>
          <span className="row-text">
            <strong>Full table</strong>
            <span>Two Regulars, a Nit, a Calling Station and a Maniac. Practice position, ranges and multiway pots.</span>
            <span className="play-tip">The coach also checks your preflop play against the charts.</span>
          </span>
          <ChevronRight className="row-chevron" size={20} aria-hidden="true" />
        </button>
        <p className="muted play-note">Stacks reset to 100 BB every hand. Blinds are 0.5 and 1 BB.</p>

        <RecentHands hands={hands} onOpen={setViewing} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ Table pieces */

const signedBB = (chips: number) => `${chips > 0 ? "+" : chips < 0 ? "−" : ""}${formatBB(Math.abs(chips))}`;

/** A made hand's name for a sentence: "a flush, nine high", "two pair, nines and sevens". */
const handPhrase = (name: string) => {
  const hand = name.toLowerCase();
  return /^(royal|straight|full|flush|pair)/.test(hand) ? `a ${hand}` : hand;
};

function actionText(a: Pick<ActionRecord, "kind" | "amount" | "to" | "allIn">, name: string, you: boolean): string {
  const verb = (base: string) => (you ? base : base.replace(/^(\w+)/, (w) => `${w}${w.endsWith("h") ? "es" : "s"}`));
  const allIn = a.allIn ? " (all-in)" : "";
  switch (a.kind) {
    case "fold":
      return `${name} ${verb("fold")}`;
    case "check":
      return `${name} ${verb("check")}`;
    case "call":
      return `${name} ${verb("call")} ${formatBB(a.amount)}${allIn}`;
    case "bet":
      return `${name} ${verb("bet")} ${formatBB(a.to)}${allIn}`;
    case "raise":
      return `${name} ${verb("raise")} to ${formatBB(a.to)}${allIn}`;
  }
}

function lastActionTag(hand: HandState, seat: number): string | null {
  const mine = hand.log.filter((a) => a.seat === seat && a.street === hand.street);
  const last = mine[mine.length - 1];
  if (!last) return null;
  if (last.allIn) return "All-in";
  return { fold: "Fold", check: "Check", call: "Call", bet: "Bet", raise: "Raise" }[last.kind];
}

function SeatView({
  hand,
  index,
  reveal,
  compact,
  seatRef,
}: {
  hand: HandState;
  index: number;
  reveal: boolean;
  compact: boolean;
  seatRef?: Ref<HTMLDivElement>;
}) {
  const seat = hand.seats[index];
  const label = seatLabel(hand.seats.length, hand.button, index);
  const acting = hand.toAct === index;
  const showdown = hand.result?.showdown && !seat.folded;
  const faceUp = seat.human || showdown || (reveal && hand.result !== null);
  const tag = hand.result ? null : lastActionTag(hand, index);
  const won = hand.result ? hand.result.won[index] : 0;
  return (
    <div
      ref={seatRef}
      className={`seat ${seat.human ? "hero" : ""} ${seat.folded ? "folded" : ""} ${acting ? "acting" : ""} ${compact ? "compact" : ""}`}
      style={seat.style ? ({ "--seat-color": STYLE_COLOR[seat.style] } as CSSProperties) : undefined}
    >
      <div className="seat-head">
        <span className="seat-pos">{label}</span>
        <span className="seat-name">
          {seat.name}
          {seat.style && !compact && <small>{STYLE_INFO[seat.style].short}</small>}
        </span>
      </div>
      {seat.style && compact && <small className="seat-style">{STYLE_INFO[seat.style].name}</small>}
      <div className="seat-cards">
        {seat.hole.map((c) =>
          faceUp ? (
            <PlayingCard key={c.rank + c.suit} card={c} size={seat.human ? "md" : compact ? "xs" : "sm"} />
          ) : (
            <CardBack key={c.rank + c.suit} size={compact ? "xs" : "sm"} />
          ),
        )}
      </div>
      <div className="seat-foot num">
        <span>{formatBB(seat.stack + won)}</span>
        {seat.bet > 0 && !hand.result && <span className="seat-bet">{formatBB(seat.bet)}</span>}
        {tag && <span className="seat-tag">{tag}</span>}
        {won > 0 && <span className="seat-won">+{formatBB(won)}</span>}
      </div>
      {showdown && hand.result?.hands[index] && <span className="seat-hand">{hand.result.hands[index]}</span>}
    </div>
  );
}

function Board({ hand }: { hand: HandState }) {
  return (
    <div className="play-board">
      <div className="board-cards">
        {Array.from({ length: 5 }, (_, i) =>
          hand.board[i] ? (
            <PlayingCard key={i} card={hand.board[i]} />
          ) : (
            <span key={i} className="board-slot" aria-hidden="true" />
          ),
        )}
      </div>
      <span className="play-pot num">Pot {formatBB(potSize(hand))}</span>
    </div>
  );
}

/** Sizing shortcuts for the hero's bet or raise, as totals on this street. */
function presets(hand: HandState): { label: string; to: number }[] {
  const legal = legalActions(hand);
  const sit = situation(hand);
  const clamp = (x: number) => Math.max(legal.minTo, Math.min(legal.maxTo, Math.round(x / 5) * 5));
  let list: { label: string; to: number }[];
  if (sit.street === "preflop" && sit.raises === 0) {
    list = [2.5, 3, 4].map((x) => ({ label: `${x} BB`, to: clamp((x + sit.limpers) * BB) }));
  } else if (legal.canBet) {
    list = [
      ["⅓ pot", 1 / 3],
      ["½ pot", 1 / 2],
      ["⅔ pot", 2 / 3],
      ["Pot", 1],
    ].map(([label, f]) => ({ label: label as string, to: clamp(sit.pot * (f as number)) }));
  } else {
    list = [
      { label: "Min", to: legal.minTo },
      { label: "3×", to: clamp(sit.currentBet * 3) },
      { label: "Pot", to: clamp(sit.currentBet + sit.pot + sit.toCall) },
    ];
  }
  list.push({ label: "All-in", to: legal.maxTo });
  return list.filter((p, i) => list.findIndex((q) => q.to === p.to) === i);
}

function ActionBar({ hand, onAct }: { hand: HandState; onAct: (a: TableAction) => void }) {
  const legal = legalActions(hand);
  const sit = situation(hand);
  const [sizing, setSizing] = useState<number | null>(null);
  const aggressive = legal.canBet ? "bet" : legal.canRaise ? "raise" : null;
  const options = aggressive ? presets(hand) : [];
  const price = sit.toCall > 0 ? sit.toCall / (sit.pot + sit.toCall) : 0;

  if (sizing !== null && aggressive) {
    return (
      <div className="action-bar sizing">
        <div className="sizing-presets">
          {options.map((o) => (
            <button key={o.label} className={`preset-chip ${sizing === o.to ? "on" : ""}`} onClick={() => setSizing(o.to)}>
              {o.label}
            </button>
          ))}
        </div>
        <label className="sizing-slider">
          <span className="sr-only">Amount</span>
          <input
            type="range"
            min={legal.minTo}
            max={legal.maxTo}
            step={5}
            value={sizing}
            onChange={(e) => setSizing(Number(e.target.value))}
          />
        </label>
        <div className="action-buttons">
          <button className="btn btn-secondary" onClick={() => setSizing(null)}>
            Back
          </button>
          <button className="btn btn-primary" onClick={() => onAct({ kind: aggressive, to: sizing })}>
            {aggressive === "bet" ? "Bet" : "Raise to"} {formatBB(sizing)}
            {sizing === legal.maxTo ? " (all-in)" : ""}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="action-bar">
      <p className="action-info num">
        {sit.toCall > 0
          ? `To call ${formatBB(sit.toCall)} · pot ${formatBB(sit.pot)} · you need ${Math.round(price * 100)}%`
          : `Pot ${formatBB(sit.pot)} · your move`}
      </p>
      <div className="action-buttons">
        {legal.canFold && (
          <button className="btn btn-secondary" onClick={() => onAct({ kind: "fold" })}>
            Fold
          </button>
        )}
        {legal.canCheck ? (
          <button className="btn btn-secondary" onClick={() => onAct({ kind: "check" })}>
            Check
          </button>
        ) : (
          <button className="btn btn-secondary" onClick={() => onAct({ kind: "call" })}>
            Call {formatBB(legal.toCall)}
          </button>
        )}
        {aggressive && (
          <button className="btn btn-primary" onClick={() => setSizing(options.find((o) => o.label !== "Min")?.to ?? legal.minTo)}>
            {aggressive === "bet" ? "Bet" : "Raise"}
          </button>
        )}
      </div>
    </div>
  );
}

const VERDICT_ICON: Record<Verdict, { icon: typeof Check; label: string }> = {
  good: { icon: Check, label: "Good" },
  close: { icon: Minus, label: "Close" },
  mistake: { icon: CircleAlert, label: "Mistake" },
  info: { icon: Info, label: "Note" },
};

function ReviewList({ checks }: { checks: Pick<DecisionCheck, "title" | "verdict" | "detail">[] }) {
  if (checks.length === 0) {
    return <p className="muted review-empty">No decisions to check this hand. The coach grades charted preflop spots, calls and folds against a bet, and heads-up bets and checks when you act last.</p>;
  }
  return (
    <ul className="review-list">
      {checks.map((c, i) => {
        const { icon: Icon, label } = VERDICT_ICON[c.verdict];
        return (
          <li key={i} className={`review-item ${c.verdict}`}>
            <span className="review-icon" aria-label={label}>
              <Icon size={16} strokeWidth={3} aria-hidden="true" />
            </span>
            <span className="row-text">
              <strong>{c.title}</strong>
              <span>{c.detail}</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}

/** "1 good · 1 close", "2 mistakes" or "nothing to check". */
function reviewCounts(checks: DecisionCheck[]): string {
  const parts = (["good", "close", "mistake", "info"] as Verdict[]).flatMap((v) => {
    const n = checks.filter((c) => c.verdict === v).length;
    if (n === 0) return [];
    const word = v === "mistake" ? (n === 1 ? "mistake" : "mistakes") : v === "info" ? (n === 1 ? "note" : "notes") : v;
    return [`${n} ${word}`];
  });
  return parts.length ? parts.join(" · ") : "nothing to check";
}

function resultLine(hand: HandState): string {
  const r = hand.result!;
  const winners = r.won.flatMap((w, i) => (w > 0 ? [i] : []));
  const names = (i: number) => (hand.seats[i].human ? "You" : hand.seats[i].name);
  if (!r.showdown) return `${names(winners[0])} ${hand.seats[winners[0]].human ? "win" : "wins"} ${formatBB(r.won[winners[0]])}.`;
  return winners
    .map((i) => `${names(i)} ${hand.seats[i].human ? "win" : "wins"} ${formatBB(r.won[i])} with ${handPhrase(r.hands[i] ?? "")}`)
    .join("; ")
    .concat(".");
}

/* ------------------------------------------------------------------ Table */

function Table({
  setup,
  onLeave,
  onMistakes,
}: {
  setup: TableSetup;
  onLeave: (s: PlaySummary) => void;
  /** Review questions for the hand's mistakes, saved as they happen. */
  onMistakes: (exercises: ChoiceExercise[]) => void;
}) {
  const players = useMemo(() => lineup(setup), [setup]);
  const n = players.length;
  const [handNo, setHandNo] = useState(1);
  const [hand, setHand] = useState<HandState>(() => newHand(players, 0, 1));
  const [reviewed, setReviewed] = useState<{ handNo: number; checks: DecisionCheck[] } | null>(null);
  const [stats, setStats] = useState<SessionStats>(EMPTY_SESSION);
  const [reveal, setReveal] = useState(false);
  const [fast, setFast] = useState(false);
  const [ending, setEnding] = useState(false);

  // Start at the top of the table, whatever the lobby was scrolled to.
  useEffect(() => window.scrollTo(0, 0), []);

  // On your turn, make sure your cards are in view above the action bar.
  const heroSeat = useRef<HTMLDivElement>(null);
  const heroTurnNow = !hand.result && hand.toAct === 0;
  const footer = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!heroTurnNow) return;
    // After layout settles, and only if the action bar covers the seat. ("nearest" ignores the
    // seat's scroll margin once it's on screen, so align its end, margin included.)
    const frame = requestAnimationFrame(() => {
      const seat = heroSeat.current?.getBoundingClientRect();
      const bar = footer.current?.getBoundingClientRect();
      if (seat && bar && (seat.bottom > bar.top || seat.top < 0)) heroSeat.current!.scrollIntoView({ block: "end" });
    });
    return () => cancelAnimationFrame(frame);
  }, [heroTurnNow, hand.handNo]);

  // Record the hand once, where it ends, so a finished hand is never counted twice. The
  // review runs just after the result is on screen: a long hand can take a moment to check.
  function commit(next: HandState) {
    setHand(next);
    if (!next.result) return;
    setTimeout(() => {
      const checks = reviewHand(next, 0);
      setReviewed({ handNo: next.handNo, checks });
      saveHand(storedHand(next, setupTitle(setup), checks));
      setStats((s) => addStats(s, handStats(next, checks)));
      const questions = checks.flatMap((c) => (c.exercise ? [c.exercise] : []));
      if (questions.length) onMistakes(questions);
    }, 50);
  }

  useEffect(() => {
    if (hand.result || hand.toAct === null || hand.seats[hand.toAct].human) return;
    const heroOut = hand.seats[0].folded;
    const timer = setTimeout(
      () => {
        const seat = hand.seats[hand.toAct!];
        const c = chooseBotAction(seat.style!, situation(hand), seat.hole);
        commit(act(hand, c.action, c.label));
      },
      heroOut || fast ? 200 : 650,
    );
    return () => clearTimeout(timer);
    // `commit` only reads its argument, so the hand alone drives this loop.
  }, [hand, fast]);

  function nextHand() {
    const no = handNo + 1;
    setHandNo(no);
    setHand(newHand(players, (no - 1) % n, no));
    setReveal(false);
  }

  const heroTurn = !hand.result && hand.toAct === 0;
  const review = hand.result && reviewed?.handNo === hand.handNo ? reviewed.checks : null;
  const recent = hand.log.slice(-3).map((a) => {
    const you = hand.seats[a.seat].human;
    return actionText(a, you ? "You" : hand.seats[a.seat].name, you);
  });
  const opponents = hand.seats.map((_, i) => i).filter((i) => i !== 0);

  if (ending) {
    const checked = stats.good + stats.close + stats.mistakes;
    return (
      <div className="play-summary">
        <span className="complete-hero" aria-hidden="true">
          <Users size={44} />
        </span>
        <span className="eyebrow">{setupTitle(setup)}</span>
        <h1>Session over</h1>
        <div className="tool-stats play-stats">
          <div>
            <span className="eyebrow">Hands</span>
            <strong className="num">{stats.hands}</strong>
          </div>
          <div>
            <span className="eyebrow">Result</span>
            <strong className="num">{signedBB(stats.net)}</strong>
            {stats.hands >= 20 && <small className="num">{((stats.net / BB / stats.hands) * 100).toFixed(1)} bb/100</small>}
          </div>
          <div>
            <span className="eyebrow">Decisions checked</span>
            <strong className="num">{checked}</strong>
            {checked > 0 && (
              <small className="num">
                {stats.good} good · {stats.close} close · {stats.mistakes} mistakes
              </small>
            )}
          </div>
        </div>
        <p className="muted result-copy">
          A few hands say little about your win rate; the decision checks tell you more. Keep an eye on the spots you get
          wrong most.
        </p>
        <div className="speed-actions">
          <button className="btn btn-secondary" onClick={() => setEnding(false)}>
            Keep playing
          </button>
          <button className="btn btn-primary" onClick={() => onLeave({ title: `Play: ${setupTitle(setup)}`, ...stats })} autoFocus>
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="play">
      <header className="play-top">
        <button className="icon-button" onClick={() => (stats.hands > 0 ? setEnding(true) : onLeave({ title: "", ...stats }))} aria-label="Leave table">
          <X size={22} />
        </button>
        <span className="play-title">{setupTitle(setup)}</span>
        <span className="play-score num" title="Your result this session">
          {stats.hands} {stats.hands === 1 ? "hand" : "hands"} · {signedBB(stats.net)}
        </span>
        <button className={`icon-button ${fast ? "on" : ""}`} onClick={() => setFast((f) => !f)} aria-pressed={fast} aria-label="Fast bots">
          <FastForward size={20} />
        </button>
      </header>

      <main className="play-table">
        <div className={`play-opponents n${opponents.length}`}>
          {opponents.map((i) => (
            <SeatView key={i} hand={hand} index={i} reveal={reveal} compact={opponents.length > 1} />
          ))}
        </div>
        <Board hand={hand} />
        <div className="play-log" aria-live="polite">
          {recent.map((line, i) => (
            <span key={`${hand.log.length}-${i}`}>{line}</span>
          ))}
        </div>
        <SeatView hand={hand} index={0} reveal={reveal} compact={false} seatRef={heroSeat} />
      </main>

      {review && (
        <section className="play-review" id="hand-review" aria-labelledby="review-title">
          <h2 id="review-title">Coach's review</h2>
          <ReviewList checks={review} />
          <p className="muted review-note">
            Opponents play fixed styles, so the coach knows every hand they would play this way. Equity is against those
            hands, not just the cards they held. Clear mistakes are added to Review mistakes on the Practice tab.
          </p>
        </section>
      )}

      <footer className="play-bottom" ref={footer}>
        {heroTurn && <ActionBar key={hand.log.length} hand={hand} onAct={(a) => commit(act(hand, a))} />}
        {!heroTurn && !hand.result && (
          <p className="action-info waiting">
            {hand.seats[0].folded ? "You folded. Finishing the hand…" : `${hand.seats[hand.toAct!]?.name ?? "Dealer"} is thinking…`}
          </p>
        )}
        {hand.result && (
          <div className="hand-result">
            <p className={`hand-result-line ${hand.result.net[0] > 0 ? "won" : hand.result.net[0] < 0 ? "lost" : ""}`}>
              <strong className="num">{signedBB(hand.result.net[0])}</strong> {resultLine(hand)}
            </p>
            {review && (
              <button
                className={`review-jump ${review.some((c) => c.verdict === "mistake") ? "has-mistakes" : ""}`}
                onClick={() => document.getElementById("hand-review")?.scrollIntoView({ behavior: "smooth", block: "start" })}
              >
                <span>Coach's review</span>
                <span className="review-counts num">{reviewCounts(review)}</span>
                <ChevronRight size={16} aria-hidden="true" />
              </button>
            )}
            <div className="action-buttons">
              {opponents.some((i) => hand.seats[i].folded || !hand.result!.showdown) && (
                <button className="btn btn-secondary" onClick={() => setReveal((r) => !r)} aria-pressed={reveal}>
                  <Eye size={16} aria-hidden="true" /> {reveal ? "Hide cards" : "Show their cards"}
                </button>
              )}
              <button className="btn btn-primary" onClick={nextHand} autoFocus>
                Next hand
              </button>
            </div>
          </div>
        )}
      </footer>
    </div>
  );
}

/* ------------------------------------------------------------------ Screen */

export function PlayScreen({
  lifetime,
  onExit,
  onMistakes,
}: {
  lifetime: PlayStats;
  /** Called with the session's results, or null if no hand was finished. */
  onExit: (summary: PlaySummary | null) => void;
  onMistakes: (exercises: ChoiceExercise[]) => void;
}) {
  const [setup, setSetup] = useState<TableSetup | null>(null);
  if (!setup) return <Lobby onPick={setSetup} onBack={() => onExit(null)} lifetime={lifetime} />;
  return <Table key={JSON.stringify(setup)} setup={setup} onLeave={(s) => onExit(s.hands > 0 ? s : null)} onMistakes={onMistakes} />;
}
