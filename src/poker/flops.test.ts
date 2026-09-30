import { describe, expect, it } from "vitest";
import { seededRandom } from "../course/generator";
import { fullDeck, parseCards } from "./cards";
import { CANONICAL_FLOPS, flopIndex, flopKey, FLOP_SPOTS, randomSuits } from "./flops";
import { flopEquities, raiserEquity } from "./flopEdge";
import { FACING_SETS, OPENING_SETS } from "./ranges";
import { rangeCombos, rangeVsRangeEquity } from "./rangeTools";

describe("canonical flops", () => {
  it("cover all 22,100 flops exactly once, with matching weights", () => {
    expect(CANONICAL_FLOPS).toHaveLength(1755);
    const keys = CANONICAL_FLOPS.map((f) => flopKey(f.cards));
    expect(new Set(keys).size).toBe(1755);

    const seen = new Map<string, number>();
    const deck = fullDeck();
    for (let a = 0; a < 52; a++)
      for (let b = a + 1; b < 52; b++)
        for (let c = b + 1; c < 52; c++) {
          const key = flopKey([deck[a], deck[b], deck[c]]);
          seen.set(key, (seen.get(key) ?? 0) + 1);
        }
    expect(seen.size).toBe(1755);
    CANONICAL_FLOPS.forEach((f, i) => expect(seen.get(keys[i])).toBe(f.weight));
  });

  it("keep a flop's index under any suit relabeling and card order", () => {
    const flop = parseCards("Kh 8d 3s");
    const i = flopIndex(flop);
    expect(flopIndex(parseCards("3c 8h Ks"))).toBe(i);
    for (let k = 0; k < 20; k++) expect(flopIndex(randomSuits(flop))).toBe(i);
    expect(flopIndex(parseCards("Kh 8h 3s"))).not.toBe(i);
  });
});

describe("flop equity table", () => {
  it("has a value for every flop in every spot", () => {
    for (const spot of FLOP_SPOTS) {
      const table = flopEquities(spot.id);
      expect(table).toHaveLength(1755);
      expect(Math.min(...table)).toBeGreaterThan(0.3);
      expect(Math.max(...table)).toBeLessThan(0.75);
    }
  });

  it("matches fresh sampling", () => {
    // Each table entry is itself a 20,000-deal sample, with a standard error of about 0.0035.
    // A larger seeded sample keeps the check repeatable; 0.015 is over four of those errors.
    const random = seededRandom("flop-table");
    for (const spot of FLOP_SPOTS) {
      for (const text of ["As Kd 7c", "7h 6h 5d", "Qc Jc Td", "2c 2d 7h"]) {
        const flop = parseCards(text);
        const sampled = rangeVsRangeEquity(
          rangeCombos(OPENING_SETS[spot.raiser], flop),
          rangeCombos(FACING_SETS[spot.facing].call, flop),
          flop,
          50000,
          random,
        );
        expect(Math.abs(raiserEquity(spot.id, flop) - sampled), `${spot.id} ${text}`).toBeLessThan(0.015);
      }
    }
  });

  it("favours the raiser on high dry flops over low connected ones", () => {
    const high = parseCards("As Kd 7c");
    const low = parseCards("7h 6h 5d");
    expect(raiserEquity("co-btn", high) - raiserEquity("co-btn", low)).toBeGreaterThan(0.08);
    expect(raiserEquity("utg-btn", high) - raiserEquity("utg-btn", low)).toBeGreaterThan(0.08);
  });
});
