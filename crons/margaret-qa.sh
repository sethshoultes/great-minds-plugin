#!/usr/bin/env bash
# Local Margaret QA — every 29 min
LOG="/tmp/claude-shared/cron-reports.log"
ALERT="/tmp/claude-shared/alerts.log"

check_site() {
  local url="$1" expected="$2" label="$3"
  HTTP=$(curl -s -o /tmp/qa-$$.html -w "%{http_code}" --max-time 15 "$url")
  BODY=$(cat /tmp/qa-$$.html 2>/dev/null)
  rm -f /tmp/qa-$$.html
  if [ "$HTTP" != "200" ]; then
    echo "FAIL [$label] HTTP $HTTP" >> "$LOG"
    echo "$(date '+%H:%M') ALERT: $label returned $HTTP" >> "$ALERT"
    return 1
  fi
  if echo "$BODY" | grep -qi "$expected"; then
    echo "PASS [$label]" >> "$LOG"
  else
    echo "WARN [$label] content missing" >> "$LOG"
    echo "$(date '+%H:%M') ALERT: $label content '$expected' not found" >> "$ALERT"
  fi
}

check_images() {
  local url="$1"
  BROKEN=0
  for img in $(curl -s "$url" | grep -o 'src="https://images[^"]*"' | sed 's/src="//;s/"$//;s/\&amp;/\&/g'); do
    CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$img")
    [ "$CODE" != "200" ] && BROKEN=$((BROKEN+1))
  done
  [ "$BROKEN" -gt 0 ] && echo "WARN: $BROKEN broken images on $url" >> "$ALERT"
}

{
  echo "=== QA $(date '+%H:%M') ==="
  check_site "https://localgenius.company" "LocalGenius" "localgenius"
  check_site "https://localgenius.company/site/marias-kitchen" "Maria" "marias-kitchen"
  check_site "https://greatminds.company" "Great Minds" "greatminds"
  check_images "https://localgenius.company/site/marias-kitchen"

  # Check open PRs
  PR_COUNT=$(gh pr list --repo sethshoultes/localgenius --json number 2>/dev/null | grep -c "number")
  PR_COUNT2=$(gh pr list --repo sethshoultes/great-minds --json number 2>/dev/null | grep -c "number")
  [ "$PR_COUNT" -gt 0 ] && echo "PRs open: localgenius=$PR_COUNT" >> "$LOG"
  [ "$PR_COUNT2" -gt 0 ] && echo "PRs open: great-minds=$PR_COUNT2" >> "$LOG"
  echo ""
} >> "$LOG"
tail -200 "$LOG" > "$LOG.tmp" && mv "$LOG.tmp" "$LOG"
