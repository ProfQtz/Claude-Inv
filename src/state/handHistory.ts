import { cardCode } from "../poker/cards";
import type { DecisionCheck, Verdict } from "../poker/coach";
import type { BotStyle, HandState, TableStreet } from "../poker/table";

/**
 * Recent practice-table hands, kept on this device only (their own storage key, so they
 * don't bloat progress saves or backup codes).
 */

export const HAND_HISTORY_KEY = "pokerlingo.hands.v1";
export const MAX_HANDS = 30;

export interface StoredAction {
  seat: number;
  street: TableStreet;
  kind: "fold" | "check" | "call" | "bet" | "raise";
  amount: number;
  to: number;
  allIn: boolean;
  /** Pot before the action. */
  pot: number;
}

export interface StoredHand {
  id: number;
  table: string;
  button: number;
  players: { name: string; human: boolean; style?: BotStyle; hole: string }[];
  board: string;
  actions: StoredAction[];
  won: number[];
  net: number[];
  showdown: boolean;
  hands: (string | null)[];
  review: { street: TableStreet; title: string; verdict: Verdict; detail: string }[];
}

type Storage = Pick<globalThis.Storage, "getItem" | "setItem" | "removeItem">;
const defaultStorage = (): Storage | undefined => (typeof localStorage === "undefined" ? undefined : localStorage);

/** A finished hand in its compact stored form. */
export function storedHand(state: HandState, table: string, review: DecisionCheck[], id = Date.now()): StoredHand {
  if (!state.result) throw new Error("Only finished hands can be stored");
  return {
    id,
    table,
    button: state.button,
    players: state.seats.map((s) => ({ name: s.name, human: s.human, style: s.style, hole: s.hole.map(cardCode).join(" ") })),
    board: state.board.map(cardCode).join(" "),
    actions: state.log.map((a) => ({
      seat: a.seat,
      street: a.street,
      kind: a.kind,
      amount: a.amount,
      to: a.to,
      allIn: a.allIn,
      pot: a.situation.pot,
    })),
    won: state.result.won,
    net: state.result.net,
    showdown: state.result.showdown,
    hands: state.result.hands,
    review: review.map((c) => ({ street: c.street, title: c.title, verdict: c.verdict, detail: c.detail })),
  };
}

const isHand = (h: unknown): h is StoredHand => {
  if (typeof h !== "object" || h === null) return false;
  const x = h as Record<string, unknown>;
  return (
    typeof x.id === "number" &&
    typeof x.table === "string" &&
    typeof x.board === "string" &&
    Array.isArray(x.players) &&
    Array.isArray(x.actions) &&
    Array.isArray(x.won) &&
    Array.isArray(x.net) &&
    Array.isArray(x.review)
  );
};

export function loadHands(storage: Storage | undefined = defaultStorage()): StoredHand[] {
  try {
    const raw = storage?.getItem(HAND_HISTORY_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter(isHand) : [];
  } catch {
    return [];
  }
}

/** Save a hand at the front of the history, keeping the most recent MAX_HANDS. */
export function saveHand(hand: StoredHand, storage: Storage | undefined = defaultStorage()): StoredHand[] {
  const hands = [hand, ...loadHands(storage).filter((h) => h.id !== hand.id)].slice(0, MAX_HANDS);
  try {
    storage?.setItem(HAND_HISTORY_KEY, JSON.stringify(hands));
  } catch {
    // Storage full or blocked: history just isn't kept.
  }
  return hands;
}

export function clearHands(storage: Storage | undefined = defaultStorage()) {
  try {
    storage?.removeItem(HAND_HISTORY_KEY);
  } catch {
    // Nothing to clear.
  }
}

/** Pot at the end of the hand (everything put in). */
export const finalPot = (hand: StoredHand) => hand.won.reduce((a, b) => a + b, 0);

