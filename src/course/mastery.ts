import type { Unit } from "./types";

/**
 * Section 4: turning knowledge into a winning game. Numeric answers are checked in
 * course.test.ts ("mastery math claims").
 */

const STACKS = { label: "Stacks", value: "100 BB" };

export const SPR_UNIT: Unit = {
  id: "spr",
  title: "Stack Depth & SPR",
  description: "How stack sizes decide which hands can play for all the chips.",
  color: "#9a3412",
  icon: "ruler",
  guidebook: [
    {
      heading: "Stack-to-pot ratio",
      body: "SPR is the effective stack divided by the pot on the flop. It tells you how many pot-sized bets are left, and how strong a hand you need to play for all the chips.",
    },
    {
      heading: "Rules of thumb",
      body: "With an SPR under about 4, one strong pair is usually enough to get all-in. Between about 4 and 10, top pair wants a medium pot while two pair or better can play for stacks. Above about 10, playing for stacks usually takes a set or better.",
    },
    {
      heading: "Preflop sets the SPR",
      body: "A single-raised pot at 100 BB starts the flop with an SPR around 15 or more. A 3-bet pot is around 4 to 5 and a 4-bet pot is under 2. Choose your preflop action knowing the kind of flop you'll play.",
    },
    {
      heading: "Bets compound",
      body: "Each called bet grows the pot, so bets grow fast. With an SPR of 13, a pot-size bet on the flop, turn and river gets exactly all the chips in.",
    },
    {
      heading: "Implied odds need depth",
      body: "Small pairs and suited connectors win big pots when they hit, which only works when stacks are deep. A common rule of thumb: set mine only when the effective stack is at least 15 to 20 times the call.",
    },
  ],
  lessons: [
    {
      id: "spr-1",
      title: "Stack-to-Pot Ratio",
      exercises: [
        {
          type: "choice",
          prompt: "What does SPR measure?",
          options: ["The effective stack divided by the pot", "Your share of the pot", "How often you win at showdown", "The size of the blinds"],
          answer: 0,
          explanation: "SPR = effective stack ÷ pot on the flop. An SPR of 5 means five pot-sized bets are left behind.",
        },
        {
          type: "choice",
          prompt: "You open to 2.5 BB on the button and only the big blind calls. What's the SPR on the flop?",
          info: [
            { label: "Pot", value: "5.5 BB" },
            { label: "Behind", value: "97.5 BB" },
          ],
          options: ["About 2", "About 6", "About 18", "About 40"],
          answer: 2,
          explanation:
            "97.5 ÷ 5.5 ≈ 17.7. Single-raised pots at 100 BB start deep, so one pair rarely wants to play for all the chips.",
        },
        {
          type: "choice",
          prompt: "This time the big blind 3-bets to 10 BB and you call. What's the SPR on the flop?",
          info: [
            { label: "Pot", value: "20.5 BB" },
            { label: "Behind", value: "90 BB" },
          ],
          options: ["About 1", "About 4.4", "About 9", "About 18"],
          answer: 1,
          explanation: "90 ÷ 20.5 ≈ 4.4. 3-bet pots are shallow, so top pair with a good kicker is often happy to get all-in.",
        },
        {
          type: "choice",
          prompt: "In a 4-bet pot the flop SPR is about 1.7 and you flop top pair. Usually…",
          options: [
            "You're committed: plan to get all-in",
            "Check and fold to any bet",
            "Continue only with a set",
            "Fold unless you have the nuts",
          ],
          answer: 0,
          explanation:
            "With less than two pot-sized bets behind, folding top pair gives up too much. The chips go in on most flops you connect with.",
        },
        {
          type: "order",
          prompt: "Order these pots from the lowest flop SPR to the highest",
          items: ["4-bet pot", "3-bet pot", "Single-raised pot", "Limped pot"],
          explanation:
            "More raising before the flop builds a bigger pot compared with the stacks. A 4-bet pot is nearly all-in already; a limped pot is very deep.",
        },
        {
          type: "match",
          prompt: "Match each spot to what it usually means",
          pairs: [
            ["SPR under 4", "Top pair can play for stacks"],
            ["SPR over 10", "Stacks need a set or better"],
            ["3-bet pot", "SPR around 4 to 5"],
            ["Single-raised pot", "SPR around 15 or more"],
          ],
        },
      ],
    },
    {
      id: "spr-2",
      title: "Committing to the Pot",
      exercises: [
        {
          type: "choice",
          prompt: "Villain bets into you on the flop. At this SPR, how should your overpair play?",
          hand: "Qh Qd",
          board: "9s 6c 2d",
          info: [
            { label: "Pot", value: "20 BB" },
            { label: "Behind", value: "30 BB" },
            { label: "Villain bets", value: "10 BB" },
          ],
          options: [
            "Plan to get all-in this hand",
            "Fold to the bet",
            "Call now and fold to more betting",
            "Fold unless the turn is a queen",
          ],
          answer: 0,
          explanation:
            "The SPR is only 1.5. An overpair on a dry board is far ahead of the hands that bet here, and folding later would waste the chips already in.",
        },
        {
          type: "choice",
          prompt: "The SPR is 13. You bet the size of the pot on the flop, turn and river and get called each time. How much is left behind at the end?",
          info: [
            { label: "Flop pot", value: "10 BB" },
            { label: "Behind", value: "130 BB" },
          ],
          options: ["Nothing: the river bet is all-in", "About half the stack", "About a third of the stack", "Almost all of it"],
          answer: 0,
          explanation:
            "Flop: bet 10, pot 30, 120 behind. Turn: bet 30, pot 90, 90 behind. River: a 90 bet is exactly all-in. Each called pot-size bet triples the pot.",
        },
        {
          type: "choice",
          prompt: "Single-raised pot, SPR 15. You have top pair with a weak kicker and villain check-raises the turn big. Usually…",
          options: [
            "Fold: a deep-stacked check-raise usually means two pair or better",
            "Move all-in: top pair is strong",
            "Call and bet the river",
            "Re-raise small",
          ],
          answer: 0,
          explanation:
            "Big pots with deep stacks go to big hands. Top pair with a weak kicker is rarely good when this much money goes in.",
        },
        {
          type: "choice",
          prompt: "What is pot control?",
          options: [
            "Checking or betting small to keep the pot manageable with a medium hand",
            "Betting big to take control of the pot",
            "Folding whenever the pot gets big",
            "Splitting the pot evenly",
          ],
          answer: 0,
          explanation:
            "With hands like second pair or top pair with a weak kicker you want a small or medium pot. Checking a street keeps it from growing faster than your hand deserves.",
        },
        {
          type: "choice",
          prompt: "Which hand most wants to play for stacks at an SPR of 12?",
          options: ["A set", "Top pair, good kicker", "An overpair to the board", "Second pair"],
          answer: 0,
          explanation:
            "Deep stacks favour very strong hands. A set is happy to get 100 BB in; one pair is often beaten when that much money goes in.",
        },
      ],
    },
    {
      id: "spr-3",
      title: "Set Mining & Implied Odds",
      exercises: [
        {
          type: "choice",
          prompt: "How often does a pocket pair flop a set or better?",
          hand: "5s 5d",
          options: ["About 6%", "About 12%", "About 25%", "About 33%"],
          answer: 1,
          explanation: "About 11.8%, or 1 time in 8.5. You miss about 7.5 times for every time you hit.",
        },
        {
          type: "choice",
          prompt: "You call 2.5 BB to set mine. On average, how much must you win when you flop a set just to break even?",
          options: ["About 2.5 BB", "About 10 BB", "About 19 BB", "About 60 BB"],
          answer: 2,
          explanation:
            "You miss about 7.5 times per hit and lose 2.5 BB each time: 7.5 × 2.5 ≈ 19 BB. You won't always get paid or win when you hit, so you need more than that in practice.",
        },
        {
          type: "choice",
          prompt: "As a rule of thumb, set mining pays when the effective stack is at least how many times the call?",
          options: ["2 times", "5 times", "15–20 times", "100 times"],
          answer: 2,
          explanation:
            "You hit about 1 time in 8.5, and sometimes the set doesn't get paid or loses. 15 to 20 times the call leaves room to win enough when you hit.",
        },
        {
          type: "choice",
          prompt: "Villain opens to 3 BB and the effective stack is 30 BB. Is calling to set mine profitable?",
          hand: "4c 4h",
          info: [
            { label: "Villain opens", value: "3 BB" },
            { label: "Effective stack", value: "30 BB" },
          ],
          options: ["No: the stack is only 10 times the call", "Yes: any pair can set mine"],
          answer: 0,
          explanation:
            "Even when you hit, there isn't enough behind to win back all the times you miss. With short stacks, small pairs play better as a 3-bet shove or a fold.",
        },
        {
          type: "choice",
          prompt: "Why do suited connectors like 7♥ 6♥ play worse with short stacks?",
          options: [
            "Their big wins come from implied odds, which shrink with the stacks",
            "They make fewer straights when stacks are short",
            "Short stacks can't call raises",
            "Suited cards lose value in tournaments",
          ],
          answer: 0,
          explanation:
            "Suited connectors rarely make the best hand, but when they do they can win a big pot. With less money behind, there's less to win.",
        },
        {
          type: "choice",
          prompt: "What are reverse implied odds?",
          options: [
            "Money you lose when your hand improves to a second-best hand",
            "Extra money you win when your draw hits",
            "Getting the right price to call",
            "Folding the best hand by mistake",
          ],
          answer: 0,
          explanation:
            "Hands like KJo against a tight opener often make top pair and lose a big pot to AK or KQ. That's the danger of dominated hands.",
        },
      ],
    },
  ],
};

