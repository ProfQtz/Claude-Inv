import { type CSSProperties, useEffect, useRef, useState } from "react";
import { COURSE } from "../course/course";
import type { Unit } from "../course/types";
import {
  isLessonComplete,
  isLessonUnlocked,
  nextLessonId,
  Progress,
  unitProgress,
  xpToday,
} from "../state/progress";

interface Props {
  progress: Progress;
  now: number;
  onStartLesson: (lessonId: string) => void;
}

/** Horizontal offsets that make the lesson path snake left and right. */
const OFFSETS = [0, 44, 70, 44, 0, -44, -70, -44];

export function LearnScreen({ progress, now, onStartLesson }: Props) {
  const current = nextLessonId(progress);
  const [selected, setSelected] = useState<string | null>(null);
  const [guidebook, setGuidebook] = useState<Unit | null>(null);
  const currentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    currentRef.current?.scrollIntoView({ block: "center" });
  }, []);

  const today = xpToday(progress, now);
  const goalPct = Math.min(1, today / progress.dailyGoal);

  return (
    <div className="learn">
      <section className="daily-card">
        <div>
          <strong>Daily goal</strong>
          <span className="muted">
            {today} / {progress.dailyGoal} XP
          </span>
        </div>
        <div className="progress-track small">
          <div className="progress-fill gold" style={{ width: `${goalPct * 100}%` }} />
        </div>
        {goalPct >= 1 && <span className="goal-done">🎯 Goal reached — nice grinding!</span>}
      </section>

      {COURSE.map((unit, unitIndex) => {
        const { done, total } = unitProgress(progress, unit.id);
        return (
          <section key={unit.id} className="unit">
            <div className="unit-banner" style={{ background: unit.color }}>
              <div>
                <span className="unit-label">
                  Unit {unitIndex + 1} · {done}/{total}
                </span>
                <h2>{unit.title}</h2>
                <p>{unit.description}</p>
              </div>
              <button className="guidebook-btn" onClick={() => setGuidebook(unit)}>
                📖 <span>Guidebook</span>
              </button>
            </div>

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
                    className="path-node-wrap"
                    style={{ transform: `translateX(${offset}px)` }}
                    ref={isCurrent ? currentRef : undefined}
                  >
                    {isCurrent && !open && <span className="start-bubble">START</span>}
                    <button
                      className={`path-node ${state} ${isCurrent ? "current" : ""}`}
                      style={{ "--unit-color": unit.color } as CSSProperties}
                      aria-label={`${lesson.title} (${state})`}
                      onClick={() => setSelected(open ? null : lesson.id)}
                    >
                      {state === "locked" ? "🔒" : state === "perfect" ? "👑" : complete ? "✓" : unit.icon}
                    </button>
                    {open && (
                      <div className="node-popover" style={{ "--unit-color": unit.color } as CSSProperties}>
                        <strong>{lesson.title}</strong>
                        <span>
                          Lesson {i + 1} of {unit.lessons.length}
                        </span>
                        {unlocked ? (
                          <button className="btn btn-white" onClick={() => onStartLesson(lesson.id)}>
                            {complete ? "Practice again +XP" : "Start +15 XP"}
                          </button>
                        ) : (
                          <span className="locked-note">Complete the lessons above to unlock this.</span>
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
          <div className="modal-icon">🦈</div>
          <h2>Course complete!</h2>
          <p>You've finished every lesson. Keep your edge sharp with practice drills.</p>
        </section>
      )}

      {guidebook && (
        <div className="modal-backdrop" onClick={() => setGuidebook(null)}>
          <div className="modal guidebook" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon">{guidebook.icon}</div>
            <h3>{guidebook.title} guidebook</h3>
            {guidebook.guidebook.map((g) => (
              <div key={g.heading} className="guide-section">
                <h4>{g.heading}</h4>
                <p>{g.body}</p>
              </div>
            ))}
            <button className="btn btn-green" onClick={() => setGuidebook(null)} autoFocus>
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
