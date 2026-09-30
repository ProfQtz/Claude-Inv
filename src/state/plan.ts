import { COURSE, findLesson } from "../course/course";
import { SKILLS } from "../course/generator";
import type { Skill } from "../course/types";
import {
  dayKey,
  isDailyDone,
  isExamUnlocked,
  isLessonComplete,
  nextLessonId,
  type Progress,
  recommendSkill,
  sectionProgress,
  skillAccuracy,
} from "./progress";

/** The unit that first teaches each drill skill. Drills are suggested once that unit is started. */
export const SKILL_UNIT: Record<Skill, string> = {
  handName: "rankings",
  showdown: "showdown",
  nuts: "showdown",
  preflop: "starting",
  outs: "odds",
  potOdds: "odds",
  equity: "odds",
  callFold: "odds",
  pushFold: "tournaments",
  vsOpen: "facing",
  betMath: "math",
  combos: "reading",
  rangeEdge: "reading",
  bluffCatch: "river",
};

export type PlanAction =
  | { kind: "lesson"; lessonId: string }
  | { kind: "drill"; skill: Skill }
  | { kind: "review" }
  | { kind: "daily" }
  | { kind: "exam" };

export interface PlanItem {
  id: "lesson" | "practice" | "review" | "daily" | "exam";
  title: string;
  detail: string;
  done: boolean;
  action: PlanAction;
}

/** Skills whose teaching unit the player has started. */
export function taughtSkills(p: Progress): Skill[] {
  return SKILLS.filter((skill) => {
    const unit = COURSE.find((u) => u.id === SKILL_UNIT[skill]);
    return unit !== undefined && isLessonComplete(p, unit.lessons[0].id);
  });
}

/**
 * Today's study plan, adapted to where the player is: the next lesson, a drill on the
 * weakest skill they've been taught, any mistakes to review, the Daily Challenge once
 * the basics are done, and the final exam when it's open.
 */
export function dailyPlan(p: Progress, now: number): PlanItem[] {
  const today = dayKey(now);
  const log = p.dayLog.day === today ? p.dayLog : { lessons: 0, drills: 0, reviews: 0 };
  const items: PlanItem[] = [];

  const next = nextLessonId(p);
  if (next) {
    const found = findLesson(next)!;
    items.push({
      id: "lesson",
      title: "Learn something new",
      detail: `${found.unit.title}: ${found.lesson.title}`,
      done: log.lessons > 0,
      action: { kind: "lesson", lessonId: next },
    });
  }

  const taught = taughtSkills(p);
  if (taught.length > 0) {
    // Try the newest untried drill first (what was just learned), then the weakest skill.
    const untried = taught.filter((s) => skillAccuracy(p, s) === null);
    const unitIndex = (s: Skill) => COURSE.findIndex((u) => u.id === SKILL_UNIT[s]);
    const skill = untried.length ? untried.reduce((a, b) => (unitIndex(b) > unitIndex(a) ? b : a)) : recommendSkill(p, taught);
    // The UI names the drill; `detail` stays empty so screens can word it their own way.
    items.push({ id: "practice", title: "Practice", detail: "", done: log.drills > 0, action: { kind: "drill", skill } });
  }

  if (p.reviewQueue.length > 0 || log.reviews > 0) {
    const n = p.reviewQueue.length;
    items.push({
      id: "review",
      title: "Fix your mistakes",
      detail: n > 0 ? `${n} question${n === 1 ? "" : "s"} to review` : "All caught up",
      done: log.reviews > 0,
      action: { kind: "review" },
    });
  }

  const basicsDone = sectionProgress(p, 0).done === sectionProgress(p, 0).total;
  if (basicsDone) {
    items.push({ id: "daily", title: "Daily Challenge", detail: "Ten hands, the same for everyone today", done: isDailyDone(p, now), action: { kind: "daily" } });
  }

  if (isExamUnlocked(p) && !p.examPassedOn) {
    items.push({ id: "exam", title: "Take the final exam", detail: "20 questions on the advanced skills", done: false, action: { kind: "exam" } });
  }
  return items;
}
