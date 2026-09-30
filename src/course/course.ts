import { POSTFLOP_UNIT, TOURNAMENT_UNIT } from "./advanced";
import { ADVANCED_UNITS } from "./expert";
import type { Exercise, Unit } from "./types";

const RANKING_ORDER = [
  "Royal Flush",
  "Straight Flush",
  "Four of a Kind",
  "Full House",
  "Flush",
  "Straight",
  "Three of a Kind",
  "Two Pair",
  "One Pair",
  "High Card",
];

const CATEGORY_OPTIONS = ["Flush", "Straight", "Full House", "Two Pair"];

export const COURSE: Unit[] = [
  {
    id: "basics",
    title: "Card Basics",
    description: "Meet the deck: suits, ranks and how cards compare.",
    color: "#0e7c58",
    icon: "spade",
    guidebook: [
      {
        heading: "The deck",
        body: "Poker uses a standard 52-card deck: 13 ranks in each of 4 suits — spades ♠, hearts ♥, diamonds ♦ and clubs ♣.",
      },
      {
        heading: "Ranks",
        body: "From low to high: 2, 3, 4, 5, 6, 7, 8, 9, 10 (T), Jack, Queen, King, Ace. The Ace is the highest card, but it can also play low in the straight A-2-3-4-5.",
      },
      {
        heading: "Suits are equal",
        body: "In Texas Hold'em no suit beats another. Suits only matter for making flushes.",
      },
    ],
    lessons: [
      {
        id: "basics-1",
        title: "The Deck",
        exercises: [
          {
            type: "choice",
            prompt: "How many cards are in a standard poker deck?",
            options: ["48", "52", "54", "56"],
            answer: 1,
            explanation: "A standard deck has 52 cards: 13 ranks × 4 suits. Jokers are not used.",
          },
          {
            type: "choice",
            prompt: "How many different suits are there?",
            options: ["2", "3", "4", "5"],
            answer: 2,
            explanation: "Four suits: spades, hearts, diamonds and clubs.",
          },
          {
            type: "match",
            prompt: "Match each symbol to its suit",
            pairs: [
              ["♠", "Spades"],
              ["♥", "Hearts"],
              ["♦", "Diamonds"],
              ["♣", "Clubs"],
            ],
          },
          {
            type: "choice",
            prompt: "How many cards of each suit are in the deck?",
            options: ["10", "12", "13", "14"],
            answer: 2,
            explanation: "Each suit has 13 cards, from 2 up to the Ace.",
          },
          {
            type: "choice",
            prompt: "Which suit is the strongest in Texas Hold'em?",
            options: ["Spades", "Hearts", "They are all equal", "Clubs"],
            answer: 2,
            explanation: "Suits have no ranking in Hold'em. Two identical hands in different suits split the pot.",
          },
        ],
      },
      {
        id: "basics-2",
        title: "Ranks",
        exercises: [
          {
            type: "order",
            prompt: "Put these cards in order from highest to lowest",
            items: ["Ace", "King", "Queen", "Jack", "Ten"],
            explanation: "Ace is highest, then King, Queen, Jack and Ten.",
          },
          {
            type: "choice",
            prompt: "What does the letter T stand for on a card like Ts?",
            options: ["Three", "Ten", "Trey", "Top"],
            answer: 1,
            explanation: "T is shorthand for Ten, so every rank fits in one character: Ts = Ten of spades.",
          },
          {
            type: "choice",
            prompt: "Which card is higher?",
            hand: "Kh Qs",
            options: ["King of hearts", "Queen of spades", "They are equal"],
            answer: 0,
            explanation: "King outranks Queen. The suit doesn't matter.",
          },
          {
            type: "match",
            prompt: "Match the letter to the rank",
            pairs: [
              ["A", "Ace"],
              ["K", "King"],
              ["Q", "Queen"],
              ["J", "Jack"],
            ],
          },
          {
            type: "choice",
            prompt: "The Ace can also act as the lowest card. In which hand?",
            options: ["A-K-Q-J-T", "A-2-3-4-5", "A-A-2-2-3", "Never"],
            answer: 1,
            explanation: "A-2-3-4-5 (the \"wheel\") is a five-high straight, the lowest straight.",
          },
        ],
      },
      {
        id: "basics-3",
        title: "Reading Cards",
        exercises: [
          {
            type: "choice",
            prompt: "What cards are these?",
            hand: "Ah Kh",
            options: ["Ace and King of hearts", "Ace and King of diamonds", "Ace of spades, King of hearts", "Two Aces"],
            answer: 0,
            explanation: "Both cards are hearts: the Ace of hearts and the King of hearts. Poker players call this \"Ace-King suited\".",
          },
          {
            type: "choice",
            prompt: "Two cards of the same suit are called…",
            hand: "Js Ts",
            options: ["Offsuit", "Suited", "Connected", "Paired"],
            answer: 1,
            explanation: "Cards of the same suit are \"suited\" — written JTs. Different suits are \"offsuit\" (JTo).",
          },
          {
            type: "choice",
            prompt: "How do you write these cards in shorthand?",
            hand: "Qd 9c",
            options: ["Q9s", "Q9o", "QQ", "9Qs"],
            answer: 1,
            explanation: "Queen and nine of different suits: Q9o. The higher card is written first.",
          },
          {
            type: "choice",
            prompt: "Two cards of the same rank are called…",
            hand: "8s 8d",
            options: ["A pocket pair", "Suited connectors", "A flush", "Offsuit"],
            answer: 0,
            explanation: "Two starting cards of the same rank are a pocket pair, like 88 (\"pocket eights\").",
          },
          {
            type: "choice",
            prompt: "Which of these are \"connectors\"?",
            options: ["9 and 8", "9 and 4", "K and 2", "A and 7"],
            answer: 0,
            explanation: "Connectors are consecutive ranks, like 98. They can make straights more easily.",
          },
        ],
      },
    ],
  },
  {
    id: "rankings",
    title: "Hand Rankings",
    description: "Learn which hands beat which — the foundation of every decision.",
    color: "#2f6fde",
    icon: "trophy",
    guidebook: [
      {
        heading: "Best five cards",
        body: "A poker hand is always exactly five cards. Hands are ranked by category, and within a category by the ranks of the cards.",
      },
      {
        heading: "The ladder",
        body: "Royal Flush › Straight Flush › Four of a Kind › Full House › Flush › Straight › Three of a Kind › Two Pair › One Pair › High Card.",
      },
      {
        heading: "Rarer is stronger",
        body: "Hands are ranked by how rare they are. A flush is harder to make than a straight, so a flush wins.",
      },
    ],
    lessons: [
      {
        id: "rankings-1",
        title: "The Ladder",
        exercises: [
          {
            type: "choice",
            prompt: "What is the best possible hand in poker?",
            options: ["Four Aces", "Royal Flush", "Full House", "Straight Flush, 9 high"],
            answer: 1,
            explanation: "A Royal Flush (A-K-Q-J-T of one suit) is the highest straight flush and cannot be beaten.",
          },
          {
            type: "order",
            prompt: "Order from strongest to weakest",
            items: ["Straight Flush", "Four of a Kind", "Full House", "Flush"],
            explanation: "Straight Flush › Four of a Kind › Full House › Flush.",
          },
          {
            type: "choice",
            prompt: "Which hand is stronger?",
            options: ["Flush", "Straight"],
            answer: 0,
            explanation: "A flush beats a straight. It's a common mistake to mix them up!",
          },
          {
            type: "order",
            prompt: "Order from strongest to weakest",
            items: ["Straight", "Three of a Kind", "Two Pair", "One Pair", "High Card"],
            explanation: "Straight › Three of a Kind › Two Pair › One Pair › High Card.",
          },
          {
            type: "choice",
            prompt: "Which hand is stronger?",
            options: ["Three of a Kind", "Two Pair"],
            answer: 0,
            explanation: "Three of a kind beats two pair.",
          },
          {
            type: "choice",
            prompt: "Which hand is stronger?",
            options: ["Flush", "Full House"],
            answer: 1,
            explanation: "A full house beats a flush.",
          },
        ],
      },
      {
        id: "rankings-2",
        title: "Name That Hand",
        exercises: [
          {
            type: "match",
            prompt: "Match each hand to its name",
            pairs: [
              ["K K K 4 4", "Full House"],
              ["9 8 7 6 5", "Straight"],
              ["Q Q 7 7 2", "Two Pair"],
              ["J J J J 3", "Four of a Kind"],
            ],
          },
          {
            type: "choice",
            prompt: "What hand is this?",
            board: "Kh 9h 6h 3h 2h",
            options: CATEGORY_OPTIONS,
            answer: 0,
            explanation: "Five cards of the same suit is a flush — here, King-high.",
          },
          {
            type: "choice",
            prompt: "What hand is this?",
            board: "Td 9s 8c 7h 6d",
            options: CATEGORY_OPTIONS,
            answer: 1,
            explanation: "Five consecutive ranks in mixed suits is a straight — ten-high.",
          },
          {
            type: "choice",
            prompt: "What hand is this?",
            board: "7s 7d 7c Ks Kd",
            options: CATEGORY_OPTIONS,
            answer: 2,
            explanation: "Three of one rank plus a pair is a full house: sevens full of kings.",
          },
          {
            type: "choice",
            prompt: "What hand is this?",
            board: "As Ad 5c 5h Qs",
            options: CATEGORY_OPTIONS,
            answer: 3,
            explanation: "Two different pairs: aces and fives, with a queen kicker.",
          },
          {
            type: "choice",
            prompt: "What hand is this?",
            board: "5c 4d 3s 2h Ac",
            options: ["High Card, Ace", "Straight", "Flush", "One Pair"],
            answer: 1,
            explanation: "A-2-3-4-5 is a straight — the wheel. Here the Ace plays low.",
          },
          {
            type: "choice",
            prompt: "What hand is this?",
            board: "Qs Kd Ac 2h 3s",
            options: ["Straight", "High Card", "One Pair", "Flush"],
            answer: 1,
            explanation: "Straights can't \"wrap around\": Q-K-A-2-3 is not a straight. This is just Ace-high.",
          },
        ],
      },
      {
        id: "rankings-3",
        title: "Kickers & Ties",
        exercises: [
          {
            type: "choice",
            prompt: "Both players have a pair of Kings. Who wins?",
            info: [
              { label: "Player A", value: "K K A 7 3" },
              { label: "Player B", value: "K K Q J 9" },
            ],
            options: ["Player A", "Player B", "Split pot"],
            answer: 0,
            explanation: "Same pair, so the highest side card — the kicker — decides. Ace beats Queen.",
          },
          {
            type: "choice",
            prompt: "Which flush wins?",
            info: [
              { label: "Player A", value: "A♥ 9♥ 7♥ 4♥ 2♥" },
              { label: "Player B", value: "K♠ Q♠ J♠ 9♠ 8♠" },
            ],
            options: ["Player A", "Player B", "Split pot"],
            answer: 0,
            explanation: "Flushes are compared card by card from the top. Ace-high beats King-high.",
          },
          {
            type: "choice",
            prompt: "Two full houses. Who wins?",
            info: [
              { label: "Player A", value: "8 8 8 A A" },
              { label: "Player B", value: "9 9 9 2 2" },
            ],
            options: ["Player A", "Player B", "Split pot"],
            answer: 1,
            explanation: "In a full house the three-of-a-kind part is compared first. Nines beat eights.",
          },
          {
            type: "choice",
            prompt: "Two straights. Who wins?",
            info: [
              { label: "Player A", value: "A 2 3 4 5" },
              { label: "Player B", value: "2 3 4 5 6" },
            ],
            options: ["Player A", "Player B", "Split pot"],
            answer: 1,
            explanation: "A-2-3-4-5 is only five-high. The six-high straight wins.",
          },
          {
            type: "choice",
            prompt: "Two pair vs two pair. Who wins?",
            info: [
              { label: "Player A", value: "J J 4 4 K" },
              { label: "Player B", value: "T T 9 9 A" },
            ],
            options: ["Player A", "Player B", "Split pot"],
            answer: 0,
            explanation: "Compare the top pair first: Jacks beat Tens. The kicker only matters if both pairs match.",
          },
          {
            type: "choice",
            prompt: "Identical five-card hands. What happens?",
            info: [
              { label: "Player A", value: "Q♥ Q♦ 8♠ 8♣ 5♥" },
              { label: "Player B", value: "Q♠ Q♣ 8♥ 8♦ 5♠" },
            ],
            options: ["Player A wins", "Player B wins", "Split pot"],
            answer: 2,
            explanation: "Suits don't break ties. Identical ranks means the pot is split.",
          },
        ],
      },
      {
        id: "rankings-4",
        title: "Full Ladder",
        exercises: [
          {
            type: "order",
            prompt: "Order all ten hands from strongest to weakest",
            items: RANKING_ORDER.slice(0, 5),
            explanation: RANKING_ORDER.slice(0, 5).join(" › "),
          },
          {
            type: "order",
            prompt: "Keep going: strongest to weakest",
            items: RANKING_ORDER.slice(5),
            explanation: RANKING_ORDER.slice(5).join(" › "),
          },
          {
            type: "choice",
            prompt: "Which hand is the rarest?",
            options: ["Four of a Kind", "Full House", "Flush", "Straight"],
            answer: 0,
            explanation: "Rarer hands rank higher. Four of a kind is the rarest of these.",
          },
          {
            type: "choice",
            prompt: "What hand is this?",
            board: "9c 9s 9h 9d 2c",
            options: ["Full House", "Four of a Kind", "Three of a Kind", "Two Pair"],
            answer: 1,
            explanation: "All four nines: four of a kind (\"quads\").",
          },
          {
            type: "choice",
            prompt: "What hand is this?",
            board: "8s 7s 6s 5s 4s",
            options: ["Flush", "Straight", "Straight Flush", "Royal Flush"],
            answer: 2,
            explanation: "Five consecutive cards of one suit: an eight-high straight flush.",
          },
        ],
      },
    ],
  },
  {
    id: "holdem",
    title: "How Hold'em Works",
    description: "Blinds, streets, actions and showdown — the flow of a hand.",
    color: "#7156d9",
    icon: "layers",
    guidebook: [
      {
        heading: "Hole cards and community cards",
        body: "Each player gets two private hole cards. Five shared community cards are dealt face up in the middle. You make the best five-card hand from any combination of your two cards and the five on the board.",
      },
      {
        heading: "The streets",
        body: "Preflop (hole cards only) → Flop (3 cards) → Turn (1 card) → River (1 card). There is a round of betting on each street.",
      },
      {
        heading: "Blinds",
        body: "Two forced bets — the small blind and big blind — start the pot so there is always something to play for.",
      },
      {
        heading: "Actions",
        body: "Fold (give up), Check (pass when there's no bet), Call (match a bet), Bet (put chips in first) or Raise (increase a bet).",
      },
    ],
    lessons: [
      {
        id: "holdem-1",
        title: "The Streets",
        exercises: [
          {
            type: "choice",
            prompt: "How many hole cards does each player get in Texas Hold'em?",
            options: ["1", "2", "4", "5"],
            answer: 1,
            explanation: "Two hole cards each. (Omaha uses four.)",
          },
          {
            type: "order",
            prompt: "Put the betting rounds in order",
            items: ["Preflop", "Flop", "Turn", "River"],
            explanation: "Preflop → Flop → Turn → River, then showdown.",
          },
          {
            type: "choice",
            prompt: "How many community cards are dealt on the flop?",
            options: ["1", "2", "3", "5"],
            answer: 2,
            explanation: "The flop is three cards at once. The turn and river are one card each.",
          },
          {
            type: "choice",
            prompt: "What's the total number of community cards by the river?",
            options: ["3", "4", "5", "7"],
            answer: 2,
            explanation: "3 (flop) + 1 (turn) + 1 (river) = 5 community cards.",
          },
          {
            type: "match",
            prompt: "Match the street to the cards dealt",
            pairs: [
              ["Preflop", "2 hole cards"],
              ["Flop", "3 shared cards"],
              ["Turn", "4th shared card"],
              ["River", "5th shared card"],
            ],
          },
        ],
      },
      {
        id: "holdem-2",
        title: "Actions",
        exercises: [
          {
            type: "match",
            prompt: "Match each action to its meaning",
            pairs: [
              ["Fold", "Give up the hand"],
              ["Check", "Pass without betting"],
              ["Call", "Match the current bet"],
              ["Raise", "Increase the bet"],
            ],
          },
          {
            type: "choice",
            prompt: "Someone has bet $10. Which action is NOT allowed?",
            options: ["Fold", "Call", "Raise", "Check"],
            answer: 3,
            explanation: "You can only check when nobody has bet on this street.",
          },
          {
            type: "choice",
            prompt: "Nobody has bet yet on the turn. What can you do?",
            options: ["Check or Bet", "Call or Raise", "Only Fold", "Only Call"],
            answer: 0,
            explanation: "With no bet in front of you, you can check or make a bet. (Folding is allowed but never makes sense for free.)",
          },
          {
            type: "choice",
            prompt: "What does \"all-in\" mean?",
            options: ["Betting all your chips", "Everyone calls", "Showing your cards", "Folding"],
            answer: 0,
            explanation: "Going all-in means putting every chip you have in front of you into the pot.",
          },
          {
            type: "choice",
            prompt: "Player A bets $20, Player B raises to $60. How much more must A add to call?",
            options: ["$20", "$40", "$60", "$80"],
            answer: 1,
            explanation: "A has already put in $20, so calling $60 costs $40 more.",
          },
        ],
      },
      {
        id: "holdem-3",
        title: "Blinds & Position",
        exercises: [
          {
            type: "choice",
            prompt: "What are the blinds?",
            options: ["Forced bets posted before cards are dealt", "Face-down community cards", "Players who folded", "Side pots"],
            answer: 0,
            explanation: "The small blind and big blind are forced bets that seed the pot every hand.",
          },
          {
            type: "choice",
            prompt: "Which player acts last on the flop, turn and river?",
            options: ["Small blind", "Big blind", "The button (dealer)", "The player to the left of the big blind"],
            answer: 2,
            explanation: "After the flop, the button acts last — the best position at the table.",
          },
          {
            type: "choice",
            prompt: "Why is acting last an advantage?",
            options: [
              "You see what everyone else does before deciding",
              "You get extra cards",
              "You pay smaller blinds",
              "You win ties",
            ],
            answer: 0,
            explanation: "Position = information. Acting last lets you react to your opponents' actions.",
          },
          {
            type: "choice",
            prompt: "Who acts first preflop?",
            options: ["Small blind", "Big blind", "Under the Gun (left of the big blind)", "The button"],
            answer: 2,
            explanation: "Preflop the action starts \"under the gun\", left of the big blind. The blinds act last preflop.",
          },
          {
            type: "match",
            prompt: "Match the position name",
            pairs: [
              ["BTN", "Button / dealer"],
              ["SB", "Small blind"],
              ["BB", "Big blind"],
              ["UTG", "Under the gun"],
            ],
          },
        ],
      },
      {
        id: "holdem-4",
        title: "Making Your Hand",
        exercises: [
          {
            type: "choice",
            prompt: "What's your best hand?",
            hand: "Ah Kh",
            board: "Qh Jh Th 3c 2d",
            options: ["Straight", "Flush", "Royal Flush", "High Card"],
            answer: 2,
            explanation: "A♥ K♥ plus Q♥ J♥ T♥ makes a Royal Flush!",
          },
          {
            type: "choice",
            prompt: "What's your best hand?",
            hand: "7c 7d",
            board: "7s Kd Kc 2h 9s",
            options: ["Three of a Kind", "Two Pair", "Full House", "Four of a Kind"],
            answer: 2,
            explanation: "Three sevens plus the pair of kings on board: sevens full of kings.",
          },
          {
            type: "choice",
            prompt: "What's your best hand?",
            hand: "9s 2c",
            board: "Ah Kd Qs Jc Td",
            options: ["High Card", "Straight", "One Pair", "Flush"],
            answer: 1,
            explanation: "The board itself is a straight (A-K-Q-J-T). You \"play the board\" — your cards don't help.",
          },
          {
            type: "choice",
            prompt: "Can you use both, one, or none of your hole cards?",
            options: ["Must use both", "Must use exactly one", "Any of those", "Must use none"],
            answer: 2,
            explanation: "In Hold'em you use any combination of your hole cards and the board — 2, 1 or even 0.",
          },
          {
            type: "choice",
            prompt: "What's your best hand?",
            hand: "Qs 8s",
            board: "As 9s 3d 4s Kc",
            options: ["Flush", "One Pair", "High Card", "Straight"],
            answer: 0,
            explanation: "Q♠ 8♠ with A♠ 9♠ 4♠ makes an Ace-high flush.",
          },
        ],
      },
    ],
  },
  {
    id: "showdown",
    title: "Showdown",
    description: "Who wins the pot? Read the board and compare hands.",
    color: "#d27a14",
    icon: "swords",
    guidebook: [
      {
        heading: "Compare the best five",
        body: "At showdown each player's best five-card hand is compared. Only five cards count — a sixth card can never break a tie.",
      },
      {
        heading: "Playing the board",
        body: "If the best hand is on the board itself, everyone who can't beat it splits the pot.",
      },
      {
        heading: "The nuts",
        body: "The \"nuts\" is the best possible hand given the board. Knowing it helps you spot when you're beaten.",
      },
    ],
    lessons: [
      {
        id: "showdown-1",
        title: "Who Wins?",
        exercises: [
          { type: "compare", board: "Kd 8s 5c 2h 3d", hands: ["As Ks", "Qh Qc"] },
          { type: "compare", board: "Jh Th 4c 9s 2d", hands: ["Qd 8c", "Jc Js"] },
          { type: "compare", board: "Ah 7h 6h Kd 2c", hands: ["Qh 3h", "Ac Ad"] },
          { type: "compare", board: "9c 9d 4s 4h 2c", hands: ["Ac 3d", "Kh Qh"] },
          { type: "compare", board: "Tc 6d 6s 3h Qc", hands: ["Td 3c", "6h 2d"] },
        ],
      },
      {
        id: "showdown-2",
        title: "Kicker Battles",
        exercises: [
          {
            type: "compare",
            board: "Ah 9c 5d 3s 2c",
            hands: ["Ad Kc", "As Jd"],
            explanation: "Both have a pair of Aces. The King kicker beats the Jack.",
          },
          {
            type: "compare",
            board: "Kc Ks 8h 4d 2s",
            hands: ["Ah Qd", "Ac Jh"],
            explanation: "Both play the pair of Kings with an Ace. The second kicker decides: Queen beats Jack.",
          },
          {
            type: "compare",
            board: "Qh Qd Jc Jh As",
            hands: ["Kc 5d", "2s 3c"],
            explanation: "The board already has Queens and Jacks with an Ace kicker. Neither player can improve it, so both play the board and split.",
          },
          {
            type: "compare",
            board: "7s 7h 3c 3d 9s",
            hands: ["Ac 2d", "Kh Qc"],
            explanation: "Both play sevens and threes. The Ace kicker beats the King.",
          },
          {
            type: "compare",
            board: "Td 8c 5h 4s 2d",
            hands: ["Ts 9h", "Th 3c"],
            explanation: "Pair of Tens each. Player A's 9 kicker beats Player B's best kicker, the 8 on the board.",
          },
        ],
      },
      {
        id: "showdown-3",
        title: "Tricky Boards",
        exercises: [
          {
            type: "compare",
            board: "5h 6h 7c 8d Kh",
            hands: ["9s Tc", "4c 3d"],
            explanation: "Player A makes a Ten-high straight (6-7-8-9-T). Player B's straight is only Eight-high (4-5-6-7-8).",
          },
          {
            type: "compare",
            board: "Jh 9h 2h 6c Qh",
            hands: ["Ah 3h", "Kh Th"],
            explanation: "Player B makes a King-high straight flush: K-Q-J-T-9 of hearts. Player A's Ace-high flush loses.",
          },
          {
            type: "compare",
            board: "8s 8d 8h Qc Qd",
            hands: ["Qs 2c", "8c 3d"],
            explanation: "Player B has four eights. Player A's Queens full of eights is a full house — it loses to quads.",
          },
          {
            type: "compare",
            board: "As Ks Qs Js 2h",
            hands: ["Ts 3c", "Ah Ad"],
            explanation: "T♠ completes a Royal Flush. Three Aces don't come close.",
          },
          {
            type: "choice",
            prompt: "What's the nuts (best possible hand) on this board?",
            board: "Kc 9d 4s 2h 7c",
            options: ["Three Kings", "Four Kings", "A straight", "A flush"],
            answer: 0,
            explanation: "No pair on board, no three suited cards and no straight possible. The best hand is a set of Kings.",
          },
          {
            type: "choice",
            prompt: "Which hand is possible on this board?",
            board: "Th 9h 8h 2c 2d",
            options: ["Straight flush", "Only a straight", "Nothing better than a pair", "No flush possible"],
            answer: 0,
            explanation: "With three connected hearts, J♥7♥ or Q♥J♥ make a straight flush — and the paired board allows full houses and quads too.",
          },
        ],
      },
    ],
  },
  {
    id: "starting",
    title: "Starting Hands",
    description: "Which two cards are worth playing, and from where.",
    color: "#d64541",
    icon: "hand",
    guidebook: [
      {
        heading: "Play fewer hands",
        body: "The most common beginner mistake is playing too many hands. Strong players fold most of their starting hands.",
      },
      {
        heading: "Premium hands",
        body: "AA, KK, QQ, JJ and AK are premium hands. Raise them from any position.",
      },
      {
        heading: "Position widens your range",
        body: "The later you act, the more hands you can play. Under the gun, stick to strong hands; on the button, you can open much wider.",
      },
      {
        heading: "Raise, don't limp",
        body: "When you enter a pot first, raise rather than just calling the big blind. Raising gives you two ways to win: everyone folds, or you have the best hand.",
      },
    ],
    lessons: [
      {
        id: "starting-1",
        title: "Premium Hands",
        exercises: [
          {
            type: "choice",
            prompt: "What's the best starting hand in Hold'em?",
            options: ["AKs", "AA", "KK", "72o"],
            answer: 1,
            explanation: "Pocket Aces is the strongest starting hand.",
          },
          {
            type: "choice",
            prompt: "Which of these is the weakest starting hand?",
            options: ["72o", "AKo", "JTs", "55"],
            answer: 0,
            explanation: "7-2 offsuit is widely considered the worst hand: low, unconnected and unsuited.",
          },
          {
            type: "choice",
            prompt: "How many starting-hand card combinations are there?",
            options: ["52", "169", "1,326", "2,652"],
            answer: 2,
            explanation: "52 × 51 / 2 = 1,326 combos. They group into 169 strategically distinct hands (like AKs, AKo, AA).",
          },
          {
            type: "choice",
            prompt: "You're dealt this hand. Roughly how often do you get it?",
            hand: "As Ad",
            options: ["1 in 52", "1 in 100", "1 in 221", "1 in 1,000"],
            answer: 2,
            explanation: "There are 6 ways to make AA out of 1,326 combos: 1 in 221.",
          },
          {
            type: "order",
            prompt: "Order these hands from strongest to weakest preflop",
            items: ["AA", "KK", "QQ", "AKs", "JJ"],
            explanation: "AA › KK › QQ › AKs ≈ JJ. They are all premium hands.",
          },
        ],
      },
      {
        id: "starting-2",
        title: "Suited & Connected",
        exercises: [
          {
            type: "choice",
            prompt: "Roughly how much equity does being suited add to a hand?",
            options: ["About 2–3%", "About 20%", "About 50%", "Nothing"],
            answer: 0,
            explanation: "Being suited adds only a few percent. Don't overvalue weak hands just because they're suited.",
          },
          {
            type: "choice",
            prompt: "Which hand makes straights most easily?",
            options: ["98s", "94s", "K2s", "A7o"],
            answer: 0,
            explanation: "Connected cards like 98 can make many straights (5-9, 6-T, 7-J, and more).",
          },
          {
            type: "choice",
            prompt: "What's the chance of flopping a set with a pocket pair?",
            hand: "6h 6c",
            options: ["About 12% (1 in 8.5)", "About 33%", "About 50%", "About 2%"],
            answer: 0,
            explanation: "You flop a set (or better) about 12% of the time. That's why small pairs want cheap flops and deep stacks.",
          },
          {
            type: "choice",
            prompt: "A pair vs two higher overcards, like QQ vs AK — who's favored?",
            options: ["Slight favorite: the pair (~55%)", "Huge favorite: the pair (~90%)", "The overcards", "Exactly 50/50"],
            answer: 0,
            explanation: "This classic matchup is a \"coin flip\" — the pair wins about 54–57% of the time.",
          },
          {
            type: "choice",
            prompt: "AA vs KK all-in preflop. Roughly how often do Aces win?",
            options: ["About 52%", "About 65%", "About 82%", "About 97%"],
            answer: 2,
            explanation: "A bigger pair vs a smaller pair is roughly an 80/20 favorite. AA wins about 82% vs KK.",
          },
        ],
      },
      {
        id: "starting-3",
        title: "Preflop Decisions",
        exercises: [
          {
            type: "choice",
            prompt: "Everyone folds to you. What do you do?",
            hand: "Kd Kc",
            info: [
              { label: "Position", value: "Under the Gun" },
              { label: "Action", value: "Folded to you" },
            ],
            options: ["Fold", "Call (limp)", "Raise"],
            answer: 2,
            explanation: "Kings are a premium hand. Raise from any position.",
          },
          {
            type: "choice",
            prompt: "Everyone folds to you. What do you do?",
            hand: "8d 3c",
            info: [
              { label: "Position", value: "Under the Gun" },
              { label: "Action", value: "First to act" },
            ],
            options: ["Fold", "Call (limp)", "Raise"],
            answer: 0,
            explanation: "83o is far too weak, especially from early position with the whole table left to act.",
          },
          {
            type: "choice",
            prompt: "Everyone folds to you. What do you do?",
            hand: "Kh 9h",
            info: [
              { label: "Position", value: "Button" },
              { label: "Action", value: "Folded to you" },
            ],
            options: ["Fold", "Call (limp)", "Raise"],
            answer: 2,
            explanation: "On the button with only the blinds left, K9s is a clear open-raise. Position widens your range.",
          },
          {
            type: "choice",
            prompt: "What do you do?",
            hand: "Js 4d",
            info: [
              { label: "Position", value: "Cutoff" },
              { label: "Action", value: "UTG raised to 3 BB" },
            ],
            options: ["Fold", "Call", "Re-raise"],
            answer: 0,
            explanation: "J4o is weak and an early-position raise signals strength. Fold.",
          },
          {
            type: "choice",
            prompt: "What do you do?",
            hand: "Ac Kd",
            info: [
              { label: "Position", value: "Button" },
              { label: "Action", value: "Hijack raised to 3 BB" },
            ],
            options: ["Fold", "Call", "Re-raise (3-bet)"],
            answer: 2,
            explanation: "AK is premium. 3-betting builds a pot with a strong hand and often wins it right away.",
          },
          {
            type: "choice",
            prompt: "Everyone folds to you. Why is raising better than limping?",
            hand: "Ts 9s",
            info: [{ label: "Position", value: "Cutoff" }],
            options: [
              "Raising can win the blinds immediately",
              "Limping is against the rules",
              "Raising guarantees you win",
              "There is no difference",
            ],
            answer: 0,
            explanation: "Raising gives you fold equity — the chance everyone folds — plus the initiative.",
          },
        ],
      },
    ],
  },
  {
    id: "odds",
    title: "Outs & Pot Odds",
    description: "Count outs, estimate equity and make +EV calls.",
    color: "#4957c9",
    icon: "calculator",
    guidebook: [
      {
        heading: "Outs",
        body: "An out is an unseen card that improves your hand to (probably) the best hand. A flush draw has 9 outs: 13 cards of the suit minus the 4 you can see.",
      },
      {
        heading: "The Rule of 2 and 4",
        body: "Multiply your outs by 4 on the flop (two cards to come) or by 2 on the turn (one card to come) to estimate your % chance to hit.",
      },
      {
        heading: "Pot odds",
        body: "Pot odds = call ÷ (pot + call), where the pot already includes your opponent's bet. If they bet $50 into a $50 pot, the pot is $100 and you call $50: you need 50 ÷ 150 ≈ 33% equity.",
      },
      {
        heading: "The decision",
        body: "If your equity is higher than the pot odds, calling is profitable in the long run.",
      },
    ],
    lessons: [
      {
        id: "odds-1",
        title: "Counting Outs",
        exercises: [
          {
            type: "choice",
            prompt: "You have a flush draw. How many outs?",
            hand: "Ah 7h",
            board: "Kh 9h 2c",
            options: ["4", "8", "9", "13"],
            answer: 2,
            explanation: "13 hearts total − 4 you can see = 9 outs.",
          },
          {
            type: "choice",
            prompt: "You have an open-ended straight draw. How many outs?",
            hand: "9c 8d",
            board: "7s 6h 2c",
            options: ["4", "6", "8", "9"],
            answer: 2,
            explanation: "Any 5 or T makes a straight: 4 fives + 4 tens = 8 outs.",
          },
          {
            type: "choice",
            prompt: "You have a gutshot (inside) straight draw. How many outs?",
            hand: "9c 8d",
            board: "6s 5h Kc",
            options: ["2", "4", "8", "9"],
            answer: 1,
            explanation: "Only a 7 fills the gap: 4 outs.",
          },
          {
            type: "choice",
            prompt: "You have two overcards and no pair. How many outs to make top pair?",
            hand: "Ad Kc",
            board: "9s 6h 2c",
            options: ["3", "6", "8", "12"],
            answer: 1,
            explanation: "3 Aces + 3 Kings = 6 outs.",
          },
          {
            type: "match",
            prompt: "Match each draw to its outs",
            pairs: [
              ["Flush draw", "9 outs"],
              ["Open-ended straight draw", "8 outs"],
              ["Gutshot straight draw", "4 outs"],
              ["Pocket pair to a set", "2 outs"],
            ],
          },
        ],
      },
      {
        id: "odds-2",
        title: "Rule of 2 and 4",
        exercises: [
          {
            type: "choice",
            prompt: "Flush draw on the flop (9 outs), seeing both turn and river. Approx. chance to hit?",
            options: ["9%", "18%", "36%", "50%"],
            answer: 2,
            explanation: "9 outs × 4 = 36%. (Exact: 35%.)",
          },
          {
            type: "choice",
            prompt: "Flush draw on the turn (9 outs), one card to come. Approx. chance to hit?",
            options: ["9%", "18%", "27%", "36%"],
            answer: 1,
            explanation: "9 outs × 2 = 18%. (Exact: 19.6%.)",
          },
          {
            type: "choice",
            prompt: "Open-ended straight draw on the flop (8 outs), two cards to come?",
            options: ["16%", "24%", "32%", "40%"],
            answer: 2,
            explanation: "8 × 4 = 32%. (Exact: 31.5%.)",
          },
          {
            type: "choice",
            prompt: "Gutshot on the turn (4 outs), one card to come?",
            options: ["4%", "8%", "16%", "20%"],
            answer: 1,
            explanation: "4 × 2 = 8%. (Exact: 8.7%.)",
          },
          {
            type: "choice",
            prompt: "Why multiply by 4 on the flop but only 2 on the turn?",
            options: [
              "On the flop you have two cards to come",
              "The deck is bigger on the flop",
              "Bets are bigger on the turn",
              "It's just a convention",
            ],
            answer: 0,
            explanation: "Each card to come gives you roughly 2% per out. Two cards ≈ 4%.",
          },
        ],
      },
      {
        id: "odds-3",
        title: "Pot Odds",
        exercises: [
          {
            type: "choice",
            prompt: "The pot is $100 (including their bet). You must call $50. What equity do you need?",
            info: [
              { label: "Pot", value: "$100" },
              { label: "To call", value: "$50" },
            ],
            options: ["20%", "25%", "33%", "50%"],
            answer: 2,
            explanation: "50 ÷ (100 + 50) = 33%.",
          },
          {
            type: "choice",
            prompt: "Pot is $150 (including their bet). You must call $50. What equity do you need?",
            info: [
              { label: "Pot", value: "$150" },
              { label: "To call", value: "$50" },
            ],
            options: ["20%", "25%", "33%", "50%"],
            answer: 1,
            explanation: "50 ÷ (150 + 50) = 25%.",
          },
          {
            type: "choice",
            prompt: "Your opponent bets the size of the pot. What equity do you need to call?",
            options: ["25%", "33%", "50%", "66%"],
            answer: 1,
            explanation: "Pot 100, bet 100 → you call 100 into 200: 100 ÷ 300 = 33%.",
          },
          {
            type: "choice",
            prompt: "Your opponent bets half the pot. What equity do you need to call?",
            options: ["20%", "25%", "33%", "50%"],
            answer: 1,
            explanation: "Pot 100, bet 50 → you call 50 into 150: 50 ÷ 200 = 25%.",
          },
          {
            type: "match",
            prompt: "Match the bet size to the equity needed",
            pairs: [
              ["¼ pot", "17%"],
              ["½ pot", "25%"],
              ["Pot", "33%"],
              ["2× pot", "40%"],
            ],
          },
        ],
      },
      {
        id: "odds-4",
        title: "Call or Fold?",
        exercises: [
          {
            type: "choice",
            prompt: "Turn. Villain bets. Call or fold?",
            hand: "Ah 7h",
            board: "Kh 9h 2c 4s",
            info: [
              { label: "Pot (incl. bet)", value: "$120" },
              { label: "To call", value: "$20" },
            ],
            options: ["Call", "Fold"],
            answer: 0,
            explanation: "You need 20 ÷ 140 ≈ 14%. Your flush draw hits ~18–20% on the river. Call!",
          },
          {
            type: "choice",
            prompt: "Turn. Villain bets pot. Call or fold?",
            hand: "9c 8d",
            board: "6s 5h Kc 2d",
            info: [
              { label: "Pot (incl. bet)", value: "$200" },
              { label: "To call", value: "$100" },
            ],
            options: ["Call", "Fold"],
            answer: 1,
            explanation: "You need 100 ÷ 300 = 33%, but a gutshot with one card to come is only ~8%. Fold.",
          },
          {
            type: "choice",
            prompt: "Turn. Villain bets half pot. Call or fold?",
            hand: "Jd Tc",
            board: "9s 8h 2c 3d",
            info: [
              { label: "Pot (incl. bet)", value: "$150" },
              { label: "To call", value: "$50" },
            ],
            options: ["Call", "Fold"],
            answer: 1,
            explanation: "You need 25%. An open-ended draw with one card to come is ~17% (8 × 2). Fold — unless implied odds are huge.",
          },
          {
            type: "choice",
            prompt: "Flop. Villain goes all-in. Call or fold?",
            hand: "Qs Js",
            board: "Ts 9s 3h",
            info: [
              { label: "Pot (incl. bet)", value: "$200" },
              { label: "To call", value: "$100" },
              { label: "Your draw", value: "Flush + open-ended" },
            ],
            options: ["Call", "Fold"],
            answer: 0,
            explanation: "15 outs (9 spades + 6 non-spade Kings and Eights) give about 54% with two cards to come. You need only 33%. Snap call!",
          },
          {
            type: "choice",
            prompt: "What are \"implied odds\"?",
            options: [
              "Money you expect to win on later streets if you hit",
              "The odds shown on the TV broadcast",
              "Odds of your opponent bluffing",
              "The rake",
            ],
            answer: 0,
            explanation: "Implied odds count future bets you can win when you hit, which can justify calls that pot odds alone don't.",
          },
        ],
      },
    ],
  },
  POSTFLOP_UNIT,
  {
    id: "strategy",
    title: "Strategy & Mindset",
    description: "Value bets, bluffs, bankroll and keeping a cool head.",
    color: "#a14b8c",
    icon: "brain",
    guidebook: [
      {
        heading: "Why you bet",
        body: "Bet for value when worse hands will call. Bluff when better hands will fold. If neither is likely, consider checking.",
      },
      {
        heading: "Bankroll",
        body: "Only play with money you can afford to lose, and keep enough buy-ins that a bad run can't knock you out. Common advice: 20+ buy-ins for cash games.",
      },
      {
        heading: "Tilt",
        body: "Tilt is playing worse because of emotion — usually after a bad beat. Recognize it and take a break.",
      },
    ],
    lessons: [
      {
        id: "strategy-1",
        title: "Value & Bluffs",
        exercises: [
          {
            type: "choice",
            prompt: "What is a value bet?",
            options: [
              "Betting so a worse hand will call",
              "Betting so a better hand will fold",
              "The minimum bet",
              "Betting with a draw",
            ],
            answer: 0,
            explanation: "A value bet wants to be called by worse hands.",
          },
          {
            type: "choice",
            prompt: "What is a bluff?",
            options: [
              "Betting to make a better hand fold",
              "Betting the nuts",
              "Checking with a strong hand",
              "Calling a big bet",
            ],
            answer: 0,
            explanation: "A bluff succeeds when a better hand folds.",
          },
          {
            type: "choice",
            prompt: "River. You have the nuts and your opponent checks. What should you usually do?",
            hand: "Ah Qh",
            board: "Kh 9h 4h 2c 7d",
            options: ["Bet for value", "Check behind", "Fold"],
            answer: 0,
            explanation: "You have the nut flush. Bet so worse hands can pay you off.",
          },
          {
            type: "choice",
            prompt: "What is a \"semi-bluff\"?",
            options: [
              "Betting with a draw that can improve",
              "Betting half the pot",
              "Bluffing only on the flop",
              "Calling with a weak hand",
            ],
            answer: 0,
            explanation: "A semi-bluff can win right away if they fold, and can still win by improving if called.",
          },
          {
            type: "choice",
            prompt: "What's a continuation bet (c-bet)?",
            options: [
              "The preflop raiser betting again on the flop",
              "Calling every street",
              "Betting after someone checks the river",
              "Re-raising preflop",
            ],
            answer: 0,
            explanation: "The preflop aggressor \"continues\" the story by betting the flop.",
          },
        ],
      },
      {
        id: "strategy-2",
        title: "Bankroll & Tilt",
        exercises: [
          {
            type: "choice",
            prompt: "What is \"tilt\"?",
            options: [
              "Playing worse due to frustration or emotion",
              "A special betting structure",
              "When the dealer misdeals",
              "A winning streak",
            ],
            answer: 0,
            explanation: "Tilt is emotional, poor decision-making. Take a break when you notice it.",
          },
          {
            type: "choice",
            prompt: "You just lost a huge pot to a lucky river. Best response?",
            options: [
              "Take a short break to reset",
              "Double your stakes to win it back",
              "Play every hand next orbit",
              "Target that player with bluffs",
            ],
            answer: 0,
            explanation: "Chasing losses is classic tilt. Step away, reset, and return when you're clear-headed.",
          },
          {
            type: "choice",
            prompt: "Why keep a bankroll with many buy-ins?",
            options: [
              "Variance: even good players have long losing stretches",
              "Casinos require it",
              "It makes you win more hands",
              "It lets you bluff more",
            ],
            answer: 0,
            explanation: "Poker has big short-term swings. A healthy bankroll protects you from going broke during downswings.",
          },
          {
            type: "choice",
            prompt: "Should you judge a decision by whether you won the hand?",
            options: [
              "No — judge by whether it was the right play",
              "Yes — winning means it was right",
              "Only for big pots",
              "Only in tournaments",
            ],
            answer: 0,
            explanation: "Good decisions sometimes lose and bad ones sometimes win. Focus on decision quality, not short-term results.",
          },
          {
            type: "match",
            prompt: "Match the poker term",
            pairs: [
              ["Variance", "Short-term luck swings"],
              ["Bad beat", "Losing as a big favorite"],
              ["EV", "Average long-run result"],
              ["Tilt", "Emotional play"],
            ],
          },
        ],
      },
    ],
  },
  TOURNAMENT_UNIT,
  ...ADVANCED_UNITS,
];