export const BIG_POTS_UNIT: Unit = {
  id: "bigpots",
  title: "3-Bet & Multiway Pots",
  description: "Play shallow 3-bet pots and crowded multiway pots well.",
  color: "#1d4ed8",
  icon: "git-fork",
  guidebook: [
    {
      heading: "3-bet pots are shallow",
      body: "After a 3-bet at 100 BB, the flop SPR is usually around 4 to 5. Ranges are stronger, so top pair with a good kicker is often worth getting all-in.",
    },
    {
      heading: "The 3-bettor's edge",
      body: "The 3-bettor holds most of the aces, kings and big pairs. On high flops they can bet small and often. On low, connected flops the caller's pairs and suited connectors make more sets and straights, so the 3-bettor checks more.",
    },
    {
      heading: "Multiway pots",
      body: "Every extra player makes it likelier that someone has a strong hand. AA wins about 85% of the time against one random hand but only about 56% against four.",
    },
    {
      heading: "Bluff less, value bet tighter",
      body: "A bluff has to get through every opponent. If two players each fold half the time, both fold only 25% of the time. Hands that make the nuts gain value; medium pairs lose it.",
    },
    {
      heading: "Squeezes and position",
      body: "A 3-bet after an open and a call is a squeeze. The caller's range is capped, so both players often fold. Out of position, play fewer hands: you act first on every street and see less before you decide.",
    },
  ],
  lessons: [
    {
      id: "bigpots-1",
      title: "Playing 3-Bet Pots",
      exercises: [
        {
          type: "choice",
          prompt: "You 3-bet to 9 BB on the button over a cutoff open, the blinds fold and the cutoff calls. How big is the pot on the flop?",
          options: ["11.5 BB", "18 BB", "19.5 BB", "27 BB"],
          answer: 2,
          explanation:
            "Both players put in 9 BB, plus the 1.5 BB of folded blinds: 19.5 BB. With 91 BB behind, the SPR is about 4.7.",
        },
        {
          type: "choice",
          prompt: "In that 3-bet pot you flop top pair with the best kicker. Usually…",
          hand: "As Kd",
          board: "Kh 8c 3s",
          options: ["Plan to get all-in", "Check and fold to a bet", "Call one bet, then give up", "Fold: 3-bet pots need a set"],
          answer: 0,
          explanation:
            "At an SPR under 5 against a cutoff range, top pair top kicker is well ahead of the hands that will put money in. Build the pot.",
        },
        {
          type: "choice",
          prompt: "Why can the 3-bettor often c-bet small on an A-K-x flop?",
          options: [
            "They hold far more strong aces and kings than the caller",
            "Small bets always make players fold",
            "The caller never has an ace",
            "Big bets aren't allowed in 3-bet pots",
          ],
          answer: 0,
          explanation:
            "When a board favours your range this much, a small bet with most of your hands wins the pot often and gets called by worse.",
        },
        {
          type: "choice",
          prompt: "You 3-bet and get called. Who is more likely to hold a straight or a set on this flop?",
          board: "7h 6h 5d",
          options: ["The caller", "The 3-bettor", "They're equally likely"],
          answer: 0,
          explanation:
            "The caller flats with small pairs and suited connectors that make sets and straights here. The 3-bettor's AK, AQ and big pairs don't, so the 3-bettor should check more often.",
        },
        {
          type: "choice",
          prompt: "Why is calling 3-bets out of position with hands like K♣ J♦ a mistake?",
          options: [
            "It's dominated by the 3-bettor's range and hard to play without position",
            "KJ is too strong to call",
            "You must always 4-bet or fold",
            "Calling 3-bets isn't allowed",
          ],
          answer: 0,
          explanation:
            "A 3-bettor's range is full of AK, KQ and big pairs. When you pair your king or jack you're often beaten, and you'll play every street first.",
        },
      ],
    },
    {
      id: "bigpots-2",
      title: "Multiway Pots",
      exercises: [
        {
          type: "choice",
          prompt: "All-in before the flop against four random hands, about how often does AA win?",
          hand: "As Ah",
          options: ["About 36%", "About 56%", "About 73%", "About 85%"],
          answer: 1,
          explanation:
            "About 85% against one random hand, 73% against two and 56% against four. Even the best hand loses often in a crowd.",
        },
        {
          type: "choice",
          prompt: "You bluff into two opponents. Each folds half the time, independently. How often does the bluff win the pot right away?",
          options: ["25%", "50%", "75%", "100%"],
          answer: 0,
          explanation: "Both have to fold: 0.5 × 0.5 = 25%. Bluffs need far more fold equity when more players are in the pot.",
        },
        {
          type: "choice",
          prompt: "Four players see this flop. Compared with a heads-up pot, your top pair is…",
          hand: "Ks 9s",
          board: "Kd 8c 4h",
          options: [
            "Weaker: someone is more likely to have you beat",
            "Stronger: more players means more callers",
            "Exactly as strong",
            "Unbeatable",
          ],
          answer: 0,
          explanation:
            "Three opponents have three chances to hold two pair, a set or a better king. Keep the pot smaller and be ready to slow down.",
        },
        {
          type: "choice",
          prompt: "Which hand gains value in multiway pots?",
          options: ["A nut flush draw", "Top pair, weak kicker", "A bluff with no draw", "Middle pair"],
          answer: 0,
          explanation:
            "Draws to the nuts win big pots when they hit, and more players means more money to win. Medium-strength pairs are the hands that suffer.",
        },
        {
          type: "choice",
          prompt: "In a four-way pot you have no pair and no draw. Your default?",
          options: ["Check and give up if someone bets", "Bet big to take it down", "Check-raise all-in", "Call any bet to see the turn"],
          answer: 0,
          explanation: "With three opponents, someone usually has something. Save your bluffs for heads-up pots.",
        },
        {
          type: "match",
          prompt: "How does each change in a multiway pot?",
          pairs: [
            ["Pure bluffs", "Work far less often"],
            ["Thin value bets", "Get beaten more often"],
            ["Nut draws", "Win bigger pots"],
            ["C-bet frequency", "Should go down"],
          ],
        },
      ],
    },
    {
      id: "bigpots-3",
      title: "Squeezes & Position",
      exercises: [
        {
          type: "choice",
          prompt: "What is a squeeze?",
          options: [
            "A 3-bet after an open and one or more calls",
            "Calling with a hand that's almost beaten",
            "A river bet when you're behind",
            "Raising a limper",
          ],
          answer: 0,
          explanation: "The name comes from the opener being squeezed between you and the caller.",
        },
        {
          type: "choice",
          prompt: "Why does a squeeze often win the pot?",
          options: [
            "The caller's range is capped: they would have 3-bet their best hands",
            "Callers always fold to raises",
            "It forces an all-in",
            "The opener has to call",
          ],
          answer: 0,
          explanation:
            "The caller rarely has a premium hand, and the opener has to act knowing another player could wake up behind them. Both fold often.",
        },
        {
          type: "choice",
          prompt: "The cutoff opens to 2.5 BB and the button calls. In the big blind, which squeeze size makes sense?",
          info: [
            { label: "Open", value: "2.5 BB" },
            { label: "Callers", value: "1" },
          ],
          options: ["5 BB", "8 BB", "14 BB", "40 BB"],
          answer: 2,
          explanation:
            "Out of position a 3-bet is about 4 times the open (10 BB). Add about one open for each caller: roughly 12 to 15 BB makes both players pay to continue.",
        },
        {
          type: "choice",
          prompt: "Why play fewer hands out of position?",
          options: [
            "You act first on every street, so you see less before deciding",
            "Out-of-position players get worse cards",
            "You can't raise out of position",
            "The dealer favours the button",
          ],
          answer: 0,
          explanation:
            "Position lets you control the pot size and bluff or value bet with more information. Without it, marginal hands lose money.",
        },
        {
          type: "choice",
          prompt: "For most winning players, which seat makes the most money?",
          options: ["The button", "Under the gun", "The small blind", "The big blind"],
          answer: 0,
          explanation:
            "The button acts last after the flop on every hand it plays. The blinds lose money for almost everyone because they pay before seeing their cards and play out of position.",
        },
      ],
    },
  ],
};

