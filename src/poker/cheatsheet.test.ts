import { describe, expect, it } from "vitest";
import { GLOSSARY } from "../course/glossary";
import { BET_SIZE_TABLE, choose, matchupTable, ODDS_TABLE, OUTS_TABLE } from "./cheatsheet";

describe("cheat sheets", () => {
  it("computes binomial coefficients", () => {
    expect(choose(52, 2)).toBe(1326);
    expect(choose(50, 3)).toBe(19600);
    expect(choose(50, 5)).toBe(2118760);
  });

  it("matches the well-known everyday odds", () => {
    const odds = Object.fromEntries(ODDS_TABLE.map((r) => [r.event, r.probability]));
    expect(odds["Dealt any pocket pair"]).toBeCloseTo(1 / 17, 4);
    expect(odds["Dealt pocket aces (or any specific pair)"]).toBeCloseTo(1 / 221, 5);
    expect(odds["Pocket pair flops a set or better"]).toBeCloseTo(0.1176, 3);
    expect(odds["Suited hand flops a flush"]).toBeCloseTo(0.0084, 3);
    expect(odds["Suited hand makes a flush by the river"]).toBeCloseTo(0.064, 3);
  });

  it("lists exact draw odds", () => {
    const nine = OUTS_TABLE.find((r) => r.outs === 9)!;
    expect(nine.draw).toBe("Flush draw");
    expect(nine.twoCards).toBeCloseTo(0.35, 2);
    expect(nine.oneCard).toBeCloseTo(9 / 46, 5);
  });

  it("derives bet-size math from the formulas", () => {
    const pot = BET_SIZE_TABLE.find((r) => r.label === "Pot")!;
    expect(pot.callNeeds).toBeCloseTo(1 / 3);
    expect(pot.mdf).toBeCloseTo(0.5);
    expect(pot.bluffWorks).toBeCloseTo(0.5);
    const half = BET_SIZE_TABLE.find((r) => r.label === "½ pot")!;
    expect(half.callNeeds).toBeCloseTo(0.25);
    expect(half.mdf).toBeCloseTo(2 / 3);
  });

  it("reads preflop matchups from the equity table", () => {
    const aaKk = matchupTable().find((m) => m.hero === "AA" && m.villain === "KK")!;
    expect(aaKk.equity).toBeGreaterThan(0.8);
    expect(aaKk.equity).toBeLessThan(0.84);
  });
});

describe("glossary", () => {
  it("has unique terms with definitions", () => {
    const terms = GLOSSARY.map((g) => g.term.toLowerCase());
    expect(new Set(terms).size).toBe(terms.length);
    for (const g of GLOSSARY) expect(g.definition.length).toBeGreaterThan(20);
    expect(GLOSSARY.length).toBeGreaterThanOrEqual(80);
  });
});
