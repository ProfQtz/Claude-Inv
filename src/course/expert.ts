import type { Unit } from "./types";

/**
 * Section 3: the skills that separate strong regulars from everyone else. Numeric answers
 * are checked in course.test.ts ("advanced math claims").
 */

const STACKS = { label: "Stacks", value: "100 BB" };

export const FACING_UNIT: Unit = {
  id: "facing",
  title: "Facing Raises",
  description: "3-bets, blind defense, 4-bets and limpers.",
  color: "#b45309",
  icon: "shield",
  guidebook: [
    {
      heading: "Three ways to respond",
      body: "When someone opens, you can fold, call, or re-raise (a 3-bet). Strong players fold most hands, call with hands that play well after the flop in position, and 3-bet their best hands plus a few well-chosen bluffs.",
    },
    {
      heading: "3-bet for value and as a bluff",
      body: "3-bet hands like QQ+ and AK to build a big pot while you're ahead. Add a few bluffs such as A5s: the ace makes AA and AK less likely for your opponent, and the hand can still make straights and flushes when called.",
    },
    {
      heading: "Respect early raises",
      body: "An under-the-gun open is a strong range. Continue tighter against it and fold hands like KJo and ATo, which are often dominated.",
    },
    {
      heading: "Defend the big blind",
      body: "You already have 1 BB in and you close the action, so you get a good price. Against a 2.5 BB button open you need only about 27% equity to call, so you can defend a wide range.",
    },
    {
      heading: "Isolate limpers",
      body: "When players limp, raise your good hands to about 3 BB plus 1 BB per limper. You'll often play heads-up, in position, against a weak range.",
    },
  ],
  lessons: [
    {
      id: "facing-1",
      title: "Fold, Call or 3-Bet",
      exercises: [
        {
          type: "choice",
          prompt: "What is a 3-bet?",
          options: ["A re-raise after someone opens", "Your third bet on the river", "Calling three bets in a row", "A bet of three big blinds"],
          answer: 0,
          explanation:
            "The blinds count as the first bet and the open raise as the second, so the first re-raise is the 3-bet. A re-raise of that is a 4-bet.",
        },
        {
          type: "choice",
          prompt: "UTG raises to 2.5 BB. Your move?",
          hand: "Ah Kd",
          info: [
            { label: "Position", value: "Button" },
            { label: "Action", value: "UTG raised to 2.5 BB" },
          ],
          options: ["Fold", "Call", "3-bet"],
          answer: 2,
          explanation: "AK is a premium hand. 3-bet to about 7.5 BB to build a pot while you're ahead of most of the opener's range.",
        },
        {
          type: "choice",
          prompt: "UTG raises to 2.5 BB. Your move?",
          hand: "Kh Jd",
          info: [
            { label: "Position", value: "Hijack" },
            { label: "Action", value: "UTG raised to 2.5 BB" },
          ],
          options: ["Fold", "Call", "3-bet"],
          answer: 0,
          explanation:
            "KJo is dominated by the hands UTG opens, like AK, AJ and KQ. When you pair your king or jack you often lose a big pot, so fold.",
        },
        {
          type: "choice",
          prompt: "Which hand is a classic 3-bet bluff?",
          options: ["72o", "KJo", "A5s", "99"],
          answer: 2,
          explanation:
            "A5s holds an ace, which makes AA and AK less likely for your opponent, and it can still make wheels and nut flushes when called.",
        },
        {
          type: "choice",
          prompt: "Why 3-bet QQ instead of just calling an open?",
          options: [
            "To build a bigger pot while you're likely ahead",
            "To make sure everyone folds",
            "Because calling is against the rules",
            "To see a cheaper flop",
          ],
          answer: 0,
          explanation:
            "QQ is ahead of almost every opening range. Re-raising builds the pot and stops weaker hands from seeing a cheap flop.",
        },
        {
          type: "match",
          prompt: "Match the preflop term",
          pairs: [
            ["3-bet", "Re-raise of an open"],
            ["4-bet", "Re-raise of a 3-bet"],
            ["Flat call", "Just calling a raise"],
            ["Squeeze", "3-bet after a raise and a call"],
          ],
        },
      ],
    },
    {
      id: "facing-2",
      title: "Defending the Blinds",
      exercises: [
        {
          type: "choice",
          prompt: "The button opens to 2.5 BB and the small blind folds. In the big blind, what equity do you need to call?",
          info: [
            { label: "Pot", value: "4 BB" },
            { label: "To call", value: "1.5 BB" },
          ],
          options: ["15%", "27%", "38%", "50%"],
          answer: 1,
          explanation:
            "You call 1.5 BB to win a pot of 4 BB: 1.5 ÷ (4 + 1.5) ≈ 27%. That good price is why the big blind defends so many hands.",
        },
        {
          type: "choice",
          prompt: "Why can the big blind defend more hands than any other seat?",
          options: [
            "It already has 1 BB in and closes the action",
            "It always has position after the flop",
            "Big blinds win more showdowns",
            "It gets dealt better cards",
          ],
          answer: 0,
          explanation:
            "You're getting a discount and no one can raise behind you. The trade-off is that you'll play out of position after the flop.",
        },
        {
          type: "choice",
          prompt: "The button opens to 2.5 BB. Your move?",
          hand: "9h 7h",
          info: [
            { label: "Position", value: "Big Blind" },
            { label: "Action", value: "Button raised to 2.5 BB" },
          ],
          options: ["Fold", "Call", "3-bet"],
          answer: 1,
          explanation: "97s has enough equity and plays well after the flop. At this price it's a clear defend, usually by calling.",
        },
        {
          type: "choice",
          prompt: "The button opens to 2.5 BB. Your move?",
          hand: "Jc Js",
          info: [
            { label: "Position", value: "Big Blind" },
            { label: "Action", value: "Button raised to 2.5 BB" },
          ],
          options: ["Fold", "Call", "3-bet"],
          answer: 2,
          explanation:
            "JJ is well ahead of a wide button range. 3-bet for value so you build the pot instead of playing a small pot out of position.",
        },
        {
          type: "choice",
          prompt: "The button opens to 2.5 BB. Your move?",
          hand: "7c 2d",
          info: [
            { label: "Position", value: "Big Blind" },
            { label: "Action", value: "Button raised to 2.5 BB" },
          ],
          options: ["Fold", "Call", "3-bet"],
          answer: 0,
          explanation: "Even at a good price, 72o wins too rarely and is hard to play out of position. Fold the very worst hands.",
        },
        {
          type: "choice",
          prompt: "Against a button open, the small blind should mostly…",
          options: ["3-bet or fold", "Call with any two cards", "Always fold", "Call and hope to hit"],
          answer: 0,
          explanation:
            "The small blind is out of position with the big blind still to act. Calling invites a squeeze and leads to tough spots, so strong players mostly 3-bet or fold.",
        },
      ],
    },
    {
      id: "facing-3",
      title: "Facing 3-Bets",
      exercises: [
        {
          type: "choice",
          prompt: "You open the cutoff and the button 3-bets. Your move?",
          hand: "Kd Jc",
          info: [
            { label: "Position", value: "Cutoff" },
            { label: "Action", value: "Button 3-bet to 7.5 BB" },
          ],
          options: ["Fold", "Call", "4-bet"],
          answer: 0,
          explanation: "KJo is dominated by most hands that 3-bet, and you'd play out of position. Folding is standard.",
        },
        {
          type: "choice",
          prompt: "You open under the gun and the cutoff 3-bets. Your move?",
          hand: "As Ad",
          info: [
            { label: "Position", value: "Under the Gun" },
            { label: "Action", value: "Cutoff 3-bet to 7.5 BB" },
          ],
          options: ["Fold", "Call", "4-bet"],
          answer: 2,
          explanation:
            "Aces are the best hand. 4-bet to about 20 BB to build the pot: hands like KK, QQ and AK will often put in more.",
        },
        {
          type: "choice",
          prompt: "You opened to 2.5 BB and the button 3-bets to 7.5 BB. What equity do you need to call?",
          info: [
            { label: "Pot", value: "11.5 BB" },
            { label: "To call", value: "5 BB" },
          ],
          options: ["20%", "30%", "45%", "50%"],
          answer: 1,
          explanation:
            "You call 5 BB to win 11.5 BB (the blinds, your open and the 3-bet): 5 ÷ 16.5 ≈ 30%. Out of position you need more than raw equity, so this is only the starting point.",
        },
        {
          type: "choice",
          prompt: "Why are hands like A5s popular 4-bet bluffs?",
          options: [
            "The ace blocks AA and AK",
            "They win most showdowns",
            "They are the strongest suited hands",
            "They never get called",
          ],
          answer: 0,
          explanation:
            "Holding an ace cuts the combinations of AA and AK your opponent can have, so they fold more often, and you still have outs when called.",
        },
        {
          type: "choice",
          prompt: "You opened the cutoff and the big blind 3-bets. Which hand is usually a comfortable call in position?",
          options: ["Q4o", "QJs", "J2s", "K3o"],
          answer: 1,
          explanation:
            "QJs plays well after the flop: it makes strong pairs, straights and flushes, and you have position. The others are too weak or too easily dominated.",
        },
      ],
    },
    {
      id: "facing-4",
      title: "Limpers & Isolation",
      exercises: [
        {
          type: "choice",
          prompt: "One player limps in. How big should your isolation raise be?",
          options: ["2 BB", "About 4 BB", "10 BB", "All-in"],
          answer: 1,
          explanation:
            "A common rule is 3 BB plus 1 BB for each limper. That's big enough to play heads-up and small enough to risk little when you're behind.",
        },
        {
          type: "choice",
          prompt: "Two players limp in front of you. Your move?",
          hand: "Ac Qd",
          info: [
            { label: "Position", value: "Button" },
            { label: "Action", value: "Two players limped" },
          ],
          options: ["Fold", "Call", "Raise to 5 BB"],
          answer: 2,
          explanation:
            "AQ is well ahead of limping ranges. Raise to about 5 BB (3 + 1 per limper) to isolate and take the initiative in position.",
        },
        {
          type: "choice",
          prompt: "Why isolate limpers instead of limping behind with strong hands?",
          options: [
            "To play heads-up in position against a weak range",
            "To make the pot smaller",
            "Because limping behind is illegal",
            "To let the blinds in cheaply",
          ],
          answer: 0,
          explanation:
            "Limpers usually have weak, capped ranges. A raise thins the field so your strong hand faces one opponent, often in position.",
        },
        {
          type: "choice",
          prompt: "Everyone folds to you. Limp to see a cheap flop?",
          hand: "Ts 9s",
          info: [
            { label: "Position", value: "Cutoff" },
            { label: "Action", value: "Folded to you" },
          ],
          options: ["Fold", "Limp", "Raise"],
          answer: 2,
          explanation:
            "When you're first in, raise or fold. Raising gives you fold equity and the initiative, and T9s is a standard cutoff open.",
        },
        {
          type: "match",
          prompt: "Match the preflop action",
          pairs: [
            ["Iso-raise", "Raise over limpers"],
            ["Over-limp", "Limp behind other limpers"],
            ["Open-limp", "Limp as the first player in"],
            ["Open-raise", "Raise as the first player in"],
          ],
        },
      ],
    },
  ],
};

