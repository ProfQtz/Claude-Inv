import { type Card, fullDeck, shuffle } from "./cards";
import { describeHand, evaluate, score7 } from "./evaluator";

/**
 * A no-limit hold'em table for practice hands. Amounts are integer chips with
 * 10 chips to the big blind, so bets can be sized in tenths of a big blind.
 * Every function returns a new state; nothing is mutated in place.
 */

export const BB = 10;
export const SB = 5;
export const START_STACK = 100 * BB;

export type TableStreet = "preflop" | "flop" | "turn" | "river";
export type BotStyle = "nit" | "station" | "maniac" | "regular";

export interface PlayerConfig {
  name: string;
  human: boolean;
  style?: BotStyle;
}

export interface Seat extends PlayerConfig {
  stack: number;
  hole: Card[];
  folded: boolean;
  allIn: boolean;
  /** Chips put in on this street. */
  bet: number;
  /** Chips put in this hand. */
  total: number;
  /** Has acted since the last full raise on this street. */
  acted: boolean;
  /** False after facing only an incomplete all-in raise, which doesn't reopen the betting. */
  mayRaise: boolean;
}

export type TableAction =
  | { kind: "fold" }
  | { kind: "check" }
  | { kind: "call" }
  | { kind: "bet"; to: number }
  | { kind: "raise"; to: number };

/** Everything a player can see when acting, except their own cards. */
export interface Situation {
  street: TableStreet;
  board: Card[];
  /** Chips in the pot before this action, including bets on this street. */
  pot: number;
  toCall: number;
  currentBet: number;
  ownBet: number;
  stack: number;
  /** Bets and raises so far on this street (the blinds don't count). */
  raises: number;
  /** Preflop: players who called the big blind before any raise. */
  limpers: number;
  /** Players who called the current bet or raise. */
  callers: number;
  /** Live opponents. */
  opponents: number;
  players: number;
  position: string;
  /** Position of the player who made the current bet or raise. */
  raiserPosition: string | null;
  /** Acts last on this street among players who can still act. */
  lastToAct: boolean;
  /** Made the last bet or raise on the previous street. */
  aggressor: boolean;
  canBet: boolean;
  canRaise: boolean;
  /** Smallest legal bet or raise, as the player's total bet on this street. */
  minTo: number;
  /** All-in, as the player's total bet on this street. */
  maxTo: number;
}

export interface ActionRecord {
  seat: number;
  street: TableStreet;
  kind: TableAction["kind"];
  /** Chips added to the pot. */
  amount: number;
  /** The player's bet on this street after the action. */
  to: number;
  allIn: boolean;
  /** A bot's policy label, used to rebuild its range. */
  label?: string;
  situation: Situation;
}

export interface PotResult {
  amount: number;
  eligible: number[];
  winners: number[];
}

export interface HandResult {
  /** Chips each seat takes from the pot. */
  won: number[];
  /** Chips won minus chips put in, per seat. */
  net: number[];
  pots: PotResult[];
  showdown: boolean;
  /** Hand names for the seats that showed down. */
  hands: (string | null)[];
}

export interface HandState {
  handNo: number;
  seats: Seat[];
  button: number;
  deck: Card[];
  board: Card[];
  street: TableStreet;
  /** Seat to act, or null once the hand is over. */
  toAct: number | null;
  currentBet: number;
  /** Size of the last full raise on this street: the minimum raise increment. */
  lastRaise: number;
  /** Last player to bet or raise on this street. */
  aggressor: number | null;
  /** Last player to bet or raise on the previous street. */
  previousAggressor: number | null;
  log: ActionRecord[];
  result: HandResult | null;
}

const NEXT_STREET: Record<TableStreet, TableStreet | null> = { preflop: "flop", flop: "turn", turn: "river", river: null };
const BOARD_SIZE: Record<TableStreet, number> = { preflop: 0, flop: 3, turn: 4, river: 5 };

