#!/usr/bin/env bash
# Pipeline Runner — the autonomous pipeline loop
# Runs every 15 min via crontab. Reads STATUS.md to determine current phase,
# then dispatches the RIGHT claude -p command for that phase.
#
# This is what makes the agency actually autonomous.
# Claude agents don't loop. This script IS the loop.

set -euo pipefail

LOG="/tmp/claude-shared/pipeline.log"
ALERT="/tmp/claude-shared/alerts.log"
REPO="${PIPELINE_REPO:-$(pwd)}"
PLUGIN="${PLUGIN_DIR:-/Users/sethshoultes/Local Sites/great-minds-plugin}"

# Read current state from STATUS.md
STATE=$(grep -oP '(?<=\*\*state\*\*:\s).*' "$REPO/STATUS.md" 2>/dev/null || echo "idle")
PROJECT=$(grep -oP '(?<=\*\*active project\*\*:\s).*' "$REPO/STATUS.md" 2>/dev/null || echo "")

echo "=== PIPELINE $(date '+%Y-%m-%d %H:%M') state=$STATE project=$PROJECT ===" >> "$LOG"

# Skip if idle or no project
if [ "$STATE" = "idle" ] || [ -z "$PROJECT" ]; then
  # Check for new PRDs
  NEW_PRD=$(find "$REPO/prds" -name "*.md" -newer "$REPO/STATUS.md" 2>/dev/null | head -1)
  if [ -n "$NEW_PRD" ]; then
    echo "New PRD detected: $NEW_PRD — starting DEBATE" >> "$LOG"
    PROJECT_NAME=$(basename "$NEW_PRD" .md)
    cd "$REPO" && claude -p "Read $NEW_PRD. Start the Great Minds pipeline. Phase 1: DEBATE. Spawn Steve Jobs and Elon Musk via Agent tool with worktree isolation to debate this PRD. Steve writes rounds/${PROJECT_NAME}/round-1-steve.md, Elon writes rounds/${PROJECT_NAME}/round-1-elon.md. After both finish, run Round 2 (each challenges the other). Then consolidate decisions to rounds/${PROJECT_NAME}/decisions.md. Update STATUS.md state to 'plan' when debate is complete." --dangerously-skip-permissions 2>> "$LOG"
  else
    echo "idle — no new PRDs" >> "$LOG"
  fi
  exit 0
fi

case "$STATE" in
  *debate*|*DEBATE*)
    echo "DEBATE phase — checking if rounds are complete" >> "$LOG"
    DECISIONS="$REPO/rounds/$(echo $PROJECT | tr ' ' '-' | tr '[:upper:]' '[:lower:]')/decisions.md"
    if [ -f "$DECISIONS" ]; then
      echo "Decisions exist — advancing to PLAN" >> "$LOG"
      cd "$REPO" && claude -p "Read $DECISIONS. Phase 2: PLAN. Run /agency-plan. Create structured task plans from the debate decisions. Spawn Sara Blakely (haiku) to gut-check from customer perspective. Update STATUS.md state to 'build' when plan is complete." --dangerously-skip-permissions 2>> "$LOG"
    else
      echo "Waiting for debate to complete" >> "$LOG"
    fi
    ;;

  *plan*|*PLAN*)
    echo "PLAN phase — checking if plans exist" >> "$LOG"
    PLANS=$(find "$REPO/.planning" -name "*.md" -newer "$REPO/STATUS.md" 2>/dev/null | wc -l | tr -d ' ')
    if [ "$PLANS" -gt 0 ]; then
      echo "Plans exist ($PLANS files) — advancing to BUILD" >> "$LOG"
      cd "$REPO" && claude -p "Phase 3: BUILD. Run /agency-execute. Spawn agents via Agent tool with worktree isolation for each task in the plan. Steve handles frontend/design, Elon handles backend/architecture. Each agent creates a feature branch, builds, commits, pushes, creates a PR. Spawn Jony Ive (haiku) for visual review and Maya Angelou (haiku) for copy review before PRs. Update STATUS.md state to 'verify' when all tasks are complete." --dangerously-skip-permissions 2>> "$LOG"
    else
      echo "Waiting for plans" >> "$LOG"
    fi
    ;;

  *build*|*BUILD*)
    echo "BUILD phase — checking if PRs are open" >> "$LOG"
    OPEN_PRS=$(gh pr list --repo sethshoultes/$(basename "$REPO") --json number 2>/dev/null | grep -c "number" || echo 0)
    if [ "$OPEN_PRS" -eq 0 ]; then
      echo "No open PRs — advancing to VERIFY" >> "$LOG"
      cd "$REPO" && claude -p "Phase 4: VERIFY. Run /agency-verify. Spawn Margaret Hamilton via Agent tool with worktree isolation for full QA. Check: PHP syntax, security, wp.org compliance, requirements coverage. Spawn Aaron Sorkin (haiku) to write a demo script. Update STATUS.md state to 'review' when QA passes." --dangerously-skip-permissions 2>> "$LOG"
    else
      echo "Build in progress — $OPEN_PRS PRs open" >> "$LOG"
    fi
    ;;

  *verify*|*VERIFY*)
    echo "VERIFY phase — checking QA status" >> "$LOG"
    QA_PASS=$(find "$REPO/rounds" -name "qa-*.md" -newer "$REPO/STATUS.md" 2>/dev/null | head -1)
    if [ -n "$QA_PASS" ]; then
      echo "QA report exists — advancing to BOARD REVIEW" >> "$LOG"
      cd "$REPO" && claude -p "Phase 5: BOARD REVIEW. Run /agency-board-review. Spawn all 4 board members (Jensen, Oprah, Buffett, Shonda) via Agent tool (haiku, run_in_background). Each writes a 20-line review. Consolidate into board verdict. Spawn Shonda separately for retention roadmap. Update STATUS.md state to 'ship' when board review is complete." --dangerously-skip-permissions 2>> "$LOG"
    else
      echo "Waiting for QA" >> "$LOG"
    fi
    ;;

  *review*|*REVIEW*|*board*)
    echo "BOARD REVIEW phase — checking if verdict exists" >> "$LOG"
    VERDICT=$(find "$REPO/rounds" -name "board-review-*.md" -newer "$REPO/STATUS.md" 2>/dev/null | wc -l | tr -d ' ')
    if [ "$VERDICT" -ge 3 ]; then
      echo "Board reviews in ($VERDICT) — advancing to SHIP" >> "$LOG"
      cd "$REPO" && claude -p "Phase 6: SHIP. Run /agency-ship. Merge all feature branches to main. Update STATUS.md, SCOREBOARD.md. Spawn Marcus Aurelius (haiku) to write retrospective to memory/. Clean up branches. Set STATUS.md state to 'idle'. Push everything." --dangerously-skip-permissions 2>> "$LOG"
    else
      echo "Waiting for board reviews ($VERDICT so far)" >> "$LOG"
    fi
    ;;

  *ship*|*SHIP*)
    echo "SHIP phase — finalizing" >> "$LOG"
    cd "$REPO" && claude -p "Finalize ship. Merge any remaining branches. Update STATUS.md to idle. Push. The project is complete." --dangerously-skip-permissions 2>> "$LOG"
    ;;

  *)
    echo "Unknown state: $STATE" >> "$LOG"
    ;;
esac

tail -500 "$LOG" > "$LOG.tmp" && mv "$LOG.tmp" "$LOG"
