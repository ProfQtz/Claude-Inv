import { describe, expect, it } from "vitest";
import { seededRandom } from "../course/generator";
import { botPolicy, chooseBotAction } from "./bots";
import { parseCards } from "./cards";
import { act, type BotStyle, type HandState, newHand, type PlayerConfig, potSize, situation } from "./table";

const STYLES: BotStyle[] = ["nit", "station", "maniac", "regular"];

/** Play one all-bot hand to the end. */
function playOut(s: HandState, random: () => number): HandState {
  for (let steps = 0; s.toAct !== null; steps++) {
    if (steps > 300) throw new Error("hand did not end");
    const seat = s.seats[s.toAct];
    const c = chooseBotAction(seat.style!, situation(s), seat.hole, random);
    s = act(s, c.action, c.label);
  }
  return s;
}

describe("simulated opponents", () => {
  it("only take legal actions and every hand ends with chips accounted for", () => {
    const random = seededRandom("bots");
    for (let hand = 0; hand < 1200; hand++) {
      const n = hand % 2 ? 2 : 6;
      const table: PlayerConfig[] = Array.from({ length: n }, (_, i) => ({ name: `B${i}`, human: false, style: STYLES[(hand + i) % 4] }));
      const s = playOut(newHand(table, hand % n, hand, random), random);
      expect(s.result!.won.reduce((a, b) => a + b, 0)).toBe(potSize(s));
    }
  });

  it("return probabilities that sum to one, with unique labels", () => {
    const random = seededRandom("policy");
    for (let hand = 0; hand < 300; hand++) {
      const table: PlayerConfig[] = STYLES.map((style, i) => ({ name: `B${i}`, human: false, style }));
      let s = newHand([...table, ...table.slice(0, 2)], hand % 6, hand, random);
      while (s.toAct !== null) {
        const seat = s.seats[s.toAct];
        const choices = botPolicy(seat.style!, situation(s), seat.hole);
        expect(choices.reduce((sum, c) => sum + c.p, 0)).toBeCloseTo(1, 9);
        expect(new Set(choices.map((c) => c.label)).size).toBe(choices.length);
        const c = chooseBotAction(seat.style!, situation(s), seat.hole, random);
        s = act(s, c.action, c.label);
      }
    }
  });

  it("play like their styles: stations and maniacs play far more hands than nits", () => {
    const random = seededRandom("styles");
    const played: Record<BotStyle, { hands: number; vpip: number; pfr: number }> = {
      nit: { hands: 0, vpip: 0, pfr: 0 },
      station: { hands: 0, vpip: 0, pfr: 0 },
      maniac: { hands: 0, vpip: 0, pfr: 0 },
      regular: { hands: 0, vpip: 0, pfr: 0 },
    };
    for (let hand = 0; hand < 1500; hand++) {
      const table: PlayerConfig[] = Array.from({ length: 6 }, (_, i) => ({ name: `B${i}`, human: false, style: STYLES[(hand + i) % 4] }));
      const s = playOut(newHand(table, hand % 6, hand, random), random);
      s.seats.forEach((seat, i) => {
        const pre = s.log.filter((a) => a.seat === i && a.street === "preflop");
        const stats = played[seat.style!];
        stats.hands++;
        if (pre.some((a) => a.kind === "call" || a.kind === "raise")) stats.vpip++;
        if (pre.some((a) => a.kind === "raise")) stats.pfr++;
      });
    }
    const vpip = (st: BotStyle) => played[st].vpip / played[st].hands;
    const pfr = (st: BotStyle) => played[st].pfr / played[st].hands;
    expect(vpip("nit")).toBeLessThan(0.16);
    expect(vpip("regular")).toBeGreaterThan(vpip("nit"));
    expect(vpip("station")).toBeGreaterThan(0.35);
    expect(pfr("station")).toBeLessThan(0.08);
    expect(pfr("maniac")).toBeGreaterThan(0.3);
    expect(pfr("maniac")).toBeGreaterThan(pfr("regular"));
  });

  it("value bet the nuts and check or give up with nothing, depending on style", () => {
    let s = newHand(
      [
        { name: "A", human: false, style: "regular" },
        { name: "B", human: false, style: "regular" },
      ],
      0,
      1,
      seededRandom("spot"),
    );
    s = act(act(s, { kind: "call" }), { kind: "check" });
    s.board = parseCards("Ah Kh 7c");
    // First to act without the initiative: mostly check, even with the nuts.
    const lead = botPolicy("regular", situation(s), parseCards("As Ad"));
    expect(lead.find((c) => c.action.kind === "check")!.p).toBeGreaterThan(0.5);
    const nit = botPolicy("nit", situation(s), parseCards("4d 2s"));
    expect(nit.find((c) => c.action.kind === "check")!.p).toBeGreaterThan(0.9);
    // Checked to, last to act: bet the nuts for value.
    s = act(s, { kind: "check" });
    const nuts = botPolicy("regular", situation(s), parseCards("As Ad"));
    expect(nuts.find((c) => c.action.kind === "bet")!.p).toBeGreaterThan(0.5);
  });
});
