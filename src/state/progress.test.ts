import { describe, expect, it } from "vitest";
import { LESSON_ORDER } from "../course/course";
import {
  buyHeartRefill,
  buyStreakFreeze,
  clearMistake,
  completeSession,
  currentStreak,
  HEART_REFILL_MS,
  initialProgress,
  isLessonUnlocked,
  loseHeart,
  MAX_HEARTS,
  nextLessonId,
  recordMistake,
  recordSkill,
  recordSpeedRound,
  recommendSkill,
  refillHearts,
  skillAccuracy,
  skillMastery,
  isDailyDone,
} from "./progress";
import { accuracy, answer, isFinished, sessionProgress, startSession } from "./session";

const DAY = 24 * 60 * 60 * 1000;
const T0 = new Date(2026, 0, 10, 12).getTime();

describe("lesson unlocking", () => {
  it("unlocks lessons in order", () => {
    let p = initialProgress(T0);
    expect(isLessonUnlocked(p, LESSON_ORDER[0])).toBe(true);
    expect(isLessonUnlocked(p, LESSON_ORDER[1])).toBe(false);
    p = completeSession(p, { lessonId: LESSON_ORDER[0], accuracy: 1 }, T0).progress;
    expect(isLessonUnlocked(p, LESSON_ORDER[1])).toBe(true);
    expect(nextLessonId(p)).toBe(LESSON_ORDER[1]);
  });
});

describe("rewards and streaks", () => {
  it("awards XP with a perfect bonus", () => {
    const { progress, reward } = completeSession(initialProgress(T0), { lessonId: "basics-1", accuracy: 1 }, T0);
    expect(reward.xp).toBe(15);
    expect(progress.xp).toBe(15);
    expect(progress.perfectLessons).toBe(1);
    expect(completeSession(progress, { lessonId: "basics-1", accuracy: 0.8 }, T0).reward.xp).toBe(10);
  });

  it("extends the streak on consecutive days and resets after a gap", () => {
    let p = initialProgress(T0);
    p = completeSession(p, { accuracy: 1 }, T0).progress;
    expect(p.streak).toBe(1);
    p = completeSession(p, { accuracy: 1 }, T0 + 1000).progress;
    expect(p.streak).toBe(1);
    p = completeSession(p, { accuracy: 1 }, T0 + DAY).progress;
    expect(p.streak).toBe(2);
    expect(currentStreak(p, T0 + 2 * DAY)).toBe(2);
    expect(currentStreak(p, T0 + 3 * DAY)).toBe(0);
    p = completeSession(p, { accuracy: 1 }, T0 + 3 * DAY).progress;
    expect(p.streak).toBe(1);
    expect(p.longestStreak).toBe(2);
  });
});

describe("hearts", () => {
  it("loses and regenerates hearts", () => {
    let p = initialProgress(T0);
    p = loseHeart(p, T0);
    p = loseHeart(p, T0);
    expect(p.hearts).toBe(MAX_HEARTS - 2);
    expect(refillHearts(p, T0 + HEART_REFILL_MS - 1).hearts).toBe(MAX_HEARTS - 2);
    expect(refillHearts(p, T0 + HEART_REFILL_MS).hearts).toBe(MAX_HEARTS - 1);
    expect(refillHearts(p, T0 + 10 * HEART_REFILL_MS).hearts).toBe(MAX_HEARTS);
  });

  it("never goes below zero", () => {
    let p = initialProgress(T0);
    for (let i = 0; i < 10; i++) p = loseHeart(p, T0);
    expect(p.hearts).toBe(0);
  });

  it("restores a heart after a practice drill", () => {
    const p = loseHeart(initialProgress(T0), T0);
    expect(completeSession(p, { accuracy: 0.5 }, T0).progress.hearts).toBe(MAX_HEARTS);
  });

  it("buys a full refill with gems", () => {
    let p = initialProgress(T0);
    for (let i = 0; i < 5; i++) p = loseHeart(p, T0);
    p = buyHeartRefill(p, T0);
    expect(p.hearts).toBe(MAX_HEARTS);
    expect(p.gems).toBe(50);
  });
});

describe("session", () => {
  it("re-queues missed exercises until solved", () => {
    let s = startSession(3);
    s = answer(s, true);
    s = answer(s, false);
    expect(s.queue).toEqual([2, 1]);
    s = answer(s, true);
    expect(sessionProgress(s)).toBeCloseTo(2 / 3);
    s = answer(s, true);
    expect(isFinished(s)).toBe(true);
    expect(accuracy(s)).toBeCloseTo(2 / 3);
    expect(s.mistakes).toBe(1);
  });
});

