import { describe, expect, it } from "vitest";
import { parseCards } from "../poker/cards";
import { COURSE, exerciseByRef, exerciseRef, LESSON_ORDER } from "./course";
import { countOuts, findNuts, generateDrill, generateExercise, resolveCompare, SKILLS } from "./generator";
import { describeHand, HandCategory } from "../poker/evaluator";
import type { Exercise } from "./types";

const allExercises = COURSE.flatMap((u) => u.lessons.flatMap((l) => l.exercises.map((e) => ({ id: l.id, e }))));

function cardsIn(e: Exercise): string[] {
  if (e.type === "compare") return [e.board, ...e.hands].join(" ").split(" ");
  if (e.type === "choice") return [e.hand, e.board].filter(Boolean).join(" ").split(" ").filter(Boolean);
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

  it.each(["showdown", "handName", "potOdds", "outs", "nuts", "mixed"] as const)("generates valid %s drills", (kind) => {
    for (let i = 0; i < 25; i++) generateDrill(kind, 6, random).forEach(checkExercise);
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
