#!/bin/bash
# context-guard.sh — GSD-inspired context rot prevention
# Monitors conversation context health and warns when it's time to spawn fresh agents.
#
# Signals checked:
#   1. Tool call count in current session (proxy for context depth)
#   2. .planning/STATE.md staleness
#   3. Agent output file sizes (large = context-heavy)
#
# Usage: Called as a PreToolUse or Notification hook.
# Returns JSON with hookSpecificOutput for Claude Code to display.

set -euo pipefail

# --- Configuration ---
MAX_TOOL_CALLS_BEFORE_WARN=80
MAX_STATE_AGE_MINUTES=30
MAX_AGENT_OUTPUT_KB=200

WARNINGS=""
WARNING_COUNT=0

# --- Check 1: Tool call density (approximate via output file sizes) ---
if [ -d "/private/tmp/claude-501" ]; then
  LARGE_OUTPUTS=$(find /private/tmp/claude-501 -name "*.output" -size +${MAX_AGENT_OUTPUT_KB}k 2>/dev/null | wc -l | tr -d ' ')
  if [ "$LARGE_OUTPUTS" -gt 2 ]; then
    WARNINGS="${WARNINGS}⚠ ${LARGE_OUTPUTS} agent outputs exceed ${MAX_AGENT_OUTPUT_KB}KB — context is getting heavy. "
    WARNING_COUNT=$((WARNING_COUNT + 1))
  fi
fi

# --- Check 2: STATE.md freshness ---
if [ -n "${PROJECT_DIR:-}" ] && [ -f "${PROJECT_DIR}/.planning/STATE.md" ]; then
  STATE_AGE=$(( ($(date +%s) - $(stat -f %m "${PROJECT_DIR}/.planning/STATE.md")) / 60 ))
  if [ "$STATE_AGE" -gt "$MAX_STATE_AGE_MINUTES" ]; then
    WARNINGS="${WARNINGS}⚠ STATE.md is ${STATE_AGE}min stale — update before continuing. "
    WARNING_COUNT=$((WARNING_COUNT + 1))
  fi
fi

# --- Check 3: Git diff size as context load proxy ---
if [ -n "${PROJECT_DIR:-}" ] && [ -d "${PROJECT_DIR}/.git" ]; then
  DIFF_LINES=$(cd "${PROJECT_DIR}" && git diff --stat 2>/dev/null | tail -1 | grep -oE '[0-9]+ insertion|[0-9]+ deletion' | head -1 | grep -oE '[0-9]+' || echo "0")
  if [ "$DIFF_LINES" -gt 500 ]; then
    WARNINGS="${WARNINGS}⚠ ${DIFF_LINES} uncommitted diff lines — commit before context rots. "
    WARNING_COUNT=$((WARNING_COUNT + 1))
  fi
fi

# --- Output ---
if [ "$WARNING_COUNT" -gt 0 ]; then
  SUGGESTION="Spawn fresh haiku sub-agents for remaining work. Commit current progress. Update STATE.md."
  if [ "$WARNING_COUNT" -ge 3 ]; then
    SUGGESTION="CRITICAL: Context is saturated. Stop current work, commit everything, update STATE.md, then spawn fresh agents with clean context for each remaining task."
  fi

  # Escape for JSON
  MSG=$(echo "[Context Guard] ${WARNINGS}${SUGGESTION}" | sed 's/"/\\"/g')
  echo "{\"hookSpecificOutput\":{\"hookEventName\":\"ContextGuard\",\"additionalContext\":\"${MSG}\"}}"
else
  echo "{\"hookSpecificOutput\":{\"hookEventName\":\"ContextGuard\",\"additionalContext\":\"[Context Guard] Context health: OK\"}}"
fi
