#!/usr/bin/env bash
# Haiku-powered dream consolidation — every 60 min
# Detects drift and reports using cheap haiku model
LOG="/tmp/claude-shared/cron-reports.log"

# Find repo
REPO=""
for path in */MEMORY.md MEMORY.md; do
  [ -f "$path" ] && REPO=$(dirname "$path") && break
done
[ -z "$REPO" ] && exit 0

MEMLINES=$(wc -l < "$REPO/MEMORY.md" 2>/dev/null || echo "0")
AGENTS=$(grep -c "^### [0-9]" "$REPO/AGENTS.md" 2>/dev/null || echo "0")
GIT_DIRTY=$(git -C "$REPO" status --short 2>/dev/null | wc -l)
TODAY=$(date "+%Y-%m-%d")

DRIFT=false
[ "$MEMLINES" -gt 50 ] && DRIFT=true
[ "$GIT_DIRTY" -gt 0 ] && DRIFT=true

if [ "$DRIFT" = true ]; then
  PROMPT="Maintenance bot. MEMORY=$MEMLINES lines (limit 50), AGENTS=$AGENTS, uncommitted=$GIT_DIRTY. Write 2-line status."
  SUMMARY=$(claude --model haiku --print "$PROMPT" 2>/dev/null)
  echo "=== DREAM $(date +%H:%M) ===" >> "$LOG"
  echo "$SUMMARY" >> "$LOG"
else
  echo "$(date +%H:%M) dream: no drift" >> "$LOG"
fi
