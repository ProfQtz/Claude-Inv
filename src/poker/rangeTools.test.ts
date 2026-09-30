import { describe, expect, it } from "vitest";
import { parseCards } from "./cards";
import { exactEquity } from "./equity";
import { HandCategory } from "./evaluator";
import { parseRange } from "./ranges";
import { flopDraw, rangeCombos, rangeVsRangeEquity, riverRange, topPairOrBetter } from "./rangeTools";

const cards = parseCards;

describe("range combos", () => {
  it("removes combos that use dead cards", () => {
    expect(rangeCombos(["AKs"], cards("Ah"))).toHaveLength(3);
    expect(rangeCombos(["AA"], cards("As Ah"))).toHaveLength(1);
    expect(rangeCombos(parseRange("AKo"), [])).toHaveLength(12);
  });
});

describe("flop draws", () => {
  it.each([
    ["Ah 5h", "Kh 9h 2c", "flush"],
    ["Ah 3c", "Kh 9h 2h", "flush"], // one-card flush draw
    ["Jh Th", "9h 8c 2h", "flush"], // flush draw beats the straight draw label
    ["9c 8d", "7s 6h 2c", "straight"], // open-ended
    ["9c 5d", "7s 6h 2c", null], // gutshot only
    ["Ac 2d", "3s 4h 9c", null], // wheel gutshot
    ["Ac 2d", "3s 4h 5c", null], // made straight
    ["Ah 3h", "Kh 9h 2h", null], // made flush
  ])("%s on %s is %s", (hole, flop, draw) => {
    expect(flopDraw(cards(hole), cards(flop))).toBe(draw);
  });
});

describe("polarized river ranges", () => {
  const board = cards("Kh 9h 4c 2d 7s");
  const range = parseRange("K9s, AQs, 76s, AKs");

  it("keeps two pair or better and missed draws, and checks one pair", () => {
    const read = riverRange(range, board);
    // K9s: three combos (the hearts combo uses the board's Kh). AQs: only AhQh had a flush draw.
    expect(read.value).toEqual({ [HandCategory.TwoPair]: 3 });
    expect(read.bluffs).toEqual({ flush: 1, straight: 0 });
    expect([read.valueTotal, read.bluffTotal]).toEqual([3, 1]);
  });

  it("applies hero's blockers", () => {
    const read = riverRange(range, board, cards("Ah Kd"));
    expect([read.valueTotal, read.bluffTotal]).toEqual([2, 0]);
  });
});

describe("range vs range equity", () => {
  it("matches exact enumeration for single combos", () => {
    const flop = cards("2c 7d 9s");
    const exact = exactEquity(cards("As Ah"), cards("Ks Kh"), flop).equity;
    const sampled = rangeVsRangeEquity([cards("As Ah")], [cards("Ks Kh")], flop, 20000);
    expect(Math.abs(sampled - exact)).toBeLessThan(0.015);
  });
});

describe("top pair or better", () => {
  it.each([
    ["As Qd", "Ah 7c 2d", true],
    ["Ks Qd", "Ah 7c 2d", false],
    ["Ks Kd", "Qh 7c 2d", true],
    ["5s 5d", "Qh 7c 2d", false],
    ["7s 2s", "Qh 7c 2d", true],
    ["As 2s", "2h 2c 7d", true],
    ["As 7s", "2h 2c 7d", true],
    ["9s 9d", "2h 2c 7d", true],
    ["9s 8s", "Th 7c 6d", true],
    ["Js 9s", "Th 7c 6d", false],
  ])("%s on %s: %s", (hole, flop, expected) => {
    expect(topPairOrBetter(cards(hole), cards(flop))).toBe(expected);
  });
});
