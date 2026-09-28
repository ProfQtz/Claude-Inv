type Cue = "correct" | "wrong" | "complete";

const NOTES: Record<Cue, { freq: number; at: number; dur: number }[]> = {
  correct: [
    { freq: 784, at: 0, dur: 0.12 },
    { freq: 1047, at: 0.09, dur: 0.18 },
  ],
  wrong: [
    { freq: 220, at: 0, dur: 0.16 },
    { freq: 196, at: 0.12, dur: 0.22 },
  ],
  complete: [
    { freq: 523, at: 0, dur: 0.14 },
    { freq: 659, at: 0.12, dur: 0.14 },
    { freq: 784, at: 0.24, dur: 0.14 },
    { freq: 1047, at: 0.36, dur: 0.35 },
  ],
};

let ctx: AudioContext | null = null;

/** Play a short synthesized cue. Silently does nothing where Web Audio is unavailable. */
export function playCue(cue: Cue) {
  try {
    ctx ??= new AudioContext();
    const start = ctx.currentTime + 0.01;
    for (const note of NOTES[cue]) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = cue === "wrong" ? "triangle" : "sine";
      osc.frequency.value = note.freq;
      gain.gain.setValueAtTime(0.0001, start + note.at);
      gain.gain.exponentialRampToValueAtTime(0.18, start + note.at + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + note.at + note.dur);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start + note.at);
      osc.stop(start + note.at + note.dur + 0.05);
    }
  } catch {
    // Audio is a nice-to-have.
  }
}
