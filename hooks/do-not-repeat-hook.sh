#!/bin/bash
# do-not-repeat-hook.sh — Injects DO-NOT-REPEAT.md into session context on SessionStart
# Prevents agents from repeating known-bad patterns and commands.

set -uo pipefail

PLUGIN_DIR="${CLAUDE_PLUGIN_ROOT:-$(cd "$(dirname "$0")/.." && pwd)}"
DNR_FILE="${PLUGIN_DIR}/DO-NOT-REPEAT.md"

if [ -f "$DNR_FILE" ]; then
  CONTENT=$(cat "$DNR_FILE" | sed 's/"/\\"/g' | tr '\n' ' ')
  echo "{\"hookSpecificOutput\":{\"hookEventName\":\"DoNotRepeat\",\"additionalContext\":\"${CONTENT}\"}}"
else
  echo "{\"hookSpecificOutput\":{\"hookEventName\":\"DoNotRepeat\",\"additionalContext\":\"[Do-Not-Repeat] No DO-NOT-REPEAT.md found.\"}}"
fi
