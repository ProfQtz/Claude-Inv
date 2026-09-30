import { describe, expect, it } from "vitest";
import { parseCards } from "../poker/cards";
import { COURSE, drillRef, exerciseByRef, exerciseRef, LESSON_ORDER, SECTIONS, sectionLessons } from "./course";
import { hitProbability, potOdds } from "../poker/math";
import { classEquity, solvePushFold } from "../poker/nash";
import { fullDeck, shuffle } from "../poker/cards";
import { choose } from "../poker/cheatsheet";
import {
  countCombos,
  countOuts,
  generateMix,
  DAILY_LENGTH,
  dailyChallenge,
  EQUITY_BUCKETS,
  findNuts,
  generateDrill,
  generateExercise,
  EDGE_GAP,
  RIVER_MARGIN,
  resolveCompare,
  seededRandom,
  sectionTest,
  SKILLS,
} from "./generator";
import { exactEquity } from "../poker/equity";
import { FACING_SETS, FACING_SPOTS, facingAction, handLabel, OPENING_SETS, POSITIONS } from "../poker/ranges";
import { describeHand, HandCategory, score7, scoreCategory } from "../poker/evaluator";
import { flopDraw, rangeCombos, rangeVsRangeEquity, riverRange } from "../poker/rangeTools";
import { FLOP_SPOTS } from "../poker/flops";
import type { Exercise } from "./types";

const allExercises = COURSE.flatMap((u) => u.lessons.flatMap((l) => l.exercises.map((e) => ({ id: l.id, e }))));

function cardsIn(e: Exercise): string[] {
  if (e.type === "compare") return [e.board, ...e.hands].join(" ").split(" ");
  if (e.type === "choice") return [e.hand, e.board, e.villain].filter(Boolean).join(" ").split(" ").filter(Boolean);
  if (e.type === "scenario") {
    const finalBoard = e.steps.map((s) => s.board).filter(Boolean).pop() ?? "";
    return [e.hand, finalBoard].join(" ").split(" ").filter(Boolean);
  }
  return [];
}

function checkExercise(e: Exercise) {
  const cards = cardsIn(e);
  expect(() => parseCards(cards.join(" ") || "As")).not.toThrow();
  expect(new Set(cards).size, `duplicate cards: ${cards.join(" ")}`).toBe(cards.length);
  switch (e.type) {
    case "choice":
      expect(e.answer).toBeGreaterThanOrEqual(0);
      expect(e.answer).toBeLessThan(e.options.length);
      expect(new Set(e.options).size).toBe(e.options.length);
      break;
    case "compare":
      expect(parseCards(e.board)).toHaveLength(5);
      e.hands.forEach((h) => expect(parseCards(h)).toHaveLength(2));
      break;
    case "order":
      expect(e.items.length).toBeGreaterThan(1);
      expect(new Set(e.items).size).toBe(e.items.length);
      break;
    case "scenario": {
      const streets = ["Preflop", "Flop", "Turn", "River"];
      const boardSizes = { Preflop: 0, Flop: 3, Turn: 4, River: 5 };
      let lastStreet = -1;
      let lastBoard = "";
      for (const step of e.steps) {
        expect(step.answer).toBeGreaterThanOrEqual(0);
        expect(step.answer).toBeLessThan(step.options.length);
        // Streets move forward and each board extends the previous one.
        expect(streets.indexOf(step.street)).toBeGreaterThan(lastStreet);
        lastStreet = streets.indexOf(step.street);
        const board = step.board ?? "";
        expect(board.split(" ").filter(Boolean)).toHaveLength(boardSizes[step.street]);
        expect(board.startsWith(lastBoard)).toBe(true);
        lastBoard = board;
      }
      break;
    }
    case "match":
      expect(new Set(e.pairs.map((p) => p[0])).size).toBe(e.pairs.length);
      expect(new Set(e.pairs.map((p) => p[1])).size).toBe(e.pairs.length);
      break;
  }
}

