import { describe, expect, it } from "vitest";
import { classEquity, recommend, solvePushFold } from "./nash";
import { blockerWeights, CLASS_INDEX, classCombos, decodeEquities, encodeEquity, HAND_CLASSES } from "./preflop";

describe("preflop classes", () => {
  it("has 169 classes covering all 1,326 combos", () => {
    expect(HAND_CLASSES).toHaveLength(169);
    expect(HAND_CLASSES.reduce((n, l) => n + classCombos(l).length, 0)).toBe(1326);
  });

  it("round-trips encoded equities", () => {
    const values = [0, 0.1234, 0.5, 0.8175, 1];
    const decoded = decodeEquities(values.map(encodeEquity).join(""));
    values.forEach((v, i) => expect(decoded[i]).toBeCloseTo(v, 3));
  });

  it("accounts for card removal", () => {
    const w = blockerWeights();
    const at = (a: string, b: string) => w[CLASS_INDEX.get(a)! * 169 + CLASS_INDEX.get(b)!];
    expect(at("AA", "KK")).toBe(6);
    expect(at("AA", "AA")).toBe(1);
    expect(at("AA", "AKs")).toBe(2);
    expect(at("AKo", "AA")).toBeCloseTo(3);
  });
});

describe("preflop equity table", () => {
  // Well-known all-in matchups; the table is sampled, so allow a small tolerance.
  it.each([
    ["AA", "KK", 0.82],
    ["AKs", "QQ", 0.46],
    ["22", "AKo", 0.53],
    ["AA", "72o", 0.88],
    // Exact enumeration of KsQs vs AhJd gives 44.2%; the class average is a little lower.
    ["KQs", "AJo", 0.44],
  ])("%s vs %s ≈ %s", (a, b, expected) => {
    expect(classEquity(a, b)).toBeGreaterThan(expected - 0.02);
    expect(classEquity(a, b)).toBeLessThan(expected + 0.02);
  });

  it("is symmetric", () => {
    expect(classEquity("AKo", "QJs") + classEquity("QJs", "AKo")).toBeCloseTo(1, 3);
  });
});

describe("push/fold solver", () => {
  it("finds an equilibrium: no pure deviation gains", () => {
    const s = solvePushFold(10);
    for (let i = 0; i < 169; i++) {
      // A hand that always shoves must not prefer folding (and vice versa), within solver noise.
      if (s.push[i] === 1) expect(s.pushMargin[i]).toBeGreaterThan(-0.02);
      if (s.push[i] === 0) expect(s.pushMargin[i]).toBeLessThan(0.02);
      if (s.call[i] === 1) expect(s.callMargin[i]).toBeGreaterThan(-0.02);
      if (s.call[i] === 0) expect(s.callMargin[i]).toBeLessThan(0.02);
    }
  });

  it("gets tighter as stacks get deeper", () => {
    const pct = [2, 5, 10, 15, 20].map((s) => solvePushFold(s).pushPercent);
    for (let k = 1; k < pct.length; k++) expect(pct[k]).toBeLessThanOrEqual(pct[k - 1] + 0.01);
    expect(pct[0]).toBeGreaterThan(0.9);
  });

  it("produces ranges in the known Nash ballpark at 10 BB", () => {
    const s = solvePushFold(10);
    expect(s.pushPercent).toBeGreaterThan(0.5);
    expect(s.pushPercent).toBeLessThan(0.65);
    expect(s.callPercent).toBeGreaterThan(0.3);
    expect(s.callPercent).toBeLessThan(0.45);
  });

  it("makes the obvious plays", () => {
    for (const stack of [3, 10, 20]) {
      const s = solvePushFold(stack);
      expect(recommend(s, "AA", "SB").action).toBe("Shove");
      expect(recommend(s, "AA", "BB").action).toBe("Call");
    }
    expect(recommend(solvePushFold(20), "72o", "SB").action).toBe("Fold");
    expect(recommend(solvePushFold(20), "72o", "BB").action).toBe("Fold");
  });

  it("shoves wider with antes in the pot", () => {
    expect(solvePushFold(15, 0.125).pushPercent).toBeGreaterThan(solvePushFold(15, 0).pushPercent);
  });
});