export const MATH_UNIT: Unit = {
  id: "math",
  title: "Advanced Poker Math",
  description: "EV, implied odds, fold equity and defense frequencies.",
  color: "#0369a1",
  icon: "sigma",
  guidebook: [
    {
      heading: "Expected value (EV)",
      body: "EV is the average result of a decision if you made it many times. Multiply each outcome by its chance and add them up. Strong players choose the highest-EV option, not the one that wins most often.",
    },
    {
      heading: "Implied odds",
      body: "Implied odds are the money you expect to win later when you hit. Small pairs and suited connectors rely on them. Reverse implied odds are the opposite: hands like weak aces win small pots and lose big ones.",
    },
    {
      heading: "Fold equity",
      body: "A bluff that risks B to win a pot of P needs to work B ÷ (P + B) of the time. A half-pot bluff must work 33% of the time; a pot-sized bluff, 50%.",
    },
    {
      heading: "Minimum defense frequency",
      body: "Facing a bet B into a pot P, continue with at least P ÷ (P + B) of your range, or any two cards can bluff you profitably. Against a pot-sized bet that's 50%. Against players who rarely bluff, fold more.",
    },
    {
      heading: "Balanced bluffing",
      body: "On the river, a bet of B into P can be bluffs B ÷ (P + 2B) of the time. With a pot-sized bet that's one bluff for every two value bets, which makes calling break even.",
    },
  ],
  lessons: [
    {
      id: "math-1",
      title: "Expected Value",
      exercises: [
        {
          type: "choice",
          prompt: "What does EV (expected value) measure?",
          options: [
            "The average result of a decision over many repetitions",
            "The most you can win in one hand",
            "How often you win the pot",
            "Your total winnings this session",
          ],
          answer: 0,
          explanation: "EV weighs every possible outcome by how likely it is. A decision can lose often and still be +EV.",
        },
        {
          type: "choice",
          prompt: "A bet risks $100 to win $300 and works 40% of the time. What's its EV?",
          options: ["+$60", "+$20", "−$20", "+$120"],
          answer: 0,
          explanation: "0.4 × $300 − 0.6 × $100 = $120 − $60 = +$60.",
        },
        {
          type: "choice",
          prompt: "You call $50 with 30% equity and no more betting to come. What's the EV of calling?",
          info: [
            { label: "Pot (incl. bet)", value: "$100" },
            { label: "To call", value: "$50" },
            { label: "Your equity", value: "30%" },
          ],
          options: ["+$15", "−$5", "+$30", "−$35"],
          answer: 1,
          explanation:
            "You win the $100 pot 30% of the time and lose your $50 call 70% of the time: 0.3 × $100 − 0.7 × $50 = −$5. Fold, unless you expect to win more later.",
        },
        {
          type: "choice",
          prompt: "Same spot, but when you hit you expect to win another $40 on average. Now what's the EV of calling?",
          info: [
            { label: "Pot (incl. bet)", value: "$100" },
            { label: "To call", value: "$50" },
            { label: "Extra when you hit", value: "$40" },
          ],
          options: ["+$7", "−$5", "+$12", "−$17"],
          answer: 0,
          explanation: "0.3 × ($100 + $40) − 0.7 × $50 = $42 − $35 = +$7. Future winnings turned a losing call into a winning one.",
        },
        {
          type: "match",
          prompt: "Match the concept",
          pairs: [
            ["EV", "Average result of a decision"],
            ["Variance", "Swings around that average"],
            ["Equity", "Your share of the pot on average"],
            ["Fold equity", "Value from opponents folding"],
          ],
        },
      ],
    },
    {
      id: "math-2",
      title: "Implied Odds",
      exercises: [
        {
          type: "choice",
          prompt: "What are implied odds?",
          options: [
            "Money you expect to win on later streets when you hit",
            "The odds printed on the table",
            "Your chance of being bluffed",
            "The rake the casino takes",
          ],
          answer: 0,
          explanation: "Implied odds count future bets. They can justify calls that the pot odds alone don't.",
        },
        {
          type: "choice",
          prompt: "On the turn you call with a flush draw. How much must you win on the river when you hit to break even?",
          info: [
            { label: "Pot (incl. bet)", value: "$100" },
            { label: "To call", value: "$50" },
            { label: "Your equity", value: "20%" },
          ],
          options: ["$50", "$100", "$150", "$250"],
          answer: 1,
          explanation:
            "Break even when 0.2 × ($100 + X) = 0.8 × $50, so X = $100. If villain will pay you at least that when the flush comes, calling is fine.",
        },
        {
          type: "choice",
          prompt: "Which preflop call relies most on implied odds?",
          options: ["Calling a raise with 55 to hit a set", "Calling with AK", "Calling with KK", "Calling an all-in with AQ"],
          answer: 0,
          explanation:
            "Small pairs flop a set only about 12% of the time. They need to win a big pot when they hit, so they rely on implied odds.",
        },
        {
          type: "choice",
          prompt: "A common rule for calling to hit a set: the stacks behind should be at least how many times the call?",
          options: ["2–3 times", "5 times", "15–20 times", "100 times"],
          answer: 2,
          explanation:
            "You flop a set about 1 time in 8.5 and you won't always get paid. Needing roughly 15–20 times the call behind covers that.",
        },
        {
          type: "choice",
          prompt: "What are reverse implied odds?",
          options: [
            "When hitting your hand often still loses a big pot",
            "Winning more when you miss",
            "Getting a discount to call",
            "Odds that improve on the river",
          ],
          answer: 0,
          explanation:
            "Weak aces and dominated hands like KJ facing an early raise make second-best hands. You win small pots and lose big ones.",
        },
      ],
    },
    {
      id: "math-3",
      title: "Fold Equity",
      exercises: [
        {
          type: "choice",
          prompt: "You bluff $50 into a $100 pot. How often must villain fold for the bluff to break even?",
          options: ["25%", "33%", "50%", "67%"],
          answer: 1,
          explanation: "Risk ÷ (pot + risk) = 50 ÷ 150 ≈ 33%.",
        },
        {
          type: "choice",
          prompt: "A pot-sized bluff ($100 into $100) must work how often?",
          options: ["33%", "50%", "67%", "100%"],
          answer: 1,
          explanation: "100 ÷ (100 + 100) = 50%. Bigger bluffs need more folds.",
        },
        {
          type: "choice",
          prompt: "Villain folds to half-pot c-bets 60% of the time. Is a pure bluff c-bet profitable?",
          info: [
            { label: "Pot", value: "$100" },
            { label: "Your bet", value: "$50" },
            { label: "Villain folds", value: "60%" },
          ],
          options: ["Yes, it needs only 33%", "No, it needs 60%", "Only with a draw", "No, bluffs never profit"],
          answer: 0,
          explanation: "EV = 0.6 × $100 − 0.4 × $50 = +$40. Any fold rate above 33% makes this bluff profitable.",
        },
        {
          type: "choice",
          prompt: "Why is a semi-bluff stronger than a pure bluff?",
          options: ["It can still win when called", "It always makes villain fold", "It risks less money", "It's harder to read"],
          answer: 0,
          explanation: "A draw adds a second way to win. Fold equity plus your outs often makes betting better than checking.",
        },
        {
          type: "order",
          prompt: "Order these bluff sizes from fewest to most folds needed",
          items: ["¼ pot (20%)", "½ pot (33%)", "Pot (50%)", "2× pot (67%)"],
          explanation: "Folds needed = bet ÷ (pot + bet): 20%, 33%, 50% and 67%. Small bluffs need to work far less often.",
        },
      ],
    },
    {
      id: "math-4",
      title: "Defense Frequency",
      exercises: [
        {
          type: "choice",
          prompt: "Villain bets the size of the pot. What's your minimum defense frequency (MDF)?",
          options: ["33%", "50%", "67%", "75%"],
          answer: 1,
          explanation: "MDF = pot ÷ (pot + bet) = 100 ÷ 200 = 50%. Fold more than half your range and any two cards can bluff you profitably.",
        },
        {
          type: "choice",
          prompt: "Villain bets half the pot. What's your MDF?",
          options: ["33%", "50%", "67%", "80%"],
          answer: 2,
          explanation: "100 ÷ (100 + 50) ≈ 67%. Smaller bets require you to continue more often.",
        },
        {
          type: "choice",
          prompt: "Villain almost never bluffs the river. Should you still defend by MDF?",
          options: [
            "No, fold more against players who don't bluff enough",
            "Yes, always defend exactly MDF",
            "Call with every hand",
            "Raise more often",
          ],
          answer: 0,
          explanation: "MDF protects you against a balanced opponent. Against someone who under-bluffs, folding more wins money.",
        },
        {
          type: "choice",
          prompt: "On the river you bet the size of the pot. For a balanced range, what share of your bets can be bluffs?",
          options: ["25%", "33%", "50%", "67%"],
          answer: 1,
          explanation:
            "Bluff share = bet ÷ (pot + 2 × bet) = 100 ÷ 300 ≈ 33%: one bluff for every two value bets. Villain's call then breaks even.",
        },
        {
          type: "match",
          prompt: "Match each number to its formula",
          pairs: [
            ["MDF", "Pot ÷ (pot + bet)"],
            ["Bluff break-even", "Bet ÷ (pot + bet)"],
            ["Pot odds", "Call ÷ (pot + call)"],
            ["Balanced bluff share", "Bet ÷ (pot + 2 × bet)"],
          ],
        },
      ],
    },
  ],
};

