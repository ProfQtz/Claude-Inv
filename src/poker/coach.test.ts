import { describe, expect, it } from "vitest";
import { seededRandom } from "../course/generator";
import { botPolicy, chooseBotAction } from "./bots";
import { cardCode, parseCards } from "./cards";
import { equityVsRanges, inferRange, reviewHand } from "./coach";
import { exactEquity } from "./equity";
import { handLabel } from "./ranges";
import { act, type BotStyle, type HandState, newHand, type PlayerConfig, situation } from "./table";

const STYLES: BotStyle[] = ["nit", "station", "maniac", "regular"];

function botHand(n: number, seed: string, hand: number): HandState {
  const random = seededRandom(seed);
  const table: PlayerConfig[] = Array.from({ length: n }, (_, i) => ({ name: `B${i}`, human: false, style: STYLES[(hand + i) % 4] }));
  let s = newHand(table, hand % n, hand, random);
  while (s.toAct !== null) {
    const seat = s.seats[s.toAct];
    const c = chooseBotAction(seat.style!, situation(s), seat.hole, random);
    s = act(s, c.action, c.label);
  }
  return s;
}

/** Take a bot's action by its label, as its policy would size it for its actual cards. */
function botAct(s: HandState, labelPrefix: string): HandState {
  const seat = s.seats[s.toAct!];
  const c = botPolicy(seat.style!, situation(s), seat.hole).find((x) => x.label.startsWith(labelPrefix));
  if (!c) throw new Error(`${seat.style} with ${seat.hole.map(cardCode).join("")} never takes "${labelPrefix}" here`);
  return act(s, c.action, c.label);
}

describe("range inference", () => {
  it("always keeps the bot's actual hand, weighted by the chances of its actual actions", () => {
    let checked = 0;
    for (let hand = 0; hand < 150; hand++) {
      const s = botHand(hand % 3 ? 6 : 2, `infer-${hand}`, hand);
      s.seats.forEach((seat, i) => {
        const others = s.seats.flatMap((o, j) => (j === i ? [] : o.hole));
        const range = inferRange(seat.style!, i, s.log, [...s.board, ...others]);
        const mine = range.find((r) => cardCode(r.combo[0]) + cardCode(r.combo[1]) === seat.hole.map(cardCode).join("") ||
          cardCode(r.combo[1]) + cardCode(r.combo[0]) === seat.hole.map(cardCode).join(""));
        expect(mine, `${seat.style} seat ${i} hand ${hand}`).toBeDefined();
        const expected = s.log
          .filter((a) => a.seat === i)
          .reduce((w, a) => w * botPolicy(seat.style!, a.situation, seat.hole).find((c) => c.label === a.label)!.p, 1);
        expect(mine!.weight).toBeCloseTo(expected, 12);
        checked++;
      });
    }
    expect(checked).toBeGreaterThan(500);
  });

  it("narrows a nit's range after it raises from under the gun", () => {
    let s = newHand(
      Array.from({ length: 6 }, (_, i) => ({ name: `B${i}`, human: false, style: "nit" as BotStyle })),
      0,
      1,
      seededRandom("nit"),
    );
    s.seats[3].hole = parseCards("As Ad");
    s = botAct(s, "raise");
    const range = inferRange("nit", 3, s.log, []);
    const share = range.reduce((sum, r) => sum + r.weight, 0) / 1326;
    expect(share).toBeGreaterThan(0.05);
    expect(share).toBeLessThan(0.15);
    const labels = new Set(range.map((r) => handLabel(r.combo[0], r.combo[1])));
    expect(labels.has("AA")).toBe(true);
    expect(labels.has("72o")).toBe(false);
    expect(labels.has("K4o")).toBe(false);
  });
});

