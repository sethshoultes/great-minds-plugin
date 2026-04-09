#!/usr/bin/env bash
# Local heartbeat — every 5 min
LOG="/tmp/claude-shared/cron-reports.log"
{
  echo "=== HEARTBEAT $(date '+%H:%M') ==="
  REPO_ROOT="${PIPELINE_REPO:-$(cd "$(dirname "$0")/.." && pwd)}"
  APP_DIR="${APP_DIR:-$REPO_ROOT/../localgenius}"
  echo "files: $(find "$APP_DIR/src" -type f 2>/dev/null | wc -l | tr -d ' ')"
  echo "sites: $(curl -s -o /dev/null -w '%{http_code}' https://localgenius.company) $(curl -s -o /dev/null -w '%{http_code}' https://greatminds.company)"
  echo "memory: $(wc -l < "$REPO_ROOT/MEMORY.md" 2>/dev/null || echo 0) lines"
  echo ""
} >> "$LOG"
tail -200 "$LOG" > "$LOG.tmp" && mv "$LOG.tmp" "$LOG"