/** Position name for a seat: BTN, SB, BB, then UTG, HJ, CO. Heads-up the button is also the small blind. */
export function seatLabel(players: number, button: number, seat: number): string {
  const offset = (seat - button + players) % players;
  if (players === 2) return offset === 0 ? "BTN" : "BB";
  if (offset < 3) return ["BTN", "SB", "BB"][offset];
  const middle = ["UTG", "HJ", "CO"].slice(3 - (players - 3));
  return middle[offset - 3] ?? `MP${offset - 2}`;
}

export function blindSeats(players: number, button: number): { sb: number; bb: number } {
  if (players === 2) return { sb: button, bb: (button + 1) % 2 };
  return { sb: (button + 1) % players, bb: (button + 2) % players };
}

const clone = (s: HandState): HandState => ({
  ...s,
  seats: s.seats.map((seat) => ({ ...seat, hole: [...seat.hole] })),
  deck: [...s.deck],
  board: [...s.board],
  log: [...s.log],
});

export const potSize = (s: HandState) => s.seats.reduce((sum, seat) => sum + seat.total, 0);

/** Seats in acting order starting after `from`, filtered. */
function orderFrom(s: HandState, from: number, keep: (seat: Seat) => boolean): number[] {
  const n = s.seats.length;
  const out: number[] = [];
  for (let k = 1; k <= n; k++) {
    const i = (from + k) % n;
    if (keep(s.seats[i])) out.push(i);
  }
  return out;
}

const canAct = (seat: Seat) => !seat.folded && !seat.allIn;

function put(seat: Seat, chips: number) {
  const amount = Math.min(chips, seat.stack);
  seat.stack -= amount;
  seat.bet += amount;
  seat.total += amount;
  if (seat.stack === 0) seat.allIn = true;
  return amount;
}

/** Deal a new hand: shuffle, deal hole cards, post the blinds. Everyone starts with `stack` chips. */
export function newHand(
  players: PlayerConfig[],
  button: number,
  handNo: number,
  random: () => number = Math.random,
  stack = START_STACK,
): HandState {
  if (players.length < 2) throw new Error("A hand needs at least two players");
  const deck = shuffle(fullDeck(), random);
  const seats: Seat[] = players.map((p) => ({
    ...p,
    stack,
    hole: [deck.pop()!, deck.pop()!],
    folded: false,
    allIn: false,
    bet: 0,
    total: 0,
    acted: false,
    mayRaise: true,
  }));
  const n = players.length;
  const { sb, bb } = blindSeats(n, button);
  put(seats[sb], SB);
  put(seats[bb], BB);
  const state: HandState = {
    handNo,
    seats,
    button,
    deck,
    board: [],
    street: "preflop",
    toAct: null,
    currentBet: BB,
    lastRaise: BB,
    aggressor: null,
    previousAggressor: null,
    log: [],
    result: null,
  };
  const first = n === 2 ? button : (bb + 1) % n;
  const order = [first, ...orderFrom(state, first, () => true)].filter((i) => canAct(seats[i]));
  state.toAct = order[0] ?? null;
  return state.toAct === null ? advance(state) : state;
}

export interface Legal {
  toCall: number;
  canCheck: boolean;
  canCall: boolean;
  canFold: boolean;
  canBet: boolean;
  canRaise: boolean;
  minTo: number;
  maxTo: number;
}

export function legalActions(s: HandState): Legal {
  if (s.toAct === null) throw new Error("No one is to act");
  const seat = s.seats[s.toAct];
  const owed = s.currentBet - seat.bet;
  const toCall = Math.min(owed, seat.stack);
  const maxTo = seat.bet + seat.stack;
  const canBet = s.currentBet === 0 && seat.stack > 0;
  const canRaise = s.currentBet > 0 && seat.stack > owed && seat.mayRaise;
  const minTo = canBet ? Math.min(BB, maxTo) : Math.min(s.currentBet + s.lastRaise, maxTo);
  return { toCall, canCheck: owed <= 0, canCall: owed > 0, canFold: owed > 0, canBet, canRaise, minTo, maxTo };
}

