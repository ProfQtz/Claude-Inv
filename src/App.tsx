import { useState } from "react";
import { drillRef, exerciseByRef, exerciseRef, findLesson } from "./course/course";
import { SECTIONS } from "./course/course";
import { dailyChallenge, type DrillKind, generateDrill, generateMix, sectionTest } from "./course/generator";
import type { Exercise, Skill } from "./course/types";
import { BottomNav, RightRail, Sidebar, type Tab, TopBar } from "./components/Shell";
import { playCue } from "./sound";
import {
  applyTestOut,
  buyHeartRefill,
  buyStreakFreeze,
  clearMistake,
  completeSession,
  currentStreak,
  dayKey,
  loseHeart,
  recordMistake,
  recordSkill,
  recordSpeedRound,
  passedTest,
  type Reward,
  SECTION_TEST_LENGTH,
  SECTION_TEST_PASS,
} from "./state/progress";
import { useProgress } from "./state/useProgress";
import { CompleteScreen } from "./screens/CompleteScreen";
import { LearnScreen } from "./screens/LearnScreen";
import { LessonScreen } from "./screens/LessonScreen";
import { DRILL_TITLES, PracticeScreen } from "./screens/PracticeScreen";
import { ProfileScreen } from "./screens/ProfileScreen";
import { ShopScreen } from "./screens/ShopScreen";
import { RangesScreen } from "./screens/RangesScreen";
import { SpeedRoundScreen } from "./screens/SpeedRoundScreen";
import { OnboardingScreen } from "./screens/OnboardingScreen";
import { TestResultScreen } from "./screens/TestResultScreen";

interface ActiveSession {
  id: number;
  title: string;
  exercises: Exercise[];
  /** Course lessons cost hearts and unlock the next lesson. */
  lessonId?: string;
  /** Course exercise refs, parallel to `exercises`, for lessons and reviews. */
  refs?: string[];
  review?: boolean;
  daily?: boolean;
  /** A placement test that unlocks this section when passed. */
  testSection?: number;
}

interface TestOutcome {
  sectionIndex: number;
  passed: boolean;
  correct: number;
  total: number;
}

interface Completion {
  title: string;
  reward: Reward;
  accuracy: number;
  durationMs: number;
}

const REVIEW_SIZE = 8;