export const READING_UNIT: Unit = {
  id: "reading",
  title: "Ranges & Hand Reading",
  description: "Think in ranges, narrow them and spot who's ahead.",
  color: "#6d28d9",
  icon: "eye",
  guidebook: [
    {
      heading: "Think in ranges",
      body: "Nobody holds just one hand: they hold a range, every hand they'd play this way. Start from their preflop action and remove hands as each decision tells you more.",
    },
    {
      heading: "Narrow with every action",
      body: "Raises and big bets make ranges stronger. Checks and calls cap them: a player who only calls preflop rarely has AA or KK.",
    },
    {
      heading: "Range shapes",
      body: "Polarized: very strong hands and bluffs. Linear: the best hands down to a cutoff. Condensed: mostly medium hands. Capped: the strongest hands are missing.",
    },
    {
      heading: "Range and nut advantage",
      body: "The preflop raiser has more big pairs and strong aces, so high-card boards favor them. Low, connected boards favor the caller, who has more suited connectors and small pairs.",
    },
    {
      heading: "Count combinations",
      body: "Weigh hands by combinations: 6 for a pair, 4 for a suited hand, 12 for an offsuit one. Cards you can see reduce those numbers.",
    },
  ],
  lessons: [
    {
      id: "reading-1",
      title: "Thinking in Ranges",
      exercises: [
        {
          type: "choice",
          prompt: "What is a range?",
          options: [
            "All the hands a player could have in this spot",
            "The gap between the blinds",
            "The best possible hand on the board",
            "A player's stack size",
          ],
          answer: 0,
          explanation: "Ranges are how strong players think: every hand the opponent could hold, weighted by how likely each is.",
        },
        {
          type: "choice",
          prompt: "A tight player opens under the gun. Which hand is least likely in their range?",
          options: ["AQs", "99", "J4o", "KQs"],
          answer: 2,
          explanation: "Tight early-position ranges are strong pairs, big aces and the best broadways. J4o is almost never in them.",
        },
        {
          type: "choice",
          prompt: "The big blind just calls a button open. Which hand is least likely?",
          options: ["76s", "KTo", "AA", "44"],
          answer: 2,
          explanation:
            "With AA the big blind would almost always 3-bet. A calling range is capped: the strongest hands are mostly missing.",
        },
        {
          type: "match",
          prompt: "Match the range shape",
          pairs: [
            ["Polarized", "Very strong hands and bluffs"],
            ["Linear", "The best hands down to a cutoff"],
            ["Capped", "Missing the strongest hands"],
            ["Condensed", "Mostly medium-strength hands"],
          ],
        },
        {
          type: "choice",
          prompt: "Why put opponents on a range instead of one exact hand?",
          options: [
            "You rarely know their exact hand, so you decide against everything they could hold",
            "Ranges are required by the rules",
            "It makes you call more",
            "Exact reads are always wrong",
          ],
          answer: 0,
          explanation: "Decisions made against the whole range hold up even when you can't guess the exact cards.",
        },
      ],
    },
    {
      id: "reading-2",
      title: "Narrowing Ranges",
      exercises: [
        {
          type: "choice",
          prompt: "A passive player who has only called suddenly check-raises the turn. Their range is mostly…",
          options: ["Strong hands like two pair or better", "Bluffs", "Weak pairs", "Random hands"],
          answer: 0,
          explanation: "Passive players rarely raise without a strong hand. A late check-raise from them is heavily weighted to value.",
        },
        {
          type: "choice",
          prompt: "Villain called preflop, flop and turn, then raised your river bet when the flush card came. Their range is…",
          options: [
            "Polarized: mostly flushes and a few bluffs",
            "Mostly one-pair hands",
            "Mostly weak draws",
            "Completely random",
          ],
          answer: 0,
          explanation:
            "A river raise is a very strong action. With one pair they'd usually just call, so the range splits into big hands and the occasional bluff.",
        },
        {
          type: "choice",
          prompt: "How many AK combinations can villain hold on this board?",
          board: "As Kd 7c",
          options: ["4", "9", "12", "16"],
          answer: 1,
          explanation: "Three aces and three kings are left: 3 × 3 = 9 combinations.",
        },
        {
          type: "choice",
          prompt: "Villain's river bet represents 6 combos of value and 12 combos of bluffs. How often does your bluff-catcher win?",
          options: ["33%", "50%", "67%", "75%"],
          answer: 2,
          explanation: "Your hand beats the 12 bluffs out of 18 total combinations: 12 ÷ 18 ≈ 67%.",
        },
        {
          type: "choice",
          prompt: "You hold the ace of hearts on a board with three hearts. What does that tell you?",
          hand: "Ah 5c",
          board: "Kh 8h 3h",
          options: [
            "Villain can't have the nut flush",
            "Villain must have a flush",
            "Nothing changes",
            "Villain is bluffing",
          ],
          answer: 0,
          explanation:
            "That's a blocker: with the A♥ in your hand, villain can't hold the ace-high flush. Their strongest hands become less likely and your bluffs more believable.",
        },
      ],
    },
    {
      id: "reading-3",
      title: "Range Advantage",
      exercises: [
        {
          type: "choice",
          prompt: "UTG raised and the big blind called. Who has the range advantage on this flop?",
          board: "As Kd 4c",
          options: ["UTG, the preflop raiser", "The big blind", "Neither", "Whoever acts last"],
          answer: 0,
          explanation: "UTG has far more AA, KK, AK and AQ. High-card boards favor the preflop raiser.",
        },
        {
          type: "choice",
          prompt: "The button raised and the big blind called. Who has more of the strongest hands here?",
          board: "7h 6h 5c",
          options: ["The big blind", "The button", "They're equal", "Nobody can have a strong hand"],
          answer: 0,
          explanation:
            "The big blind defends many suited connectors and small pairs, so it has more straights, two pairs and sets on low, connected boards.",
        },
        {
          type: "choice",
          prompt: "With a big range advantage on a dry board, a common c-bet strategy is…",
          options: ["Bet small with most of your range", "Check your whole range", "Overbet only your best hands", "Always go all-in"],
          answer: 0,
          explanation:
            "When your whole range is ahead, a small bet with most hands wins the pot often and gets value from weaker hands cheaply.",
        },
        {
          type: "choice",
          prompt: "When you have the nut advantage on a wet board, which sizing fits?",
          options: ["Larger bets with a polarized range", "Tiny bets with everything", "Checking every hand", "Min-bets only"],
          answer: 0,
          explanation:
            "If you have more of the very best hands, big bets pressure villain's medium hands while your strongest hands get paid.",
        },
        {
          type: "scenario",
          prompt: "Reading a tight opener",
          hand: "Kh Qh",
          setup: [{ label: "Position", value: "Button" }, { label: "Villain", value: "Tight UTG" }, STACKS],
          steps: [
            {
              street: "Preflop",
              prompt: "A tight UTG player (opens about 13% of hands) raises to 2.5 BB. Which range should you put them on?",
              options: [
                "Strong hands: 77+, AJ+, KQ and some suited broadways",
                "Any two cards",
                "Only AA and KK",
                "Mostly small suited connectors",
              ],
              answer: 0,
              explanation:
                "Tight early openers play pairs, big aces and the best broadways. You call with KQs in position and start from that range.",
            },
            {
              street: "Flop",
              board: "Ks 9h 4c",
              info: [
                { label: "Pot", value: "6.5 BB" },
                { label: "UTG bets", value: "3 BB" },
              ],
              prompt: "You called. UTG bets 3 BB. Your move?",
              options: ["Fold", "Call", "Raise"],
              answer: 1,
              explanation:
                "Top pair is ahead of UTG's underpairs and missed aces. A raise folds those out and gets called by AK and sets, so call and keep the pot controlled.",
            },
            {
              street: "Turn",
              board: "Ks 9h 4c 2d",
              info: [
                { label: "Pot", value: "12.5 BB" },
                { label: "UTG bets", value: "8 BB" },
              ],
              prompt: "UTG bets 8 BB. Your move?",
              options: ["Fold", "Call", "Raise"],
              answer: 1,
              explanation:
                "UTG can still have QQ–TT, AQ, AJ and some bluffs, and the 2 changes nothing. You beat enough of that range to call again.",
            },
            {
              street: "River",
              board: "Ks 9h 4c 2d 7s",
              info: [
                { label: "Pot", value: "28.5 BB" },
                { label: "UTG bets", value: "28 BB" },
              ],
              prompt: "UTG bets about the pot. Your move?",
              options: ["Fold", "Call", "Raise"],
              answer: 0,
              explanation:
                "A tight player betting three streets, big on the river, has mostly AK, KK, AA and sets. Few bluffs remain, so top pair with a queen kicker folds.",
            },
          ],
          summary: "Start from the preflop range and let each bet narrow it. A tight player's third big bet is rarely a bluff.",
        },
      ],
    },
  ],
};

