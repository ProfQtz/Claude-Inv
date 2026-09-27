import { useState } from "react";
import { findLesson } from "./course/course";
import { type DrillKind, generateDrill } from "./course/generator";
import type { Exercise } from "./course/types";
import { TopBar } from "./components/TopBar";
import { buyHeartRefill, completeSession, currentStreak, loseHeart, type Reward } from "./state/progress";
import { useProgress } from "./state/useProgress";
import { CompleteScreen } from "./screens/CompleteScreen";
import { LearnScreen } from "./screens/LearnScreen";
import { LessonScreen } from "./screens/LessonScreen";
import { DRILL_TITLES, PracticeScreen } from "./screens/PracticeScreen";
import { ProfileScreen } from "./screens/ProfileScreen";

type Tab = "learn" | "practice" | "profile";

interface ActiveSession {
  id: number;
  title: string;
  lessonId?: string;
  exercises: Exercise[];
}

interface Completion {
  title: string;
  reward: Reward;
  accuracy: number;
  durationMs: number;
}

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "learn", label: "Learn", icon: "🏠" },
  { id: "practice", label: "Practice", icon: "🎯" },
  { id: "profile", label: "Profile", icon: "👤" },
];

export default function App() {
  const { progress, update, reset, now } = useProgress();
  const [tab, setTab] = useState<Tab>("learn");
  const [session, setSession] = useState<ActiveSession | null>(null);
  const [completion, setCompletion] = useState<Completion | null>(null);

  function startLesson(lessonId: string) {
    const found = findLesson(lessonId);
    if (!found) return;
    setSession({ id: Date.now(), title: found.lesson.title, lessonId, exercises: found.lesson.exercises });
  }

  function startDrill(kind: DrillKind) {
    setSession({ id: Date.now(), title: DRILL_TITLES[kind], exercises: generateDrill(kind) });
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
          onLoseHeart={() => update((p) => loseHeart(p))}
          onBuyRefill={() => update((p) => buyHeartRefill(p))}
          onQuit={() => setSession(null)}
          onFinish={({ accuracy, durationMs }) => {
            const { progress: next, reward } = completeSession(progress, { lessonId: session.lessonId, accuracy });
            update(() => next);
            setCompletion({ title: session.title, reward, accuracy, durationMs });
            setSession(null);
          }}
        />
      </div>
    );
  }

  return (
    <div className="app">
      <TopBar progress={progress} now={now} />
      <main className="content">
        {tab === "learn" && <LearnScreen progress={progress} now={now} onStartLesson={startLesson} />}
        {tab === "practice" && <PracticeScreen progress={progress} onStart={startDrill} />}
        {tab === "profile" && (
          <ProfileScreen
            progress={progress}
            now={now}
            onSetGoal={(xp) => update((p) => ({ ...p, dailyGoal: xp }))}
            onReset={reset}
          />
        )}
      </main>
      <nav className="bottom-nav">
        {TABS.map((t) => (
          <button key={t.id} className={tab === t.id ? "active" : ""} onClick={() => setTab(t.id)}>
            <span className="nav-icon">{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