export default function App() {
  const { progress, update, reset, now } = useProgress();
  const [tab, setTab] = useState<Tab>("learn");
  const [session, setSession] = useState<ActiveSession | null>(null);
  const [completion, setCompletion] = useState<Completion | null>(null);
  const [speedRound, setSpeedRound] = useState(false);
  const [rangesOpen, setRangesOpen] = useState(false);
  const [testOutcome, setTestOutcome] = useState<TestOutcome | null>(null);

  function switchTab(next: Tab) {
    setTab(next);
    setRangesOpen(false);
  }

  function startLesson(lessonId: string) {
    const found = findLesson(lessonId);
    if (!found) return;
    const exercises = found.lesson.exercises;
    setSession({
      id: Date.now(),
      title: found.lesson.title,
      lessonId,
      exercises,
      refs: exercises.map((_, i) => exerciseRef(lessonId, i)),
    });
  }

  function startDrill(kind: DrillKind) {
    setSession({ id: Date.now(), title: DRILL_TITLES[kind], exercises: generateDrill(kind, progress.drillLength) });
  }

  function startMix(skills: Skill[]) {
    update((p) => ({ ...p, customMix: skills }));
    setSession({ id: Date.now(), title: "Custom Mix", exercises: generateMix(skills, progress.drillLength) });
  }

  function startDaily() {
    setSession({ id: Date.now(), title: "Daily Challenge", exercises: dailyChallenge(dayKey(Date.now())), daily: true });
  }

  function startTest(sectionIndex: number) {
    setTestOutcome(null);
    setSession({
      id: Date.now(),
      title: `Placement test: ${SECTIONS[sectionIndex].title}`,
      exercises: sectionTest(sectionIndex, SECTION_TEST_LENGTH),
      testSection: sectionIndex,
    });
  }

  function finishTest(sectionIndex: number, accuracy: number, total: number) {
    const passed = passedTest(accuracy);
    const result = { accuracy, title: "Placement test", test: true };
    update((p) => {
      const next = completeSession(p, result).progress;
      return passed ? applyTestOut(next, sectionIndex) : next;
    });
    if (progress.soundOn && passed) playCue("complete");
    setTestOutcome({ sectionIndex, passed, correct: Math.round(accuracy * total), total });
    setTab("learn");
  }

  function startReview() {
    const items = progress.reviewQueue
      .map((ref) => ({ ref, exercise: exerciseByRef(ref) }))
      .filter((i): i is { ref: string; exercise: Exercise } => i.exercise !== undefined)
      .slice(0, REVIEW_SIZE);
    if (items.length === 0) return;
    setSession({
      id: Date.now(),
      title: "Mistakes Review",
      exercises: items.map((i) => i.exercise),
      refs: items.map((i) => i.ref),
      review: true,
    });
  }

  function finishSession(title: string, lessonId: string | undefined, accuracy: number, durationMs: number, daily = false) {
    const result = { lessonId, accuracy, title, daily };
    const { reward } = completeSession(progress, result);
    update((p) => completeSession(p, result).progress);
    if (progress.soundOn) playCue("complete");
    setCompletion({ title, reward, accuracy, durationMs });
  }

  function handleResult(active: ActiveSession, index: number, correct: boolean) {
    // Placement tests only decide where you start; they don't feed reviews or skills.
    if (active.testSection !== undefined) return;
    const exercise = active.exercises[index];
    // Drill exercises feed the per-skill accuracy shown on the Practice tab.
    if ((exercise.type === "choice" || exercise.type === "compare") && exercise.skill) {
      const skill: Skill = exercise.skill;
      update((p) => recordSkill(p, skill, correct));
    }
    const ref = active.refs?.[index];
    if (!ref) {
      // Missed drill hands are saved whole so Review mistakes can deal them again.
      if (!correct && exercise.type !== "scenario") update((p) => recordMistake(p, drillRef(exercise)));
      return;
    }
    // Lessons remember misses; a correct answer in a review clears them.
    if (!correct) update((p) => recordMistake(p, ref));
    else if (active.review) update((p) => clearMistake(p, ref));
  }

  if (!progress.onboarded) {
    return (
      <div className="app focus">
        <OnboardingScreen
          onComplete={({ dailyGoal, testSection }) => {
            update((p) => ({ ...p, dailyGoal, onboarded: true }));
            if (testSection !== null) startTest(testSection);
          }}
        />
      </div>
    );
  }

  if (testOutcome) {
    return (
      <div className="app focus">
        <TestResultScreen
          {...testOutcome}
          needed={Math.ceil(testOutcome.total * SECTION_TEST_PASS)}
          sectionTitle={SECTIONS[testOutcome.sectionIndex].title}
          onContinue={() => setTestOutcome(null)}
          onRetry={() => startTest(testOutcome.sectionIndex)}
        />
      </div>
    );
  }

  if (completion) {
    return (
      <div className="app focus">
        <CompleteScreen
          {...completion}
          streak={currentStreak(progress, now)}
          onContinue={() => setCompletion(null)}
        />
      </div>
    );
  }

  if (speedRound) {
    return (
      <div className="app focus">
        <SpeedRoundScreen
          best={progress.speedBest}
          soundOn={progress.soundOn}
          onSkillResult={(skill, correct) => update((p) => recordSkill(p, skill, correct))}
          onRoundEnd={(score) => update((p) => recordSpeedRound(p, score))}
          onQuit={() => setSpeedRound(false)}
          onFinish={({ accuracy, durationMs }) => {
            finishSession("Speed Round", undefined, accuracy, durationMs);
            setSpeedRound(false);
          }}
        />
      </div>
    );
  }

  if (session) {
    return (
      <div className="app focus">
        <LessonScreen
          key={session.id}
          title={session.title}
          exercises={session.exercises}
          hearts={session.lessonId ? progress.hearts : null}
          mode={session.testSection !== undefined ? "test" : "lesson"}
          gems={progress.gems}
          soundOn={progress.soundOn}
          onLoseHeart={() => update((p) => loseHeart(p))}
          onResult={(index, correct) => handleResult(session, index, correct)}
          onBuyRefill={() => update((p) => buyHeartRefill(p))}
          onQuit={() => setSession(null)}
          onFinish={({ accuracy, durationMs }) => {
            if (session.testSection !== undefined) finishTest(session.testSection, accuracy, session.exercises.length);
            else finishSession(session.title, session.lessonId, accuracy, durationMs, session.daily);
            setSession(null);
          }}
        />
      </div>
    );
  }

  return (
    <div className="app shell">
      <Sidebar tab={tab} onTab={switchTab} />
      <TopBar progress={progress} now={now} />
      <main className="content">
        {tab === "learn" && (
          <LearnScreen progress={progress} now={now} onStartLesson={startLesson} onTestOut={startTest} />
        )}
        {tab === "practice" && (
          rangesOpen ? (
            <RangesScreen onBack={() => setRangesOpen(false)} />
          ) : (
            <PracticeScreen
              progress={progress}
              now={now}
              onStart={startDrill}
              onStartDaily={startDaily}
              onStartReview={startReview}
              onStartSpeed={() => setSpeedRound(true)}
              onOpenRanges={() => setRangesOpen(true)}
              onStartMix={startMix}
              onSetLength={(n) => update((p) => ({ ...p, drillLength: n }))}
            />
          )
        )}
        {tab === "shop" && (
          <ShopScreen
            progress={progress}
            onBuyFreeze={() => update(buyStreakFreeze)}
            onBuyRefill={() => update((p) => buyHeartRefill(p))}
          />
        )}
        {tab === "profile" && (
          <ProfileScreen
            progress={progress}
            now={now}
            onSetGoal={(xp) => update((p) => ({ ...p, dailyGoal: xp }))}
            onToggleSound={() => update((p) => ({ ...p, soundOn: !p.soundOn }))}
            onReset={reset}
          />
        )}
      </main>
      <RightRail progress={progress} now={now} onContinue={startLesson} />
      <BottomNav tab={tab} onTab={switchTab} />
    </div>
  );
}
