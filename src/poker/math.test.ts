import { describe, expect, it } from "vitest";
import { hitProbability, isProfitableCall, potOdds, ruleOf2And4 } from "./math";

describe("poker math", () => {
  it("computes pot odds", () => {
    expect(potOdds(100, 50)).toBeCloseTo(1 / 3);
    expect(potOdds(150, 50)).toBeCloseTo(0.25);
  });

  it("applies the rule of 2 and 4", () => {
    expect(ruleOf2And4(9, 2)).toBe(36);
    expect(ruleOf2And4(9, 1)).toBe(18);
  });

  it("computes exact hit probabilities", () => {
    expect(hitProbability(9, 2)).toBeCloseTo(0.35, 2);
    expect(hitProbability(9, 1)).toBeCloseTo(0.196, 3);
    expect(hitProbability(8, 2)).toBeCloseTo(0.315, 3);
  });

  it("decides profitable calls", () => {
    expect(isProfitableCall(0.196, 120, 20)).toBe(true);
    expect(isProfitableCall(0.087, 200, 100)).toBe(false);
  });
});
