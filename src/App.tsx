import { useState } from "react";
import { exerciseByRef, exerciseRef, findLesson } from "./course/course";
import { type DrillKind, generateDrill } from "./course/generator";
import type { Exercise } from "./course/types";
import { BottomNav, RightRail, Sidebar, type Tab, TopBar } from "./components/Shell";
import { playCue } from "./sound";
import {
  buyHeartRefill,
  buyStreakFreeze,
  clearMistake,
  completeSession,
  currentStreak,
  loseHeart,
  recordMistake,
  type Reward,
} from "./state/progress";
import { useProgress } from "./state/useProgress";
import { CompleteScreen } from "./screens/CompleteScreen";
import { LearnScreen } from "./screens/LearnScreen";
import { LessonScreen } from "./screens/LessonScreen";
import { DRILL_TITLES, PracticeScreen } from "./screens/PracticeScreen";
import { ProfileScreen } from "./screens/ProfileScreen";
import { ShopScreen } from "./screens/ShopScreen";

interface ActiveSession {
  id: number;
  title: string;
  exercises: Exercise[];
  /** Course lessons cost hearts and unlock the next lesson. */
  lessonId?: string;
  /** Course exercise refs, parallel to `exercises`, for lessons and reviews. */
  refs?: string[];
  review?: boolean;
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
    setSession({ id: Date.now(), title: DRILL_TITLES[kind], exercises: generateDrill(kind) });
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

  function handleResult(active: ActiveSession, index: number, correct: boolean) {
    const ref = active.refs?.[index];
    if (!ref) return;
    // Lessons remember misses; a correct answer in a review clears them.
    if (!correct) update((p) => recordMistake(p, ref));
    else if (active.review) update((p) => clearMistake(p, ref));
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

  if (session) {
    return (
      <div className="app focus">
        <LessonScreen
          key={session.id}
          title={session.title}
          exercises={session.exercises}
          hearts={session.lessonId ? progress.hearts : null}
          gems={progress.gems}
          soundOn={progress.soundOn}
          onLoseHeart={() => update((p) => loseHeart(p))}
          onResult={(index, correct) => handleResult(session, index, correct)}
          onBuyRefill={() => update((p) => buyHeartRefill(p))}
          onQuit={() => setSession(null)}
          onFinish={({ accuracy, durationMs }) => {
            const result = { lessonId: session.lessonId, accuracy };
            const { reward } = completeSession(progress, result);
            update((p) => completeSession(p, result).progress);
            if (progress.soundOn) playCue("complete");
            setCompletion({ title: session.title, reward, accuracy, durationMs });
            setSession(null);
          }}
        />
      </div>
    );
  }

  return (
    <div className="app shell">
      <Sidebar tab={tab} onTab={setTab} />
      <TopBar progress={progress} now={now} />
      <main className="content">
        {tab === "learn" && <LearnScreen progress={progress} now={now} onStartLesson={startLesson} />}
        {tab === "practice" && (
          <PracticeScreen progress={progress} onStart={startDrill} onStartReview={startReview} />
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
      <BottomNav tab={tab} onTab={setTab} />
    </div>
  );
}
