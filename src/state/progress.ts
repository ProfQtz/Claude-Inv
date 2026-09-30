import { COURSE, LESSON_ORDER, sectionLessons } from "../course/course";
import { SKILLS } from "../course/generator";
import type { Skill } from "../course/types";

export const MAX_HEARTS = 5;
export const HEART_REFILL_MS = 20 * 60 * 1000;
export const HEART_REFILL_GEM_COST = 50;
export const XP_PER_LEVEL = 60;
export const STREAK_FREEZE_GEM_COST = 200;
export const MAX_STREAK_FREEZES = 2;
/** Most missed exercises kept for review; the oldest drop off first. */
export const MAX_REVIEW_ITEMS = 40;

/** Skill accuracy needs this many answers before it counts as measured. */
export const SKILL_MIN_ATTEMPTS = 5;
export const DRILL_LENGTHS = [5, 10, 20] as const;

export const MAX_HISTORY = 20;

export interface PracticeRecord {
  day: string;
  title: string;
  accuracy: number;
}

export interface SkillRecord {
  attempts: number;
  correct: number;
}

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
  skills: Partial<Record<Skill, SkillRecord>>;
  speedBest: number;
  drillLength: number;
  /** Day the daily challenge was last completed. */
  dailyDone: string | null;
  /** Most recent practice sessions, newest first. */
  history: PracticeRecord[];
  /** Skills chosen last time in "Build a drill". */
  customMix: Skill[];
  /** Whether the welcome flow has been completed (or skipped). */
  onboarded: boolean;
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
    skills: {},
    speedBest: 0,
    drillLength: 10,
    dailyDone: null,
    history: [],
    customMix: [],
    onboarded: false,
  };
}

/**
 * Fill in fields added since the data was saved. Anyone with progress from before
 * onboarding existed has clearly started already, so they skip the welcome flow.
 */
export function migrateProgress(saved: Partial<Progress>, now = Date.now()): Progress {
  const p = initialProgress(now);
  const src: Record<string, unknown> = typeof saved === "object" && saved !== null ? saved : {};
  // Keep only fields whose type matches the default, so a corrupt or hand-edited
  // save can't put a null where a screen expects a number, list or record.
  for (const key of Object.keys(p) as (keyof Progress)[]) {
    if (key in src && sameShape(src[key], p[key])) (p as unknown as Record<string, unknown>)[key] = src[key];
  }
  // Then drop malformed entries inside the records and lists.
  p.xpByDay = keepEntries(p.xpByDay, isNum);
  p.lessons = keepEntries(p.lessons, (v): v is LessonRecord => isObj(v) && isNum(v.completions) && isNum(v.bestAccuracy));
  p.skills = keepEntries(p.skills, (v): v is SkillRecord => isObj(v) && isNum(v.attempts) && isNum(v.correct));
  p.reviewQueue = p.reviewQueue.filter((ref) => typeof ref === "string");
  p.customMix = p.customMix.filter((skill) => SKILLS.includes(skill));
  p.history = p.history.filter(
    (h): h is PracticeRecord => isObj(h) && typeof h.day === "string" && typeof h.title === "string" && isNum(h.accuracy),
  );
  if (typeof src.onboarded !== "boolean") p.onboarded = Object.keys(p.lessons).length > 0 || p.xp > 0;
  return p;
}

const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

function keepEntries<T>(record: Record<string, unknown>, ok: (v: unknown) => v is T): Record<string, T> {
  return Object.fromEntries(Object.entries(record).filter(([, v]) => ok(v))) as Record<string, T>;
}

function sameShape(value: unknown, fallback: unknown): boolean {
  if (fallback === null) return value === null || typeof value === "string";
  if (Array.isArray(fallback)) return Array.isArray(value);
  if (typeof fallback === "number") return isNum(value);
  if (typeof fallback === "object") return isObj(value);
  return typeof value === typeof fallback;
}

export const SECTION_TEST_LENGTH = 12;
/** Pass mark for a test-out: 10 of 12. */
export const SECTION_TEST_PASS = 0.8;

export function passedTest(accuracy: number): boolean {
  return accuracy >= SECTION_TEST_PASS - 1e-9;
}

/** Passing a section test marks every lesson before that section as complete. */
export function applyTestOut(p: Progress, sectionIndex: number): Progress {
  const lessons = { ...p.lessons };
  for (let s = 0; s < sectionIndex; s++) {
    for (const id of sectionLessons(s)) {
      if (!lessons[id]?.completions) lessons[id] = { completions: 1, bestAccuracy: 0 };
    }
  }
  return { ...p, lessons };
}

/** A section is open once its first lesson is unlocked. */
export function isSectionUnlocked(p: Progress, sectionIndex: number): boolean {
  return isLessonUnlocked(p, sectionLessons(sectionIndex)[0]);
}