describe("equity against ranges", () => {
  it("matches exact enumeration for a single hand", () => {
    const hero = parseCards("Ah Kh");
    const villain = [{ combo: parseCards("Qs Qd"), weight: 1 }];
    for (const board of ["Th 7h 2c", "Th 7h 2c 3s", "Th 7h 2c 3s 9d"]) {
      const exact = exactEquity(hero, villain[0].combo, parseCards(board)).equity;
      const est = equityVsRanges(hero, parseCards(board), [villain], seededRandom(board), 20000);
      expect(Math.abs(est - exact), board).toBeLessThan(0.015);
    }
  });

  it("handles several opponents: aces against two random hands win about 73%", () => {
    const hero = parseCards("As Ah");
    const any = inferRange("station", -1, [], hero);
    const eq = equityVsRanges(hero, [], [any, any], seededRandom("multi"), 20000);
    expect(Math.abs(eq - 0.73)).toBeLessThan(0.015);
  });
});

describe("coach review", () => {
  /** Deal hero's cards and the board, then find bot cards that really take the scripted line. */
  function scripted(style: BotStyle, heroCards: string, board: string, line: (s: HandState) => HandState): HandState {
    const hero = parseCards(heroCards);
    const boardCards = parseCards(board);
    const used = new Set([...hero, ...boardCards].map(cardCode));
    for (const combo of inferRange(style, -1, [], [...hero, ...boardCards])) {
      let s = newHand(
        [
          { name: "You", human: true },
          { name: "Bot", human: false, style },
        ],
        0,
        1,
        seededRandom(style),
      );
      s.seats[0].hole = hero;
      s.seats[1].hole = combo.combo;
      const taken = new Set([...used, ...combo.combo.map(cardCode)]);
      s.deck = [...s.deck.filter((c) => !taken.has(cardCode(c))), ...[...boardCards].reverse()];
      try {
        return line(s);
      } catch {
        // These cards don't take the line; try the next hand.
      }
    }
    throw new Error(`No ${style} hand takes this line`);
  }

  /** Heads-up: hero on the button raises, the bot calls, checks flop and turn, bets the river; hero calls. */
  const riverCall = (style: BotStyle, heroCards: string, board: string) =>
    scripted(style, heroCards, board, (s) => {
      s = act(s, { kind: "raise", to: 25 });
      s = botAct(s, "call");
      for (let street = 0; street < 2; street++) {
        s = botAct(s, "check");
        s = act(s, { kind: "check" });
      }
      s = botAct(s, "bet");
      return act(s, { kind: "call" });
    });

  it("flags calling a nit's river bet with a weak pair, but not a maniac's", () => {
    const nit = reviewHand(riverCall("nit", "5s 5d", "Kh 9c 2d 7s Jh"), 0, seededRandom("r1"));
    const maniac = reviewHand(riverCall("maniac", "5s 5d", "Kh 9c 2d 7s Jh"), 0, seededRandom("r2"));
    const nitCall = nit.find((c) => c.street === "river")!;
    const maniacCall = maniac.find((c) => c.street === "river")!;
    expect(nitCall.verdict).toBe("mistake");
    expect(maniacCall.verdict).not.toBe("mistake");
    expect(nitCall.detail).not.toContain("NaN");
  });

  it("recommends betting top pair into a calling station on the river", () => {
    let s = newHand(
      [
        { name: "You", human: true },
        { name: "Bot", human: false, style: "station" },
      ],
      0,
      1,
      seededRandom("station"),
    );
    s.seats[0].hole = parseCards("Ks Qd");
    s.seats[1].hole = parseCards("9h 8h");
    const board = parseCards("Kh 7c 2d 4s 3c");
    const used = new Set([...s.seats[0].hole, ...s.seats[1].hole, ...board].map(cardCode));
    s.deck = [...s.deck.filter((c) => !used.has(cardCode(c))), ...[...board].reverse()];
    s = act(s, { kind: "raise", to: 25 });
    s = botAct(s, "call");
    for (let street = 0; street < 3; street++) {
      s = botAct(s, "check");
      if (street < 2) s = act(s, { kind: "check" });
    }
    const checkedBack = reviewHand(act(s, { kind: "check" }), 0, seededRandom("c"));
    expect(checkedBack.find((c) => c.street === "river")!.verdict).toBe("mistake");
    const bet = reviewHand(act(s, { kind: "bet", to: 30 }), 0, seededRandom("b"));
    expect(bet.find((c) => c.street === "river")!.verdict).toBe("good");
  });

  it("grades flop c-bets heads-up: bluff the Nit, value bet the Station", () => {
    const flop = (style: BotStyle, hero: string, action: "bet" | "check") =>
      scripted(style, hero, "Ks 9h 4d 2c 6s", (s) => {
        s = act(s, { kind: "raise", to: 25 });
        s = botAct(s, "call");
        s = botAct(s, "check");
        return act(s, action === "bet" ? { kind: "bet", to: 35 } : { kind: "check" });
      });
    const flopCheck = (s: HandState) => reviewHand(s, 0, seededRandom("flop")).find((c) => c.street === "flop")!;

    const checkedAir = flopCheck(flop("nit", "7c 2d", "check"));
    expect(checkedAir.kind).toBe("check");
    expect(checkedAir.styles).toEqual(["nit"]);
    expect(checkedAir.verdict).toBe("mistake");
    expect(checkedAir.detail).toContain("This street only");
    expect(checkedAir.exercise!.options[checkedAir.exercise!.answer]).toMatch(/^Bet /);

    expect(flopCheck(flop("nit", "7c 2d", "bet")).verdict).toBe("good");
    expect(flopCheck(flop("station", "Kc Qd", "check")).verdict).toBe("mistake");
    expect(flopCheck(flop("station", "7c 2d", "bet")).verdict).not.toBe("good");
  });

  it("turns a bad river call into a review question with the right answer", () => {
    const check = reviewHand(riverCall("nit", "5s 5d", "Kh 9c 2d 7s Jh"), 0, seededRandom("q")).find((c) => c.street === "river")!;
    expect(check.kind).toBe("call");
    const q = check.exercise!;
    expect(q.options).toEqual(["Fold", "Call"]);
    expect(q.options[q.answer]).toBe("Fold");
    expect(q.hand).toBe("5s 5d");
    expect(q.board).toBe("Kh 9c 2d 7s Jh");
    expect(q.explanation).toContain("From your practice table.");
  });

  it("grades 6-max opens against the chart", () => {
    let s = newHand(
      Array.from({ length: 6 }, (_, i) => ({ name: `P${i}`, human: i === 3, style: i === 3 ? undefined : ("regular" as BotStyle) })),
      0,
      1,
      seededRandom("open"),
    );
    s.seats[3].hole = parseCards("7c 2d");
    s = act(s, { kind: "raise", to: 25 });
    const checks = reviewHand(s, 3);
    expect(checks[0].verdict).toBe("mistake");
    expect(checks[0].kind).toBe("preflop");
    expect(checks[0].detail).toContain("outside the UTG opening range");
    const q = checks[0].exercise!;
    expect(q.options[q.answer]).toBe("Fold");
    expect(q.info![0].value).toBe("Under the Gun");
  });

  it("gives every mistake a well-formed review question, and nothing else", () => {
    const random = seededRandom("fuzz-review");
    let mistakes = 0;
    for (let hand = 0; hand < 120; hand++) {
      const n = hand % 3 ? 2 : 6;
      const table = Array.from({ length: n }, (_, i) => ({
        name: `P${i}`,
        human: i === 0,
        style: (["nit", "station", "maniac", "regular"] as BotStyle[])[(hand + i) % 4],
      }));
      let s = newHand(table, hand % n, hand, random);
      while (s.toAct !== null) {
        const seat = s.seats[s.toAct];
        const c = chooseBotAction(seat.style!, situation(s), seat.hole, random);
        s = act(s, c.action, c.label);
      }
      for (const check of reviewHand(s, 0, random)) {
        if (check.verdict !== "mistake") {
          expect(check.exercise).toBeUndefined();
          continue;
        }
        mistakes++;
        const q = check.exercise!;
        expect(q.answer).toBeGreaterThanOrEqual(0);
        expect(q.answer).toBeLessThan(q.options.length);
        expect(new Set(q.options).size).toBe(q.options.length);
        const cards = [q.hand, q.board].filter(Boolean).join(" ").split(" ");
        expect(new Set(cards).size).toBe(cards.length);
        expect(parseCards(cards.join(" ")).length).toBe(cards.length);
      }
    }
    expect(mistakes).toBeGreaterThan(5);
  });
});
