import { describe, expect, it } from "vitest";
import { parseCards } from "./cards";
import { chartLabel, combos, handLabel, OPENING_SETS, parseRange, POSITIONS, rangePercent } from "./ranges";

describe("hand labels", () => {
  it("labels pairs, suited and offsuit hands with the high card first", () => {
    const [a, k, q, a2] = parseCards("As Ks Qd Ah");
    expect(handLabel(k, a)).toBe("AKs");
    expect(handLabel(q, a)).toBe("AQo");
    expect(handLabel(a, a2)).toBe("AA");
  });

  it("lays out the chart with pairs on the diagonal, suited above and offsuit below", () => {
    expect(chartLabel(0, 0)).toBe("AA");
    expect(chartLabel(0, 1)).toBe("AKs");
    expect(chartLabel(1, 0)).toBe("AKo");
    expect(chartLabel(12, 12)).toBe("22");
  });

  it("counts combinations", () => {
    expect(combos("AA")).toBe(6);
    expect(combos("AKs")).toBe(4);
    expect(combos("AKo")).toBe(12);
  });
});

describe("parseRange", () => {
  it("expands plus notation", () => {
    expect([...parseRange("QQ+")].sort()).toEqual(["AA", "KK", "QQ"]);
    expect([...parseRange("K9s+")].sort()).toEqual(["K9s", "KJs", "KQs", "KTs"]);
    expect([...parseRange("ATo+")].sort()).toEqual(["AJo", "AKo", "AQo", "ATo"]);
  });

  it("expands dash ranges and singles", () => {
    expect([...parseRange("A5s-A3s")].sort()).toEqual(["A3s", "A4s", "A5s"]);
    expect([...parseRange("22-44, T9s")].sort()).toEqual(["22", "33", "44", "T9s"]);
  });

  it("covers the whole deck with 22+, A2s+ ... style tokens", () => {
    const all = new Set<string>();
    for (let r = 0; r < 13; r++) for (let c = 0; c < 13; c++) all.add(chartLabel(r, c));
    expect(all.size).toBe(169);
    expect(rangePercent(all)).toBeCloseTo(1);
  });

  it("rejects bad tokens", () => {
    expect(() => parseRange("ZZ+")).toThrow();
  });
});

describe("opening ranges", () => {
  it("widen from early to late position", () => {
    const pct = (id: keyof typeof OPENING_SETS) => rangePercent(OPENING_SETS[id]);
    expect(pct("UTG")).toBeLessThan(pct("HJ"));
    expect(pct("HJ")).toBeLessThan(pct("CO"));
    expect(pct("CO")).toBeLessThan(pct("BTN"));
    expect(pct("UTG")).toBeGreaterThan(0.1);
    expect(pct("BTN")).toBeLessThan(0.55);
  });

  it("always open premium hands and never open 72o", () => {
    for (const { id } of POSITIONS) {
      for (const hand of ["AA", "KK", "AKs", "AKo"]) expect(OPENING_SETS[id].has(hand)).toBe(true);
      expect(OPENING_SETS[id].has("72o")).toBe(false);
    }
  });

  it("nest each range inside the next wider one", () => {
    for (const hand of OPENING_SETS.UTG) expect(OPENING_SETS.HJ.has(hand)).toBe(true);
    for (const hand of OPENING_SETS.HJ) expect(OPENING_SETS.CO.has(hand)).toBe(true);
    for (const hand of OPENING_SETS.CO) expect(OPENING_SETS.BTN.has(hand)).toBe(true);
  });
});
