#!/usr/bin/env bash
# Fast checks (a few seconds): JavaScript syntax in every page, then the unit tests.
# Claude Code runs this after every edit (see .claude/settings.json); failures are shown to Claude to fix.
set -euo pipefail
cd "$(dirname "$0")/.."
for f in site/*.js site/*/*.js; do node --check "$f"; done
# Quiet when green, but print the full test report when anything fails, so a failure is never silent.
if ! report=$(node --test tests/unit/*.test.js 2>&1); then
  echo "$report" >&2
  exit 1
fi
