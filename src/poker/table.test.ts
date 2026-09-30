import { describe, expect, it } from "vitest";
import { seededRandom } from "../course/generator";
import { cardCode, fullDeck, parseCards } from "./cards";
import {
  act,
  BB,
  buildPots,
  formatBB,
  type HandState,
  legalActions,
  newHand,
  type PlayerConfig,
  potSize,
  seatLabel,
  situation,
  START_STACK,
  type TableAction,
} from "./table";

const players = (n: number): PlayerConfig[] => Array.from({ length: n }, (_, i) => ({ name: `P${i}`, human: i === 0 }));

/** Give seats chosen hole cards and stack the deck so the board comes out as given. */
function rig(s: HandState, holes: string[], board: string): HandState {
  const used = new Set<string>();
  holes.forEach((h, i) => {
    s.seats[i].hole = parseCards(h);
    s.seats[i].hole.forEach((c) => used.add(cardCode(c)));
  });
  const boardCards = parseCards(board);
  boardCards.forEach((c) => used.add(cardCode(c)));
  const rest = fullDeck().filter((c) => !used.has(cardCode(c)));
  // Cards are dealt with pop(), so the first board card goes last.
  s.deck = [...rest, ...[...boardCards].reverse()];
  return s;
}

const play = (s: HandState, ...actions: TableAction[]) => actions.reduce((state, a) => act(state, a), s);
const conserved = (s: HandState) => s.result!.won.reduce((a, b) => a + b, 0) === potSize(s);

describe("formatting", () => {
  it("shows chips as big blinds with a real minus sign", () => {
    expect(formatBB(25)).toBe("2.5 BB");
    expect(formatBB(1000)).toBe("100 BB");
    expect(formatBB(-35)).toBe("−3.5 BB");
    expect(formatBB(0)).toBe("0 BB");
  });
});

describe("seats and blinds", () => {
  it("labels positions", () => {
    expect([0, 1, 2, 3, 4, 5].map((i) => seatLabel(6, 0, i))).toEqual(["BTN", "SB", "BB", "UTG", "HJ", "CO"]);
    expect([0, 1].map((i) => seatLabel(2, 1, i))).toEqual(["BB", "BTN"]);
  });

  it("posts blinds heads-up with the button on the small blind, acting first", () => {
    const s = newHand(players(2), 0, 1, seededRandom("hu"));
    expect(s.seats[0].bet).toBe(5);
    expect(s.seats[1].bet).toBe(10);
    expect(s.toAct).toBe(0);
    expect(potSize(s)).toBe(15);
    expect(s.seats.every((seat) => seat.hole.length === 2)).toBe(true);
  });

  it("starts 6-max action under the gun", () => {
    const s = newHand(players(6), 2, 1, seededRandom("6max"));
    expect(s.seats[3].bet).toBe(5);
    expect(s.seats[4].bet).toBe(10);
    expect(s.toAct).toBe(5);
    expect(situation(s).position).toBe("UTG");
  });
});

describe("betting rounds", () => {
  it("gives the big blind the option after a limp, then the big blind acts first on the flop", () => {
    let s = newHand(players(2), 0, 1, seededRandom("limp"));
    s = act(s, { kind: "call" });
    expect(s.toAct).toBe(1);
    expect(legalActions(s).canCheck).toBe(true);
    expect(legalActions(s).canRaise).toBe(true);
    s = act(s, { kind: "check" });
    expect(s.street).toBe("flop");
    expect(s.board).toHaveLength(3);
    expect(s.toAct).toBe(1);
    expect(s.currentBet).toBe(0);
  });

  it("wins the blinds when everyone folds", () => {
    let s = newHand(players(6), 0, 1, seededRandom("folds"));
    s = play(s, { kind: "fold" }, { kind: "fold" }, { kind: "fold" }, { kind: "fold" }, { kind: "fold" });
    expect(s.result!.showdown).toBe(false);
    expect(s.result!.won[2]).toBe(15);
    expect(s.result!.net[2]).toBe(5);
    expect(s.result!.net[1]).toBe(-5);
  });

  it("enforces the minimum raise", () => {
    let s = newHand(players(6), 0, 1, seededRandom("minraise"));
    s = act(s, { kind: "raise", to: 25 });
    expect(legalActions(s).minTo).toBe(40);
    expect(() => act(s, { kind: "raise", to: 30 })).toThrow();
    expect(() => act(s, { kind: "check" })).toThrow();
    s = act(s, { kind: "raise", to: 40 });
    expect(s.lastRaise).toBe(15);
  });

  it("doesn't reopen the betting after an incomplete all-in raise", () => {
    let s = newHand(players(3), 0, 1, seededRandom("short"));
    s.seats[2].stack = 60; // the big blind has 70 chips in total
    // Preflop: everyone calls, big blind checks.
    s = play(s, { kind: "call" }, { kind: "call" }, { kind: "check" });
    expect(s.street).toBe("flop");
    // Flop: SB bets 40, BB goes all-in for 60 (a raise of only 20), button calls.
    s = play(s, { kind: "bet", to: 40 });
    s = act(s, { kind: "raise", to: 60 });
    expect(s.seats[2].allIn).toBe(true);
    // The button hadn't acted yet, so it may still raise.
    expect(s.toAct).toBe(0);
    expect(legalActions(s).canRaise).toBe(true);
    s = act(s, { kind: "call" });
    // The small blind already acted: it can call or fold, not raise.
    expect(s.toAct).toBe(1);
    expect(legalActions(s).canRaise).toBe(false);
    expect(legalActions(s).toCall).toBe(20);
  });

  it("runs out the board when players are all-in", () => {
    let s = newHand(players(2), 0, 1, seededRandom("allin"));
    s = act(s, { kind: "raise", to: START_STACK });
    s = act(s, { kind: "call" });
    expect(s.result!.showdown).toBe(true);
    expect(s.board).toHaveLength(5);
    expect(conserved(s)).toBe(true);
  });
});

