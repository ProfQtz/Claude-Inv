import { ArrowLeft, BookOpen, Calculator, ChartSpline, ChevronRight, Grid3x3, Search, Table2, TextSearch } from "lucide-react";
import { type CSSProperties, type ReactNode, useMemo, useState } from "react";
import { COURSE, SECTIONS } from "../course/course";
import { GLOSSARY } from "../course/glossary";
import { NamedIcon } from "../components/Icons";
import { BET_SIZE_TABLE, matchupTable, ODDS_TABLE, OUTS_TABLE } from "../poker/cheatsheet";
import { formatPercent } from "../poker/math";
import { RangesScreen } from "./RangesScreen";
import { EquityCalculator, VarianceTool } from "./ToolsScreens";

export type LibraryView = "charts" | "equity" | "variance" | "glossary" | "cheats" | "guides";

const pct1 = (x: number) => `${(x * 100).toFixed(1)}%`;

function SubPage({ title, lead, onBack, children }: { title: string; lead?: string; onBack: () => void; children: ReactNode }) {
  return (
    <div className="page library-page">
      <button className="btn btn-ghost back" onClick={onBack}>
        <ArrowLeft size={18} aria-hidden="true" /> Library
      </button>
      <header className="page-head">
        <h1>{title}</h1>
        {lead && <p>{lead}</p>}
      </header>
      {children}
    </div>
  );
}

function Glossary({ onBack }: { onBack: () => void }) {
  const [query, setQuery] = useState("");
  const entries = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...GLOSSARY]
      .sort((a, b) => a.term.localeCompare(b.term, undefined, { sensitivity: "base", numeric: true }))
      .filter((e) => !q || e.term.toLowerCase().includes(q) || e.definition.toLowerCase().includes(q));
  }, [query]);

  return (
    <SubPage title="Glossary" lead={`${GLOSSARY.length} poker terms, from 3-bet to wheel.`} onBack={onBack}>
      <label className="search-box" htmlFor="glossary-search">
        <Search size={18} aria-hidden="true" />
        <input
          id="glossary-search"
          type="search"
          placeholder="Search terms"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoComplete="off"
        />
      </label>
      {entries.length === 0 ? (
        <p className="muted empty-note">No terms match “{query}”.</p>
      ) : (
        <dl className="glossary">
          {entries.map((e) => (
            <div key={e.term} className="glossary-entry">
              <dt>{e.term}</dt>
              <dd>{e.definition}</dd>
            </div>
          ))}
        </dl>
      )}
    </SubPage>
  );
}

