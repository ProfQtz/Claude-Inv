# PokerLingo

A Duolingo-style platform for learning Texas Hold'em, from "what beats what" to
the skills strong regulars rely on: bite-sized lessons on a path, practice drills
graded by real poker math, strategy charts, and hearts, XP, streaks and gems to
keep you coming back.

## The path from novice to strong regular

The course has three sections. New players start at the beginning; players who
already know the basics can take a 12-question placement test during onboarding,
or later from the Learn tab, to jump ahead (pass mark 80%).

| Section | Units | Lessons | Covers |
| --- | --- | --- | --- |
| 1. Foundations | 4 | 14 | Cards, hand rankings, how a hand plays out, showdowns |
| 2. Winning Fundamentals | 5 | 14 | Starting hands, outs and pot odds, post-flop basics, strategy, tournament basics |
| 3. Advanced | 7 | 24 | Facing raises and 3-bets, advanced math (MDF, bluff break-even, EV, implied odds), ranges and hand reading, value and bluff sizing, exploiting player types, ICM and push/fold, the mental game and study habits |

The Profile tab tracks a **Path to top 10%**: finish all three sections, reach
Silver mastery in the six core skills (preflop, facing a raise, pot odds, bet math,
equity, combos), Gold in any three skills, 15 in a Speed Round and a 14-day streak.
It measures the knowledge and habits that separate winning players. Results at a
real table also depend on experience, bankroll discipline and game selection.

## Features

**Learn**
- 16 units, 52 lessons, each unit with a guidebook. Lessons unlock in order.
- Exercise types: multiple choice with cards on a felt table, "who wins?"
  showdowns graded by a hand evaluator, tap-to-order, match-the-pairs, and
  play-a-hand scenarios with a decision on every street.
- Wrong answers cost a heart and come back at the end of the lesson.

**Practice**
- Randomly dealt drills for 12 skills: preflop opens, facing a raise
  (3-bet / call / fold), push or fold (graded by the solver), showdowns,
  name-that-hand, finding the nuts, combos and blockers, counting outs,
  hand-vs-hand equity, pot odds, bet math and call-or-fold on the turn.
- Per-skill accuracy with Bronze / Silver / Gold mastery and a
  "recommended for you" drill; 5, 10 or 20 questions; build your own mix.
- Daily Challenge (the same ten hands for everyone each day), a 60-second Speed
  Round with a personal best, and a mistakes review that brings back missed
  questions until you get them right.

**Library**
- Strategy charts: a heads-up push/fold Nash equilibrium solved in the browser
  for 1–25 BB (with or without antes), simplified 6-max opening ranges, and
  3-bet / call / fold charts for common spots facing a raise.
- Cheat sheets: outs to equity, bet sizes (call needs, MDF, bluff break-even),
  classic preflop all-in matchups and everyday odds, all computed exactly.
- A searchable glossary of 99 terms, and every unit's guidebook in one place.

**Progress**
- XP, daily goal, day streaks with streak freezes, levels, gems, a shop and
  9 achievements.
- Progress is saved in the browser (`localStorage`). The Profile tab can copy or
  download a backup code and restore it on another device.
- Keyboard: number keys pick an answer, Enter checks and continues.

### What is exact and what is simplified

Hand evaluation, outs, equity, combos, pot odds and bet math are computed
exactly, and the push/fold charts are a solved equilibrium for heads-up play.
Opening and facing-a-raise charts are simplified baselines written for learning,
not solver output.

## Development

```bash
npm install
npm run dev           # start the dev server
npm test              # unit tests (evaluator, poker math, solver, course content, progress)
npm run build         # typecheck + production build into dist/
npm run build:equity  # regenerate the preflop equity table (a few minutes)
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
  poker/       cards, hand evaluator, equity, ranges, push/fold solver, cheat sheets
  course/      course content, glossary, exercise types, drill generator
  state/       progress rules (XP, hearts, streaks, mastery, backups), lesson sessions
  components/  playing cards, exercise views, app shell, error screen
  screens/     Onboarding, Learn, Lesson, Practice, Library, Shop, Profile
public/        icons and web manifest
scripts/       equity table generator
```