export const RIVER_UNIT: Unit = {
  id: "river",
  title: "River Mastery",
  description: "Thin value, bluff-catching, blockers and polarized bets.",
  color: "#7c3aed",
  icon: "binoculars",
  guidebook: [
    {
      heading: "Thin value",
      body: "Bet for value when worse hands call more often than better ones. If more than half the hands that call you are worse, the bet makes money.",
    },
    {
      heading: "Bluff-catching",
      body: "A bluff-catcher beats only bluffs. Count villain's value hands and bluffs: call when bluffs make up a bigger share of the betting range than the equity the price asks for.",
    },
    {
      heading: "Blockers",
      body: "Cards in your hand remove combos from villain's range. Good bluffs block the hands that would call. Good bluff-catchers block value hands, not bluffs.",
    },
    {
      heading: "Polarized bets",
      body: "Big river bets usually mean the nuts or a bluff. Bet big with a polarized range, and small with thin value that worse hands can call.",
    },
    {
      heading: "Real players",
      body: "Many low-stakes players rarely bluff with big river raises. Against them, fold one pair to a big raise even when the price looks good.",
    },
  ],
  lessons: [
    {
      id: "river-1",
      title: "Thin Value",
      exercises: [
        {
          type: "choice",
          prompt: "When is a river value bet profitable, ignoring raises?",
          options: [
            "When more than half the hands that call are worse than yours",
            "Only when you have the nuts",
            "When villain is likely to fold",
            "Whenever you have top pair",
          ],
          answer: 0,
          explanation:
            "Each call from a worse hand wins you the bet; each call from a better hand costs you the bet. You need more of the first.",
        },
        {
          type: "choice",
          prompt: "You bet $50 into $100. Villain calls with 6 worse hands and 4 better ones, and folds the rest. How much does betting gain over checking?",
          info: [
            { label: "Pot", value: "$100" },
            { label: "Your bet", value: "$50" },
          ],
          options: ["−$10", "$0", "+$10", "+$30"],
          answer: 2,
          explanation:
            "When a worse hand calls you win an extra $50; when a better hand calls you lose an extra $50. 0.6 × $50 − 0.4 × $50 = +$10.",
        },
        {
          type: "choice",
          prompt: "Villain is a calling station who has called every street. You have second pair on a quiet river. Your action?",
          hand: "8s 7s",
          board: "Kd 8h 3c 2s 2d",
          options: ["Bet small for value", "Check behind", "Overbet all-in"],
          answer: 0,
          explanation: "Stations call with worse pairs, ace-high and missed draws. Those are exactly the hands thin value is for.",
        },
        {
          type: "choice",
          prompt: "Against a tight player, the river completes the flush and villain checks. You have top pair with a weak kicker. Your action?",
          hand: "Ks 6d",
          board: "Kh 9h 4c 2d 7h",
          options: ["Check behind", "Bet big for value"],
          answer: 0,
          explanation:
            "A tight player who calls a bet here has a flush or a better king far more often than a worse hand. Take the free showdown.",
        },
        {
          type: "choice",
          prompt: "Why do smaller bets suit thin value?",
          options: [
            "More worse hands can call a small bet",
            "Bigger bets are always better",
            "Sizing never matters on the river",
            "Small bets only work as bluffs",
          ],
          answer: 0,
          explanation: "A big bet folds out the worse hands you want calls from and gets called mostly by better ones.",
        },
      ],
    },
    {
      id: "river-2",
      title: "Bluff-Catching",
      exercises: [
        {
          type: "choice",
          prompt: "What is a bluff-catcher?",
          options: ["A hand that beats bluffs but loses to value bets", "The nuts", "A hand that always calls", "A bluff that hits on the river"],
          answer: 0,
          explanation: "Whether a bluff-catcher should call depends only on how often villain is bluffing compared with the price.",
        },
        {
          type: "choice",
          prompt: "Villain's river range has 12 value combos and 6 bluffs. They bet $50 into $100. Call or fold?",
          info: [
            { label: "Value", value: "12 combos" },
            { label: "Bluffs", value: "6 combos" },
            { label: "Bet", value: "$50 into $100" },
          ],
          options: ["Fold", "Call"],
          answer: 1,
          explanation: "You need 50 ÷ 200 = 25%. Bluffs are 6 of 18 = 33% of the range, so calling wins money.",
        },
        {
          type: "choice",
          prompt: "Now villain has 12 value combos and 4 bluffs, and bets $100 into $100. Call or fold?",
          info: [
            { label: "Value", value: "12 combos" },
            { label: "Bluffs", value: "4 combos" },
            { label: "Bet", value: "$100 into $100" },
          ],
          options: ["Fold", "Call"],
          answer: 0,
          explanation: "A pot-size bet needs 100 ÷ 300 = 33%. Bluffs are only 4 of 16 = 25%, so fold.",
        },
        {
          type: "choice",
          prompt: "Which cards are best to hold when bluff-catching?",
          options: [
            "Cards that block villain's value hands",
            "Cards that block villain's bluffs",
            "It never matters",
            "The highest cards possible",
          ],
          answer: 0,
          explanation:
            "Blocking value hands makes the bluffs a bigger share of what's left. Blocking bluffs does the opposite.",
        },
        {
          type: "choice",
          prompt: "Minimum defense frequency says to defend two-thirds of your range against a half-pot bet. Against a player who never bluffs, you should…",
          options: ["Defend less: fold your bluff-catchers", "Defend exactly two-thirds", "Defend more often", "Always raise"],
          answer: 0,
          explanation:
            "MDF protects you against a player who bluffs the right amount. When a player under-bluffs, folding more is the exploit.",
        },
        {
          type: "choice",
          prompt: "A passive low-stakes player check-raises big on the river. You have top pair. Usually…",
          options: ["Fold: these raises are rarely bluffs", "Re-raise all-in", "Call: top pair is strong", "It's a coin flip either way"],
          answer: 0,
          explanation:
            "Big river raises from passive players are almost always strong. Calling them 'to keep them honest' is one of the most expensive habits in poker.",
        },
      ],
    },
    {
      id: "river-3",
      title: "Blockers",
      exercises: [
        {
          type: "choice",
          prompt: "You have no pair on a three-spade board. Why is this a good hand to bluff with?",
          hand: "As Jd",
          board: "Ks 8s 3d 2s 7c",
          options: [
            "You hold the ace of spades, so villain never has the nut flush",
            "Aces always win",
            "Spades are the highest suit",
            "Villain must fold to any ace",
          ],
          answer: 0,
          explanation:
            "Your A♠ removes the strongest flushes from villain's range, so they'll hold a hand that can call less often.",
        },
        {
          type: "choice",
          prompt: "How many combos of KK can villain hold?",
          hand: "Ks 9s",
          board: "Kh 9d 4c 2s 7h",
          options: ["0", "1", "3", "6"],
          answer: 1,
          explanation: "Two kings are visible (the board's and yours), leaving two: one combo instead of six.",
        },
        {
          type: "choice",
          prompt: "Same board. How many combos of K9 (two pair) can villain hold?",
          hand: "Ks 9s",
          board: "Kh 9d 4c 2s 7h",
          options: ["2", "4", "9", "16"],
          answer: 1,
          explanation:
            "Two kings and two nines are left: 2 × 2 = 4 combos instead of 16. Your hand blocks a lot of villain's value.",
        },
        {
          type: "choice",
          prompt: "Choosing a river bluff, which hand is better?",
          options: [
            "One that blocks villain's strongest calls",
            "One that blocks villain's missed draws",
            "The one with the highest kicker",
            "Any hand: blockers don't matter",
          ],
          answer: 0,
          explanation:
            "If you block the hands that call, villain folds more often. Blocking their missed draws is bad: those hands would have folded anyway.",
        },
        {
          type: "match",
          prompt: "Match the idea",
          pairs: [
            ["Blocker", "A card that removes villain combos"],
            ["Nut flush blocker", "The ace of the flush suit"],
            ["Bluff-catcher", "Beats only bluffs"],
            ["Combo", "One exact pair of hole cards"],
          ],
        },
      ],
    },
    {
      id: "river-4",
      title: "Polarized Bets",
      exercises: [
        {
          type: "choice",
          prompt: "A polarized river range is mostly…",
          options: ["Very strong hands and bluffs", "Medium-strength pairs", "Only bluffs", "Only the nuts"],
          answer: 0,
          explanation: "Medium hands prefer to check and reach showdown. What's left for a big bet is the top and the bottom.",
        },
        {
          type: "choice",
          prompt: "You bluff 2× the pot on the river. How often must villain fold for it to break even?",
          options: ["33%", "50%", "67%", "80%"],
          answer: 2,
          explanation: "You risk 2 pots to win 1: 2 ÷ (1 + 2) ≈ 67%. Big bluffs need a lot of folds.",
        },
        {
          type: "choice",
          prompt: "Villain bets 2× the pot on the river. What equity do you need to call?",
          options: ["25%", "33%", "40%", "50%"],
          answer: 2,
          explanation: "You call 2 pots to win a pot of 1 + 2 + 2 = 5: 2 ÷ 5 = 40%. Big bets give you a worse price.",
        },
        {
          type: "choice",
          prompt: "When should you bet small on the river?",
          options: ["With thin value that worse hands can call", "With the nuts, every time", "As a big bluff", "Never"],
          answer: 0,
          explanation:
            "Small bets get called by the most worse hands. Save big bets for when your range is polarized.",
        },
        {
          type: "choice",
          prompt: "You checked back the turn, so you rarely have a very strong hand. Villain overbets the river. What does that tell you?",
          options: [
            "They're attacking your capped range with nutted hands and bluffs",
            "They must be bluffing",
            "They have a medium hand",
            "Nothing: bet sizes are random",
          ],
          answer: 0,
          explanation:
            "Against a capped range, big bets are powerful for both value and bluffs. Your job is to call with enough of your best bluff-catchers, not all of them.",
        },
      ],
    },
  ],
};

