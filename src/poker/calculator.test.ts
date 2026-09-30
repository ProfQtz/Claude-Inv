import { describe, expect, it } from "vitest";
import { seededRandom } from "../course/generator";
import { calculateEquity } from "./calculator";
import { parseCards } from "./cards";
import { exactEquity } from "./equity";
import { parseRange } from "./ranges";

const cards = parseCards;

describe("equity calculator", () => {
  it("is exact for hand vs hand on the flop", () => {
    const r = calculateEquity(cards("Ah Kh"), { kind: "hand", cards: cards("Qs Qd") }, cards("Th 7h 2c"))!;
    expect(r.exact).toBe(true);
    expect(r.deals).toBe(990);
    expect(r.equity).toBe(exactEquity(cards("Ah Kh"), cards("Qs Qd"), cards("Th 7h 2c")).equity);
  });

  it("simulates hand vs hand before the flop", () => {
    const r = calculateEquity(cards("As Ah"), { kind: "hand", cards: cards("Ks Kh") }, [], seededRandom("pre"))!;
    expect(r.exact).toBe(false);
    expect(Math.abs(r.equity - 0.82)).toBeLessThan(0.01);
  });

  it("counts every combo and river exactly on the turn", () => {
    // AA vs KK on a dry turn: only the two remaining kings beat you.
    const r = calculateEquity(cards("As Ah"), { kind: "range", range: parseRange("KK") }, cards("2c 7d 9s 3h"))!;
    expect(r.exact).toBe(true);
    expect(r.combos).toBe(6);
    expect(r.deals).toBe(6 * 44);
    expect(r.equity).toBeCloseTo(1 - 2 / 44, 10);
  });

  it("applies card removal on the river", () => {
    // AA (6 combos) beats you; QQ has only 3 combos left and loses.
    const r = calculateEquity(cards("Kh Qh"), { kind: "range", range: parseRange("AA, QQ") }, cards("Kd 9c 4s 2h 7c"))!;
    expect(r.combos).toBe(9);
    expect(r.equity).toBeCloseTo(3 / 9, 10);
  });

  it("simulates a range before the flop", () => {
    const r = calculateEquity(cards("As Ah"), { kind: "range", range: parseRange("KK") }, [], seededRandom("range"))!;
    expect(Math.abs(r.equity - 0.82)).toBeLessThan(0.01);
  });

  it("returns null when card removal empties the range", () => {
    expect(calculateEquity(cards("As Ah"), { kind: "range", range: parseRange("AA") }, cards("Ad Ac 2s"))).toBeNull();
  });

  it("rejects a partial board", () => {
    expect(() => calculateEquity(cards("As Ah"), { kind: "hand", cards: cards("Ks Kh") }, cards("2c 7d"))).toThrow();
  });
});
