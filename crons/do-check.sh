#!/usr/bin/env bash
# DO server health check — every 10 min
LOG="/tmp/claude-shared/cron-reports.log"
ALERT="/tmp/claude-shared/alerts.log"

{
  echo "=== DO $(date '+%H:%M') ==="
  RESULT=$(ssh -o ConnectTimeout=5 -o BatchMode=yes -i ~/.ssh/greatminds root@164.90.151.82 \
    'free -h | grep Mem | awk "{print \$3\"/\"\$2}" && uptime -p' 2>/dev/null)
  if [ -z "$RESULT" ]; then
    echo "DO: UNREACHABLE" >> "$LOG"
    echo "$(date '+%H:%M') ALERT: DO server unreachable" >> "$ALERT"
  else
    echo "DO: $RESULT" >> "$LOG"
  fi
  echo ""
} >> "$LOG"
tail -200 "$LOG" > "$LOG.tmp" && mv "$LOG.tmp" "$LOG"
