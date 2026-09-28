import { COURSE, LESSON_ORDER } from "../course/course";

export const MAX_HEARTS = 5;
export const HEART_REFILL_MS = 20 * 60 * 1000;
export const HEART_REFILL_GEM_COST = 50;
export const XP_PER_LEVEL = 60;
export const STREAK_FREEZE_GEM_COST = 200;
export const MAX_STREAK_FREEZES = 2;
/** Most missed exercises kept for review; the oldest drop off first. */
export const MAX_REVIEW_ITEMS = 40;

export interface LessonRecord {
  completions: number;
  bestAccuracy: number;
}

export interface Progress {
  xp: number;
  gems: number;
  hearts: number;
  /** When the heart-regeneration clock last ticked (ms since epoch). */
  heartsUpdatedAt: number;
  streak: number;
  longestStreak: number;
  lastActiveDay: string | null;
  dailyGoal: number;
  xpByDay: Record<string, number>;
  lessons: Record<string, LessonRecord>;
  perfectLessons: number;
  drillsCompleted: number;
  /** Each freeze covers one missed day without breaking the streak. */
  streakFreezes: number;
  /** Missed course exercises ("lessonId#index") waiting to be reviewed. */
  reviewQueue: string[];
  soundOn: boolean;
}

export function initialProgress(now = Date.now()): Progress {
  return {
    xp: 0,
    gems: 100,
    hearts: MAX_HEARTS,
    heartsUpdatedAt: now,
    streak: 0,
    longestStreak: 0,
    lastActiveDay: null,
    dailyGoal: 30,
    xpByDay: {},
    lessons: {},
    perfectLessons: 0,
    drillsCompleted: 0,
    streakFreezes: 0,
    reviewQueue: [],
    soundOn: true,
  };
}