describe("course content", () => {
  it("has unique lesson ids", () => {
    expect(new Set(LESSON_ORDER).size).toBe(LESSON_ORDER.length);
  });

  it("gives every lesson at least four exercises", () => {
    COURSE.forEach((u) => u.lessons.forEach((l) => expect(l.exercises.length, l.id).toBeGreaterThanOrEqual(4)));
  });

  it.each(allExercises.map(({ id, e }, i) => [`${id} #${i}`, e] as const))("%s is well formed", (_, e) => {
    checkExercise(e);
  });

  it("matches hand-written showdown explanations to the evaluator", () => {
    const expected: Record<string, number> = {
      "Qh Qd Jc Jh As": -1,
      "Jh 9h 2h 6c Qh": 1,
      "8s 8d 8h Qc Qd": 1,
      "5h 6h 7c 8d Kh": 0,
      "Td 8c 5h 4s 2d": 0,
    };
    for (const { e } of allExercises) {
      if (e.type === "compare" && e.board in expected) {
        expect(resolveCompare(e).winner, e.board).toBe(expected[e.board]);
      }
    }
  });
});

describe("drill generator", () => {
  let seed = 42;
  const random = () => ((seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31);

  it.each(["showdown", "handName", "potOdds", "outs", "nuts", "preflop", "callFold", "combos", "betMath", "vsOpen", "bluffCatch", "rangeEdge", "mixed"] as const)(
    "generates valid %s drills",
    (kind) => {
      for (let i = 0; i < 25; i++) generateDrill(kind, 6, random).forEach(checkExercise);
    },
  );

  it("generates valid equity drills", () => {
    for (let i = 0; i < 3; i++) generateDrill("equity", 5, random).forEach(checkExercise);
  });
});

describe("exercise refs", () => {
  it("round-trips a ref to its exercise", () => {
    const lesson = COURSE[1].lessons[2];
    expect(exerciseByRef(exerciseRef(lesson.id, 3))).toBe(lesson.exercises[3]);
    expect(exerciseByRef("missing#0")).toBeUndefined();
  });
});

describe("outs and nuts", () => {
  it("counts straight and flush outs", () => {
    expect(countOuts(parseCards("9c 8d"), parseCards("7s 6h 2c"))).toHaveLength(8);
    expect(countOuts(parseCards("Ah 7h"), parseCards("Kh 9h 2c"))).toHaveLength(9);
    // Open-ended straight draw plus flush draw: 9 flush cards + 6 non-heart straight cards.
    expect(countOuts(parseCards("Qh Jh"), parseCards("Th 9h 3c"))).toHaveLength(15);
  });

  it("finds the nuts", () => {
    expect(describeHand(findNuts(parseCards("Kc 9d 4s 2h 7c")).value)).toBe("Three of a Kind, Kings");
    expect(findNuts(parseCards("Th 9h 8h 2c 2d")).value.category).toBe(HandCategory.StraightFlush);
    expect(describeHand(findNuts(parseCards("As Ks Qs Js 2h")).value)).toBe("Royal Flush");
  });
});

describe("call-or-fold and combos drills", () => {
  it("grades calls by exact river equity against the price, never close to the line", () => {
    for (let i = 0; i < 25; i++) {
      const e = generateExercise("callFold");
      if (e.type !== "choice") throw new Error("expected choice");
      const hero = parseCards(e.hand!);
      const villain = parseCards(e.villain!);
      const board = parseCards(e.board!);
      expect(board).toHaveLength(4);
      const { equity } = exactEquity(hero, villain, board);
      const pot = Number(e.info![0].value.slice(1));
      const bet = Number(e.info![1].value.slice(1));
      const required = bet / (pot + 2 * bet);
      expect(Math.abs(equity - required)).toBeGreaterThanOrEqual(0.04);
      expect(e.options[e.answer]).toBe(equity > required ? "Call" : "Fold");
    }
  });

  it("counts combos with blockers", () => {
    const none = parseCards("2c 3d 7h 8s 9d");
    expect(countCombos("KK", none)).toBe(6);
    expect(countCombos("AK", none)).toBe(16);
    expect(countCombos("AKs", none)).toBe(4);
    expect(countCombos("AKo", none)).toBe(12);
    const kingOut = parseCards("Kh 3d 7h 8s 9d");
    expect(countCombos("KK", kingOut)).toBe(3);
    expect(countCombos("AK", kingOut)).toBe(12);
    expect(countCombos("AKs", kingOut)).toBe(3);
    expect(countCombos("KK", parseCards("Kh Kd 7h 8s 9d"))).toBe(1);
  });

  it("gives combos drills the counted answer", () => {
    for (let i = 0; i < 30; i++) {
      const e = generateExercise("combos");
      if (e.type !== "choice") throw new Error("expected choice");
      expect(e.explanation.startsWith(`${e.options[e.answer]} combinations.`)).toBe(true);
    }
  });

  it("mixes only the chosen skills", () => {
    const skills = generateMix(["combos", "preflop"], 6).map((e) => (e.type === "choice" ? e.skill : undefined));
    expect(new Set(skills)).toEqual(new Set(["combos", "preflop"]));
  });

  it("round-trips drill exercises through review refs", () => {
    const e = generateExercise("nuts");
    expect(exerciseByRef(drillRef(e))).toEqual(e);
    expect(exerciseByRef("drill:{not json")).toBeUndefined();
  });
});

describe("preflop, equity and daily drills", () => {
  it("grades preflop opens against the chart", () => {
    for (let i = 0; i < 40; i++) {
      const e = generateExercise("preflop");
      if (e.type !== "choice") throw new Error("expected choice");
      const [a, b] = parseCards(e.hand!);
      const seat = POSITIONS.find((p) => p.name === e.info![0].value)!.id;
      expect(e.options[e.answer]).toBe(OPENING_SETS[seat].has(handLabel(a, b)) ? "Raise" : "Fold");
    }
  });

  it("puts equity answers in the right bucket, clear of the edges", () => {
    for (let i = 0; i < 10; i++) {
      const e = generateExercise("equity");
      if (e.type !== "choice") throw new Error("expected choice");
      const { equity } = exactEquity(parseCards(e.hand!), parseCards(e.villain!), parseCards(e.board!));
      const bucket = EQUITY_BUCKETS.findIndex((b) => equity < b.max);
      expect(e.answer).toBe(bucket);
      expect(EQUITY_BUCKETS.every((b) => Math.abs(equity - b.max) >= 0.025)).toBe(true);
    }
  });

  it("deals the same daily challenge all day and a different one tomorrow", () => {
    const today = JSON.stringify(dailyChallenge("2026-09-28"));
    expect(JSON.stringify(dailyChallenge("2026-09-28"))).toBe(today);
    expect(JSON.stringify(dailyChallenge("2026-09-29"))).not.toBe(today);
    expect(dailyChallenge("2026-09-28")).toHaveLength(DAILY_LENGTH);
  });
});

describe("skill tags", () => {
  it("tags every generated drill exercise with its skill", () => {
    for (const skill of SKILLS) {
      for (const e of generateDrill(skill, 3)) {
        expect(e.type === "choice" || e.type === "compare").toBe(true);
        if (e.type === "choice" || e.type === "compare") expect(e.skill).toBe(skill);
      }
    }
  });

  it("gives outs drills an answer that matches the counted outs", () => {
    for (let i = 0; i < 20; i++) {
      const e = generateExercise("outs");
      if (e.type !== "choice") throw new Error("expected choice");
      const outs = countOuts(parseCards(e.hand!), parseCards(e.board!));
      expect(Number(e.options[e.answer])).toBe(outs.length);
    }
  });
});

describe("sections", () => {
  it("cover every unit exactly once, in course order", () => {
    expect(SECTIONS.flatMap((s) => s.unitIds)).toEqual(COURSE.map((u) => u.id));
  });

  it("list lessons per section", () => {
    const all = SECTIONS.flatMap((_, i) => sectionLessons(i));
    expect(all).toEqual(LESSON_ORDER);
  });
});

describe("advanced math claims", () => {
  const pct = (x: number) => Math.round(x * 100);
  const lesson = (id: string) => COURSE.flatMap((u) => u.lessons).find((l) => l.id === id)!;
  const choice = (id: string, i: number) => {
    const e = lesson(id).exercises[i];
    if (e.type !== "choice") throw new Error(`${id}#${i} is not a choice`);
    return e.options[e.answer];
  };

  it("big blind defense price: call 1.5 into 4", () => expect(`${pct(potOdds(4, 1.5))}%`).toBe(choice("facing-2", 0)));
  it("price to call a 3-bet: 5 into 11.5", () => expect(`${pct(potOdds(11.5, 5))}%`).toBe(choice("facing-3", 2)));
  it("EV of a +$300/-$100 bet at 40%", () => expect(`+$${0.4 * 300 - 0.6 * 100}`).toBe(choice("math-1", 1)));
  it("EV of a 30% call", () => expect(0.3 * 100 - 0.7 * 50).toBeCloseTo(-5));
  it("EV with $40 implied", () => expect(0.3 * 140 - 0.7 * 50).toBeCloseTo(7));
  it("implied odds needed on the turn", () => {
    // Break even when e × (pot + X) = (1 − e) × call.
    const x = (0.8 * 50) / 0.2 - 100;
    expect(`$${x}`).toBe(choice("math-2", 1));
  });
  it("bluff break-even sizes", () => {
    expect(`${pct(50 / 150)}%`).toBe(choice("math-3", 0));
    expect(`${pct(100 / 200)}%`).toBe(choice("math-3", 1));
    expect(0.6 * 100 - 0.4 * 50).toBe(40);
  });
  it("minimum defense frequencies and bluff share", () => {
    expect(`${pct(100 / 200)}%`).toBe(choice("math-4", 0));
    expect(`${pct(100 / 150)}%`).toBe(choice("math-4", 1));
    expect(`${pct(100 / 300)}%`).toBe(choice("math-4", 3));
  });
  it("combinations and bluff-catching", () => {
    expect(String(countCombos("AK", parseCards("As Kd 7c")))).toBe(choice("reading-2", 2));
    expect(`${pct(12 / 18)}%`).toBe(choice("reading-2", 3));
  });
  it("river bluff-catch price", () => expect(pct(potOdds(180, 60))).toBe(25));
  it("combo draw has 15 outs", () => expect(countOuts(parseCards("9h 8h"), parseCards("Th 7c 2h"))).toHaveLength(15));
  it("ICM with equal stacks", () => expect(`$${Math.round(1000 / 3)}`).toBe(choice("mtt-1", 2)));
  it("the solver claim about heads-up 10 BB shoves", () => {
    expect(solvePushFold(10).pushPercent).toBeGreaterThan(0.55);
    expect(solvePushFold(10).pushPercent).toBeLessThan(0.63);
  });

  it("scenario pots add up", () => {
    // Tight opener: 2.5 + 2.5 + blinds 1.5 = 6.5; +3 +3 = 12.5; +8 +8 = 28.5.
    expect(2.5 + 2.5 + 1.5).toBe(6.5);
    expect(6.5 + 3 + 3).toBe(12.5);
    expect(12.5 + 8 + 8).toBe(28.5);
    // Value on three streets: 5.5 → +2+2 = 9.5 → +6+6 = 21.5.
    expect(5.5 + 2 + 2).toBe(9.5);
    expect(9.5 + 6 + 6).toBe(21.5);
  });
});

describe("option ordering", () => {
  it("lists all-numeric options in ascending order", () => {
    const num = (o: string) => Number(o.replace(/[$,%]/g, "").split(/[–\s]/)[0]);
    for (const { e } of allExercises) {
      if (e.type !== "choice" || !e.options.every((o) => /^\$?\d/.test(o))) continue;
      const values = e.options.map(num);
      expect([...values].sort((a, b) => a - b), e.prompt).toEqual(values);
    }
  });
});

describe("bet math and facing-a-raise drills", () => {
  it("grades facing-a-raise spots by the charts", () => {
    for (let i = 0; i < 60; i++) {
      const e = generateExercise("vsOpen");
      if (e.type !== "choice") throw new Error("expected choice");
      const [a, b] = parseCards(e.hand!);
      const spot = FACING_SPOTS.find((s) => s.action === e.info![1].value && s.seat === e.info![0].value)!;
      expect(e.options[e.answer]).toBe(facingAction(spot.id, handLabel(a, b)));
    }
  });

  it("gives bet math questions a correct answer among distinct options", () => {
    for (let i = 0; i < 300; i++) {
      const e = generateExercise("betMath");
      if (e.type !== "choice") throw new Error("expected choice");
      expect(new Set(e.options).size).toBe(e.options.length);
      expect(e.answer).toBeGreaterThanOrEqual(0);
      const info = Object.fromEntries(e.info!.map((i) => [i.label, Number(i.value.replace(/[$%]/g, ""))]));
      const right = e.options[e.answer];
      if (e.prompt.includes("minimum defense")) {
        const p = info["Pot before bet"];
        const b = info["Villain bets"];
        expect(right).toBe(`${Math.round((p / (p + b)) * 100)}%`);
      } else if (e.prompt.includes("break even") && e.prompt.includes("bluff")) {
        const p = info["Pot before bet"];
        const b = info["Your bet"];
        expect(right).toBe(`${Math.round((b / (p + b)) * 100)}%`);
      } else if (e.prompt.includes("share of your bets")) {
        const p = info["Pot before bet"];
        const b = info["Your bet"];
        expect(right).toBe(`${Math.round((b / (p + 2 * b)) * 100)}%`);
      } else if (e.prompt.includes("EV of calling")) {
        const x = info["Pot (incl. bet)"];
        const c = info["To call"];
        const eq = info["Your equity"] / 100;
        const ev = Math.round(eq * x - (1 - eq) * c);
        expect(right).toBe(`${ev < 0 ? "−" : "+"}$${Math.abs(ev)}`);
      } else if (e.prompt.includes("win on later streets")) {
        const x = info["Pot (incl. bet)"];
        const c = info["To call"];
        const eq = info["Your equity"] / 100;
        // Check the break-even identity rather than the rounded display.
        const needed = Number(right.slice(1));
        expect(Math.abs(eq * (x + needed) - (1 - eq) * c)).toBeLessThan(1);
      } else {
        expect(e.prompt).toContain("implied odds");
      }
    }
  });
});

describe("section tests", () => {
  it("draw quick-to-grade questions from every unit before the section", () => {
    const test = sectionTest(2, 12);
    expect(test).toHaveLength(12);
    const units = new Set(test.map((e) => COURSE.find((u) => u.lessons.some((l) => l.exercises.includes(e)))!.id));
    const before = [...SECTIONS[0].unitIds, ...SECTIONS[1].unitIds];
    for (const id of units) expect(before).toContain(id);
    expect(units.size).toBeGreaterThanOrEqual(8);
    for (const e of test) expect(["choice", "compare", "order"]).toContain(e.type);
  });
});

describe("river bluff-catching drill", () => {
  const drills = Array.from({ length: 80 }, (_, i) => generateExercise("bluffCatch", seededRandom(`river-${i}`)));

  it("grades by bluffs ÷ all combos against the price, clear of the line", () => {
    for (const e of drills) {
      if (e.type !== "choice") throw new Error("expected choice");
      const hero = parseCards(e.hand!);
      const board = parseCards(e.board!);
      const position = POSITIONS.find((p) => p.name === e.info![0].value)!.id;
      const read = riverRange(OPENING_SETS[position], board, hero);
      const [pot, bet] = [1, 2].map((i) => Number(e.info![i].value.slice(1)));
      const equity = read.bluffTotal / (read.valueTotal + read.bluffTotal);
      const need = potOdds(pot + bet, bet);
      expect(Math.abs(equity - need)).toBeGreaterThanOrEqual(RIVER_MARGIN);
      expect(e.options[e.answer]).toBe(equity > need ? "Call" : "Fold");
      expect(e.explanation).toContain(`${read.bluffTotal} ÷ ${read.valueTotal + read.bluffTotal}`);
    }
  });

  it("gives hero a pair that loses to every value hand and beats every bluff", () => {
    for (const e of drills) {
      if (e.type !== "choice") throw new Error("expected choice");
      const hero = parseCards(e.hand!);
      const board = parseCards(e.board!);
      const position = POSITIONS.find((p) => p.name === e.info![0].value)!.id;
      const heroScore = score7([...hero, ...board]);
      expect(scoreCategory(heroScore)).toBe(HandCategory.OnePair);
      // Hero's hand is one that calls the open in this spot.
      const spot = FLOP_SPOTS.find((s) => s.raiser === position)!;
      expect(FACING_SETS[spot.facing].call.has(handLabel(hero[0], hero[1]))).toBe(true);
      for (const combo of rangeCombos(OPENING_SETS[position], [...board, ...hero])) {
        const score = score7([...combo, ...board]);
        const category = scoreCategory(score);
        if (category >= HandCategory.TwoPair) expect(score).toBeGreaterThan(heroScore);
        else if (category === HandCategory.HighCard && flopDraw(combo, board.slice(0, 3))) expect(score).toBeLessThan(heroScore);
      }
    }
  });

  it("deals calls and folds in similar numbers", () => {
    const calls = drills.filter((e) => e.type === "choice" && e.answer === 1).length;
    expect(calls).toBeGreaterThan(drills.length * 0.3);
    expect(calls).toBeLessThan(drills.length * 0.7);
  });
});

describe("range advantage drill", () => {
  it("picks the flop where the raiser's equity is clearly higher", () => {
    for (let i = 0; i < 12; i++) {
      const e = generateExercise("rangeEdge", seededRandom(`edge-${i}`));
      if (e.type !== "choice") throw new Error("expected choice");
      expect(e.cardOptions).toBe(true);
      const spot = FLOP_SPOTS.find((s) => e.prompt.startsWith(s.text))!;
      const flops = e.options.map(parseCards);
      expect(new Set(e.options.join(" ").split(" ")).size).toBe(6);
      // Re-measure independently by sampling: the answer must still win by a margin.
      const equities = flops.map((flop, k) =>
        rangeVsRangeEquity(
          rangeCombos(OPENING_SETS[spot.raiser], flop),
          rangeCombos(FACING_SETS[spot.facing].call, flop),
          flop,
          20000,
          seededRandom(`check-${i}-${k}`),
        ),
      );
      expect(equities[e.answer] - equities[1 - e.answer]).toBeGreaterThan(EDGE_GAP / 2);
    }
  });
});

describe("mastery math claims", () => {
  const lesson = (id: string) => COURSE.flatMap((u) => u.lessons).find((l) => l.id === id)!;
  const exercise = (id: string, i: number) => lesson(id).exercises[i];
  const answerOf = (id: string, i: number) => {
    const e = exercise(id, i);
    if (e.type !== "choice") throw new Error(`${id}#${i} is not a choice`);
    return e.options[e.answer];
  };
  const pct = (x: number) => `${Math.round(x * 100)}%`;
  const visible = (id: string, i: number) => {
    const e = exercise(id, i);
    if (e.type !== "choice") throw new Error("expected choice");
    return parseCards(`${e.hand} ${e.board}`);
  };

  it("SPR examples", () => {
    expect(`About ${Math.round(97.5 / 5.5)}`).toBe(answerOf("spr-1", 1));
    expect(`About ${Math.round((90 / 20.5) * 10) / 10}`).toBe(answerOf("spr-1", 2));
    expect(2.5 + 2.5 + 0.5).toBe(5.5);
    expect(10 + 10 + 0.5).toBe(20.5);
    expect(30 / 20).toBe(1.5);
  });

  it("three pot-size bets at SPR 13 are exactly all-in", () => {
    let [pot, stack] = [10, 130];
    for (let street = 0; street < 3; street++) {
      const bet = Math.min(pot, stack);
      stack -= bet;
      pot += 2 * bet;
    }
    expect(stack).toBe(0);
    expect(answerOf("spr-2", 1)).toMatch(/^Nothing/);
  });

  it("set mining odds", () => {
    const set = 1 - choose(48, 3) / choose(50, 3);
    expect(`About ${Math.round(set * 100)}%`).toBe(answerOf("spr-3", 0));
    expect(`About ${Math.round(((1 - set) / set) * 2.5)} BB`).toBe(answerOf("spr-3", 2 - 1));
  });

  it("3-bet pot size", () => {
    expect(`${9 + 9 + 1.5} BB`).toBe(answerOf("bigpots-1", 0));
    expect(Math.round((91 / 19.5) * 10) / 10).toBe(4.7);
  });

  it("AA against one, two and four random hands", () => {
    const random = seededRandom("multiway");
    const aa = parseCards("As Ah");
    const rest = fullDeck().filter((c) => !(c.rank === "A" && (c.suit === "s" || c.suit === "h")));
    const share = (opponents: number, samples: number) => {
      let won = 0;
      for (let n = 0; n < samples; n++) {
        const deck = shuffle(rest, random);
        const board = deck.slice(0, 5);
        const hero = score7([...aa, ...board]);
        const others = Array.from({ length: opponents }, (_, k) => score7([...deck.slice(5 + 2 * k, 7 + 2 * k), ...board]));
        const best = Math.max(hero, ...others);
        if (hero === best) won += 1 / (1 + others.filter((o) => o === best).length);
      }
      return won / samples;
    };
    expect(Math.abs(share(1, 20000) - 0.85)).toBeLessThan(0.015);
    expect(Math.abs(share(2, 20000) - 0.73)).toBeLessThan(0.015);
    const four = share(4, 20000);
    expect(Math.abs(four - 0.56)).toBeLessThan(0.015);
    expect(`About ${Math.round(four * 100)}%`).toBe(answerOf("bigpots-2", 0));
  });

  it("bluffing two players", () => expect(pct(0.5 * 0.5)).toBe(answerOf("bigpots-2", 1)));

  it("thin value EV", () => expect(`+$${0.6 * 50 - 0.4 * 50}`).toBe(answerOf("river-1", 1)));

  it("the thin value river is quiet: no straight or flush is possible", () => {
    const board = visible("river-1", 2).slice(2);
    const seen = new Set(visible("river-1", 2).map((c) => c.rank + c.suit));
    const deck = fullDeck().filter((c) => !seen.has(c.rank + c.suit));
    for (let a = 0; a < deck.length; a++)
      for (let b = a + 1; b < deck.length; b++) {
        const category = scoreCategory(score7([deck[a], deck[b], ...board]));
        expect([HandCategory.Straight, HandCategory.Flush, HandCategory.StraightFlush]).not.toContain(category);
      }
  });

  it("bluff-catching counts", () => {
    expect(6 / 18).toBeGreaterThan(potOdds(150, 50));
    expect(answerOf("river-2", 1)).toBe("Call");
    expect(4 / 16).toBeLessThan(potOdds(200, 100));
    expect(answerOf("river-2", 2)).toBe("Fold");
  });

  it("blocker combos", () => {
    expect(String(countCombos("KK", visible("river-3", 1)))).toBe(answerOf("river-3", 1));
    expect(String(countCombos("K9", visible("river-3", 2)))).toBe(answerOf("river-3", 2));
  });

  it("overbet math", () => {
    expect(pct(2 / 3)).toBe(answerOf("river-4", 1));
    expect(pct(2 / 5)).toBe(answerOf("river-4", 2));
  });

  it("leak spots", () => {
    expect(pct(potOdds(3.5, 1))).toBe(answerOf("leaks-1", 2));
    const cards = visible("leaks-2", 0);
    expect(countOuts(cards.slice(0, 2), cards.slice(2))).toHaveLength(4);
    expect(Math.round(hitProbability(4, 1) * 100)).toBe(9);
    expect(Math.round(potOdds(200, 100) * 100)).toBe(33);
    expect(Math.round(classEquity("AA", "72o") * 100)).toBe(88);
  });

  it("hand lab pots add up", () => {
    const pots = (id: string, i: number) => {
      const e = exercise(id, i);
      if (e.type !== "scenario") throw new Error("expected scenario");
      return e.steps.filter((s) => s.info).map((s) => s.info!.find((x) => x.label === "Pot")!.value);
    };
    const bb = (values: number[]) => values.map((v) => `${v} BB`);
    // Charge the draws: 5.5, +4+4, +9+9.
    expect(pots("handlab-1", 0)).toEqual(bb([5.5, 5.5 + 8, 5.5 + 8 + 18]));
    expect(100 - 2.5 - 4 - 9).toBe(84.5);
    // 3-bet pot: 8 + 8 + blinds, then +6+6, then +20+20; stacks 92, 86, 66 behind.
    expect(pots("handlab-1", 1)).toEqual(bb([17.5, 17.5 + 12, 17.5 + 12 + 40]));
    expect([100 - 8, 100 - 8 - 6, 100 - 8 - 6 - 20]).toEqual([92, 86, 66]);
    // Nut flush draw: 5.5, +2+2, +6+6.
    expect(pots("handlab-2", 0)).toEqual(bb([5.5, 9.5, 21.5]));
    // Overpair: 5.5, +3+3, +8+8.
    expect(pots("handlab-3", 0)).toEqual(bb([5.5, 11.5, 27.5]));
    // Big blind: 5.5 on the flop, then +2+2 with the turn checked through.
    expect(pots("handlab-3", 1)).toEqual(bb([5.5, 9.5]));
  });

  it("the nut flush draw gets there with the best possible hand", () => {
    const e = exercise("handlab-2", 0);
    if (e.type !== "scenario") throw new Error("expected scenario");
    const hero = parseCards(e.hand);
    const board = parseCards(e.steps.at(-1)!.board!);
    const heroScore = score7([...hero, ...board]);
    const seen = new Set([...hero, ...board].map((c) => c.rank + c.suit));
    const deck = fullDeck().filter((c) => !seen.has(c.rank + c.suit));
    for (let a = 0; a < deck.length; a++)
      for (let b = a + 1; b < deck.length; b++) expect(score7([deck[a], deck[b], ...board])).toBeLessThan(heroScore);
  });
});