export const LEAKS_UNIT: Unit = {
  id: "leaks",
  title: "Common Leaks",
  description: "The mistakes that cost most players the most money.",
  color: "#dc2626",
  icon: "bug",
  guidebook: [
    {
      heading: "Plug leaks first",
      body: "Most players lose because of a few mistakes they repeat, not a lack of fancy plays. Fixing one big leak is worth more than learning ten new moves.",
    },
    {
      heading: "Preflop leaks",
      body: "Limping, calling too many raises (especially out of position), opening too many hands from early seats, and folding too often in the big blind.",
    },
    {
      heading: "Postflop leaks",
      body: "Paying off big bets from players who rarely bluff, chasing draws without the price, slowplaying strong hands on wet boards, bluffing players who never fold, and c-betting every flop.",
    },
    {
      heading: "Mental leaks",
      body: "Tilt, playing stakes your bankroll can't handle, judging decisions by results, and never reviewing your hands.",
    },
    {
      heading: "Find your own",
      body: "Review the hands where you lost big pots or felt unsure. Spots you keep getting wrong are your leaks, and the practice drills are a good place to fix them.",
    },
  ],
  lessons: [
    {
      id: "leaks-1",
      title: "Preflop Leaks",
      exercises: [
        {
          type: "choice",
          prompt: "Everyone folds to you in the cutoff. Which play is the leak?",
          hand: "9s 8s",
          info: [{ label: "Position", value: "Cutoff" }, STACKS],
          options: ["Limping in", "Raising to 2.5 BB"],
          answer: 0,
          explanation:
            "Limping gives up the initiative and invites raises from the players behind. 98s is a standard cutoff open: raise it.",
        },
        {
          type: "choice",
          prompt: "Under the gun, you open this hand. What's wrong with that?",
          hand: "Kd 9s",
          info: [{ label: "Position", value: "Under the Gun" }, STACKS],
          options: [
            "It's too weak: five players still act behind you",
            "Nothing: any king is worth a raise",
            "You should have limped",
            "It's too strong to open",
          ],
          answer: 0,
          explanation:
            "Early position needs a tight range. K9o is dominated by the hands that call or 3-bet you, like KQ, KJ and AK.",
        },
        {
          type: "choice",
          prompt: "The button min-raises to 2 BB and the small blind folds. In the big blind, what equity do you need to call?",
          info: [
            { label: "Pot", value: "3.5 BB" },
            { label: "To call", value: "1 BB" },
          ],
          options: ["14%", "22%", "33%", "40%"],
          answer: 1,
          explanation:
            "You call 1 BB to win a pot of 3.5 BB: 1 ÷ 4.5 ≈ 22%. Folding most hands here is a big leak; defend very wide against small raises.",
        },
        {
          type: "choice",
          prompt: "Which preflop mistake costs losing players the most?",
          options: ["Playing too many hands", "Folding too much from early position", "Raising too often on the button", "3-betting aces"],
          answer: 0,
          explanation:
            "Weak hands lead to tough spots after the flop, where they lose small pots often and big pots when they're dominated.",
        },
        {
          type: "choice",
          prompt: "A tight player 3-bets your open. You're out of position with this hand. What's the leak?",
          hand: "Kc Jd",
          options: ["Calling", "Folding"],
          answer: 0,
          explanation:
            "KJo is dominated by a tight 3-betting range (AK, KQ, AJ, big pairs) and you'd play the pot out of position. Fold it.",
        },
      ],
    },
    {
      id: "leaks-2",
      title: "Postflop Leaks",
      exercises: [
        {
          type: "choice",
          prompt: "On the turn you have a gutshot and villain bets the size of the pot. Why is calling a leak?",
          hand: "Qh Js",
          board: "Kd 9c 4s 2h",
          options: [
            "You need 33% equity and have about 9%",
            "Gutshots never hit",
            "You should always raise draws",
            "Pot-size bets are always bluffs",
          ],
          answer: 0,
          explanation:
            "A pot-size bet needs 1 ÷ 3 ≈ 33%. Four tens out of 46 unseen cards is about 9%. Without huge implied odds, fold.",
        },
        {
          type: "choice",
          prompt: "You flop a set on this board. Which play is the leak?",
          hand: "4s 4d",
          board: "9h 8h 4c",
          options: ["Checking to trap and giving free cards", "Betting for value"],
          answer: 0,
          explanation:
            "This board is full of flush and straight draws. Slowplaying lets them catch up for free; bet to get value and charge them.",
        },
        {
          type: "choice",
          prompt: "Against a player who calls almost everything, which leak costs the most?",
          options: ["Bluffing too often", "Value betting thin hands", "Folding weak hands", "Betting your strong hands"],
          answer: 0,
          explanation: "Bluffs only work when players fold. Against a calling station, bet your good hands and give up your bluffs.",
        },
        {
          type: "choice",
          prompt: "A player who rarely raises suddenly raises your river bet. You have top pair. The common leak is…",
          options: ["Calling because they might be bluffing", "Folding top pair", "Re-raising all-in"],
          answer: 0,
          explanation:
            "Passive players raise the river with very strong hands. Calling to keep them honest pays off their value hands again and again.",
        },
        {
          type: "choice",
          prompt: "Why is c-betting every flop a leak?",
          options: [
            "Some flops favour the caller, and multiway pots punish bluffs",
            "C-bets never work",
            "You should only bet on the river",
            "It's bad etiquette",
          ],
          answer: 0,
          explanation:
            "Bet often when the flop favours your range and you're heads-up. Check more on boards that hit the caller and when several players are in.",
        },
      ],
    },
    {
      id: "leaks-3",
      title: "Mental Leaks",
      exercises: [
        {
          type: "choice",
          prompt: "You got all-in before the flop with AA against 72o and lost. Was it a mistake?",
          hand: "As Ad",
          villain: "7c 2h",
          options: ["No: judge decisions by their EV, not the result", "Yes: you lost the pot", "Only if it happens twice", "Yes: you should slowplay aces"],
          answer: 0,
          explanation:
            "AA wins about 88% of the time here. Good decisions still lose sometimes; judging them by results is called results-oriented thinking.",
        },
        {
          type: "choice",
          prompt: "You've lost three buy-ins and feel angry. Best move?",
          options: ["Take a break or stop for the day", "Move up in stakes to win it back", "Play more tables", "Bluff more to get even"],
          answer: 0,
          explanation: "Tilt turns small losses into big ones. A break costs nothing; playing angry costs a lot.",
        },
        {
          type: "choice",
          prompt: "Playing stakes where one bad session costs a third of your bankroll is…",
          options: [
            "A bankroll leak: normal swings can wipe you out",
            "Fine for a winning player",
            "The fastest way to improve",
            "Only a problem in tournaments",
          ],
          answer: 0,
          explanation:
            "Even strong winners have long losing stretches. Enough buy-ins let you keep playing well through them. The Variance tool in the Library shows how big they get.",
        },
        {
          type: "choice",
          prompt: "Which habit helps most in finding your leaks?",
          options: ["Reviewing hands after each session", "Playing longer sessions", "Changing seats often", "Only playing when you're winning"],
          answer: 0,
          explanation: "Mark hands where you were unsure, then check the key decision away from the table.",
        },
        {
          type: "match",
          prompt: "Match the mental leak",
          pairs: [
            ["Tilt", "Playing worse after bad beats"],
            ["Results-oriented", "Judging decisions by outcomes"],
            ["Scared money", "Playing too high for your bankroll"],
            ["Stop-loss", "A limit that ends the session"],
          ],
        },
      ],
    },
  ],
};

