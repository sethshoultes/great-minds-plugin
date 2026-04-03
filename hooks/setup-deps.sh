#!/bin/bash
# Great Minds Plugin — Dependency Setup + Cron Reminder
# Runs on SessionStart to ensure dependencies and remind about crons

DEPS_OK=true
MISSING=""

# Check tmux
if ! command -v tmux &>/dev/null; then
  DEPS_OK=false
  MISSING="$MISSING tmux(brew install tmux)"
fi

# Check claude-swarm
export PATH="$HOME/.local/bin:$PATH"
if ! command -v claude-swarm &>/dev/null; then
  # Auto-install claude-swarm
  mkdir -p ~/.local/bin
  curl -sL -o ~/.local/bin/claude-swarm https://raw.githubusercontent.com/sethshoultes/claude-swarm/main/claude-swarm 2>/dev/null
  chmod +x ~/.local/bin/claude-swarm 2>/dev/null

  if command -v claude-swarm &>/dev/null; then
    INSTALLED_SWARM=true
  else
    DEPS_OK=false
    MISSING="$MISSING claude-swarm"
  fi
fi

# Check if swarm is running
SWARM_RUNNING=false
if tmux has-session -t claude-swarm 2>/dev/null; then
  SWARM_RUNNING=true
fi

# Report status
if [ "$DEPS_OK" = true ]; then
  if [ "$SWARM_RUNNING" = true ]; then
    echo "{\"hookSpecificOutput\":{\"hookEventName\":\"SessionStart\",\"additionalContext\":\"[Great Minds] Swarm is running. IMPORTANT: Run /agency-crons to set up automated monitoring, git sync, organizer nudges, Jensen board reviews, and dream consolidation. Without crons, agents will go idle and PRs will sit unreviewed.\"}}"
  elif [ "$INSTALLED_SWARM" = true ]; then
    echo "{\"hookSpecificOutput\":{\"hookEventName\":\"SessionStart\",\"additionalContext\":\"[Great Minds] Auto-installed claude-swarm. Use /agency-start to create a project, then run /agency-crons immediately after launching the swarm.\"}}"
  else
    echo "{\"hookSpecificOutput\":{\"hookEventName\":\"SessionStart\",\"additionalContext\":\"[Great Minds] Ready. Use /agency-start to create a project. After launching the swarm, run /agency-crons to set up automated monitoring and agent management.\"}}"
  fi
else
  echo "{\"hookSpecificOutput\":{\"hookEventName\":\"SessionStart\",\"additionalContext\":\"[Great Minds] Missing dependencies:$MISSING. Install them before using the agency.\"}}"
fi
