import { describe, expect, it } from "vitest";
import { EXAM_SKILLS, finalExam, seededRandom } from "../course/generator";
import { dailyPlan, taughtSkills } from "./plan";
import {
  applyTestOut,
  completeSession,
  EXAM_FIRST_PASS_GEMS,
  EXAM_LENGTH,
  initialProgress,
  isExamUnlocked,
  migrateProgress,
  recordMistake,
  recordSkill,
  topTrack,
} from "./progress";

const T0 = new Date(2026, 8, 30, 12).getTime();
const DAY = 24 * 60 * 60 * 1000;
const ids = (p: ReturnType<typeof initialProgress>, now = T0) => dailyPlan(p, now).map((i) => i.id);

describe("daily plan", () => {
  it("starts a new player with just the next lesson", () => {
    const plan = dailyPlan(initialProgress(T0), T0);
    expect(plan.map((i) => i.id)).toEqual(["lesson"]);
    expect(plan[0].action).toEqual({ kind: "lesson", lessonId: "basics-1" });
    expect(plan[0].done).toBe(false);
  });

  it("suggests drills only for skills whose unit has been started", () => {
    let p = initialProgress(T0);
    expect(taughtSkills(p)).toEqual([]);
    for (const id of ["basics-1", "basics-2", "basics-3", "rankings-1"]) {
      p = completeSession(p, { lessonId: id, accuracy: 1 }, T0).progress;
    }
    expect(taughtSkills(p)).toEqual(["handName"]);
    const practice = dailyPlan(p, T0).find((i) => i.id === "practice")!;
    expect(practice.action).toEqual({ kind: "drill", skill: "handName" });
  });

  it("suggests the newest untried drill, then the weakest skill", () => {
    let p = applyTestOut(initialProgress(T0), 3);
    const first = dailyPlan(p, T0).find((i) => i.id === "practice")!;
    // Ranges & Hand Reading is the latest finished unit with untried drills (Combos and Range Advantage).
    expect(first.action).toEqual({ kind: "drill", skill: "combos" });
    for (const skill of taughtSkills(p)) for (let i = 0; i < 6; i++) p = recordSkill(p, skill, skill !== "potOdds");
    expect(dailyPlan(p, T0).find((i) => i.id === "practice")!.action).toEqual({ kind: "drill", skill: "potOdds" });
  });

  it("ticks items off for today and resets tomorrow", () => {
    let p = completeSession(initialProgress(T0), { lessonId: "basics-1", accuracy: 1 }, T0).progress;
    expect(dailyPlan(p, T0).find((i) => i.id === "lesson")!.done).toBe(true);
    expect(dailyPlan(p, T0 + DAY).find((i) => i.id === "lesson")!.done).toBe(false);
    p = completeSession(p, { accuracy: 0.8, title: "Pot Odds" }, T0).progress;
    expect(p.dayLog).toEqual({ day: p.dayLog.day, lessons: 1, drills: 1, reviews: 0 });
  });

  it("adds a review item while mistakes are waiting, done after a review", () => {
    let p = recordMistake(initialProgress(T0), "basics-1#0");
    expect(ids(p)).toContain("review");
    p = completeSession(p, { accuracy: 1, title: "Mistakes Review", review: true }, T0).progress;
    expect(dailyPlan(p, T0).find((i) => i.id === "review")!.done).toBe(true);
    // A review doesn't count as the day's drill.
    expect(p.dayLog.drills).toBe(0);
  });

  it("adds the Daily Challenge once Foundations is done, and the exam after Advanced", () => {
    expect(ids(applyTestOut(initialProgress(T0), 1))).toContain("daily");
    expect(ids(applyTestOut(initialProgress(T0), 2))).not.toContain("exam");
    const ready = applyTestOut(initialProgress(T0), 3);
    expect(isExamUnlocked(ready)).toBe(true);
    expect(ids(ready)).toContain("exam");
  });
});

describe("final exam", () => {
  it("asks every exam skill twice", () => {
    const exam = finalExam(seededRandom("exam"));
    expect(exam).toHaveLength(EXAM_LENGTH);
    for (const skill of EXAM_SKILLS) {
      expect(exam.filter((e) => (e.type === "choice" || e.type === "compare") && e.skill === skill)).toHaveLength(2);
    }
  });

  it("pays the first-pass bonus once and records the best score", () => {
    let p = applyTestOut(initialProgress(T0), 3);
    const failed = completeSession(p, { accuracy: 0.8, title: "Final exam", exam: true }, T0);
    expect(failed.progress.examPassedOn).toBeNull();
    expect(failed.progress.examBest).toBe(0.8);
    expect(failed.reward.gems).toBe(0);

    const passed = completeSession(failed.progress, { accuracy: 0.9, title: "Final exam", exam: true }, T0 + DAY);
    expect(passed.reward.gems).toBe(EXAM_FIRST_PASS_GEMS);
    expect(passed.progress.examPassedOn).not.toBeNull();
    expect(dailyPlan(passed.progress, T0 + DAY).map((i) => i.id)).not.toContain("exam");

    const again = completeSession(passed.progress, { accuracy: 1, title: "Final exam", exam: true }, T0 + 2 * DAY);
    expect(again.reward.gems).toBe(0);
    expect(again.progress.examBest).toBe(1);
    expect(again.progress.examPassedOn).toBe(passed.progress.examPassedOn);
    p = again.progress;
    expect(topTrack(p).find((m) => m.id === "exam")!.value).toBe(1);
  });

  it("keeps exams out of drill counts", () => {
    const p = completeSession(initialProgress(T0), { accuracy: 0.9, title: "Final exam", exam: true }, T0).progress;
    expect(p.drillsCompleted).toBe(0);
    expect(p.dayLog.drills).toBe(0);
  });
});

describe("saved data", () => {
  it("repairs a malformed day log", () => {
    const p = migrateProgress({ dayLog: { day: 3 } } as never, T0);
    expect(p.dayLog).toEqual({ day: "", lessons: 0, drills: 0, reviews: 0 });
    expect(p.examBest).toBe(0);
    expect(p.examPassedOn).toBeNull();
  });

  it("lists every section and the exam on the track", () => {
    const track = topTrack(initialProgress(T0)).map((m) => m.id);
    expect(track).toEqual(["section-0", "section-1", "section-2", "section-3", "core-silver", "gold-3", "speed-15", "streak-14", "play-150", "exam"]);
  });
});

describe("practice table sessions", () => {
  it("add up lifetime stats, count as practice and pay XP by hands played", () => {
    const play = { hands: 12, net: -35, good: 5, checked: 7 };
    const first = completeSession(initialProgress(T0), { accuracy: 5 / 6, title: "Play: 6-max table", play }, T0);
    expect(first.reward.xp).toBe(24);
    expect(first.reward.gems).toBe(2);
    const p = completeSession(first.progress, { accuracy: 1, title: "Play: 6-max table", play: { hands: 3, net: 20, good: 1, checked: 1 } }, T0).progress;
    expect(p.play).toEqual({ hands: 15, net: -15, good: 6, checked: 8 });
    expect(p.dayLog.drills).toBe(2);
    expect(p.history[0].title).toBe("Play: 6-max table");
    expect(topTrack(p).find((m) => m.id === "play-150")!.value).toBe(6);
  });

  it("repairs malformed play stats", () => {
    expect(migrateProgress({ play: { hands: "x" } } as never, T0).play).toEqual({ hands: 0, net: 0, good: 0, checked: 0 });
  });
});
