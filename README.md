# PokerLingo

A Duolingo-style platform for learning Texas Hold'em, from "what beats what" to
the skills strong regulars rely on: bite-sized lessons on a path, practice drills
graded by real poker math, strategy charts, and hearts, XP, streaks and gems to
keep you coming back.

## The path from novice to strong regular

The course has four sections. New players start at the beginning; players who
already know the basics can take a 12-question placement test during onboarding,
or later from the Learn tab, to jump ahead (pass mark 80%).

| Section | Units | Lessons | Covers |
| --- | --- | --- | --- |
| 1. Foundations | 4 | 14 | Cards, hand rankings, how a hand plays out, showdowns |
| 2. Winning Fundamentals | 5 | 14 | Starting hands, outs and pot odds, post-flop basics, strategy, tournament basics |
| 3. Advanced | 7 | 24 | Facing raises and 3-bets, advanced math (MDF, bluff break-even, EV, implied odds), ranges and hand reading, value and bluff sizing, exploiting player types, ICM and push/fold, the mental game and study habits |
| 4. Mastery | 5 | 16 | Stack depth and SPR, 3-bet and multiway pots, river play (thin value, bluff-catching, blockers, polarized bets), the most expensive leaks, and full-hand walkthroughs |

Every day, **Today's plan** on the Learn tab picks the next lesson, a drill (the
newest skill you've been taught but not tried, otherwise your weakest), any
mistakes to review and the Daily Challenge. After the Advanced section, a
**final exam** asks 20 fresh questions across ten advanced skills (17 to pass)
and shows your score by skill.

The Profile tab tracks a **Path to top 10%**: finish all four sections, reach
Silver mastery in the eight core skills (preflop, facing a raise, pot odds, bet
math, equity, combos, bluff-catching, range advantage), Gold in any three skills,
15 in a Speed Round, a 14-day streak, 150 good decisions at the practice table
and a pass in the final exam.
It measures the knowledge and habits that separate winning players. Results at a
real table also depend on experience, bankroll discipline and game selection.

## Features

**Learn**
- 21 units, 68 lessons and 348 exercises, each unit with a guidebook. Lessons
  unlock in order.
- Exercise types: multiple choice with cards on a felt table, "who wins?"
  showdowns graded by a hand evaluator, tap-to-order, match-the-pairs, and
  play-a-hand scenarios with a decision on every street.
- Wrong answers cost a heart and come back at the end of the lesson.

**Practice**
- Randomly dealt drills for 14 skills: preflop opens, facing a raise
  (3-bet / call / fold), push or fold (graded by the solver), showdowns,
  name-that-hand, finding the nuts, combos and blockers, counting outs,
  hand-vs-hand equity, pot odds, bet math, call-or-fold on the turn,
  **bluff-catching** (count villain's value and bluff combos on the river, with
  blockers) and **range advantage** (which flop favours the preflop raiser).
- Per-skill accuracy with Bronze / Silver / Gold mastery and a
  "recommended for you" drill; 5, 10 or 20 questions; build your own mix.
- Daily Challenge (the same ten hands for everyone each day), a 60-second Speed
  Round with a personal best, and a mistakes review that brings back missed
  questions until you get them right.

**Practice table**
- Play full no-limit hands against simulated opponents: heads-up against a
  Nit, a Calling Station, a Maniac or a Regular, or at a 6-max table with a
  mix of them. Stacks reset to 100 BB every hand.
- The opponents are probability policies: preflop they rank hands by the Chen
  formula (the Regular follows the 6-max charts), and postflop they act on
  hand strength, draws, position, initiative and the price, each in its own
  style.
- After every hand the coach reviews your decisions. Because each opponent's
  strategy is known, it rebuilds the exact range of hands that opponent would
  have played the way it did. It then grades:
  - preflop opens and responses to a raise against the charts (6-max);
  - every call and fold against a bet, by your equity against those ranges
    versus the price;
  - river bets and checks when you're last to act heads-up, by comparing the
    EV of betting with checking given how the opponent responds.
