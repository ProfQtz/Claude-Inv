import { BookOpen, Check, Crown, Lock, Play, Star } from "lucide-react";
import { type CSSProperties, useEffect, useRef, useState } from "react";
import { COURSE } from "../course/course";
import type { Unit } from "../course/types";
import { DailyGoalCard } from "../components/Shell";
import { NamedIcon } from "../components/Icons";
import { isLessonComplete, isLessonUnlocked, nextLessonId, Progress, unitProgress } from "../state/progress";

interface Props {
  progress: Progress;
  now: number;
  onStartLesson: (lessonId: string) => void;
}

/** Horizontal offsets that make the lesson path snake left and right. */
const OFFSETS = [0, 40, 64, 40, 0, -40, -64, -40];
const SUIT_WATERMARK = ["♠", "♥", "♦", "♣"];

export function LearnScreen({ progress, now, onStartLesson }: Props) {
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

      {COURSE.map((unit, unitIndex) => {
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
                          <span className="locked-note">Finish the lessons above to unlock this one.</span>
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

      {!current && (
        <section className="course-done">
          <span className="icon-disc gold">
            <NamedIcon name="fish" size={32} />
          </span>
          <h2>Course complete</h2>
          <p>You've finished every lesson. Keep your edge sharp with practice drills.</p>
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
