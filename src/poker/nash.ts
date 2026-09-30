import { blockerWeights, CLASS_INDEX, classCombos, decodeEquities, HAND_CLASSES } from "./preflop";
import { PREFLOP_EQUITY } from "./preflopEquity";

/**
 * Heads-up push/fold equilibrium solver.
 *
 * The small blind (0.5 BB) either shoves its whole stack or folds; facing a shove the big
 * blind (1 BB) calls or folds. Stacks are effective, in big blinds, after any ante. This
 * two-player zero-sum game is solved with fictitious play: each side repeatedly best-responds
 * to the other's average strategy, and the averages converge to the Nash equilibrium.
 */

const N = HAND_CLASSES.length;
let equity: Float32Array | null = null;
let weights: Float32Array | null = null;

function tables() {
  equity ??= decodeEquities(PREFLOP_EQUITY);
  weights ??= blockerWeights();
  return { E: equity, W: weights };
}

export interface PushFoldSolution {
  stack: number;
  ante: number;
  /** Small blind shove frequency per class, 0..1, in HAND_CLASSES order. */
  push: Float32Array;
  /** Big blind call frequency per class facing a shove. */
  call: Float32Array;
  /** EV of shoving minus EV of folding, in big blinds, per small-blind class. */
  pushMargin: Float32Array;
  /** EV of calling minus EV of folding, in big blinds, per big-blind class. */
  callMargin: Float32Array;
  /** Share of all 1,326 combos the small blind shoves / the big blind calls. */
  pushPercent: number;
  callPercent: number;
}

const COMBO_COUNT = HAND_CLASSES.map((l) => classCombos(l).length);

function comboShare(freq: Float32Array): number {
  let total = 0;
  for (let i = 0; i < N; i++) total += freq[i] * COMBO_COUNT[i];
  return total / 1326;
}

/** EV margins for both players against the given strategies. */
function margins(push: Float32Array, call: Float32Array, stack: number, ante: number) {
  const { E, W } = tables();
  const showdownPot = 2 * stack + 2 * ante;
  const pushMargin = new Float32Array(N);
  const callMargin = new Float32Array(N);

  for (let i = 0; i < N; i++) {
    // Small blind shoving class i: BB folds (SB wins the blind and antes) or calls (showdown).
    let ev = 0;
    let total = 0;
    for (let j = 0; j < N; j++) {
      const w = W[i * N + j];
      if (!w) continue;
      const c = call[j];
      ev += w * ((1 - c) * (1 + ante) + c * (E[i * N + j] * showdownPot - stack - ante));
      total += w;
    }
    // Folding the small blind loses the 0.5 posted and the ante.
    pushMargin[i] = ev / total - (-0.5 - ante);
  }

  for (let j = 0; j < N; j++) {
    // Big blind with class j facing a shove: weight each small-blind class by how often it shoves.
    let ev = 0;
    let total = 0;
    for (let i = 0; i < N; i++) {
      const w = W[j * N + i] * push[i];
      if (!w) continue;
      ev += w * (E[j * N + i] * showdownPot - stack - ante);
      total += w;
    }
    const callEv = total > 0 ? ev / total : -stack;
    callMargin[j] = callEv - (-1 - ante);
  }
  return { pushMargin, callMargin };
}

const cache = new Map<string, PushFoldSolution>();

export function solvePushFold(stack: number, ante = 0, iterations = 600): PushFoldSolution {
  const key = `${stack}/${ante}/${iterations}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const push = new Float32Array(N).fill(1);
  const call = new Float32Array(N).fill(0.5);
  for (let t = 1; t <= iterations; t++) {
    const { pushMargin, callMargin } = margins(push, call, stack, ante);
    // Blend each best response into the running average (fictitious play).
    const step = 1 / (t + 1);
    for (let k = 0; k < N; k++) {
      push[k] += step * ((pushMargin[k] > 0 ? 1 : 0) - push[k]);
      call[k] += step * ((callMargin[k] > 0 ? 1 : 0) - call[k]);
    }
  }

  // Snap near-pure frequencies so charts show clean pure actions.
  const clean = (f: Float32Array) => f.map((v) => (v > 0.97 ? 1 : v < 0.03 ? 0 : v));
  const finalPush = clean(push);
  const finalCall = clean(call);
  const { pushMargin, callMargin } = margins(finalPush, finalCall, stack, ante);
  const solution: PushFoldSolution = {
    stack,
    ante,
    push: finalPush,
    call: finalCall,
    pushMargin,
    callMargin,
    pushPercent: comboShare(finalPush),
    callPercent: comboShare(finalCall),
  };
  cache.set(key, solution);
  return solution;
}

export type Seat = "SB" | "BB";

export interface Recommendation {
  hand: string;
  seat: Seat;
  action: "Shove" | "Fold" | "Call";
  /** How often equilibrium takes the aggressive action (shove or call), 0..1. */
  frequency: number;
  /** EV of the aggressive action minus folding, in big blinds. */
  margin: number;
}

/** The equilibrium play for one hand, with its EV edge over folding. */
export function recommend(solution: PushFoldSolution, hand: string, seat: Seat): Recommendation {
  const i = CLASS_INDEX.get(hand);
  if (i === undefined) throw new Error(`Unknown hand class: ${hand}`);
  const frequency = seat === "SB" ? solution.push[i] : solution.call[i];
  const margin = seat === "SB" ? solution.pushMargin[i] : solution.callMargin[i];
  const aggressive = seat === "SB" ? "Shove" : "Call";
  return { hand, seat, action: frequency >= 0.5 ? aggressive : "Fold", frequency, margin };
}

/** All-in equity of a class against a range given as per-class frequencies, with card removal. */
export function rangeEquity(hero: string, villainFreq: Float32Array): number | null {
  const { E, W } = tables();
  const i = CLASS_INDEX.get(hero)!;
  let eq = 0;
  let total = 0;
  for (let j = 0; j < N; j++) {
    const w = W[i * N + j] * villainFreq[j];
    eq += w * E[i * N + j];
    total += w;
  }
  return total > 0 ? eq / total : null;
}

/** Preflop all-in equity of one class against another (from the precomputed table). */
export function classEquity(hero: string, villain: string): number {
  const { E } = tables();
  return E[CLASS_INDEX.get(hero)! * N + CLASS_INDEX.get(villain)!];
}
