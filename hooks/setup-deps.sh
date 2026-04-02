#!/bin/bash
# Great Minds Plugin — Dependency Setup
# Runs on SessionStart to ensure claude-swarm and tmux are available

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

# Report status
if [ "$DEPS_OK" = true ]; then
  if [ "$INSTALLED_SWARM" = true ]; then
    echo "{\"hookSpecificOutput\":{\"hookEventName\":\"SessionStart\",\"additionalContext\":\"[Great Minds] Auto-installed claude-swarm. All dependencies ready. Use /agency-start to create a project or /agency-status to check a running swarm.\"}}"
  else
    echo "{\"hookSpecificOutput\":{\"hookEventName\":\"SessionStart\",\"additionalContext\":\"[Great Minds] All dependencies ready. Use /agency-start to create a project or /agency-status to check a running swarm.\"}}"
  fi
else
  echo "{\"hookSpecificOutput\":{\"hookEventName\":\"SessionStart\",\"additionalContext\":\"[Great Minds] Missing dependencies:$MISSING. Install them before using the agency.\"}}"
fi
