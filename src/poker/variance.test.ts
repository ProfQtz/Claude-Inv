import { describe, expect, it } from "vitest";
import { seededRandom } from "../course/generator";
import { normalCdf, simulatePaths, varianceSummary } from "./variance";

describe("normal CDF", () => {
  it("matches standard table values", () => {
    expect(normalCdf(0)).toBeCloseTo(0.5, 7);
    expect(normalCdf(1.96)).toBeCloseTo(0.975, 4);
    expect(normalCdf(-1)).toBeCloseTo(0.158655, 5);
    expect(normalCdf(2.5758)).toBeCloseTo(0.995, 4);
  });
});

describe("variance summary", () => {
  const base = { winRate: 5, stdDev: 90, hands: 10_000, bankroll: 3000 };

  it("gives the expected result and spread", () => {
    const s = varianceSummary(base);
    expect(s.expected).toBe(500);
    expect(s.sd).toBe(900);
    expect(s.low95).toBeCloseTo(500 - 1.96 * 900);
    expect(s.high95).toBeCloseTo(500 + 1.96 * 900);
  });

  it("shows a 5 bb/100 winner is down after 10k hands about 29% of the time", () => {
    expect(varianceSummary(base).probLoss).toBeCloseTo(0.2893, 3);
    expect(varianceSummary({ ...base, hands: 100_000 }).probLoss).toBeCloseTo(0.0395, 3);
  });

  it("computes risk of ruin and the bankroll for 5% risk", () => {
    const s = varianceSummary(base);
    expect(s.riskOfRuin).toBeCloseTo(Math.exp((-2 * 5 * 3000) / 8100), 10);
    expect(s.riskOfRuin).toBeCloseTo(0.0246, 3);
    expect(s.bankrollFor5).toBeCloseTo((8100 * Math.log(20)) / 10, 6);
    expect(Math.round(s.bankrollFor5)).toBe(2427);
    // At exactly that bankroll the risk is 5%.
    expect(varianceSummary({ ...base, bankroll: s.bankrollFor5 }).riskOfRuin).toBeCloseTo(0.05, 10);
  });

  it("treats break-even and losing players as certain to go broke eventually", () => {
    expect(varianceSummary({ ...base, winRate: 0 }).riskOfRuin).toBe(1);
    expect(varianceSummary({ ...base, winRate: -2 }).bankrollFor5).toBe(Infinity);
  });
});

describe("simulated paths", () => {
  it("have the right length and match the model on average", () => {
    const random = seededRandom("variance");
    const paths = simulatePaths({ winRate: 5, stdDev: 90, hands: 10_000 }, 2000, 11, random);
    expect(paths).toHaveLength(2000);
    paths.forEach((p) => expect(p).toHaveLength(11));
    const finals = paths.map((p) => p[10]);
    const mean = finals.reduce((a, b) => a + b, 0) / finals.length;
    const sd = Math.sqrt(finals.reduce((a, b) => a + (b - mean) ** 2, 0) / finals.length);
    expect(Math.abs(mean - 500)).toBeLessThan(60);
    expect(Math.abs(sd - 900)).toBeLessThan(45);
    expect(paths.every((p) => p[0] === 0)).toBe(true);
  });
});
