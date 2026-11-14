# Under the C

Piano note-reading games for kids about 4 to 10, played mostly on iPads in Safari, also on laptops.
A piano teacher uses them with her students. The Note Friends story (animals that live on each line and
space) comes from her; the specs in `specs/` say what each game does in plain words.

## Hard rules (kid safety)
- Static site only, served by GitHub Pages from `site/`. No server code, accounts, cookies, analytics, ads,
  third-party scripts, CDNs or web fonts. No network requests at runtime.
- No runtime dependencies. Don't add npm packages to the site. Test tools live in `requirements-dev.txt`.
- Every page keeps the Content-Security-Policy and referrer meta tags exactly as they are.
- Only `localStorage` for small per-device conveniences, through `memory` in `site/kit/ui.js`.
- Never build HTML from text a person typed. Markup comes only from constants and numbers in the code.
- No spoken voice. Sounds are piano notes, a soft miss sound and a cheer.
- The microphone only through `listen` in `site/kit/listen.js`: started by a tap, turned into note numbers on the
  device, never recorded, stored or sent. Every page that listens works by tapping too.

## Architecture
- `site/kit/` is shared by every game: `notes.js` (the one table of friends, notes, staff steps, hands, music
  rules), `characters.js` (drawings), `sound.js`, `staff.js` (grand staff markup), `logic.js` (pure question
  logic), `ui.js` (DOM helpers), `kit.css` (tokens and shared components),
  `listen.js` (hears one piano note at a time through the microphone).
- One folder per game under `site/`, each with `index.html`, `main.js`, `style.css`. A game imports from the
  kit; the kit never imports a game. A new game never edits another game.
- Plain ES modules with `// @ts-check` and JSDoc types, loaded directly by the browser. No build step.
- Links are relative, because the site lives at `/Under-The-C/` on GitHub Pages.

## Music rules (tested in tests/unit/notes.test.js)
- Stems up below the middle line of each staff, down on or above it.
- Notes sit left to right by pitch: low C toward the left, middle C in the middle.
- Step = next-door neighbours (E to F). Skip = jump over one (E to G).
- Left hand = low C to middle C. Right hand = middle C to G. Middle C belongs to both.

## Definition of done
- Every behavior in `specs/<game>.md` has a test, and it passes.
- `npm run check` passes: syntax, unit tests, browser tests.
- Look at the page at iPad and phone sizes before calling it done.
- Never push to main. Work on a branch and open a pull request; CI runs Chrome and iPad Safari engines
  and only a green main deploys.

## Commands
- `npm run serve` then open http://localhost:4173
- `npm run check:fast` (seconds) and `npm run check` (about a minute)
- Browser tests need `pip install -r requirements-dev.txt` and `python3 -m playwright install chromium webkit`.
