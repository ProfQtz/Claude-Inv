import { ArrowRight, BookOpen, Check, Cpu, Flame, GraduationCap, Sprout, Trophy } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { LESSON_ORDER, SECTIONS } from "../course/course";
import { SECTION_TEST_LENGTH, SECTION_TEST_PASS } from "../state/progress";

export const GOALS = [
  { xp: 15, label: "Casual", note: "About 5 minutes a day" },
  { xp: 30, label: "Regular", note: "About 10 minutes a day" },
  { xp: 50, label: "Serious", note: "About 15 minutes a day" },
  { xp: 100, label: "Grinder", note: "30 minutes or more" },
];

type Experience = "new" | "rules" | "regular";

const EXPERIENCE: { id: Experience; title: string; body: string; icon: ReactNode; testSection: number | null }[] = [
  {
    id: "new",
    title: "I'm new to poker",
    body: "Start from the basics: the deck, hand rankings and how a hand plays out.",
    icon: <Sprout size={22} aria-hidden="true" />,
    testSection: null,
  },
  {
    id: "rules",
    title: "I know the rules",
    body: `Take a short test to skip ${SECTIONS[0].title}.`,
    icon: <BookOpen size={22} aria-hidden="true" />,
    testSection: 1,
  },
  {
    id: "regular",
    title: "I play regularly",
    body: `Take a short test to skip ahead to ${SECTIONS[2].title}.`,
    icon: <Trophy size={22} aria-hidden="true" />,
    testSection: 2,
  },
];

interface Props {
  /** `testSection` is the section a placement test would unlock, or null to start at the beginning. */
  onComplete: (choice: { dailyGoal: number; testSection: number | null }) => void;
}

export function OnboardingScreen({ onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [experience, setExperience] = useState<Experience | null>(null);
  const [goal, setGoal] = useState(30);
  const chosen = EXPERIENCE.find((e) => e.id === experience);
  const needed = Math.ceil(SECTION_TEST_LENGTH * SECTION_TEST_PASS);

  return (
    <div className="onboarding">
      <div className="onboarding-steps" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={i <= step ? "on" : ""} />
        ))}
      </div>

      {step === 0 && (
        <section className="onboarding-card">
          <span className="onboarding-mark" aria-hidden="true">
            ♠
          </span>
          <h1>Learn poker the smart way</h1>
          <p className="lead">
            Short lessons, real math and a built-in solver. Start from zero and build the skills strong regulars use.
          </p>
          <ul className="value-list">
            <li>
              <GraduationCap size={20} aria-hidden="true" /> {LESSON_ORDER.length} lessons, from the rules to advanced
              strategy
            </li>
            <li>
              <Cpu size={20} aria-hidden="true" /> Drills graded by exact math and a push/fold solver
            </li>
            <li>
              <Flame size={20} aria-hidden="true" /> Daily goals, streaks and reviews that make it stick
            </li>
          </ul>
          <button className="btn btn-primary wide" onClick={() => setStep(1)} autoFocus>
            Get started <ArrowRight size={18} aria-hidden="true" />
          </button>
          <p className="fine-print">PokerLingo teaches poker strategy. There's no real-money gambling.</p>
        </section>
      )}

      {step === 1 && (
        <section className="onboarding-card">
          <h1>How much poker do you know?</h1>
          <div className="choice-cards" role="radiogroup" aria-label="Experience">
            {EXPERIENCE.map((e) => (
              <button
                key={e.id}
                role="radio"
                aria-checked={experience === e.id}
                className={`choice-card ${experience === e.id ? "on" : ""}`}
                onClick={() => setExperience(e.id)}
              >
                <span className="icon-tile brand">{e.icon}</span>
                <span className="row-text">
                  <strong>{e.title}</strong>
                  <span>{e.body}</span>
                </span>
                {experience === e.id && <Check size={20} strokeWidth={3} className="choice-check" aria-hidden="true" />}
              </button>
            ))}
          </div>
          <button className="btn btn-primary wide" disabled={!experience} onClick={() => setStep(2)}>
            Continue
          </button>
        </section>
      )}

      {step === 2 && (
        <section className="onboarding-card">
          <h1>Pick a daily goal</h1>
          <p className="lead">You can change it any time on your profile.</p>
          <div className="choice-cards" role="radiogroup" aria-label="Daily goal">
            {GOALS.map((g) => (
              <button
                key={g.xp}
                role="radio"
                aria-checked={goal === g.xp}
                className={`choice-card ${goal === g.xp ? "on" : ""}`}
                onClick={() => setGoal(g.xp)}
              >
                <span className="row-text">
                  <strong>{g.label}</strong>
                  <span>{g.note}</span>
                </span>
                <span className="goal-xp num">{g.xp} XP</span>
              </button>
            ))}
          </div>
          <button className="btn btn-primary wide" onClick={() => setStep(3)}>
            Continue
          </button>
        </section>
      )}

      {step === 3 && chosen && (
        <section className="onboarding-card">
          <h1>{chosen.testSection === null ? "You're all set" : "Take the placement test"}</h1>
          {chosen.testSection === null ? (
            <>
              <p className="lead">
                You'll start with {SECTIONS[0].title}: {SECTIONS[0].description.toLowerCase()}
              </p>
              <button
                className="btn btn-primary wide"
                onClick={() => onComplete({ dailyGoal: goal, testSection: null })}
                autoFocus
              >
                Start learning
              </button>
            </>
          ) : (
            <>
              <p className="lead">
                {SECTION_TEST_LENGTH} questions from{" "}
                {SECTIONS.slice(0, chosen.testSection)
                  .map((s) => s.title)
                  .join(" and ")}
                . Get {needed} or more right to start at {SECTIONS[chosen.testSection].title}.
              </p>
              <button
                className="btn btn-primary wide"
                onClick={() => onComplete({ dailyGoal: goal, testSection: chosen.testSection })}
                autoFocus
              >
                Start the test
              </button>
              <button className="btn btn-ghost wide" onClick={() => onComplete({ dailyGoal: goal, testSection: null })}>
                Start from the beginning instead
              </button>
            </>
          )}
        </section>
      )}
    </div>
  );
}