/** The public situation for the seat to act. */
export function situation(s: HandState): Situation {
  const seatIndex = s.toAct!;
  const seat = s.seats[seatIndex];
  const legal = legalActions(s);
  const n = s.seats.length;
  const street = s.log.filter((a) => a.street === s.street);
  const raises = street.filter((a) => a.kind === "bet" || a.kind === "raise").length;
  const lastRaiseIndex = street.map((a) => a.kind === "bet" || a.kind === "raise").lastIndexOf(true);
  const callers = street.slice(lastRaiseIndex + 1).filter((a) => a.kind === "call").length;
  const limpers = s.street === "preflop" && raises === 0 ? street.filter((a) => a.kind === "call").length : 0;
  // Postflop order starts left of the button; preflop it ends with the big blind (or the button heads-up).
  const start = s.street === "preflop" ? (n === 2 ? (s.button + 1) % n : blindSeats(n, s.button).bb) : s.button;
  const order = orderFrom(s, start, canAct);
  return {
    street: s.street,
    board: [...s.board],
    pot: potSize(s),
    toCall: legal.toCall,
    currentBet: s.currentBet,
    ownBet: seat.bet,
    stack: seat.stack,
    raises,
    limpers,
    callers,
    opponents: s.seats.filter((o, i) => i !== seatIndex && !o.folded).length,
    players: n,
    position: seatLabel(n, s.button, seatIndex),
    raiserPosition: s.aggressor === null ? null : seatLabel(n, s.button, s.aggressor),
    lastToAct: order[order.length - 1] === seatIndex,
    aggressor: s.previousAggressor === seatIndex,
    canBet: legal.canBet,
    canRaise: legal.canRaise,
    minTo: legal.minTo,
    maxTo: legal.maxTo,
  };
}

/** Apply the action of the seat to act. Throws on an illegal action. */
export function act(state: HandState, action: TableAction, label?: string): HandState {
  if (state.toAct === null || state.result) throw new Error("The hand is over");
  const legal = legalActions(state);
  const sit = situation(state);
  const s = clone(state);
  const i = s.toAct!;
  const seat = s.seats[i];
  let amount = 0;

  switch (action.kind) {
    case "fold":
      if (!legal.canFold) throw new Error("Can't fold when you can check");
      seat.folded = true;
      break;
    case "check":
      if (!legal.canCheck) throw new Error("Can't check facing a bet");
      break;
    case "call":
      if (!legal.canCall) throw new Error("Nothing to call");
      amount = put(seat, legal.toCall);
      break;
    case "bet":
    case "raise": {
      const allowed = action.kind === "bet" ? legal.canBet : legal.canRaise;
      if (!allowed) throw new Error(`Can't ${action.kind} now`);
      const to = Math.round(action.to);
      if (to > legal.maxTo || (to < legal.minTo && to !== legal.maxTo)) {
        throw new Error(`${action.kind} to ${to} is outside ${legal.minTo}–${legal.maxTo}`);
      }
      amount = put(seat, to - seat.bet);
      const increment = seat.bet - s.currentBet;
      const full = increment >= s.lastRaise;
      if (full) s.lastRaise = increment;
      s.currentBet = seat.bet;
      s.aggressor = i;
      // A full raise reopens the betting; an incomplete all-in only asks the others to call.
      for (const [j, other] of s.seats.entries()) {
        if (j === i || !canAct(other)) continue;
        if (full) other.mayRaise = true;
        else if (other.acted) other.mayRaise = false;
        other.acted = false;
      }
      break;
    }
  }
  seat.acted = true;
  s.log.push({ seat: i, street: s.street, kind: action.kind, amount, to: seat.bet, allIn: seat.allIn, label, situation: sit });
  return advance(s);
}

