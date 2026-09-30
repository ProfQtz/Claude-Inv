import { describe, expect, it } from "vitest";
import { seededRandom } from "../course/generator";
import { chooseBotAction } from "../poker/bots";
import { reviewHand } from "../poker/coach";
import { act, type HandState, newHand, situation } from "../poker/table";
import { clearHands, finalPot, HAND_HISTORY_KEY, loadHands, MAX_HANDS, saveHand, storedHand } from "./handHistory";

function memoryStorage() {
  const data = new Map<string, string>();
  return {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
    removeItem: (k: string) => void data.delete(k),
    data,
  };
}

function playedHand(seed: string): HandState {
  const random = seededRandom(seed);
  let s = newHand(
    [
      { name: "You", human: true, style: "regular" },
      { name: "Max", human: false, style: "maniac" },
    ],
    0,
    1,
    random,
  );
  while (s.toAct !== null) {
    const seat = s.seats[s.toAct];
    const c = chooseBotAction(seat.style!, situation(s), seat.hole, random);
    s = act(s, c.action, c.label);
  }
  return s;
}

describe("hand history", () => {
  it("stores a finished hand compactly and loads it back", () => {
    const storage = memoryStorage();
    const s = playedHand("history");
    const hand = storedHand(s, "Heads-up vs the Maniac", reviewHand(s, 0, seededRandom("r")), 42);
    saveHand(hand, storage);
    const [loaded] = loadHands(storage);
    expect(loaded).toEqual(hand);
    expect(loaded.players.map((p) => p.hole.split(" ").length)).toEqual([2, 2]);
    expect(loaded.actions).toHaveLength(s.log.length);
    expect(finalPot(loaded)).toBe(s.seats.reduce((sum, seat) => sum + seat.total, 0));
    // Small enough that 30 hands fit easily in local storage.
    expect(storage.data.get(HAND_HISTORY_KEY)!.length).toBeLessThan(8000);
  });

  it("keeps the most recent hands first, up to the limit", () => {
    const storage = memoryStorage();
    const s = playedHand("many");
    for (let i = 0; i < MAX_HANDS + 5; i++) saveHand(storedHand(s, "t", [], i), storage);
    const hands = loadHands(storage);
    expect(hands).toHaveLength(MAX_HANDS);
    expect(hands[0].id).toBe(MAX_HANDS + 4);
  });

  it("ignores corrupt data and can be cleared", () => {
    const storage = memoryStorage();
    storage.setItem(HAND_HISTORY_KEY, "{not json");
    expect(loadHands(storage)).toEqual([]);
    storage.setItem(HAND_HISTORY_KEY, JSON.stringify([{ id: 1 }, 7]));
    expect(loadHands(storage)).toEqual([]);
    saveHand(storedHand(playedHand("clear"), "t", [], 1), storage);
    clearHands(storage);
    expect(loadHands(storage)).toEqual([]);
  });

  it("refuses unfinished hands", () => {
    const s = newHand(
      [
        { name: "You", human: true },
        { name: "Max", human: false, style: "maniac" },
      ],
      0,
      1,
      seededRandom("open"),
    );
    expect(() => storedHand(s, "t", [])).toThrow();
  });
});