describe("showdown and pots", () => {
  it("splits a board-playing pot, odd chip to the first seat left of the button", () => {
    let s = rig(newHand(players(3), 0, 1, seededRandom("split")), ["2c 3d", "2d 3c", "4h 5h"], "As Ks Qs Js Ts");
    // Button folds, blinds check it down: pot 20 split between the blinds.
    s = play(s, { kind: "fold" }, { kind: "call" }, { kind: "check" });
    s = play(s, { kind: "check" }, { kind: "check" }, { kind: "check" }, { kind: "check" }, { kind: "check" }, { kind: "check" });
    expect(s.result!.showdown).toBe(true);
    expect(s.result!.won).toEqual([0, 10, 10]);
    expect(s.result!.hands[1]).toMatch(/Royal Flush|Straight Flush/);
  });

  it("builds side pots from unequal stacks", () => {
    let s = rig(newHand(players(3), 0, 1, seededRandom("side"), 500), ["As Ad", "Ks Kd", "Qs Qd"], "2c 7d 9h 3s 4c");
    s.seats[1].stack = 95; // small blind: 100 chips in total
    s.seats[2].stack = 290; // big blind: 300 in total
    s = act(s, { kind: "raise", to: 500 }); // button all-in for 500
    s = act(s, { kind: "call" }); // small blind all-in for 100
    s = act(s, { kind: "call" }); // big blind all-in for 300
    const pots = s.result!.pots;
    expect(pots.map((p) => p.amount)).toEqual([300, 400, 200]);
    expect(pots.map((p) => p.eligible.length)).toEqual([3, 2, 1]);
    // AA wins everything it's eligible for: all three pots.
    expect(s.result!.won).toEqual([900, 0, 0]);
    expect(conserved(s)).toBe(true);
  });

  it("gives the side pot to the best hand among those who covered it", () => {
    let s = rig(newHand(players(3), 0, 1, seededRandom("side2"), 500), ["Qs Qd", "As Ad", "Ks Kd"], "2c 7d 9h 3s 4c");
    s.seats[1].stack = 95;
    s.seats[2].stack = 290;
    s = play(s, { kind: "raise", to: 500 }, { kind: "call" }, { kind: "call" });
    // SB's aces win the 300 main pot, BB's kings the 400 side pot, the button gets 200 back.
    expect(s.result!.won).toEqual([200, 300, 400]);
  });

  it("counts folded chips in the pot", () => {
    const seats = [
      { total: 300, folded: true },
      { total: 100, folded: false },
      { total: 100, folded: false },
    ].map((x) => ({ ...x, name: "", human: false, stack: 0, hole: [], allIn: false, bet: 0, acted: true, mayRaise: true }));
    expect(buildPots(seats)).toEqual([{ amount: 500, eligible: [1, 2] }]);
  });
});

describe("random legal play", () => {
  it("always ends with every chip accounted for", () => {
    const random = seededRandom("fuzz");
    for (let hand = 0; hand < 1500; hand++) {
      const n = hand % 3 === 0 ? 2 : 6;
      let s = newHand(players(n), hand % n, hand, random, (hand % 5 === 0 ? 30 : 100) * BB);
      for (let steps = 0; s.toAct !== null; steps++) {
        if (steps > 200) throw new Error("hand did not end");
        const legal = legalActions(s);
        const options: TableAction[] = [];
        if (legal.canCheck) options.push({ kind: "check" });
        if (legal.canCall) options.push({ kind: "call" }, { kind: "call" });
        if (legal.canFold) options.push({ kind: "fold" });
        const size = legal.minTo + Math.floor(random() * (legal.maxTo - legal.minTo + 1));
        if (legal.canBet) options.push({ kind: "bet", to: size });
        if (legal.canRaise) options.push({ kind: "raise", to: size });
        s = act(s, options[Math.floor(random() * options.length)]);
      }
      const r = s.result!;
      expect(r.won.reduce((a, b) => a + b, 0)).toBe(potSize(s));
      expect(r.net.reduce((a, b) => a + b, 0)).toBe(0);
      expect(s.seats.every((seat) => seat.stack >= 0)).toBe(true);
      if (r.showdown) expect(s.board).toHaveLength(5);
    }
  });
});
