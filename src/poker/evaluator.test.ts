import { describe, expect, it } from "vitest";
import { fullDeck, parseCards, shuffle } from "./cards";
import { compareHands, describeHand, evaluate, HandCategory, score7 } from "./evaluator";

const ev = (s: string) => evaluate(parseCards(s));

describe("evaluate", () => {
  it.each([
    ["As Ks Qs Js Ts", HandCategory.StraightFlush, "Royal Flush"],
    ["9h 8h 7h 6h 5h", HandCategory.StraightFlush, "Straight Flush, Nine high"],
    ["Qc Qd Qh Qs 2c", HandCategory.FourOfAKind, "Four of a Kind, Queens"],
    ["7s 7d 7c Ks Kd", HandCategory.FullHouse, "Full House, Sevens full of Kings"],
    ["Kh 9h 6h 3h 2h", HandCategory.Flush, "Flush, King high"],
    ["Td 9s 8c 7h 6d", HandCategory.Straight, "Straight, Ten high"],
    ["5c 4d 3s 2h Ac", HandCategory.Straight, "Straight, Five high"],
    ["6s 6d 6c Ks 2d", HandCategory.ThreeOfAKind, "Three of a Kind, Sixes"],
    ["As Ad 5c 5h Qs", HandCategory.TwoPair, "Two Pair, Aces and Fives"],
    ["Js Jd 5c 4h 2s", HandCategory.OnePair, "Pair of Jacks"],
    ["Qs Kd Ac 2h 3s", HandCategory.HighCard, "Ace High"],
  ])("%s → %s", (cards, category, name) => {
    const hand = ev(cards);
    expect(hand.category).toBe(category);
    expect(describeHand(hand)).toBe(name);
  });

  it("picks the best five of seven", () => {
    expect(describeHand(ev("Ah Kh Qh Jh Th 3c 2d"))).toBe("Royal Flush");
    expect(describeHand(ev("7c 7d 7s Kd Kc 2h 9s"))).toBe("Full House, Sevens full of Kings");
    expect(ev("9s 2c Ah Kd Qs Jc Td").category).toBe(HandCategory.Straight);
  });

  it("uses the higher of two trips as a full house", () => {
    expect(describeHand(ev("8s 8d 8h Qc Qd Qs 2c"))).toBe("Full House, Queens full of Eights");
  });

  it("uses the best three pairs' top two plus best kicker", () => {
    expect(ev("Td 3c Tc 6d 6s 3h Qc").kickers).toEqual([10, 6, 12]);
  });

  it("rejects wrong card counts", () => {
    expect(() => ev("As Ks Qs Js")).toThrow();
  });
});

describe("compareHands", () => {
  const cmp = (a: string, b: string) => Math.sign(compareHands(ev(a), ev(b)));

  it("ranks categories", () => {
    expect(cmp("Kh 9h 6h 3h 2h", "Td 9s 8c 7h 6d")).toBe(1);
    expect(cmp("As Ad 5c 5h Qs", "6s 6d 6c Ks 2d")).toBe(-1);
  });

  it("breaks ties with kickers", () => {
    expect(cmp("Kd Ks Ah 7c 3d", "Kc Kh Qs Jd 9h")).toBe(1);
    expect(cmp("Jd Jc 4s 4h Kd", "Td Tc 9s 9h Ad")).toBe(1);
  });

  it("treats the wheel as the lowest straight", () => {
    expect(cmp("Ac 2d 3h 4s 5c", "2c 3d 4h 5s 6c")).toBe(-1);
  });

  it("splits identical ranks regardless of suit", () => {
    expect(cmp("Qh Qd 8s 8c 5h", "Qs Qc 8h 8d 5s")).toBe(0);
  });
});

describe("score7", () => {
  it("agrees with compareHands on random 7-card hands", () => {
    let seed = 7;
    const random = () => ((seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31);
    for (let i = 0; i < 3000; i++) {
      const deck = shuffle(fullDeck(), random);
      const board = deck.slice(0, 5);
      const a = [...deck.slice(5, 7), ...board];
      const b = [...deck.slice(7, 9), ...board];
      const expected = Math.sign(compareHands(evaluate(a), evaluate(b)));
      expect(Math.sign(score7(a) - score7(b))).toBe(expected);
    }
  });

  it("scores categories in order", () => {
    const s = (c: string) => score7(parseCards(c));
    expect(s("As Ks Qs Js Ts 2c 3d")).toBeGreaterThan(s("9c 9d 9h 9s Kc 2d 3h"));
    expect(s("7s 7d 7c Ks Kd Kh 2c")).toBeGreaterThan(s("Ah Kh 9h 6h 3h 2c 2d"));
    expect(s("5c 4d 3s 2h Ac Kd Qh")).toBeLessThan(s("6c 5d 4s 3h 2c Kd Qh"));
  });
});
