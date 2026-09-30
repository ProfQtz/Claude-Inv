import { useRef, useState } from "react";
import { drillRef, exerciseByRef, exerciseRef, findLesson } from "./course/course";
import { SECTIONS } from "./course/course";
import { dailyChallenge, type DrillKind, finalExam, generateDrill, generateMix, sectionTest } from "./course/generator";
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
  EXAM_LENGTH,
  EXAM_PASS,
  loseHeart,
  passedExam,
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
import { LibraryScreen, type LibraryView } from "./screens/LibraryScreen";
import { SpeedRoundScreen } from "./screens/SpeedRoundScreen";
import { OnboardingScreen } from "./screens/OnboardingScreen";
import { TestResultScreen } from "./screens/TestResultScreen";
import { ExamResultScreen, type SkillScore } from "./screens/ExamResultScreen";
import { PlayScreen, type PlaySummary } from "./screens/PlayScreen";
import type { PlanAction } from "./state/plan";

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
  /** The final exam. */
  exam?: boolean;
}

interface ExamOutcome {
  passed: boolean;
  correct: number;
  total: number;
  bySkill: SkillScore[];
  gems: number;
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
  const { progress, update, reset, replace, now } = useProgress();
  const [tab, setTab] = useState<Tab>("learn");
  const [session, setSession] = useState<ActiveSession | null>(null);
  const [completion, setCompletion] = useState<Completion | null>(null);
  const [speedRound, setSpeedRound] = useState(false);
  const [libraryView, setLibraryView] = useState<LibraryView | null>(null);
  const [testOutcome, setTestOutcome] = useState<TestOutcome | null>(null);
  const [examOutcome, setExamOutcome] = useState<ExamOutcome | null>(null);
  const [playing, setPlaying] = useState(false);
  const playStarted = useRef(0);
  /** Per-question results of the exam in progress, for the score by skill. */
  const examAnswers = useRef<{ skill: Skill; correct: boolean }[]>([]);

  function switchTab(next: Tab) {
    setTab(next);
    setLibraryView(null);
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

  function startExam() {
    examAnswers.current = [];
    setExamOutcome(null);
    setSession({ id: Date.now(), title: "Final exam", exercises: finalExam(), exam: true });
  }

  function finishExam(accuracy: number, total: number) {
    const result = { accuracy, title: "Final exam", exam: true };
    const { reward } = completeSession(progress, result);
    update((p) => completeSession(p, result).progress);
    const passed = passedExam(accuracy);
    if (progress.soundOn && passed) playCue("complete");
    const bySkill = new Map<Skill, SkillScore>();
    for (const { skill, correct } of examAnswers.current) {
      const s = bySkill.get(skill) ?? { skill, correct: 0, total: 0 };
      bySkill.set(skill, { skill, correct: s.correct + (correct ? 1 : 0), total: s.total + 1 });
    }
    setExamOutcome({ passed, correct: Math.round(accuracy * total), total, bySkill: [...bySkill.values()], gems: reward.gems });
    setTab("learn");
  }

  function startPlay() {
    playStarted.current = Date.now();
    setPlaying(true);
  }

  function finishPlay(summary: PlaySummary | null) {
    setPlaying(false);
    if (!summary) return;
    const checked = summary.good + summary.close + summary.mistakes;
    // Accuracy counts clear verdicts only; close calls go either way.
    const graded = summary.good + summary.mistakes;
    const accuracy = graded > 0 ? summary.good / graded : 1;
    // Close calls and mistakes feed accuracy; lifetime stats keep the rest.
    const { title, close: _close, mistakes: _mistakes, ...stats } = summary;
    const result = { accuracy, title, play: { ...stats, checked } };
    const { reward } = completeSession(progress, result);
    update((p) => completeSession(p, result).progress);
    if (progress.soundOn) playCue("complete");
    setCompletion({ title: summary.title, reward, accuracy, durationMs: Date.now() - playStarted.current });
  }

  function handlePlan(action: PlanAction) {
    if (action.kind === "lesson") startLesson(action.lessonId);
    else if (action.kind === "drill") startDrill(action.skill);
    else if (action.kind === "review") startReview();
    else if (action.kind === "daily") startDaily();
    else startExam();
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

  function finishSession(
    title: string,
    lessonId: string | undefined,
    accuracy: number,
    durationMs: number,
    daily = false,
    review = false,
  ) {
    const result = { lessonId, accuracy, title, daily, review };
    const { reward } = completeSession(progress, result);
    update((p) => completeSession(p, result).progress);
    if (progress.soundOn) playCue("complete");
    setCompletion({ title, reward, accuracy, durationMs });
  }

  function handleResult(active: ActiveSession, index: number, correct: boolean) {
    // Placement tests only decide where you start; they don't feed reviews or skills.
    if (active.testSection !== undefined) return;
    const exercise = active.exercises[index];
    if (active.exam && (exercise.type === "choice" || exercise.type === "compare") && exercise.skill) {
      examAnswers.current.push({ skill: exercise.skill, correct });
    }
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

  if (examOutcome) {
    return (
      <div className="app focus">
        <ExamResultScreen
          {...examOutcome}
          needed={Math.ceil(EXAM_LENGTH * EXAM_PASS)}
          onPractice={(skill) => {
            setExamOutcome(null);
            startDrill(skill);
          }}
          onRetry={startExam}
          onContinue={() => setExamOutcome(null)}
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

  if (playing) {
    return (
      <div className="app focus">
        <PlayScreen
          lifetime={progress.play}
          onExit={finishPlay}
          onMistakes={(questions) => update((p) => questions.reduce((q, e) => recordMistake(q, drillRef(e)), p))}
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
          mode={session.testSection !== undefined || session.exam ? "test" : "lesson"}
          gems={progress.gems}
          soundOn={progress.soundOn}
          onLoseHeart={() => update((p) => loseHeart(p))}
          onResult={(index, correct) => handleResult(session, index, correct)}
          onBuyRefill={() => update((p) => buyHeartRefill(p))}
          onQuit={() => setSession(null)}
          onFinish={({ accuracy, durationMs }) => {
            if (session.testSection !== undefined) finishTest(session.testSection, accuracy, session.exercises.length);
            else if (session.exam) finishExam(accuracy, session.exercises.length);
            else finishSession(session.title, session.lessonId, accuracy, durationMs, session.daily, session.review);
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
          <LearnScreen progress={progress} now={now} onStartLesson={startLesson} onTestOut={startTest} onPlan={handlePlan} />
        )}
        {tab === "practice" && (
          <PracticeScreen
            progress={progress}
            now={now}
            onStart={startDrill}
            onStartDaily={startDaily}
            onStartReview={startReview}
            onStartSpeed={() => setSpeedRound(true)}
            onOpenRanges={() => {
              setTab("library");
              setLibraryView("charts");
            }}
            onStartMix={startMix}
            onSetLength={(n) => update((p) => ({ ...p, drillLength: n }))}
            onStartPlay={startPlay}
          />
        )}
        {tab === "library" && <LibraryScreen view={libraryView} onView={setLibraryView} />}
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
            onRestore={replace}
          />
        )}
      </main>
      <RightRail progress={progress} now={now} onContinue={startLesson} />
      <BottomNav tab={tab} onTab={switchTab} />
    </div>
  );
}