export const POSTFLOP2_UNIT: Unit = {
  id: "postflop2",
  title: "Advanced Postflop",
  description: "C-bet strategy, sizing, check-raises and river decisions.",
  color: "#0f766e",
  icon: "waypoints",
  guidebook: [
    {
      heading: "C-bet with a plan",
      body: "Bet often and small when the board favors your range and you're heads-up. Check more on boards that hit the caller, in multiway pots and out of position.",
    },
    {
      heading: "Sizing tells a story",
      body: "Small bets (about ⅓ pot) go with a wide range. Larger bets (¾ pot or more) go with a polarized range of strong hands and good bluffs. Overbets need a nut advantage.",
    },
    {
      heading: "Check-raise",
      body: "From the big blind, check-raise your strongest hands and your best draws. Draws give you fold equity now and outs when called.",
    },
    {
      heading: "Barrel with purpose",
      body: "Keep betting the turn when the card helps your range, like an overcard, or gives your bluffs new equity. Slow down on cards that complete the caller's draws.",
    },
    {
      heading: "River decisions",
      body: "Value bet when worse hands will call. Bluff with hands that can't win at showdown, ideally ones that block villain's calling hands. When bluff-catching, compare the price with how often villain bluffs.",
    },
  ],
  lessons: [
    {
      id: "postflop2-1",
      title: "C-Bet Strategy",
      exercises: [
        {
          type: "choice",
          prompt: "You raised on the button and the big blind called. On this flop, what's a typical plan?",
          board: "Ac 8d 3s",
          options: ["Bet small with most of your range", "Check every hand", "Overbet all-in", "Bet only with an ace"],
          answer: 0,
          explanation:
            "Dry ace-high boards favor the raiser's range. A small bet (about ⅓ pot) with most hands folds out many of the big blind's weak hands cheaply.",
        },
        {
          type: "choice",
          prompt: "Three players saw the flop. How should your c-betting change?",
          options: [
            "Bet less often, mostly with strong hands and good draws",
            "Bet more often with bluffs",
            "Always check",
            "Bet all-in",
          ],
          answer: 0,
          explanation: "With two opponents it's much likelier that someone hit. Bluffs work less often, so tighten up.",
        },
        {
          type: "choice",
          prompt: "You raised from early position and are out of position on this flop. Best general approach?",
          board: "Jh Th 8s",
          options: ["Check more often", "Bet every hand", "Overbet", "Give up on every hand"],
          answer: 0,
          explanation:
            "Connected, two-tone boards hit the caller's range hard. Checking protects your range and avoids building a pot with weak hands.",
        },
        {
          type: "choice",
          prompt: "The big blind checks to you. Your move?",
          hand: "Ah Kh",
          board: "Qs 7h 2h",
          info: [
            { label: "Position", value: "Button" },
            { label: "Pot", value: "5.5 BB" },
          ],
          options: ["Check behind", "Bet", "Fold"],
          answer: 1,
          explanation:
            "The nut flush draw plus two overcards is a strong semi-bluff. Betting wins the pot now or builds it for when you hit.",
        },
        {
          type: "choice",
          prompt: "What is \"range betting\"?",
          options: [
            "Betting your whole range with one small size",
            "Betting only your best hands",
            "Betting a different size with each hand",
            "Checking your whole range",
          ],
          answer: 0,
          explanation: "On boards where your whole range is strong, a small bet with everything is simple and hard to exploit.",
        },
      ],
    },
    {
      id: "postflop2-2",
      title: "Bet Sizing",
      exercises: [
        {
          type: "choice",
          prompt: "When is a large bet (¾ pot or more) usually best?",
          options: [
            "When your range is polarized: very strong hands and bluffs",
            "When you have a medium pair",
            "On every flop",
            "When you want a cheap showdown",
          ],
          answer: 0,
          explanation: "Big bets put maximum pressure on bluff-catchers. Use them when your betting hands are either very strong or bluffs.",
        },
        {
          type: "choice",
          prompt: "Why bet small on dry boards?",
          options: [
            "Villain has few strong hands, so small bets win cheaply and still get value",
            "Small bets always get called",
            "Big bets aren't allowed",
            "To protect against flush draws",
          ],
          answer: 0,
          explanation: "On dry boards villain folds or calls with weak hands either way, so there's no need to risk more.",
        },
        {
          type: "choice",
          prompt: "When does an overbet (more than the pot) work best?",
          options: [
            "When you have more of the nuts than villain",
            "When you have a weak pair",
            "When villain has the nut advantage",
            "On the first hand of a session",
          ],
          answer: 0,
          explanation: "Overbets are for spots where you can have the strongest hands and villain can't. Their capped range struggles to call.",
        },
        {
          type: "choice",
          prompt: "River value bet against a calling station. Which size?",
          hand: "Kd Qd",
          board: "Kc 9s 5h 3d 2c",
          info: [
            { label: "Villain", value: "Calling station" },
            { label: "Pot", value: "40 BB" },
          ],
          options: ["Check", "Bet small, 10 BB", "Bet big, 30 BB"],
          answer: 2,
          explanation: "Calling stations call too often with weaker hands. Bigger value bets win more from them.",
        },
        {
          type: "match",
          prompt: "Match the sizing to its use",
          pairs: [
            ["⅓ pot", "Range bet on dry boards"],
            ["¾ pot", "Strong hands and draws on wet boards"],
            ["Overbet", "Polarized with a nut advantage"],
            ["Check", "When the board favors villain"],
          ],
        },
      ],
    },
    {
      id: "postflop2-3",
      title: "Check-Raising",
      exercises: [
        {
          type: "choice",
          prompt: "Which hands make good flop check-raises from the big blind?",
          options: ["Strong made hands and good draws", "Weak pairs", "Any two cards", "Only the nuts"],
          answer: 0,
          explanation:
            "Value hands want to build the pot, and draws gain fold equity plus outs. Weak pairs prefer to call or fold.",
        },
        {
          type: "choice",
          prompt: "The button c-bets 2 BB into 5.5 BB. Your move?",
          hand: "9h 8h",
          board: "Th 7c 2h",
          info: [
            { label: "Position", value: "Big Blind" },
            { label: "Action", value: "Button bets 2 BB" },
          ],
          options: ["Fold", "Call", "Check-raise"],
          answer: 2,
          explanation:
            "You have an open-ended straight draw plus a flush draw: 15 outs. Check-raising wins the pot often, and you're rarely in bad shape when called.",
        },
        {
          type: "choice",
          prompt: "Why include draws in your check-raising range?",
          options: [
            "So your raises aren't only strong hands, and draws win two ways",
            "Draws always win",
            "To keep the pot small",
            "Because it's required",
          ],
          answer: 0,
          explanation: "If you only check-raised the nuts, good players would fold everything but the nuts. Draws keep your raises credible.",
        },
        {
          type: "choice",
          prompt: "What is SPR?",
          options: [
            "Stack-to-pot ratio: effective stack ÷ pot",
            "Showdown percentage rate",
            "Small pot raise",
            "The size of the small blind",
          ],
          answer: 0,
          explanation:
            "SPR tells you how committed you are. A low SPR (under about 3) means top pair is usually happy to get all-in; a high SPR calls for more caution.",
        },
        {
          type: "choice",
          prompt: "The SPR is 2 on the flop and you have top pair, good kicker. Villain moves all-in. Usually…",
          options: ["Call: you're committed at this SPR", "Fold: it's always a trap", "Wait and decide on the river", "Call only with the nuts"],
          answer: 0,
          explanation:
            "With little money behind compared with the pot, you get a great price, and top pair, good kicker is ahead of many hands that shove.",
        },
      ],
    },
    {
      id: "postflop2-4",
      title: "Turn & River",
      exercises: [
        {
          type: "choice",
          prompt: "You c-bet the flop as the preflop raiser and got called. Which turn card is usually best to bet again?",
          options: [
            "An ace or king that favors your range",
            "A card that completes the caller's straight draws",
            "A card that pairs the lowest card on the board",
            "Any card is the same",
          ],
          answer: 0,
          explanation: "Overcards hit the raiser's range more than the caller's, and the caller's medium pairs get uncomfortable.",
        },
        {
          type: "choice",
          prompt: "What makes a good river bluff?",
          options: [
            "A missed hand that can't win at showdown and blocks villain's calls",
            "Your strongest made hand",
            "A hand that beats most of villain's range",
            "Any hand at all",
          ],
          answer: 0,
          explanation: "Bluff with hands that have no showdown value. Blocking villain's likely calling hands makes folds more likely.",
        },
        {
          type: "choice",
          prompt: "River. You think villain bluffs 30% of the time here. Your bluff-catcher should…",
          info: [
            { label: "Pot before bet", value: "$120" },
            { label: "Villain bets", value: "$60" },
            { label: "Villain bluffs", value: "30%" },
          ],
          options: ["Fold", "Call"],
          answer: 1,
          explanation: "You need 60 ÷ (120 + 60 + 60) = 25% to call. Beating 30% of their range is enough, so call.",
        },
        {
          type: "choice",
          prompt: "A very passive player makes a big river bet. With one pair you should usually…",
          options: [
            "Fold: passive players rarely bluff big",
            "Call: they must be bluffing",
            "Raise all-in",
            "Call just to see their cards",
          ],
          answer: 0,
          explanation: "Big river bets from passive players are almost always strong. Against under-bluffers, fold more than MDF suggests.",
        },
        {
          type: "scenario",
          prompt: "Value on three streets",
          hand: "As Kd",
          setup: [{ label: "Position", value: "Button" }, STACKS],
          steps: [
            {
              street: "Preflop",
              prompt: "Everyone folds to you. Your action?",
              options: ["Fold", "Call", "Raise to 2.5 BB"],
              answer: 2,
              explanation: "AK is a raise from any position.",
            },
            {
              street: "Flop",
              board: "Kh 8s 3d",
              info: [{ label: "Pot", value: "5.5 BB" }],
              prompt: "The big blind calls and checks. Your action?",
              options: ["Check", "Bet 2 BB", "Bet 8 BB"],
              answer: 1,
              explanation: "Top pair, top kicker on a dry board. A small bet gets called by worse kings, eights and draws.",
            },
            {
              street: "Turn",
              board: "Kh 8s 3d 7c",
              info: [{ label: "Pot", value: "9.5 BB" }],
              prompt: "The big blind calls and checks again. Your action?",
              options: ["Check", "Bet 6 BB", "Bet 40 BB"],
              answer: 1,
              explanation: "Keep betting for value. Worse kings, 8x and straight draws like 96 and T9 still call.",
            },
            {
              street: "River",
              board: "Kh 8s 3d 7c 2s",
              info: [{ label: "Pot", value: "21.5 BB" }],
              prompt: "The big blind calls and checks. Your action?",
              options: ["Check", "Bet 14 BB", "Bet 80 BB"],
              answer: 1,
              explanation:
                "Worse kings still call a normal bet. Checking wastes value, and a huge overbet only gets called by hands that beat you.",
            },
          ],
          summary: "With a strong hand, plan three streets of value and size each bet so worse hands can call.",
        },
      ],
    },
  ],
};

