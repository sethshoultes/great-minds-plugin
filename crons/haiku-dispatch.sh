#!/usr/bin/env bash
# Haiku-powered dispatch — every 30 min
# Uses claude --model haiku (cheap) instead of interrupting the main agent
LOG="/tmp/claude-shared/cron-reports.log"
SESSION="${TMUX_SESSION:-great-minds}"

# Only run if tmux session exists
tmux has-session -t "$SESSION" 2>/dev/null || exit 0

# Collect idle agent info
IDLE_AGENTS=""
for window in worker1 worker2; do
  PANE=$(tmux capture-pane -t "$SESSION:$window" -p 2>/dev/null | tail -5)
  if echo "$PANE" | grep -q "❯" && ! echo "$PANE" | grep -q "esc to interrupt"; then
    IDLE_AGENTS="$IDLE_AGENTS $window"
  fi
done

[ -z "$IDLE_AGENTS" ] && echo "$(date +%H:%M) dispatch: no idle agents" >> "$LOG" && exit 0

# Find TASKS.md
TASKS=""
for path in */TASKS.md TASKS.md; do
  [ -f "$path" ] && TASKS="$path" && break
done
[ -z "$TASKS" ] && echo "$(date +%H:%M) dispatch: no TASKS.md" >> "$LOG" && exit 0

for agent in $IDLE_AGENTS; do
  TASK_CONTENT=$(grep -E "^\- \[ \]" "$TASKS" | head -5)
  if [ -n "$TASK_CONTENT" ]; then
    PROMPT="You are a dispatch bot. Pick ONE task for $agent. Tasks: $TASK_CONTENT. Write a 1-line dispatch."
    DISPATCH=$(claude --model haiku --print "$PROMPT" 2>/dev/null | head -1)
    if [ -n "$DISPATCH" ]; then
      tmux send-keys -t "$SESSION:$agent" "$DISPATCH Use a feature branch. Use haiku sub-agents." Enter
      echo "$(date +%H:%M) dispatch: $agent → $DISPATCH" >> "$LOG"
    fi
  fi
done