/** Move to the next player, the next street, or the end of the hand. */
function advance(s: HandState): HandState {
  const live = s.seats.filter((seat) => !seat.folded);
  if (live.length === 1) return finish(s, false);

  const from = s.toAct ?? s.button;
  const pending = orderFrom(s, from, (seat) => canAct(seat) && (!seat.acted || seat.bet < s.currentBet));
  if (pending.length > 0) {
    s.toAct = pending[0];
    return s;
  }
  return nextStreet(s);
}

function nextStreet(s: HandState): HandState {
  const next = NEXT_STREET[s.street];
  if (next === null) return finish(s, true);
  s.street = next;
  while (s.board.length < BOARD_SIZE[next]) s.board.push(s.deck.pop()!);
  for (const seat of s.seats) {
    seat.bet = 0;
    seat.acted = false;
    seat.mayRaise = true;
  }
  s.currentBet = 0;
  s.lastRaise = BB;
  s.previousAggressor = s.aggressor;
  s.aggressor = null;
  const actors = orderFrom(s, s.button, canAct);
  // With one or no players able to act, deal the rest of the board without betting.
  if (actors.length < 2) {
    s.toAct = null;
    return nextStreet(s);
  }
  s.toAct = actors[0];
  return s;
}

/** Split contributions into a main pot and side pots, each with the live seats eligible to win it. */
export function buildPots(seats: Seat[]): { amount: number; eligible: number[] }[] {
  const levels = [...new Set(seats.filter((s) => !s.folded).map((s) => s.total))].sort((a, b) => a - b);
  const pots: { amount: number; eligible: number[] }[] = [];
  let previous = 0;
  for (const level of levels) {
    const amount = seats.reduce((sum, s) => sum + Math.max(0, Math.min(s.total, level) - previous), 0);
    const eligible = seats.flatMap((s, i) => (!s.folded && s.total >= level ? [i] : []));
    if (amount > 0) {
      const last = pots[pots.length - 1];
      if (last && last.eligible.length === eligible.length) last.amount += amount;
      else pots.push({ amount, eligible });
    }
    previous = level;
  }
  // Folded players' chips above the highest live contribution still belong to the pot.
  const counted = pots.reduce((sum, p) => sum + p.amount, 0);
  const total = seats.reduce((sum, s) => sum + s.total, 0);
  if (total > counted && pots.length) pots[pots.length - 1].amount += total - counted;
  return pots;
}

function finish(s: HandState, showdown: boolean): HandState {
  s.toAct = null;
  const n = s.seats.length;
  const won = new Array<number>(n).fill(0);
  const hands: (string | null)[] = new Array(n).fill(null);
  const pots: PotResult[] = [];
  if (!showdown) {
    const winner = s.seats.findIndex((seat) => !seat.folded);
    won[winner] = potSize(s);
    pots.push({ amount: won[winner], eligible: [winner], winners: [winner] });
  } else {
    while (s.board.length < 5) s.board.push(s.deck.pop()!);
    const scores = s.seats.map((seat) => (seat.folded ? -1 : score7([...seat.hole, ...s.board])));
    s.seats.forEach((seat, i) => {
      if (!seat.folded) hands[i] = describeHand(evaluate([...seat.hole, ...s.board]));
    });
    for (const pot of buildPots(s.seats)) {
      const best = Math.max(...pot.eligible.map((i) => scores[i]));
      // Odd chips go to the first winners left of the button.
      const winners = orderFrom(s, s.button, () => true).filter((i) => pot.eligible.includes(i) && scores[i] === best);
      const share = Math.floor(pot.amount / winners.length);
      winners.forEach((w, k) => (won[w] += share + (k < pot.amount - share * winners.length ? 1 : 0)));
      pots.push({ ...pot, winners });
    }
  }
  s.result = { won, net: s.seats.map((seat, i) => won[i] - seat.total), pots, showdown, hands };
  return s;
}

export const chipsToBB = (chips: number) => chips / BB;

/** Chips as big blinds for display: "2.5 BB", "100 BB". */
export function formatBB(chips: number): string {
  const bb = Math.round((chips / BB) * 10) / 10;
  return `${Number.isInteger(bb) ? bb : bb.toFixed(1)} BB`;
}
