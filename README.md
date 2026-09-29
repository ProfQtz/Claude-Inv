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
- **Practice** — randomly dealt drills for seven skills (preflop opens, showdowns,
  name-that-hand, finding the nuts, counting outs, hand-vs-hand equity, pot odds)
  with unlimited hearts; finishing one restores a heart. Per-skill accuracy drives
  a "recommended for you" drill and Bronze/Silver/Gold mastery badges; drills can
  be 5, 10 or 20 questions, and recent sessions are listed.
- **Daily Challenge** — the same ten hands for everyone each day, for bonus gems.
- **Opening ranges** — a 13×13 chart of simplified 6-max opening ranges per seat.
- **Speed Round** — 60 seconds of quick reads with a saved personal best.
- **Mistakes review** — questions missed in lessons are queued for review and
  cleared once answered correctly.
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
```

## Layout

```
src/
  poker/       cards, 5–7 card hand evaluator, pot-odds math
  course/      course content, exercise types, random drill generator
  state/       progress rules (XP, hearts, streaks), lesson session queue
  components/  playing cards, exercise views, top bar
  screens/     Learn path, Lesson, Complete, Practice, Shop, Profile
```
