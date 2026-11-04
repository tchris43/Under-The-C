#!/usr/bin/env bash
# Fast checks (a few seconds): JavaScript syntax in every page, then the unit tests.
# Claude Code runs this after every edit (see .claude/settings.json); failures are shown to Claude to fix.
set -euo pipefail
cd "$(dirname "$0")/.."
for f in site/*.js site/*/*.js; do node --check "$f"; done
node --test tests/unit/*.test.js >/dev/null
