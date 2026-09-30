import { BadgeCheck, BookOpen, Check, ChevronRight, Crown, ListChecks, Lock, Play, Star, Zap } from "lucide-react";
import { type CSSProperties, useEffect, useRef, useState } from "react";
import { COURSE, SECTIONS } from "../course/course";
import type { Unit } from "../course/types";
import { DailyGoalCard } from "../components/Shell";
import { NamedIcon } from "../components/Icons";
import {
  EXAM_LENGTH,
  EXAM_PASS,
  isExamUnlocked,
  isLessonComplete,
  isLessonUnlocked,
  isSectionUnlocked,
  nextLessonId,
  Progress,
  SECTION_TEST_LENGTH,
  sectionProgress,
  skillAccuracy,
  unitProgress,
} from "../state/progress";
import { dailyPlan, type PlanAction, type PlanItem } from "../state/plan";
import { DRILL_INFO } from "./PracticeScreen";

interface Props {
  progress: Progress;
  now: number;
  onStartLesson: (lessonId: string) => void;
  /** Start a test that unlocks the given section. */
  onTestOut: (sectionIndex: number) => void;
  onPlan: (action: PlanAction) => void;
}

function planDetail(item: PlanItem, progress: Progress): string {
  if (item.action.kind !== "drill") return item.detail;
  const accuracy = skillAccuracy(progress, item.action.skill);
  const title = DRILL_INFO[item.action.skill].title;
  return accuracy === null ? `${title} · new for you` : `${title} · ${Math.round(accuracy * 100)}% so far`;
}

