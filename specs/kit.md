# Shared kit (site/kit/)

What every game relies on. Tests: `tests/unit/notes.test.js`, `tests/unit/logic.test.js`.

## The Note Friends (notes.js)
1. Twelve friends, low C (C3) to treble G (G4), ordered low to high.
2. Left hand: Coco Clownfish C, Daisy Dolphin D, Eddie Eel E, Finn Flounder F, Goldie Goldfish G, Annie Anemone A, Benny Blobfish B, plus Charlie Cat (middle C).
3. Right hand: Charlie Cat C, Donna Dog D, Ellie Elephant E, Flossy Fish F, Gracie Gorilla G.
4. Each friend's name starts with its letter and it lives where the story says (see notes.js `where` and `story`).
5. Stems point up below the middle line of each staff and down on or above it.
6. Notes sit left to right by pitch: low C toward the left, middle C in the middle.
7. A step is next-door neighbours (line to space); a skip jumps over one (line to line, space to space).

## Choosing questions (logic.js)
8. A note never comes up twice in a row.
9. Questions only use the notes of the chosen hand.
10. Level 2 pairs are always a step or a skip, about half each.
11. Animal choices are three different friends, always including the right one and, when possible, a next-door neighbour.

## Site-wide promises (tests/e2e/test_site.py)
12. No page shows errors or contacts any other website.
13. Every page carries the content security rules and sends no referrer.
14. Every page fits a phone without sideways scrolling.
15. Buttons are at least 36px tall.
16. The home page links to every game, and every game links back home.