export const EXPLOIT_UNIT: Unit = {
  id: "exploit",
  title: "Exploiting Opponents",
  description: "Player types, stats and profitable adjustments.",
  color: "#be123c",
  icon: "users",
  guidebook: [
    {
      heading: "Common player types",
      body: "Nits play few hands and rarely bluff. Calling stations call too much. Maniacs raise and bluff constantly. Tight-aggressive regulars (TAGs) play few hands and play them well.",
    },
    {
      heading: "The key stats",
      body: "VPIP is how often a player puts money in preflop; PFR is how often they raise. A big gap between the two means a passive player who calls too much.",
    },
    {
      heading: "Adjust to mistakes",
      body: "Against calling stations, value bet thinner and bluff less. Against nits, steal their blinds and fold to their big bets. Against maniacs, tighten up and let them bluff into you.",
    },
    {
      heading: "Samples and tells",
      body: "Stats need a few hundred hands to mean much. Physical tells are unreliable; betting patterns tell you more.",
    },
    {
      heading: "Table selection",
      body: "Your win rate depends on who you play against. Choosing tables with weaker players is one of the easiest ways to win more.",
    },
  ],
  lessons: [
    {
      id: "exploit-1",
      title: "Player Types",
      exercises: [
        {
          type: "match",
          prompt: "Match the player type",
          pairs: [
            ["Nit", "Plays very few hands, rarely bluffs"],
            ["Calling station", "Calls too much, rarely folds"],
            ["Maniac", "Raises and bluffs constantly"],
            ["TAG", "Few hands, played aggressively"],
          ],
        },
        {
          type: "choice",
          prompt: "What's the best adjustment against a calling station?",
          options: ["Value bet thinner and bluff less", "Bluff more often", "Only play premium hands", "Slowplay your strong hands"],
          answer: 0,
          explanation: "They call with worse hands, so bet your medium-strong hands for value and stop bluffing them.",
        },
        {
          type: "choice",
          prompt: "A nit raises your river bet. Your move?",
          hand: "Ah Qs",
          board: "Qd 8c 5s 3h 2d",
          info: [{ label: "Villain", value: "Nit" }],
          options: ["Fold", "Call", "Re-raise"],
          answer: 0,
          explanation: "Nits almost never raise the river as a bluff. Top pair is too weak against their value range.",
        },
        {
          type: "choice",
          prompt: "How should you play against a maniac?",
          options: [
            "Tighten up and call down lighter with good hands",
            "Bluff them constantly",
            "Fold everything",
            "Limp every hand",
          ],
          answer: 0,
          explanation: "Maniacs bet too much with weak hands. Let them bluff into your strong and medium hands instead of bluffing back.",
        },
        {
          type: "choice",
          prompt: "Which opponent type is usually the most profitable to play against?",
          options: [
            "Loose-passive calling stations",
            "Tight-aggressive regulars",
            "Solid professionals",
            "Nits who fold too much",
          ],
          answer: 0,
          explanation: "They put money in with weak hands and rarely punish you with aggression. Value betting them is how most winners make money.",
        },
      ],
    },
    {
      id: "exploit-2",
      title: "Reading Stats",
      exercises: [
        {
          type: "choice",
          prompt: "What does VPIP measure?",
          options: [
            "How often a player voluntarily puts money in preflop",
            "How often they win at showdown",
            "How many hands they've played",
            "Their average bet size",
          ],
          answer: 0,
          explanation: "VPIP (voluntarily put money in pot) counts calls and raises preflop, but not the blinds they're forced to post.",
        },
        {
          type: "choice",
          prompt: "What does PFR measure?",
          options: ["How often a player raises preflop", "How often they fold preflop", "Profit per hand", "How often they reach the river"],
          answer: 0,
          explanation: "PFR (preflop raise) shows aggression. Strong players' PFR is close to their VPIP.",
        },
        {
          type: "choice",
          prompt: "A player's stats are VPIP 45 / PFR 8. What type are they?",
          options: ["Loose-passive (calling station)", "Tight-aggressive", "Nit", "Maniac"],
          answer: 0,
          explanation: "They enter 45% of pots but raise only 8%: lots of limping and calling.",
        },
        {
          type: "choice",
          prompt: "A player's stats are VPIP 14 / PFR 12. What type are they?",
          options: ["Tight-aggressive", "Loose-passive", "Maniac", "Calling station"],
          answer: 0,
          explanation: "They play few hands and raise almost all of them.",
        },
        {
          type: "choice",
          prompt: "After 30 hands, a player shows VPIP 60. What should you conclude?",
          options: [
            "Not much yet: 30 hands is a tiny sample",
            "They're definitely a maniac",
            "They always play 60% of hands",
            "Stats are useless",
          ],
          answer: 0,
          explanation: "Short samples swing wildly. Treat early stats as hints and wait for a few hundred hands.",
        },
      ],
    },
    {
      id: "exploit-3",
      title: "Adjusting Your Game",
      exercises: [
        {
          type: "choice",
          prompt: "Both blinds are very tight and fold too often. Everyone folds to you. Your move?",
          hand: "Jc 5d",
          info: [
            { label: "Position", value: "Button" },
            { label: "Blinds", value: "Very tight" },
          ],
          options: ["Fold", "Raise"],
          answer: 1,
          explanation: "Tight blinds fold too often, so steal more. Your normal button range can widen against them.",
        },
        {
          type: "choice",
          prompt: "Your table is full of calling stations. What changes?",
          options: ["Bluff less and bet bigger for value", "Bluff more", "Play more hands out of position", "Stop value betting"],
          answer: 0,
          explanation: "They don't fold, so bluffs lose money, but they pay off your good hands. Size up your value bets.",
        },
        {
          type: "choice",
          prompt: "A regular 3-bets you 15% of the time, which is very often. How do you adjust?",
          options: [
            "Continue more often: 4-bet and call with a wider range",
            "Fold to every 3-bet",
            "Open more hands",
            "Stop playing",
          ],
          answer: 0,
          explanation: "If they 3-bet that often, many of their 3-bets are light. Folding too much lets them profit, so defend wider.",
        },
        {
          type: "choice",
          prompt: "What is table selection?",
          options: [
            "Choosing games with weaker opponents",
            "Choosing the seat closest to the dealer",
            "Playing only one table",
            "Choosing the highest stakes",
          ],
          answer: 0,
          explanation: "Your results depend on who you play. The same skill wins far more at a table of recreational players.",
        },
        {
          type: "choice",
          prompt: "How much should you rely on physical tells?",
          options: [
            "A little: betting patterns are more reliable",
            "Completely: tells never lie",
            "More than your cards",
            "Only when playing online",
          ],
          answer: 0,
          explanation: "Tells are noisy and easy to misread. How a player bets over many hands tells you more.",
        },
      ],
    },
  ],
};

