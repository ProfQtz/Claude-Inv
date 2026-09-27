import { useCallback, useEffect, useState } from "react";
import { initialProgress, Progress, refillHearts } from "./progress";

const STORAGE_KEY = "pokerlingo.progress.v1";

function load(): Progress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...initialProgress(), ...JSON.parse(raw) };
  } catch {
    // Storage unavailable or corrupt: start fresh.
  }
  return initialProgress();
}

function save(p: Progress) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  } catch {
    // Ignore quota / privacy-mode errors; progress just won't persist.
  }
}

/** Current time, re-rendering every `intervalMs`. */
export function useNow(intervalMs = 15_000): number {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

export function useProgress() {
  const [progress, setProgress] = useState<Progress>(() => refillHearts(load()));
  const now = useNow();

  useEffect(() => {
    setProgress((p) => refillHearts(p, now));
  }, [now]);

  useEffect(() => save(progress), [progress]);

  const update = useCallback((fn: (p: Progress) => Progress) => setProgress((p) => fn(p)), []);
  const reset = useCallback(() => setProgress(initialProgress()), []);

  return { progress, update, reset, now };
}
