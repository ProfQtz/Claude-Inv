# PokerLingo

A Duolingo-style platform for learning Texas Hold'em: bite-sized lessons on a
path, hearts, XP, streaks, gems and endless practice drills.

## Features

- **Course path** — 9 units, 28 lessons: card basics, hand rankings, how Hold'em
  works, showdowns, starting hands, outs & pot odds, post-flop play, strategy &
  mindset, and tournament basics.
  Lessons unlock in order; each unit has a guidebook.
- **Exercise types** — multiple choice (with cards on a felt table), "who wins?"
  showdowns graded by a real hand evaluator, tap-to-order, match-the-pairs, and
  play-a-hand scenarios with a decision on every street.
- **Duolingo mechanics** — wrong answers cost a heart and come back at the end of
  the lesson; hearts regenerate over time or can be refilled with gems; XP,
  daily goal, day streaks, levels and achievements.
- **Practice** — randomly dealt drills for nine skills (preflop opens, showdowns,
  name-that-hand, finding the nuts, combos and blockers, counting outs,
  hand-vs-hand equity, pot odds, call-or-fold on the turn) with unlimited hearts;
  finishing one restores a heart. Per-skill accuracy drives a "recommended for
  you" drill and Bronze/Silver/Gold mastery badges; drills can be 5, 10 or 20
  questions, you can build your own mix of skills, and recent sessions are listed.
- **Daily Challenge** — the same ten hands for everyone each day, for bonus gems.
- **Strategy charts** — a heads-up push/fold Nash equilibrium solved live in the
  browser for any stack from 1 to 25 BB (with or without antes), shown as 13×13
  charts with mixed strategies and a solver recommendation for every hand; plus
  simplified 6-max opening ranges per seat. A "Push or Fold" drill is graded by
  the solver.
- **Speed Round** — 60 seconds of quick reads with a saved personal best.
- **Mistakes review** — questions missed in lessons and hands missed in drills are
  queued for review and cleared once answered correctly.
- **Shop** — spend gems on streak freezes (each covers a missed day) and heart
  refills.
- Sound effects, with a toggle on the Profile page.
- Progress is saved in `localStorage`. Keyboard: number keys pick an answer,
  Enter checks / continues.

## Development

```bash
npm install
npm run dev        # start the dev server
npm test           # unit tests (evaluator, poker math, course content, progress)
npm run build      # typecheck + production build
npm run build:equity  # regenerate the preflop equity table (a few minutes)
```

The push/fold solver reads `src/poker/preflopEquity.ts`, a generated table of all-in
equity for every pair of the 169 starting-hand classes (10,000 sampled deals each,
with card removal between specific combos). The solver runs fictitious play over
that table, which converges to the Nash equilibrium of the heads-up push/fold game.

## Layout

```
src/
  poker/       cards, 5–7 card hand evaluator, pot-odds math
  course/      course content, exercise types, random drill generator
  state/       progress rules (XP, hearts, streaks), lesson session queue
  components/  playing cards, exercise views, top bar
  screens/     Learn path, Lesson, Complete, Practice, Shop, Profile
```