export const MTT_UNIT: Unit = {
  id: "mtt",
  title: "Tournament Strategy",
  description: "ICM, stack sizes and the bubble.",
  color: "#a16207",
  icon: "crown",
  guidebook: [
    {
      heading: "Chips aren't money",
      body: "In a tournament, doubling your chips doesn't double your prize equity. The Independent Chip Model (ICM) converts stacks into their real-money value.",
    },
    {
      heading: "Risk premium",
      body: "Because busting is so costly, you need more equity to call an all-in than chip odds alone suggest. That extra is the risk premium, and it's highest near the bubble and big pay jumps.",
    },
    {
      heading: "Stack depth changes everything",
      body: "40+ BB: normal deep-stack play. 20–40 BB: 3-bet shoves appear. 10–20 BB: open shoves and re-shoves. Under about 10 BB: push or fold.",
    },
    {
      heading: "Use the push/fold solver",
      body: "For short stacks, the Strategy charts show the exact heads-up equilibrium. With more players left to act, shove somewhat tighter, but the charts show which hands matter.",
    },
    {
      heading: "Pressure on the bubble",
      body: "Big stacks can raise often because medium stacks must avoid busting. Medium stacks should tighten their calling ranges; short stacks look for good shoving spots.",
    },
  ],
  lessons: [
    {
      id: "mtt-1",
      title: "ICM Basics",
      exercises: [
        {
          type: "choice",
          prompt: "What does ICM stand for?",
          options: ["Independent Chip Model", "Internal Cash Method", "Instant Chip Multiplier", "International Card Match"],
          answer: 0,
          explanation: "ICM estimates each player's share of the prize pool from the chip stacks.",
        },
        {
          type: "choice",
          prompt: "Why is a chip you lose worth more than a chip you win in a tournament?",
          options: [
            "Doubling your chips doesn't double your prize money, but busting ends your chances",
            "Chips gain value over time",
            "Losing chips costs rake",
            "It isn't: chips are always equal",
          ],
          answer: 0,
          explanation: "Prize money is spread across places, so chip gains have diminishing value while busting loses everything.",
        },
        {
          type: "choice",
          prompt: "Three players remain with equal stacks. The prizes are $500, $300 and $200. What's each player's ICM equity?",
          options: ["$200", "$333", "$500", "$1,000"],
          answer: 1,
          explanation: "With equal stacks everyone has the same equity: $1,000 ÷ 3 ≈ $333.",
        },
        {
          type: "choice",
          prompt: "What is a risk premium?",
          options: [
            "The extra equity you need to call an all-in because of ICM",
            "A fee to enter a tournament",
            "A bonus for the chip leader",
            "Insurance against bad beats",
          ],
          answer: 0,
          explanation: "If chip EV says you need 45% to call, ICM might say 55%. The difference is the risk premium.",
        },
        {
          type: "choice",
          prompt: "Near the bubble, who is under the most ICM pressure?",
          options: [
            "Medium stacks facing all-ins from big stacks",
            "The chip leader",
            "Players who are already out",
            "Nobody",
          ],
          answer: 0,
          explanation: "Medium stacks lose a lot of equity by busting but gain little by doubling, so big stacks can pressure them.",
        },
      ],
    },
    {
      id: "mtt-2",
      title: "Stack Sizes",
      exercises: [
        {
          type: "match",
          prompt: "Match the stack size to the strategy",
          pairs: [
            ["40+ BB", "Normal deep-stack play"],
            ["20–30 BB", "3-bet shoves instead of calling"],
            ["Under 10 BB", "Push or fold"],
            ["1–3 BB", "Shove almost any hand"],
          ],
        },
        {
          type: "choice",
          prompt: "Everyone folds to you on the button. Your move?",
          hand: "Ks 8d",
          info: [
            { label: "Stack", value: "8 BB" },
            { label: "Position", value: "Button" },
          ],
          options: ["Fold", "Min-raise", "All-in"],
          answer: 2,
          explanation:
            "At 8 BB, K8o is a clear shove from the button. Raising and folding to a re-raise wastes a big part of your stack.",
        },
        {
          type: "choice",
          prompt: "Heads-up at 10 BB with no ante, about what share of hands does the small blind shove at equilibrium?",
          options: ["20%", "40%", "60%", "90%"],
          answer: 2,
          explanation:
            "PokerLingo's push/fold solver shows about 59%: short stacks shove very wide heads-up. Explore it in Strategy charts.",
        },
        {
          type: "choice",
          prompt: "Why do antes make you play more hands?",
          options: [
            "They add dead money, so winning the pot is worth more",
            "They shrink everyone's stack to zero",
            "They make hands stronger",
            "They don't change anything",
          ],
          answer: 0,
          explanation: "More money in the pot before the cards are dealt makes stealing it more profitable.",
        },
        {
          type: "choice",
          prompt: "A loose player opens from the hijack. Your move?",
          hand: "As Qc",
          info: [
            { label: "Stack", value: "25 BB" },
            { label: "Position", value: "Cutoff" },
            { label: "Action", value: "Hijack raised to 2.2 BB" },
          ],
          options: ["Fold", "Call", "3-bet all-in"],
          answer: 2,
          explanation:
            "At 25 BB, re-shoving AQ applies maximum pressure and avoids tough spots after the flop. A loose opener folds often, and you're in good shape when called.",
        },
      ],
    },
    {
      id: "mtt-3",
      title: "Bubbles & Final Tables",
      exercises: [
        {
          type: "choice",
          prompt: "You're a medium stack on the bubble and the chip leader shoves. Usually…",
          hand: "Ad Jc",
          info: [
            { label: "Stage", value: "Bubble" },
            { label: "Action", value: "Chip leader shoves" },
          ],
          options: ["Fold", "Call"],
          answer: 0,
          explanation:
            "AJ is ahead of a wide shoving range, but busting on the bubble costs a lot of equity. ICM usually makes this a fold for a medium stack.",
        },
        {
          type: "choice",
          prompt: "You're the chip leader near the bubble. You should…",
          options: [
            "Raise more often to pressure medium stacks",
            "Play only premium hands",
            "Call every all-in",
            "Stop playing until you're in the money",
          ],
          answer: 0,
          explanation: "Medium stacks can't afford to fight back without strong hands, so your raises win a lot of blinds.",
        },
        {
          type: "choice",
          prompt: "At a final table, big pay jumps mean…",
          options: [
            "ICM pressure is high and survival matters more",
            "Chips matter less than ever",
            "Everyone should play the same way",
            "Blinds stop increasing",
          ],
          answer: 0,
          explanation: "Every elimination moves you up the payouts, so the cost of busting is high.",
        },
        {
          type: "choice",
          prompt: "An ICM deal at a final table splits the prize pool according to…",
          options: ["Each player's ICM equity", "Equal shares for everyone", "Who won the most hands", "The dealer's decision"],
          answer: 0,
          explanation: "An ICM chop pays each player the dollar value ICM assigns to their stack.",
        },
        {
          type: "choice",
          prompt: "Why can short stacks shove wider when medium stacks are being careful on the bubble?",
          options: [
            "Medium stacks call less, so shoves win the blinds more often",
            "Short stacks get better cards",
            "There are no blinds on the bubble",
            "Shoving is always correct",
          ],
          answer: 0,
          explanation: "Fold equity goes up when opponents are afraid to call.",
        },
      ],
    },
  ],
};

