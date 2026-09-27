/**
 * Lesson session: exercises answered wrong go to the back of the queue and must be
 * answered correctly before the lesson ends, just like Duolingo.
 */
export interface Session {
  total: number;
  queue: number[];
  /** Exercises answered correctly (on any attempt). */
  solved: number;
  /** Exercise indexes that were missed at least once. */
  missed: number[];
  mistakes: number;
}

export function startSession(total: number): Session {
  return { total, queue: Array.from({ length: total }, (_, i) => i), solved: 0, missed: [], mistakes: 0 };
}

export function currentExercise(s: Session): number | undefined {
  return s.queue[0];
}

export function answer(s: Session, correct: boolean): Session {
  const [head, ...rest] = s.queue;
  if (head === undefined) return s;
  if (correct) return { ...s, queue: rest, solved: s.solved + 1 };
  return {
    ...s,
    queue: [...rest, head],
    missed: s.missed.includes(head) ? s.missed : [...s.missed, head],
    mistakes: s.mistakes + 1,
  };
}

export function isFinished(s: Session): boolean {
  return s.queue.length === 0;
}

export function sessionProgress(s: Session): number {
  return s.total === 0 ? 1 : s.solved / s.total;
}

/** Share of exercises answered right the first time. */
export function accuracy(s: Session): number {
  return s.total === 0 ? 1 : (s.total - s.missed.length) / s.total;
}