describe("streak freezes", () => {
  it("costs gems and caps at two", () => {
    let p = { ...initialProgress(T0), gems: 1000 };
    p = buyStreakFreeze(buyStreakFreeze(buyStreakFreeze(p)));
    expect(p.streakFreezes).toBe(2);
    expect(p.gems).toBe(600);
  });

  it("covers missed days", () => {
    let p = { ...initialProgress(T0), gems: 1000 };
    p = completeSession(p, { accuracy: 1 }, T0).progress;
    p = buyStreakFreeze(buyStreakFreeze(p));
    // Miss two days: both freezes are used and the streak continues.
    expect(currentStreak(p, T0 + 3 * DAY)).toBe(1);
    const { progress, reward } = completeSession(p, { accuracy: 1 }, T0 + 3 * DAY);
    expect(progress.streak).toBe(2);
    expect(progress.streakFreezes).toBe(0);
    expect(reward.freezesUsed).toBe(2);
  });

  it("does not spend freezes when the gap is too long", () => {
    let p = completeSession(initialProgress(T0), { accuracy: 1 }, T0).progress;
    p = { ...p, streakFreezes: 1 };
    expect(currentStreak(p, T0 + 3 * DAY)).toBe(0);
    const next = completeSession(p, { accuracy: 1 }, T0 + 3 * DAY).progress;
    expect(next.streak).toBe(1);
    expect(next.streakFreezes).toBe(1);
  });
});

describe("mistakes review", () => {
  it("records each miss once and clears it", () => {
    let p = initialProgress(T0);
    p = recordMistake(recordMistake(p, "basics-1#0"), "basics-1#0");
    p = recordMistake(p, "basics-2#3");
    expect(p.reviewQueue).toEqual(["basics-1#0", "basics-2#3"]);
    expect(clearMistake(p, "basics-1#0").reviewQueue).toEqual(["basics-2#3"]);
  });
});

describe("skills", () => {
  it("measures accuracy after enough attempts", () => {
    let p = initialProgress(T0);
    for (let i = 0; i < 4; i++) p = recordSkill(p, "outs", i < 3);
    expect(skillAccuracy(p, "outs")).toBeNull();
    p = recordSkill(p, "outs", false);
    expect(skillAccuracy(p, "outs")).toBeCloseTo(0.6);
  });

  it("recommends unmeasured skills first, then the weakest", () => {
    let p = initialProgress(T0);
    const skills = ["showdown", "outs"] as const;
    for (let i = 0; i < 5; i++) p = recordSkill(p, "showdown", true);
    expect(recommendSkill(p, skills)).toBe("outs");
    for (let i = 0; i < 5; i++) p = recordSkill(p, "outs", i === 0);
    expect(recommendSkill(p, skills)).toBe("outs");
    for (let i = 0; i < 20; i++) p = recordSkill(p, "outs", true);
    for (let i = 0; i < 20; i++) p = recordSkill(p, "showdown", false);
    expect(recommendSkill(p, skills)).toBe("showdown");
  });

  it("awards mastery tiers for volume and accuracy", () => {
    let p = initialProgress(T0);
    expect(skillMastery(p, "nuts")).toBe("Learning");
    for (let i = 0; i < 10; i++) p = recordSkill(p, "nuts", i < 7);
    expect(skillMastery(p, "nuts")).toBe("Bronze");
    for (let i = 0; i < 40; i++) p = recordSkill(p, "nuts", true);
    expect(skillMastery(p, "nuts")).toBe("Gold");
  });

  it("rewards the daily challenge once per day and logs practice history", () => {
    const { progress, reward } = completeSession(
      initialProgress(T0),
      { accuracy: 0.9, title: "Daily Challenge", daily: true },
      T0,
    );
    expect(reward.gems).toBe(20);
    expect(isDailyDone(progress, T0)).toBe(true);
    expect(isDailyDone(progress, T0 + DAY)).toBe(false);
    expect(progress.history[0]).toMatchObject({ title: "Daily Challenge", accuracy: 0.9 });
    const lesson = completeSession(progress, { lessonId: "basics-1", accuracy: 1 }, T0).progress;
    expect(lesson.history).toHaveLength(1);
  });

  it("keeps the best speed round score", () => {
    const p = recordSpeedRound(recordSpeedRound(initialProgress(T0), 12), 7);
    expect(p.speedBest).toBe(12);
  });
});