function CheatSheets({ onBack }: { onBack: () => void }) {
  const matchups = useMemo(matchupTable, []);
  return (
    <SubPage title="Cheat sheets" lead="The numbers strong players know by heart, computed exactly." onBack={onBack}>
      <section className="sheet">
        <h2 className="section-title">Outs to equity</h2>
        <p className="muted sheet-note">Chance to hit by the river. The rule of 4 and 2 (outs × 4 on the flop, × 2 on the turn) gets close.</p>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col" className="num">Outs</th>
                <th scope="col">Common draw</th>
                <th scope="col" className="num">Flop → river</th>
                <th scope="col" className="num">Turn → river</th>
              </tr>
            </thead>
            <tbody>
              {OUTS_TABLE.map((r) => (
                <tr key={r.outs} className={r.draw ? "highlight-row" : ""}>
                  <td className="num">{r.outs}</td>
                  <td>{r.draw}</td>
                  <td className="num">{pct1(r.twoCards)}</td>
                  <td className="num">{pct1(r.oneCard)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="sheet">
        <h2 className="section-title">Bet sizes</h2>
        <p className="muted sheet-note">
          Facing a bet: the equity you need to call and how much of your range to defend (MDF). Making a bet: how often a
          pure bluff must work.
        </p>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Bet</th>
                <th scope="col" className="num">Call needs</th>
                <th scope="col" className="num">Defend (MDF)</th>
                <th scope="col" className="num">Bluff must work</th>
              </tr>
            </thead>
            <tbody>
              {BET_SIZE_TABLE.map((r) => (
                <tr key={r.label}>
                  <td>{r.label}</td>
                  <td className="num">{formatPercent(r.callNeeds)}</td>
                  <td className="num">{formatPercent(r.mdf)}</td>
                  <td className="num">{formatPercent(r.bluffWorks)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="sheet">
        <h2 className="section-title">Preflop all-in matchups</h2>
        <p className="muted sheet-note">Equity of the first hand when all the chips go in before the flop.</p>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Matchup</th>
                <th scope="col">Example</th>
                <th scope="col" className="num">Equity</th>
              </tr>
            </thead>
            <tbody>
              {matchups.map((m) => (
                <tr key={m.name}>
                  <td>{m.name}</td>
                  <td className="num">
                    {m.hero} vs {m.villain}
                  </td>
                  <td className="num">{formatPercent(m.equity)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="sheet">
        <h2 className="section-title">Everyday odds</h2>
        <div className="table-wrap">
          <table className="data-table">
            <tbody>
              {ODDS_TABLE.map((r) => (
                <tr key={r.event}>
                  <td>{r.event}</td>
                  <td className="num">{pct1(r.probability)}</td>
                  <td className="num muted">1 in {(1 / r.probability).toFixed(r.probability > 0.1 ? 1 : 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </SubPage>
  );
}

function Guidebooks({ onBack }: { onBack: () => void }) {
  return (
    <SubPage title="Guidebooks" lead="The key ideas from every unit, in one place." onBack={onBack}>
      {SECTIONS.map((section, si) => (
        <section key={section.id} className="guides-section">
          <span className="eyebrow">Section {si + 1}</span>
          <h2 className="section-title">{section.title}</h2>
          {section.unitIds.map((id) => {
            const unit = COURSE.find((u) => u.id === id)!;
            return (
              <details key={id} className="guide-card" style={{ "--unit-color": unit.color } as CSSProperties}>
                <summary>
                  <span className="icon-disc unit small">
                    <NamedIcon name={unit.icon} size={18} />
                  </span>
                  <span className="row-text">
                    <strong>{unit.title}</strong>
                    <span>{unit.description}</span>
                  </span>
                  <ChevronRight className="row-chevron" size={20} aria-hidden="true" />
                </summary>
                <div className="guide-sections">
                  {unit.guidebook.map((g) => (
                    <div key={g.heading} className="guide-section">
                      <h4>{g.heading}</h4>
                      <p>{g.body}</p>
                    </div>
                  ))}
                </div>
              </details>
            );
          })}
        </section>
      ))}
    </SubPage>
  );
}

const ENTRIES: { view: LibraryView; title: string; body: string; icon: ReactNode; tone: string }[] = [
  {
    view: "charts",
    title: "Strategy charts",
    body: "Push/fold solver, opening ranges and facing-a-raise charts.",
    icon: <Grid3x3 size={22} aria-hidden="true" />,
    tone: "brand",
  },
  {
    view: "equity",
    title: "Equity calculator",
    body: "Your hand against a hand or a range, on any board.",
    icon: <Calculator size={22} aria-hidden="true" />,
    tone: "red",
  },
  {
    view: "variance",
    title: "Variance & bankroll",
    body: "How big the swings get, and how many buy-ins you need.",
    icon: <ChartSpline size={22} aria-hidden="true" />,
    tone: "brand",
  },
  {
    view: "cheats",
    title: "Cheat sheets",
    body: "Outs, bet sizes, preflop matchups and everyday odds.",
    icon: <Table2 size={22} aria-hidden="true" />,
    tone: "blue",
  },
  {
    view: "glossary",
    title: "Glossary",
    body: `${GLOSSARY.length} poker terms explained in plain language.`,
    icon: <TextSearch size={22} aria-hidden="true" />,
    tone: "gold",
  },
  {
    view: "guides",
    title: "Guidebooks",
    body: `The key ideas from all ${COURSE.length} units.`,
    icon: <BookOpen size={22} aria-hidden="true" />,
    tone: "orange",
  },
];

export function LibraryScreen({ view, onView }: { view: LibraryView | null; onView: (v: LibraryView | null) => void }) {
  const back = () => onView(null);
  if (view === "charts") return <RangesScreen onBack={back} backLabel="Library" />;
  if (view === "equity")
    return (
      <SubPage title="Equity calculator" lead="Pick cards to see how often your hand wins. Exact where possible, simulated otherwise." onBack={back}>
        <EquityCalculator />
      </SubPage>
    );
  if (view === "variance")
    return (
      <SubPage title="Variance & bankroll" lead="Even winning players have long losing stretches. See how long, and what bankroll survives them." onBack={back}>
        <VarianceTool />
      </SubPage>
    );
  if (view === "glossary") return <Glossary onBack={back} />;
  if (view === "cheats") return <CheatSheets onBack={back} />;
  if (view === "guides") return <Guidebooks onBack={back} />;

  return (
    <div className="page">
      <header className="page-head">
        <h1>Library</h1>
        <p>Reference material to keep open while you study or play.</p>
      </header>
      <div className="library-grid">
        {ENTRIES.map((e) => (
          <button key={e.view} className="library-card" onClick={() => onView(e.view)}>
            <span className={`icon-tile lg ${e.tone}`}>{e.icon}</span>
            <span className="row-text">
              <strong>{e.title}</strong>
              <span>{e.body}</span>
            </span>
            <ChevronRight className="row-chevron" size={20} aria-hidden="true" />
          </button>
        ))}
      </div>
    </div>
  );
}