function TodayPlan({ progress, now, onPlan }: { progress: Progress; now: number; onPlan: (action: PlanAction) => void }) {
  const items = dailyPlan(progress, now);
  const done = items.filter((i) => i.done).length;
  return (
    <section className="plan-card" aria-labelledby="plan-title">
      <div className="plan-head">
        <span className="icon-tile brand">
          <ListChecks size={20} aria-hidden="true" />
        </span>
        <div>
          <span className="eyebrow" id="plan-title">
            Today's plan
          </span>
          <strong>{done === items.length ? "All done for today. Nice work." : `${done} of ${items.length} done`}</strong>
        </div>
      </div>
      <ul className="plan-list">
        {items.map((item) => (
          <li key={item.id}>
            <button className={`plan-item ${item.done ? "done" : ""}`} onClick={() => onPlan(item.action)}>
              <span className="track-check" aria-hidden="true">
                {item.done && <Check size={14} strokeWidth={3} />}
              </span>
              <span className="row-text">
                <strong>{item.title}</strong>
                <span>{planDetail(item, progress)}</span>
              </span>
              <ChevronRight className="row-chevron" size={18} aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ExamCard({ progress, onStart }: { progress: Progress; onStart: () => void }) {
  const unlocked = isExamUnlocked(progress);
  const needed = Math.ceil(EXAM_LENGTH * EXAM_PASS);
  const best = Math.round(progress.examBest * 100);
  return (
    <section className={`exam-card ${unlocked ? "" : "locked"}`}>
      <span className="icon-disc gold">
        <BadgeCheck size={30} aria-hidden="true" />
      </span>
      <span className="eyebrow">Final exam</span>
      <h2>Prove your skills</h2>
      <p>
        {EXAM_LENGTH} fresh questions on preflop ranges, facing raises, push/fold, pot odds, bet math, equity, combos,
        call-or-fold, bluff-catching and range advantage. Get {needed} right to pass.
      </p>
      {progress.examPassedOn ? (
        <p className="exam-status">Passed · best score {best}%</p>
      ) : progress.examBest > 0 ? (
        <p className="exam-status">Best so far: {best}%</p>
      ) : null}
      {unlocked ? (
        <button className="btn btn-primary" onClick={onStart}>
          {progress.examPassedOn ? "Retake the exam" : "Start the exam"}
        </button>
      ) : (
        <span className="locked-note">
          <Lock size={14} aria-hidden="true" /> Finish the Advanced section to unlock
        </span>
      )}
    </section>
  );
}

/** Horizontal offsets that make the lesson path snake left and right. */
const OFFSETS = [0, 40, 64, 40, 0, -40, -64, -40];
const SUIT_WATERMARK = ["♠", "♥", "♦", "♣"];

function SectionHeader({
  progress,
  index,
  onTestOut,
}: {
  progress: Progress;
  index: number;
  onTestOut: (sectionIndex: number) => void;
}) {
  const section = SECTIONS[index];
  const { done, total } = sectionProgress(progress, index);
  const unlocked = isSectionUnlocked(progress, index);
  return (
    <header className={`section-head ${unlocked ? "" : "locked"}`}>
      <div className="section-title-row">
        <div>
          <span className="eyebrow">Section {index + 1}</span>
          <h2>{section.title}</h2>
        </div>
        <span className="section-count num">
          {done}/{total}
        </span>
      </div>
      <p>{section.description}</p>
      <div className="meter brand" aria-hidden="true">
        <div style={{ width: `${(done / total) * 100}%` }} />
      </div>
      {!unlocked && (
        <button className="btn btn-secondary test-out" onClick={() => onTestOut(index)}>
          <Zap size={16} aria-hidden="true" />
          Jump here: take a {SECTION_TEST_LENGTH}-question test
        </button>
      )}
    </header>
  );
}

export function LearnScreen({ progress, now, onStartLesson, onTestOut, onPlan }: Props) {
  const current = nextLessonId(progress);
  const [selected, setSelected] = useState<string | null>(null);
  const [guidebook, setGuidebook] = useState<Unit | null>(null);
  const currentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    currentRef.current?.scrollIntoView({ block: "center" });
  }, []);

  return (
    <div className="learn">
      <div className="mobile-only">
        <DailyGoalCard progress={progress} now={now} />
      </div>
      <TodayPlan progress={progress} now={now} onPlan={onPlan} />

      {SECTIONS.map((section, sectionIndex) => (
        <div key={section.id} className="section-block">
          <SectionHeader progress={progress} index={sectionIndex} onTestOut={onTestOut} />

          {section.unitIds.map((unitId) => {
            const unitIndex = COURSE.findIndex((u) => u.id === unitId);
            const unit = COURSE[unitIndex];
            const { done, total } = unitProgress(progress, unit.id);
            const unitStyle = { "--unit-color": unit.color } as CSSProperties;
            return (
              <section key={unit.id} className="unit" style={unitStyle}>
                <header className="unit-banner">
                  <span className="unit-watermark" aria-hidden="true">
                    {SUIT_WATERMARK[unitIndex % 4]}
                  </span>
                  <div className="unit-heading">
                    <span className="eyebrow">
                      Unit {unitIndex + 1} · {done} of {total} lessons
                    </span>
                    <h2>{unit.title}</h2>
                    <p>{unit.description}</p>
                    <div className="unit-progress" aria-hidden="true">
                      <div style={{ width: `${(done / total) * 100}%` }} />
                    </div>
                  </div>
                  <button className="guidebook-btn" onClick={() => setGuidebook(unit)}>
                    <BookOpen size={18} aria-hidden="true" />
                    <span>Guidebook</span>
                  </button>
                </header>

                <div className="path">
                  {unit.lessons.map((lesson, i) => {
                    const complete = isLessonComplete(progress, lesson.id);
                    const unlocked = isLessonUnlocked(progress, lesson.id);
                    const isCurrent = lesson.id === current;
                    const perfect = (progress.lessons[lesson.id]?.bestAccuracy ?? 0) >= 1;
                    const state = complete ? (perfect ? "perfect" : "complete") : unlocked ? "available" : "locked";
                    const offset = OFFSETS[(i + unitIndex * 2) % OFFSETS.length];
                    const open = selected === lesson.id;

                    return (
                      <div
                        key={lesson.id}
                        className={`path-node-wrap ${open ? "open" : ""}`}
                        style={{ transform: `translateX(${offset}px)` }}
                        ref={isCurrent ? currentRef : undefined}
                      >
                        {isCurrent && !open && <span className="start-tag">Start</span>}
                        <button
                          className={`path-node ${state} ${isCurrent ? "current" : ""}`}
                          aria-label={`${lesson.title} (${state})`}
                          aria-expanded={open}
                          onClick={() => setSelected(open ? null : lesson.id)}
                        >
                          {state === "locked" ? (
                            <Lock size={22} aria-hidden="true" />
                          ) : state === "perfect" ? (
                            <Crown size={26} aria-hidden="true" />
                          ) : complete ? (
                            <Check size={28} strokeWidth={3} aria-hidden="true" />
                          ) : isCurrent ? (
                            <Star size={26} fill="currentColor" aria-hidden="true" />
                          ) : (
                            <NamedIcon name={unit.icon} size={24} />
                          )}
                        </button>
                        {open && (
                          <div className={`node-popover ${unlocked ? "" : "locked"}`}>
                            <span className="eyebrow">
                              Lesson {i + 1} of {unit.lessons.length}
                            </span>
                            <strong>{lesson.title}</strong>
                            <span className="popover-meta">{lesson.exercises.length} exercises</span>
                            {unlocked ? (
                              <button className="btn btn-light" onClick={() => onStartLesson(lesson.id)}>
                                <Play size={16} fill="currentColor" aria-hidden="true" />
                                {complete ? "Practice again" : "Start lesson"}
                                <span className="btn-xp">+{complete ? 10 : 15} XP</span>
                              </button>
                            ) : (
                              <span className="locked-note">
                                Finish the lessons above to unlock this one
                                {isSectionUnlocked(progress, sectionIndex) || sectionIndex === 0
                                  ? "."
                                  : ", or take the section test."}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      ))}

      <ExamCard progress={progress} onStart={() => onPlan({ kind: "exam" })} />

      {!current && (
        <section className="course-done">
          <span className="icon-disc gold">
            <NamedIcon name="fish" size={32} />
          </span>
          <h2>Course complete</h2>
          <p>You've finished every lesson. Keep your edge sharp with practice drills and the Daily Challenge.</p>
        </section>
      )}

      {guidebook && (
        <div className="modal-backdrop" onClick={() => setGuidebook(null)}>
          <div
            className="modal guidebook"
            role="dialog"
            aria-labelledby="guidebook-title"
            style={{ "--unit-color": guidebook.color } as CSSProperties}
            onClick={(e) => e.stopPropagation()}
          >
            <span className="icon-disc unit">
              <NamedIcon name={guidebook.icon} size={28} />
            </span>
            <span className="eyebrow">Guidebook</span>
            <h3 id="guidebook-title">{guidebook.title}</h3>
            <div className="guide-sections">
              {guidebook.guidebook.map((g) => (
                <div key={g.heading} className="guide-section">
                  <h4>{g.heading}</h4>
                  <p>{g.body}</p>
                </div>
              ))}
            </div>
            <button className="btn btn-primary" onClick={() => setGuidebook(null)} autoFocus>
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