export function sectionProgress(p: Progress, sectionIndex: number): { done: number; total: number } {
  const ids = sectionLessons(sectionIndex);
  return { done: ids.filter((id) => isLessonComplete(p, id)).length, total: ids.length };
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
  /** Shown in practice history. */
  title?: string;
  daily?: boolean;
  /** A placement or test-out test. */
  test?: boolean;
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
  if (result.test) {
    return { xp: 15, gems: passedTest(result.accuracy) ? 20 : 0, heartsRestored: 0, streakExtended: false, freezesUsed: 0 };
  }
  if (result.daily) {
    return { xp: 20 + (perfect ? 5 : 0), gems: 20, heartsRestored: 1, streakExtended: false, freezesUsed: 0 };
  }
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
    drillsCompleted: p.drillsCompleted + (result.lessonId || result.test ? 0 : 1),
    dailyDone: result.daily ? today : p.dailyDone,
    history: result.lessonId || result.test
      ? p.history
      : [{ day: today, title: result.title ?? "Practice", accuracy: result.accuracy }, ...p.history].slice(0, MAX_HISTORY),
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

export function recordSkill(p: Progress, skill: Skill, correct: boolean): Progress {
  const prev = p.skills[skill] ?? { attempts: 0, correct: 0 };
  return {
    ...p,
    skills: { ...p.skills, [skill]: { attempts: prev.attempts + 1, correct: prev.correct + (correct ? 1 : 0) } },
  };
}

/** Accuracy for a skill, or null until it has enough attempts to mean something. */
export function skillAccuracy(p: Progress, skill: Skill): number | null {
  const r = p.skills[skill];
  return r && r.attempts >= SKILL_MIN_ATTEMPTS ? r.correct / r.attempts : null;
}

/** The skill to practice next: an unmeasured one first, otherwise the weakest. */
export function recommendSkill(p: Progress, skills: readonly Skill[]): Skill {
  const unmeasured = skills.filter((s) => skillAccuracy(p, s) === null);
  if (unmeasured.length > 0) {
    return unmeasured.reduce((a, b) => ((p.skills[b]?.attempts ?? 0) < (p.skills[a]?.attempts ?? 0) ? b : a));
  }
  return skills.reduce((a, b) => (skillAccuracy(p, b)! < skillAccuracy(p, a)! ? b : a));
}

export type Mastery = "Learning" | "Bronze" | "Silver" | "Gold";

/** Mastery tiers need both volume and accuracy: 10/60%, 25/75%, 50/90%. */
export function skillMastery(p: Progress, skill: Skill): Mastery {
  const r = p.skills[skill];
  if (!r) return "Learning";
  const acc = r.correct / r.attempts;
  if (r.attempts >= 50 && acc >= 0.9) return "Gold";
  if (r.attempts >= 25 && acc >= 0.75) return "Silver";
  if (r.attempts >= 10 && acc >= 0.6) return "Bronze";
  return "Learning";
}

export function isDailyDone(p: Progress, now = Date.now()): boolean {
  return p.dailyDone === dayKey(now);
}

export function recordSpeedRound(p: Progress, score: number): Progress {
  return score > p.speedBest ? { ...p, speedBest: score } : p;
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
    { id: "speed", title: "Quick Reads", description: "Score 10 in a Speed Round", icon: "zap", unlocked: p.speedBest >= 10 },
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

const BACKUP_PREFIX = "PL1.";

/** A portable backup code: a version prefix plus base64-encoded JSON (UTF-8 safe). */
export function encodeBackup(p: Progress): string {
  const bytes = new TextEncoder().encode(JSON.stringify(p));
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return BACKUP_PREFIX + btoa(binary);
}

/** Parse a backup code, or return null if it isn't a valid PokerLingo backup. */
export function decodeBackup(code: string): Progress | null {
  const text = code.trim();
  if (!text.startsWith(BACKUP_PREFIX)) return null;
  try {
    const binary = atob(text.slice(BACKUP_PREFIX.length));
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    const data = JSON.parse(new TextDecoder().decode(bytes));
    if (typeof data !== "object" || data === null) return null;
    if (typeof data.xp !== "number" || typeof data.lessons !== "object" || data.lessons === null) return null;
    return migrateProgress({ ...data, onboarded: true });
  } catch {
    return null;
  }
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  value: number;
  target: number;
}

/** Skills a strong regular uses every session; the track asks for Silver in all of them. */
export const CORE_SKILLS: Skill[] = ["preflop", "vsOpen", "potOdds", "betMath", "equity", "combos"];

const TIER_RANK: Record<Mastery, number> = { Learning: 0, Bronze: 1, Silver: 2, Gold: 3 };

/**
 * The "Path to top 10%": finish all three sections and prove the core skills in practice.
 * It measures knowledge and drill accuracy, not results at real tables.
 */
export function topTrack(p: Progress): Milestone[] {
  const section = (i: number, title: string): Milestone => {
    const { done, total } = sectionProgress(p, i);
    return { id: `section-${i}`, title: `Finish ${title}`, description: `${total} lessons`, value: done, target: total };
  };
  const tierCount = (tier: Mastery, skills: readonly Skill[]) =>
    skills.filter((s) => TIER_RANK[skillMastery(p, s)] >= TIER_RANK[tier]).length;
  const allSkills = Object.keys(p.skills) as Skill[];
  return [
    section(0, "Foundations"),
    section(1, "Winning Fundamentals"),
    section(2, "Advanced"),
    {
      id: "core-silver",
      title: "Silver in the six core skills",
      description: "Open or Fold, Facing a Raise, Pot Odds, Bet Math, Hand vs Hand and Combos",
      value: tierCount("Silver", CORE_SKILLS),
      target: CORE_SKILLS.length,
    },
    {
      id: "gold-3",
      title: "Gold in any three skills",
      description: "50 answers at 90% or better",
      value: Math.min(3, tierCount("Gold", allSkills)),
      target: 3,
    },
    {
      id: "speed-15",
      title: "Score 15 in a Speed Round",
      description: "Fast, accurate reads under time pressure",
      value: Math.min(15, p.speedBest),
      target: 15,
    },
    {
      id: "streak-14",
      title: "Reach a 14-day streak",
      description: "Steady practice beats cramming",
      value: Math.min(14, p.longestStreak),
      target: 14,
    },
  ];
}
