# PokerLingo

A Duolingo-style platform for learning Texas Hold'em: bite-sized lessons on a
path, hearts, XP, streaks, gems and endless practice drills.

## Features

- **Course path** — 7 units, 23 lessons: card basics, hand rankings, how Hold'em
  works, showdowns, starting hands, outs & pot odds, and strategy & mindset.
  Lessons unlock in order; each unit has a guidebook.
- **Exercise types** — multiple choice (with cards on a felt table), "who wins?"
  showdowns graded by a real hand evaluator, tap-to-order, and match-the-pairs.
- **Duolingo mechanics** — wrong answers cost a heart and come back at the end of
  the lesson; hearts regenerate over time or can be refilled with gems; XP,
  daily goal, day streaks, levels and achievements.
- **Practice** — randomly dealt drills (showdowns, name-that-hand, pot odds) with
  unlimited hearts; finishing one restores a heart.
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
  screens/     Learn path, Lesson, Complete, Practice, Profile
```
