# Edge of the Empire — GM Flash Cards

A self-drilling deck of Star Wars: Edge of the Empire rules, for a GM who
wants the mechanics in their head before the session rather than in an index
during it.

Open `index.html` — no build step, no dependencies, works offline.

## What is in it

Around 380 cards generated from `data.js`, across eleven decks:

| Deck | Covers |
| --- | --- |
| Skills | All 33 skills, their governing characteristic and what they cover |
| Making the Call | A situation lands on the table — which skill do you ask for? |
| Dice & Symbols | The seven dice, their faces, and how symbols resolve |
| Checks & Turns | Difficulty, opposed checks, turn economy, range bands |
| Combat | Damage, soak, thresholds, crits, spending advantage and threat |
| Weapon Qualities | Accurate, Pierce, Vicious, Auto-fire and the rest |
| Talents | Common talents: tier, activation and effect |
| Gear | Encumbrance, stimpacks, armour, weapon stat lines |
| Vehicles | Hull trauma, silhouette, scale, handling, defence zones |
| Obligation & Destiny | The two table-level mechanics that shape a session |
| Advancement | What everything costs in XP |

## How it works

- **Pick decks**, then narrow by sub-filter (skill type, talent tier, card style).
- **Flip & self-grade**, **multiple choice**, or **mixed**. Multiple-choice
  distractors are drawn from other real answers in the same category, so the
  wrong options are all plausible.
- **Weakest first** orders the run by a five-box Leitner schedule. A card you
  get right moves up a box; a card you miss drops to box 1 and comes back
  before the session ends.
- Progress, edits and custom cards persist in `localStorage`. **Data** exports
  them as JSON to move between devices.

Keyboard: `Space` reveals · `1`/`2` grade missed/got it · `1`–`4` pick a
multiple-choice answer · `S` skip · `E` edit · `Esc` back to the decks.

## Fixing and extending the deck

The cards are a study aid written from the core rulebook, not a copy of it.
Where a table-exact number matters, trust the book. If a card is wrong, hit
**Edit** on it — the correction is stored in your browser and survives
updates to `data.js`. **+ Card** adds your own rulings and house rules.

To change the deck for everyone, edit `data.js`. It is plain data: skills,
calls, dice, qualities and talents are tables that generate several question
types each, and `EOTE.rules` is a flat list of `{t, q, a, n}` cards. Answers
support `**bold**`, `*italics*` and dice tokens like `[[triumph]]` or
`[[difficulty]]`, which render as colour-coded symbol chips.
