# Under the C

Piano note-reading games with the Note Friends, a set of animals who each live on one line or space of the staff.

| Game | What kids do |
| --- | --- |
| **Under the Sea** | Meet the friends. Tap one to hear its note and see where it lives. Left-hand sea friends live under middle C; right-hand land friends live above it. |
| **Who Lives Here?** | Level 1: tap the friend who lives on the note. Level 2: name two friends, then say whether they're a step or a skip. |
| **Note Flash** | Level 3: name the note with no friend on it, using the Letter Pad or the exact Piano Key. The friend appears as the reward. |

Every game offers Left hand, Right hand and Both hands practice.

## Safe for kids by design

- A static website: no accounts, logins, cookies, ads or trackers, and no server or database.
- No outside scripts, fonts or libraries. Every page tells the browser to load nothing from any other site.
- One anonymous count: on the public site, finishing a game sends a milestone such as "home-play-4" to
  GoatCounter (a privacy-friendly, open-source counter). No id, name, cookie or referrer: it says *a* device
  finished its 4th game, never *which*. The beta copy and local testing send nothing.
- Progress (last hand chosen, games finished) stays only in that device's browser.

## Two copies: public and beta

| Link | Branch | Who |
| --- | --- | --- |
| `https://tchris43.github.io/Under-The-C/` | `main` | Everyone |
| `https://tchris43.github.io/Under-The-C/beta/` | `beta` | The teacher, with her students, first |

Work on a branch, open a pull request into `beta`, try it in lessons, then open a pull request from `beta`
into `main`. Either push redeploys both copies. They keep separate offline files and settings on a device.

## Offline home-screen app

After one visit, the games work with no internet. On an iPad: Share → **Add to Home Screen**. When a new
version is deployed, the app downloads it in the background and shows **New games are ready!** with an
Update button; it never reloads in the middle of a round.

## Run it locally

```bash
npm run serve        # then open http://localhost:4173
```

## Tests

```bash
pip install -r requirements-dev.txt
python3 -m playwright install chromium webkit
npm run check        # syntax, unit tests, browser tests
BROWSERS=chromium,webkit npm run test:e2e   # also the iPad Safari engine
```

GitHub Actions runs everything on every push and pull request, in both the Chrome and Safari engines.
Only a green `main` deploys.

## Publishing (one-time)

1. The repo must be public, or on GitHub Pro, for GitHub Pages.
2. Settings → Pages → Build and deployment → Source: **GitHub Actions**.
3. Merge to `main`. The site appears at `https://tchris43.github.io/Under-The-C/`.

## Working on it with Claude Code

`CLAUDE.md` holds the project rules. `.claude/settings.json` runs quick checks after every edit and blocks
force-pushes and pushes to `main`. Two review agents are in `.claude/agents/`: `architecture-reviewer` and
`kid-qa`. The specs in `specs/` describe each game in plain words; add a spec line and a test for every new
behavior.