- Session results, lifetime stats and a "150 good decisions" milestone on the
  Path to top 10%.

**Library**
- Strategy charts: a heads-up push/fold Nash equilibrium solved in the browser
  for 1–25 BB (with or without antes), simplified 6-max opening ranges, and
  3-bet / call / fold charts for common spots facing a raise.
- Cheat sheets: outs to equity, bet sizes (call needs, MDF, bluff break-even),
  classic preflop all-in matchups and everyday odds, all computed exactly.
- An **equity calculator**: your hand against a hand or a range, on any board
  (exact where feasible, simulated otherwise).
- A **variance and bankroll** tool: the spread of results for a win rate and
  sample size, risk of ruin, the bankroll for 5% risk, and simulated graphs.
- A searchable glossary of 107 terms, and every unit's guidebook in one place.

**Progress**
- XP, daily goal, day streaks with streak freezes, levels, gems, a shop and
  9 achievements.
- Progress is saved in the browser (`localStorage`). The Profile tab can copy or
  download a backup code and restore it on another device.
- Keyboard: number keys pick an answer, Enter checks and continues.

### What is exact and what is simplified

Hand evaluation, outs, equity, combos, pot odds and bet math are computed
exactly, and the push/fold charts are a solved equilibrium for heads-up play.
Range-advantage answers come from range-vs-range equity sampled 20,000 times per
flop. Opening and facing-a-raise charts are simplified baselines written for
learning, not solver output, and the river drill uses a stated, stylized betting
range (two pair or better, or a missed draw).

The practice-table opponents play fixed, readable styles, not equilibrium
strategies. The coach's equity numbers are exact against the ranges those
styles produce (sampled where the board isn't complete). On the flop and turn
they ignore later betting, so the coach treats close spots as close.

## Development

```bash
npm install
npm run dev           # start the dev server
npm test              # unit tests (evaluator, poker math, solver, course content, progress)
npm run build         # typecheck + production build into dist/
npm run build:equity  # regenerate the preflop equity table (a few minutes)
npm run build:flops   # regenerate the flop equity table (about a minute)
```

`src/course/course.test.ts` checks every exercise is well formed (valid cards
and answers, no duplicate options, streets and boards in order), recomputes the
math in the advanced lessons and the showdown explanations, and checks that
numeric options are sorted and that the sections and section tests cover every
unit.

The push/fold solver reads `src/poker/preflopEquity.ts`, a generated table of
all-in equity for every pair of the 169 starting-hand classes (10,000 sampled
deals each, with card removal between specific combos). It runs fictitious play
over that table, which converges to the Nash equilibrium of the heads-up
push/fold game.

The range-advantage drill reads `src/poker/flopEquity.ts`: the preflop raiser's
equity against the caller on each of the 1,755 distinct flops (flops that differ
only by suits play the same, since the ranges don't depend on suits), for three
open-and-call spots. Regenerate it after changing the opening or calling ranges.

## Deploying

`npm run build` produces a static site in `dist/` with relative asset paths, so
it can be served from any host or subfolder. It is installable as an app on
phones and desktops (web manifest and icons are in `public/`).

To publish on GitHub Pages: in the repository settings, set Pages → Source to
"GitHub Actions", then run the **Deploy to GitHub Pages** workflow from the
Actions tab. The **CI** workflow runs the tests and a build on every pull request.

## Play responsibly

PokerLingo teaches strategy and has no real-money gambling. Poker for real money
is gambling: only play where it is legal and you are old enough, and never with
money you can't afford to lose. The About section on the Profile tab links to
free, confidential help.

## Layout

```
src/
  poker/       cards, hand evaluator, equity, ranges, solvers, calculator, variance,
               table engine, simulated opponents, coach
  course/      course content, glossary, exercise types, drill and exam generator
  state/       progress rules (XP, hearts, streaks, mastery, backups), study plan, sessions
  components/  playing cards, exercise views, app shell, error screen
  screens/     Onboarding, Learn, Lesson, Practice, Play, Library and tools, Shop, Profile
public/        icons and web manifest
scripts/       equity table generators
```
