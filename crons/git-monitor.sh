#!/usr/bin/env bash
# Local git monitor — every 15 min
LOG="/tmp/claude-shared/cron-reports.log"
ALERT="/tmp/claude-shared/alerts.log"

{
  echo "=== GIT $(date '+%H:%M') ==="
  for repo in localgenius great-minds great-minds-plugin; do
    DIR="/Users/sethshoultes/Local Sites/$repo"
    [ -d "$DIR/.git" ] || continue
    DIRTY=$(git -C "$DIR" status --short 2>/dev/null | wc -l | tr -d ' ')
    BRANCH=$(git -C "$DIR" branch --show-current 2>/dev/null)
    if [ "$DIRTY" -gt 0 ]; then
      echo "$repo: $DIRTY uncommitted ($BRANCH)" >> "$LOG"
      echo "$(date '+%H:%M') ALERT: $repo has $DIRTY uncommitted changes" >> "$ALERT"
    else
      echo "$repo: clean ($BRANCH)" >> "$LOG"
    fi
  done
  echo ""
} >> "$LOG"
tail -200 "$LOG" > "$LOG.tmp" && mv "$LOG.tmp" "$LOG"