export interface Section {
  id: string;
  title: string;
  description: string;
  unitIds: string[];
}

/** The course in three stages; units appear in COURSE in this order. */
export const SECTIONS: Section[] = [
  {
    id: "foundations",
    title: "Foundations",
    description: "The rules, hand rankings and how a hand plays out.",
    unitIds: ["basics", "rankings", "holdem", "showdown"],
  },
  {
    id: "fundamentals",
    title: "Winning Fundamentals",
    description: "Starting hands, the math of calling, post-flop basics and tournament play.",
    unitIds: ["starting", "odds", "postflop", "strategy", "tournaments"],
  },
  {
    id: "advanced",
    title: "Advanced",
    description: "What strong regulars know: 3-bets, ranges, sizing, exploits, ICM and the mental game.",
    unitIds: ["facing", "math", "reading", "postflop2", "exploit", "mtt", "mindset"],
  },
];

export function sectionOfUnit(unitId: string): number {
  return SECTIONS.findIndex((s) => s.unitIds.includes(unitId));
}

/** Lesson ids of every unit in the given section. */
export function sectionLessons(sectionIndex: number): string[] {
  return SECTIONS[sectionIndex].unitIds.flatMap((id) => COURSE.find((u) => u.id === id)!.lessons.map((l) => l.id));
}

export function findLesson(lessonId: string) {
  for (const unit of COURSE) {
    const index = unit.lessons.findIndex((l) => l.id === lessonId);
    if (index >= 0) return { unit, lesson: unit.lessons[index], index };
  }
  return undefined;
}

/** All lesson ids in course order — lessons unlock one after another. */
export const LESSON_ORDER: string[] = COURSE.flatMap((u) => u.lessons.map((l) => l.id));

/** Reference to a course exercise, used by the mistakes review: "lessonId#index". */
export function exerciseRef(lessonId: string, index: number): string {
  return `${lessonId}#${index}`;
}

const DRILL_REF = "drill:";

/** Generated drill exercises have no lesson, so their review ref carries the exercise itself. */
export function drillRef(exercise: Exercise): string {
  return DRILL_REF + JSON.stringify(exercise);
}

export function exerciseByRef(ref: string): Exercise | undefined {
  if (ref.startsWith(DRILL_REF)) {
    try {
      return JSON.parse(ref.slice(DRILL_REF.length)) as Exercise;
    } catch {
      return undefined;
    }
  }
  const [lessonId, index] = ref.split("#");
  return findLesson(lessonId)?.lesson.exercises[Number(index)];
}