export const HAND_LAB_UNIT: Unit = {
  id: "handlab",
  title: "Hand Lab",
  description: "Full hands that put every skill together.",
  color: "#0e7490",
  icon: "flask",
  guidebook: [
    {
      heading: "Plan the whole hand",
      body: "Before you act, think about the next streets: which cards help you, how big the pot will get, and whether you're happy to put all the chips in.",
    },
    {
      heading: "Ask three questions",
      body: "What does villain's range look like? Where is my hand in that range? What does my action gain: value, protection or folds?",
    },
    {
      heading: "Size with purpose",
      body: "Choose bet sizes that get the result you want: calls from worse hands, or folds from better ones.",
    },
    {
      heading: "Review",
      body: "After a hand, go back to the key decision. Was the math right? Did you read the range well? That habit is how good players keep getting better.",
    },
  ],
  lessons: [
    {
      id: "handlab-1",
      title: "Value Hands",
      exercises: [
        {
          type: "scenario",
          prompt: "Charge the draws",
          hand: "8s 8d",
          setup: [{ label: "Position", value: "Hijack" }, STACKS],
          steps: [
            {
              street: "Preflop",
              prompt: "Everyone folds to you. Your action?",
              options: ["Fold", "Call", "Raise to 2.5 BB"],
              answer: 2,
              explanation: "88 is a standard open from the hijack.",
            },
            {
              street: "Flop",
              board: "9h 8h 5c",
              info: [{ label: "Pot", value: "5.5 BB" }],
              prompt: "The big blind calls and checks. Your action?",
              options: ["Check", "Bet 4 BB"],
              answer: 1,
              explanation:
                "A set on a board full of straight and flush draws. Bet now: the draws will call, and checking gives them a free card.",
            },
            {
              street: "Turn",
              board: "9h 8h 5c 2d",
              info: [{ label: "Pot", value: "13.5 BB" }],
              prompt: "The big blind calls and checks again. Your action?",
              options: ["Check", "Bet 9 BB"],
              answer: 1,
              explanation: "The 2 changes nothing. Keep charging flush draws, straight draws and nines.",
            },
            {
              street: "River",
              board: "9h 8h 5c 2d Ks",
              info: [{ label: "Pot", value: "31.5 BB" }],
              prompt: "The big blind calls and checks. Your action?",
              options: ["Check", "Bet 22 BB", "Move all-in for 84.5 BB"],
              answer: 1,
              explanation:
                "The draws missed, but nines and kings can call a normal bet. A huge overbet only gets called by the few hands that beat you.",
            },
          ],
          summary: "Strong hands on wet boards should build the pot early. Every free card is a chance for the draws to get there.",
        },
        {
          type: "scenario",
          prompt: "Top pair in a 3-bet pot",
          hand: "As Kd",
          setup: [{ label: "Position", value: "Button" }, STACKS],
          steps: [
            {
              street: "Preflop",
              prompt: "The cutoff opens to 2.5 BB. Your action?",
              options: ["Fold", "Call", "3-bet to 8 BB"],
              answer: 2,
              explanation: "AK is a 3-bet for value against a cutoff open.",
            },
            {
              street: "Flop",
              board: "Kh 7c 2d",
              info: [
                { label: "Pot", value: "17.5 BB" },
                { label: "Behind", value: "92 BB" },
              ],
              prompt: "The cutoff calls and checks. The SPR is about 5. Your action?",
              options: ["Check", "Bet 6 BB", "Move all-in for 92 BB"],
              answer: 1,
              explanation:
                "Top pair, top kicker on a dry board that favours your range. A small bet gets called by worse kings, sevens and pairs; shoving would fold them.",
            },
            {
              street: "Turn",
              board: "Kh 7c 2d 4s",
              info: [
                { label: "Pot", value: "29.5 BB" },
                { label: "Behind", value: "86 BB" },
              ],
              prompt: "The cutoff calls and checks again. Your action?",
              options: ["Check", "Bet 20 BB"],
              answer: 1,
              explanation: "Keep building the pot. Worse kings and pairs still call, and the stacks are set up to go in on the river.",
            },
            {
              street: "River",
              board: "Kh 7c 2d 4s 9c",
              info: [
                { label: "Pot", value: "69.5 BB" },
                { label: "Behind", value: "66 BB" },
              ],
              prompt: "The cutoff calls and checks. Your action?",
              options: ["Check", "Move all-in for 66 BB"],
              answer: 1,
              explanation:
                "The river is a brick and less than a pot is left. Worse kings have called twice and will often call again: get the rest in.",
            },
          ],
          summary: "In a low-SPR pot, top pair top kicker is a hand to get all-in with. Plan your sizes so the stacks go in by the river.",
        },
        {
          type: "choice",
          prompt: "A tight player called your flop and turn bets. The river is a blank and they check. You have top two pair. Your action?",
          hand: "Kc Qc",
          board: "Kh Qd 6s 3c 2h",
          options: ["Bet for value", "Check behind"],
          answer: 0,
          explanation:
            "Top two pair beats the kings and queens that called twice. Checking back wins nothing extra; bet and get paid by worse.",
        },
        {
          type: "choice",
          prompt: "You have the nuts on the river against a player who calls far too much. Which bet wins the most?",
          options: ["A big bet: they call big bets too", "A tiny bet", "Check and hope they bet"],
          answer: 0,
          explanation:
            "Against calling stations, size up with your best hands. They call with worse hands whatever the size, so make the bet worth more.",
        },
      ],
    },
    {
      id: "handlab-2",
      title: "Draws & Initiative",
      exercises: [
        {
          type: "scenario",
          prompt: "Nut flush draw in position",
          hand: "Ah Th",
          setup: [{ label: "Position", value: "Button" }, STACKS],
          steps: [
            {
              street: "Preflop",
              prompt: "Everyone folds to you. Your action?",
              options: ["Fold", "Call", "Raise to 2.5 BB"],
              answer: 2,
              explanation: "ATs is an easy open from the button.",
            },
            {
              street: "Flop",
              board: "Kh 7h 2c",
              info: [{ label: "Pot", value: "5.5 BB" }],
              prompt: "The big blind calls and checks. Your action?",
              options: ["Check", "Bet 2 BB", "Bet 20 BB"],
              answer: 1,
              explanation:
                "A king-high flop favours the button's range and you have the nut flush draw. A small c-bet wins the pot often and builds it when called.",
            },
            {
              street: "Turn",
              board: "Kh 7h 2c 4s",
              info: [{ label: "Pot", value: "9.5 BB" }],
              prompt: "The big blind calls and checks. Your action?",
              options: ["Check behind", "Bet 6 BB"],
              answer: 1,
              explanation:
                "Keep the pressure on as a semi-bluff: you can win now, and 9 flush outs plus an ace give you a strong hand when called.",
            },
            {
              street: "River",
              board: "Kh 7h 2c 4s 9h",
              info: [{ label: "Pot", value: "21.5 BB" }],
              prompt: "The flush comes and the big blind checks. Your action?",
              options: ["Check", "Bet 16 BB"],
              answer: 1,
              explanation:
                "You have the nut flush. Kings, two pairs and smaller flushes can call; checking gives up value.",
            },
          ],
          summary: "Nut draws play well aggressively: they win the pot now or build a big pot for when they hit.",
        },
        {
          type: "choice",
          prompt: "You defended the big blind. You check and the button bets 2 BB into 5.5 BB. Your action?",
          hand: "7d 6d",
          board: "Ac Ks 9h",
          options: ["Fold", "Call", "Check-raise to 8 BB"],
          answer: 0,
          explanation:
            "No pair, no draw, and this ace-king flop hits the button's range hard. Fold and wait for a better spot.",
        },
        {
          type: "choice",
          prompt: "You raised preflop and checked back the flop. On the turn, villain checks to you. What does your flop check tell them?",
          options: [
            "Your range is weaker: you'd usually bet your strong hands",
            "You must have the nuts",
            "Nothing at all",
            "You're about to fold",
          ],
          answer: 0,
          explanation:
            "Checking back caps your range. Expect more aggression from villain later, and pick your turn bets knowing they read you as weaker.",
        },
        {
          type: "choice",
          prompt: "Which hand makes the best turn semi-bluff?",
          options: ["A flush draw with an overcard", "No pair and no draw", "Top pair, good kicker", "The nuts"],
          answer: 0,
          explanation:
            "A semi-bluff wins when villain folds and still has outs when called. Hands with no outs are pure bluffs, and strong made hands bet for value.",
        },
      ],
    },
    {
      id: "handlab-3",
      title: "Tough Spots",
      exercises: [
        {
          type: "scenario",
          prompt: "An overpair meets a river raise",
          hand: "Ks Kd",
          setup: [
            { label: "Position", value: "Under the Gun" },
            { label: "Villain", value: "Passive regular" },
          ],
          steps: [
            {
              street: "Preflop",
              prompt: "You're first to act. Your action?",
              options: ["Fold", "Call", "Raise to 2.5 BB"],
              answer: 2,
              explanation: "KK is a raise from every seat.",
            },
            {
              street: "Flop",
              board: "Jh 8c 3d",
              info: [{ label: "Pot", value: "5.5 BB" }],
              prompt: "The big blind calls and checks. Your action?",
              options: ["Check", "Bet 3 BB"],
              answer: 1,
              explanation: "An overpair on a fairly dry board. Bet for value: jacks, eights and draws call.",
            },
            {
              street: "Turn",
              board: "Jh 8c 3d 5s",
              info: [{ label: "Pot", value: "11.5 BB" }],
              prompt: "The big blind calls and checks. Your action?",
              options: ["Check", "Bet 8 BB"],
              answer: 1,
              explanation: "Still well ahead of the hands that called the flop. Keep betting.",
            },
            {
              street: "River",
              board: "Jh 8c 3d 5s 8d",
              info: [{ label: "Pot", value: "27.5 BB" }],
              prompt: "The big blind checks, you bet 18 BB, and they raise to 60 BB. Your action?",
              options: ["Fold", "Call", "Re-raise all-in"],
              answer: 0,
              explanation:
                "A passive player's check-raise on a paired river is almost always trips or better. KK beats only bluffs here, and this player rarely has one.",
            },
          ],
          summary: "Big hands aren't always good hands. Against players who rarely bluff, a big raise tells you where you stand.",
        },
        {
          type: "scenario",
          prompt: "Defend and value bet from the big blind",
          hand: "Qs Js",
          setup: [{ label: "Position", value: "Big Blind" }, STACKS],
          steps: [
            {
              street: "Preflop",
              prompt: "The button opens to 2.5 BB and the small blind folds. Your action?",
              options: ["Fold", "Call", "3-bet to 11 BB"],
              answer: 1,
              explanation: "QJs is a clear defend against a button open, and it's in the calling range rather than the 3-bet range.",
            },
            {
              street: "Flop",
              board: "Qh 7c 3d",
              info: [
                { label: "Pot", value: "5.5 BB" },
                { label: "Button bets", value: "2 BB" },
              ],
              prompt: "You check and the button bets. Your action?",
              options: ["Fold", "Call"],
              answer: 1,
              explanation: "Top pair with a good kicker is far too strong to fold to a small bet. Call and keep the button's bluffs in.",
            },
            {
              street: "River",
              board: "Qh 7c 3d 2s 9h",
              info: [{ label: "Pot", value: "9.5 BB" }],
              prompt: "The turn went check, check. On the river, you act first. Your action?",
              options: ["Check", "Bet 6 BB"],
              answer: 1,
              explanation:
                "When the button checks back the turn, it rarely has a strong hand. Worse queens, sevens and pocket pairs will call a medium bet.",
            },
          ],
          summary: "Out of position, look for the moments your opponent shows weakness, then bet for value.",
        },
        {
          type: "choice",
          prompt: "Villain's river raise range is 6 combos of sets and 9 of two pair, with no bluffs. You have an overpair. What's your equity?",
          options: ["0%", "25%", "50%", "75%"],
          answer: 0,
          explanation:
            "Every hand in that range beats an overpair. Against a range with no bluffs, a bluff-catcher has nothing to catch: fold.",
        },
        {
          type: "choice",
          prompt: "You called a river bet and lost. What's the most useful thing to review?",
          options: [
            "Whether villain's betting range had enough bluffs for the price",
            "Whether you were unlucky",
            "Nothing: it's just variance",
            "Whether to play fewer tables",
          ],
          answer: 0,
          explanation:
            "One result says little. Checking the range and the price tells you whether the call makes money over the long run.",
        },
      ],
    },
  ],
};

export const MASTERY_UNITS: Unit[] = [SPR_UNIT, BIG_POTS_UNIT, RIVER_UNIT, LEAKS_UNIT, HAND_LAB_UNIT];
