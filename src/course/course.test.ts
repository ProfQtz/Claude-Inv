import { describe, expect, it } from "vitest";
import { parseCards } from "../poker/cards";
import { COURSE, LESSON_ORDER } from "./course";
import { generateDrill, resolveCompare } from "./generator";
import type { Exercise } from "./types";

const allExercises = COURSE.flatMap((u) => u.lessons.flatMap((l) => l.exercises.map((e) => ({ id: l.id, e }))));

function cardsIn(e: Exercise): string[] {
  if (e.type === "compare") return [e.board, ...e.hands].join(" ").split(" ");
  if (e.type === "choice") return [e.hand, e.board].filter(Boolean).join(" ").split(" ").filter(Boolean);
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

  it.each(["showdown", "handName", "potOdds", "mixed"] as const)("generates valid %s drills", (kind) => {
    for (let i = 0; i < 25; i++) generateDrill(kind, 6, random).forEach(checkExercise);
  });
});
