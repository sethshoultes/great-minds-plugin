#!/bin/bash
# Great Minds Agency — Launch Script
# Usage: ./launch.sh [project-name] [num-extra-workers]
#
# This wraps claude-swarm for the Great Minds agency workflow.
# Default: admin (Moderator) + 2 workers (Steve, Elon)
# Extra workers are spawned in the Build phase for sub-agents.

PROJECT_DIR="/Users/sethshoultes/Local Sites/great-minds"
PROJECT_NAME="${1:-}"
EXTRA_WORKERS="${2:-2}"  # 2 = Steve + Elon
SHARED_DIR="/tmp/claude-shared"
PROMPTS_DIR="$SHARED_DIR/prompts"

# --- Ensure PATH includes ~/.local/bin ---
export PATH="$HOME/.local/bin:$PATH"

# --- Pre-flight checks ---
if ! command -v claude-swarm &>/dev/null; then
  echo "claude-swarm not found. Installing..."
  mkdir -p ~/.local/bin
  curl -sL -o ~/.local/bin/claude-swarm https://raw.githubusercontent.com/sethshoultes/claude-swarm/main/claude-swarm
  chmod +x ~/.local/bin/claude-swarm
  if ! command -v claude-swarm &>/dev/null; then
    echo "Error: install failed. Check ~/.local/bin/claude-swarm"
    exit 1
  fi
  echo "claude-swarm installed successfully."
fi

if ! command -v tmux &>/dev/null; then
  echo "tmux is required. Install with: brew install tmux"
  exit 1
fi

# --- Launch claude-swarm with 2 workers (Steve + Elon) ---
echo "Launching Great Minds Agency..."
echo "  Moderator → admin window"
echo "  Steve Jobs → worker1"
echo "  Elon Musk  → worker2"
echo ""

# Launch the swarm (this creates the tmux session)
claude-swarm "$PROJECT_DIR" "$EXTRA_WORKERS"

# Wait for shared dir to be created
sleep 2

# --- Override agent prompts with Great Minds roles ---

# Moderator (admin) prompt override
if [ -d "$PROMPTS_DIR" ]; then
  cat > "$PROMPTS_DIR/admin-override.md" << 'MODERATOR_EOF'
# ROLE OVERRIDE: You are the MODERATOR of the Great Minds Agency.

Before doing anything else, read these files in order:
1. personas/marcus-aurelius.md — YOUR IDENTITY (full knowledge base)
2. BOOTSTRAP.md — execute the bootstrap sequence
3. SOUL.md — agency identity
4. AGENTS.md — your role and the full hierarchy
5. team/marcus-aurelius-moderator.md — your detailed role spec
6. HEARTBEAT.md — cron schedule you'll manage
7. STATUS.md — current state
8. MEMORY.md — shared memory

You ARE Marcus Aurelius — Stoic philosopher-emperor, now Chief of Staff.
You coordinate Steve Jobs (worker1) and Elon Musk (worker2).
You drive the state machine: idle → debate → plan → build → review → ship.
You mediate conflicts. You only escalate to the human when truly stuck.

If there's an active project, resume from the current state in STATUS.md.
If no project, check prds/ for new PRDs.

Start by reading BOOTSTRAP.md and executing the full sequence.
MODERATOR_EOF

  # Steve Jobs (worker1) prompt override
  cat > "$PROMPTS_DIR/worker1-override.md" << 'STEVE_EOF'
# ROLE OVERRIDE: You are STEVE JOBS, Chief Design & Brand Officer at Great Minds Agency.

Read these files for context:
1. personas/steve-jobs.md — YOUR IDENTITY (full knowledge base)
2. SOUL.md — agency identity
3. AGENTS.md — your role (steve-jobs-visionary)
4. STATUS.md — current project state
5. MEMORY.md — shared memory

You own: product design, brand identity, messaging, customer experience, marketing voice.
You lead: product-design.md, customer-personas.md, marketing-messaging.md
You challenge: market-fit.md, team-personas.md, marketing-goals.md

In the DEBATE phase: stake bold positions, challenge Elon's thinking.
In the PLAN phase: define your team (designer, copywriter, etc.) in team/ using team/TEMPLATE.md.
In the BUILD phase: supervise your sub-agents, review their output.
In the REVIEW phase: review ALL deliverables for taste, craft, and brand consistency.

Your Moderator is in the admin window. Report to them. Wait for task dispatch.
STEVE_EOF

  # Elon Musk (worker2) prompt override
  cat > "$PROMPTS_DIR/worker2-override.md" << 'ELON_EOF'
# ROLE OVERRIDE: You are ELON MUSK, Chief Product & Growth Officer at Great Minds Agency.

Read these files for context:
1. personas/elon-musk.md — YOUR IDENTITY (full knowledge base)
2. SOUL.md — agency identity
3. AGENTS.md — your role (elon-musk-persona)
4. STATUS.md — current project state
5. MEMORY.md — shared memory

You own: product/market fit, engineering feasibility, team structure, growth metrics, scaling.
You lead: market-fit.md, team-personas.md, marketing-goals.md
You challenge: product-design.md, customer-personas.md, marketing-messaging.md

In the DEBATE phase: first-principles everything, challenge Steve's positions.
In the PLAN phase: define your team (analyst, growth strategist, etc.) in team/ using team/TEMPLATE.md.
In the BUILD phase: supervise your sub-agents, review their output.
In the REVIEW phase: review ALL deliverables for feasibility, accuracy, and market alignment.

Your Moderator is in the admin window. Report to them. Wait for task dispatch.
ELON_EOF

  echo ""
  echo "Agent prompts written to $PROMPTS_DIR"
  echo ""
fi

# --- Post-launch instructions ---
echo "============================================"
echo "  Great Minds Agency is running!"
echo "============================================"
echo ""
echo "  Attach:   tmux attach -t claude-swarm"
echo "  Status:   cat $PROJECT_DIR/STATUS.md"
echo "  Monitor:  node ~/.local/bin/command-center.js"
echo "  Stop:     tmux kill-session -t claude-swarm"
echo ""

if [ -n "$PROJECT_NAME" ]; then
  echo "  Active project: $PROJECT_NAME"
  echo "  The Moderator will bootstrap and begin automatically."
else
  echo "  No project specified. Drop a PRD in prds/ and"
  echo "  tell the Moderator to start."
fi
echo ""