export const MINDSET_UNIT: Unit = {
  id: "mindset",
  title: "Mental Game & Study",
  description: "Bankroll, variance, tilt control and a study routine.",
  color: "#475569",
  icon: "lightbulb",
  guidebook: [
    {
      heading: "Bankroll by format",
      body: "Keep at least 20–40 buy-ins for cash games and 100 or more for tournaments, where swings are much bigger. Move down when you drop below your rule.",
    },
    {
      heading: "Variance is normal",
      body: "Even strong winners have downswings of 20 buy-ins or more. Measure your win rate in big blinds per 100 hands (bb/100) over tens of thousands of hands.",
    },
    {
      heading: "Know your tilt",
      body: "Tilt comes in types: injustice after bad beats, entitlement, revenge and desperation. Set stop-loss and break rules before you play.",
    },
    {
      heading: "Raise your worst game",
      body: "Your worst game costs you the most. Improving how you play when tired or frustrated raises your average more than polishing your best play.",
    },
    {
      heading: "A study loop",
      body: "Play focused sessions, tag tough hands, review them with math and ranges, then drill the weak spot. Repeat every week.",
    },
  ],
  lessons: [
    {
      id: "mindset-1",
      title: "Bankroll & Variance",
      exercises: [
        {
          type: "choice",
          prompt: "How big a bankroll do most experienced players recommend for cash games?",
          options: ["2–5 buy-ins", "20–40 buy-ins", "1,000 buy-ins", "Whatever is in your wallet"],
          answer: 1,
          explanation: "20–40 buy-ins lets a winning player survive normal downswings without going broke.",
        },
        {
          type: "choice",
          prompt: "Why do tournament players need a much bigger bankroll?",
          options: [
            "Swings are far bigger: most money comes from rare deep runs",
            "Tournaments cost more to enter",
            "You can't lose money in tournaments",
            "The blinds are smaller",
          ],
          answer: 0,
          explanation: "Most tournaments end without a cash, so 100 or more buy-ins is the usual guideline.",
        },
        {
          type: "choice",
          prompt: "A winning player loses 20 buy-ins over a month. Most likely…",
          options: [
            "It's normal variance: downswings like this happen to winners",
            "They've forgotten how to play",
            "The game is rigged",
            "They should quit forever",
          ],
          answer: 0,
          explanation: "Review your play for leaks, but big downswings are a normal part of poker.",
        },
        {
          type: "choice",
          prompt: "How is a cash-game win rate usually measured?",
          options: ["Big blinds per 100 hands (bb/100)", "Percentage of hands won", "Dollars per session", "Pots per hour"],
          answer: 0,
          explanation: "bb/100 compares results across stakes. Solid winners at small stakes often make a few bb/100.",
        },
        {
          type: "choice",
          prompt: "Your bankroll drops below your minimum for your stakes. What should you do?",
          options: [
            "Move down in stakes until it recovers",
            "Move up to win it back faster",
            "Keep playing the same",
            "Borrow money",
          ],
          answer: 0,
          explanation: "Moving down protects you from going broke during a downswing. Move back up when your bankroll recovers.",
        },
      ],
    },
    {
      id: "mindset-2",
      title: "Tilt Control",
      exercises: [
        {
          type: "match",
          prompt: "Match the type of tilt",
          pairs: [
            ["Injustice tilt", "Anger after bad beats"],
            ["Entitlement tilt", "Feeling you deserve to win"],
            ["Revenge tilt", "Targeting a player who beat you"],
            ["Desperation tilt", "Chasing losses to get even"],
          ],
        },
        {
          type: "choice",
          prompt: "What's the most reliable way to stop tilt from costing you money?",
          options: [
            "Set stop-loss and break rules before you play",
            "Play through it",
            "Move up in stakes",
            "Play more tables",
          ],
          answer: 0,
          explanation: "Decide your limits while you're calm. In the moment, tilt makes every bad decision feel reasonable.",
        },
        {
          type: "choice",
          prompt: "Which improvement usually raises your overall results the most?",
          options: ["Improving your worst game", "Polishing your best plays", "Learning fancy bluffs", "Playing longer sessions"],
          answer: 0,
          explanation: "Your biggest losses come from your worst play. Raising the floor raises your average.",
        },
        {
          type: "choice",
          prompt: "Judging a decision only by whether it won the hand is called…",
          options: ["Results-oriented thinking", "Hand reading", "Variance control", "Range balancing"],
          answer: 0,
          explanation: "Good decisions sometimes lose and bad ones sometimes win. Judge the decision by the information you had.",
        },
        {
          type: "choice",
          prompt: "You've played for 5 hours and feel tired and irritated. Best move?",
          options: ["End the session", "Play more tables to catch up", "Raise your stakes", "Play every hand to stay awake"],
          answer: 0,
          explanation: "Tired, frustrated play is when you make your most expensive mistakes.",
        },
      ],
    },
    {
      id: "mindset-3",
      title: "How to Study",
      exercises: [
        {
          type: "order",
          prompt: "Put the study loop in order",
          items: ["Play a focused session", "Tag difficult hands", "Review them with math and ranges", "Drill the weak spot"],
          explanation: "Playing shows you where you struggle; reviewing and drilling fix it. Repeat every week.",
        },
        {
          type: "choice",
          prompt: "Which habit improves players fastest?",
          options: [
            "Reviewing your own hands regularly",
            "Watching only highlight videos",
            "Playing more hands without review",
            "Memorizing famous hands",
          ],
          answer: 0,
          explanation: "Your own hands show your own leaks. Regular review turns experience into skill.",
        },
        {
          type: "choice",
          prompt: "You've won over your last 2,000 hands. What does that prove?",
          options: [
            "Very little: 2,000 hands is mostly noise",
            "You're a top player",
            "You should move up two stakes",
            "Your strategy is perfect",
          ],
          answer: 0,
          explanation: "Results over a few thousand hands are dominated by luck. Judge your play by your decisions and long samples.",
        },
        {
          type: "choice",
          prompt: "Your stats show you fold to 3-bets 75% of the time. What does that suggest?",
          options: [
            "You fold too often, so opponents can 3-bet you light",
            "You're playing perfectly",
            "You call too much",
            "You should never open",
          ],
          answer: 0,
          explanation: "Opponents profit from 3-bet bluffs against you. Defend more strong hands by calling or 4-betting.",
        },
        {
          type: "choice",
          prompt: "What's a sensible goal for your first months of serious play?",
          options: [
            "Master the fundamentals and play within your bankroll",
            "Win every session",
            "Play the biggest games you can find",
            "Memorize solver outputs",
          ],
          answer: 0,
          explanation: "Solid fundamentals and bankroll discipline beat small-stakes games. Advanced ideas pay off once those are automatic.",
        },
      ],
    },
  ],
};

export const ADVANCED_UNITS: Unit[] = [
  FACING_UNIT,
  MATH_UNIT,
  READING_UNIT,
  POSTFLOP2_UNIT,
  EXPLOIT_UNIT,
  MTT_UNIT,
  MINDSET_UNIT,
];
