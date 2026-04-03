#!/usr/bin/env bash
# Local heartbeat — every 5 min
LOG="/tmp/claude-shared/cron-reports.log"
{
  echo "=== HEARTBEAT $(date '+%H:%M') ==="
  echo "files: $(find /Users/sethshoultes/Local\ Sites/localgenius/src -type f | wc -l | tr -d ' ')"
  echo "sites: $(curl -s -o /dev/null -w '%{http_code}' https://localgenius.company) $(curl -s -o /dev/null -w '%{http_code}' https://greatminds.company)"
  echo "memory: $(wc -l < /Users/sethshoultes/Local\ Sites/great-minds/MEMORY.md) lines"
  echo ""
} >> "$LOG"
tail -200 "$LOG" > "$LOG.tmp" && mv "$LOG.tmp" "$LOG"
