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
9. Questions only use the chosen friends.
10. Level 2 pairs are always a step or a skip, about half each.
11. Animal choices are three different friends, always including the right one and, when possible, a next-door neighbour.

## Site-wide promises (tests/e2e/test_site.py)
12. No page shows errors or contacts any other website.
13. Every page carries the content security rules and sends no referrer.
14. Every page fits a phone without sideways scrolling.
15. Buttons are at least 36px tall.
16. The home page links to every game, and every game links back home.

## Offline app (sw.js, kit/offline.js, manifest.webmanifest)
17. After one visit, every page opens and plays with no internet (tests/e2e/test_offline.py).
18. Every file in site/ is saved for offline play; a missing one fails tests/unit/offline.test.js.
19. The site can be added to an iPad home screen, with its own name and icon; the home page explains how.
20. Each deploy stamps a new version. The app checks for updates when opened or switched back to, downloads
    them in the background, then shows "New games are ready!" with an Update button. It never reloads by itself.
21. The first visit shows no update note.
22. Adding `?seed=<number>` to a game link deals the same notes every time (a shared practice set; also keeps tests exact).

## Shared setup screen (settings.js rules, setup.js screen)
Rules tests: `tests/unit/settings.test.js`. Screen tests: `tests/e2e/test_setup_screen.py` and each quiz game's browser tests. Under the Sea keeps its own view buttons.
23. A quiz game opens on the setup screen with this device's last choices; Play starts it; the settings icon brings it back.
24. Friends: hand shortcuts (Left, Right, Both) or tap friends one by one, low to high. A shortcut lights up only for an exact hand.
25. At least 2 friends. Level 2 needs two friends a step or skip apart; the screen says why when Play is off.
26. The chosen friends are shared by every game; answer mode, letters on keys and level are saved per game.
27. Broken saved choices fall back to the defaults. A device with no saved friends keeps its old hand choice.
28. The settings icon never throws away a game in progress: "Back to game", or Play with nothing changed, returns to it.
    Only a real change starts a new game. A friend still flying lands on its own note first, never on the next game.
29. On a phone the settings icon stays in the header row, and the Level choices stay one row of two buttons.

## One screen, no scrolling (kit.css one-screen layout; tests/e2e/test_no_scroll.py)
30. During play a kid never scrolls, on an iPad in Safari or from the home screen, held either way: the whole page
    fits and every answer button is on screen. The staff takes the height that's left and scales to fit; answer
    buttons stay at least 44px tall. The setup screen is for the teacher and may scroll.
    Sizes (visible area, CSS px): Safari landscape 1080x740, Safari portrait 810x1000, home-screen landscape
    1080x810, home-screen portrait 810x1080. Turning the iPad mid-round keeps the round and still fits.
    Shared layout: `body[data-screen="play"]` in kit.css; the part that should take the leftover height is `.stage`
    (quiz games) or has class `grow`.
31. In a game, the "New games are ready!" note sits in the header row, so it never covers an answer.