/** Local calendar day as YYYY-MM-DD. */
export function dayKey(time: number): string {
  const d = new Date(time);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function addDays(day: string, delta: number): string {
  const [y, m, d] = day.split("-").map(Number);
  return dayKey(new Date(y, m - 1, d + delta).getTime());
}

/** Whole calendar days from day `a` to day `b`. */
export function daysBetween(a: string, b: string): number {
  const toTime = (day: string) => {
    const [y, m, d] = day.split("-").map(Number);
    return new Date(y, m - 1, d, 12).getTime();
  };
  return Math.round((toTime(b) - toTime(a)) / (24 * 60 * 60 * 1000));
}

/** Days missed since the last active day (0 if active today or yesterday). */
function missedDays(p: Progress, today: string): number {
  return p.lastActiveDay ? Math.max(0, daysBetween(p.lastActiveDay, today) - 1) : 0;
}

/** Streak as it stands today: it lapses when more days were missed than freezes cover. */
export function currentStreak(p: Progress, now = Date.now()): number {
  return missedDays(p, dayKey(now)) <= p.streakFreezes ? p.streak : 0;
}

export function xpToday(p: Progress, now = Date.now()): number {
  return p.xpByDay[dayKey(now)] ?? 0;
}

export function level(p: Progress): { level: number; into: number; needed: number } {
  return { level: Math.floor(p.xp / XP_PER_LEVEL) + 1, into: p.xp % XP_PER_LEVEL, needed: XP_PER_LEVEL };
}

/** Apply passive heart regeneration. */
export function refillHearts(p: Progress, now = Date.now()): Progress {
  if (p.hearts >= MAX_HEARTS) return p;
  const gained = Math.floor((now - p.heartsUpdatedAt) / HEART_REFILL_MS);
  if (gained <= 0) return p;
  const hearts = Math.min(MAX_HEARTS, p.hearts + gained);
  return {
    ...p,
    hearts,
    heartsUpdatedAt: hearts >= MAX_HEARTS ? now : p.heartsUpdatedAt + gained * HEART_REFILL_MS,
  };
}

/** Milliseconds until the next heart regenerates, or null when full. */
export function nextHeartIn(p: Progress, now = Date.now()): number | null {
  if (p.hearts >= MAX_HEARTS) return null;
  return Math.max(0, p.heartsUpdatedAt + HEART_REFILL_MS - now);
}

export function loseHeart(p: Progress, now = Date.now()): Progress {
  const refilled = refillHearts(p, now);
  if (refilled.hearts <= 0) return refilled;
  // Start the regen clock when dropping below full.
  const heartsUpdatedAt = refilled.hearts >= MAX_HEARTS ? now : refilled.heartsUpdatedAt;
  return { ...refilled, hearts: refilled.hearts - 1, heartsUpdatedAt };
}

export function buyHeartRefill(p: Progress, now = Date.now()): Progress {
  if (p.gems < HEART_REFILL_GEM_COST || p.hearts >= MAX_HEARTS) return p;
  return { ...p, gems: p.gems - HEART_REFILL_GEM_COST, hearts: MAX_HEARTS, heartsUpdatedAt: now };
}

export function isLessonComplete(p: Progress, lessonId: string): boolean {
  return (p.lessons[lessonId]?.completions ?? 0) > 0;
}

/** A lesson is unlocked when every lesson before it has been completed at least once. */
export function isLessonUnlocked(p: Progress, lessonId: string): boolean {
  const index = LESSON_ORDER.indexOf(lessonId);
  if (index < 0) return false;
  return index === 0 || isLessonComplete(p, LESSON_ORDER[index - 1]);
}

/** The first lesson not yet completed, or undefined when the course is finished. */
export function nextLessonId(p: Progress): string | undefined {
  return LESSON_ORDER.find((id) => !isLessonComplete(p, id));
}

export function unitProgress(p: Progress, unitId: string): { done: number; total: number } {
  const unit = COURSE.find((u) => u.id === unitId);
  if (!unit) return { done: 0, total: 0 };
  return { done: unit.lessons.filter((l) => isLessonComplete(p, l.id)).length, total: unit.lessons.length };
}

export interface SessionResult {
  /** Present for course lessons; absent for practice drills. */
  lessonId?: string;
  /** Fraction of exercises answered correctly on the first try. */
  accuracy: number;
}

export interface Reward {
  xp: number;
  gems: number;
  heartsRestored: number;
  streakExtended: boolean;
  freezesUsed: number;
}

export function rewardFor(result: SessionResult): Reward {
  const perfect = result.accuracy >= 1;
  if (result.lessonId) {
    return { xp: 10 + (perfect ? 5 : 0), gems: perfect ? 10 : 5, heartsRestored: 0, streakExtended: false, freezesUsed: 0 };
  }
  return { xp: 8 + (perfect ? 2 : 0), gems: 2, heartsRestored: 1, streakExtended: false, freezesUsed: 0 };
}

/** Record a finished lesson or drill: XP, gems, streak, lesson stats. */
export function completeSession(p: Progress, result: SessionResult, now = Date.now()): { progress: Progress; reward: Reward } {
  const today = dayKey(now);
  const reward = rewardFor(result);

  let streak = p.streak;
  let streakFreezes = p.streakFreezes;
  if (p.lastActiveDay !== today) {
    const missed = missedDays(p, today);
    if (p.lastActiveDay && missed <= streakFreezes) {
      streak = p.streak + 1;
      streakFreezes -= missed;
      reward.freezesUsed = missed;
    } else {
      streak = 1;
    }
    reward.streakExtended = true;
  }

  const lessons = { ...p.lessons };
  if (result.lessonId) {
    const prev = lessons[result.lessonId] ?? { completions: 0, bestAccuracy: 0 };
    lessons[result.lessonId] = {
      completions: prev.completions + 1,
      bestAccuracy: Math.max(prev.bestAccuracy, result.accuracy),
    };
  }

  const refilled = refillHearts(p, now);
  const hearts = Math.min(MAX_HEARTS, refilled.hearts + reward.heartsRestored);

  const progress: Progress = {
    ...refilled,
    hearts,
    heartsUpdatedAt: hearts >= MAX_HEARTS ? now : refilled.heartsUpdatedAt,
    xp: p.xp + reward.xp,
    gems: p.gems + reward.gems,
    streak,
    streakFreezes,
    longestStreak: Math.max(p.longestStreak, streak),
    lastActiveDay: today,
    xpByDay: { ...p.xpByDay, [today]: (p.xpByDay[today] ?? 0) + reward.xp },
    lessons,
    perfectLessons: p.perfectLessons + (result.lessonId && result.accuracy >= 1 ? 1 : 0),
    drillsCompleted: p.drillsCompleted + (result.lessonId ? 0 : 1),
  };
  return { progress, reward };
}

export function buyStreakFreeze(p: Progress): Progress {
  if (p.gems < STREAK_FREEZE_GEM_COST || p.streakFreezes >= MAX_STREAK_FREEZES) return p;
  return { ...p, gems: p.gems - STREAK_FREEZE_GEM_COST, streakFreezes: p.streakFreezes + 1 };
}

export function recordMistake(p: Progress, ref: string): Progress {
  if (p.reviewQueue.includes(ref)) return p;
  return { ...p, reviewQueue: [...p.reviewQueue, ref].slice(-MAX_REVIEW_ITEMS) };
}

export function clearMistake(p: Progress, ref: string): Progress {
  if (!p.reviewQueue.includes(ref)) return p;
  return { ...p, reviewQueue: p.reviewQueue.filter((r) => r !== ref) };
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
}

export function achievements(p: Progress): Achievement[] {
  const completed = LESSON_ORDER.filter((id) => isLessonComplete(p, id)).length;
  const unitsDone = COURSE.filter((u) => u.lessons.every((l) => isLessonComplete(p, l.id))).length;
  return [
    { id: "first", title: "First Hand", description: "Complete your first lesson", icon: "party", unlocked: completed >= 1 },
    { id: "perfect", title: "Flawless", description: "Finish a lesson with no mistakes", icon: "sparkles", unlocked: p.perfectLessons >= 1 },
    { id: "unit", title: "Graduate", description: "Complete a whole unit", icon: "graduation", unlocked: unitsDone >= 1 },
    { id: "streak3", title: "On a Heater", description: "Reach a 3-day streak", icon: "flame", unlocked: p.longestStreak >= 3 },
    { id: "streak7", title: "Grinder", description: "Reach a 7-day streak", icon: "calendar", unlocked: p.longestStreak >= 7 },
    { id: "drills", title: "Table Time", description: "Complete 5 practice drills", icon: "target", unlocked: p.drillsCompleted >= 5 },
    { id: "xp500", title: "High Roller", description: "Earn 500 XP", icon: "trending", unlocked: p.xp >= 500 },
    {
      id: "course",
      title: "Shark",
      description: "Finish the entire course",
      icon: "fish",
      unlocked: completed === LESSON_ORDER.length,
    },
  ];
}
