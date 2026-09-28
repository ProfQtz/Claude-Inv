import { describe, expect, it } from "vitest";
import { parseCards } from "./cards";
import { exactEquity } from "./equity";

const eq = (a: string, b: string, board: string) => exactEquity(parseCards(a), parseCards(b), parseCards(board));

describe("exactEquity", () => {
  it("gives a set vs an overpair about 90% on the flop", () => {
    expect(eq("7c 7d", "Ah Ad", "7s Kd 2h").equity).toBeGreaterThan(0.88);
  });

  it("gives a flush draw vs top pair roughly a third", () => {
    const e = eq("Ah 7h", "Kc Qd", "Kh 9h 2c").equity;
    expect(e).toBeGreaterThan(0.35);
    expect(e).toBeLessThan(0.5);
  });

  it("splits when both play the board", () => {
    const e = eq("2c 3d", "4c 5d", "As Ks Qs Js Ts");
    expect(e.tie).toBe(1);
    expect(e.equity).toBe(0.5);
  });

  it("sums to one from both sides", () => {
    const a = eq("Ah Kh", "Qs Qd", "2h 7h 9c").equity;
    const b = eq("Qs Qd", "Ah Kh", "2h 7h 9c").equity;
    expect(a + b).toBeCloseTo(1);
  });
});
