---
name: agency-launch
description: Launch the Great Minds agent swarm in tmux. No external dependencies — replaces claude-swarm with a self-contained launcher. Creates tmux session, writes persona prompts, launches agents with staggered starts.
argument-hint: [project-dir] [num-workers]
allowed-tools: [Bash, Read, Write, Glob]
---

# Great Minds Agency — Launch Swarm

Launch a Great Minds agent swarm. No claude-swarm dependency required — just tmux + claude.

**Usage:** `/agency-launch [project-dir] [num-workers]`
- `project-dir`: Path to the project (default: current directory)
- `num-workers`: Number of worker agents (default: 2)

## Instructions

Run the following steps using Bash. Use SEPARATE calls (no cd && chaining).

### Step 1: Validate prerequisites

Check that `tmux` and `claude` are available:
```
which tmux
which claude || which ~/.claude/bin/claude || which ~/.local/bin/claude
```
If either is missing, tell the user how to install.

**CRITICAL**: Check if running as root:
```
whoami
```
If root, STOP. Claude Code refuses `--dangerously-skip-permissions` as root. Create a non-root user first:
```
useradd -m -s /bin/bash agent
cp /usr/local/bin/claude /usr/local/bin/claude  # ensure claude is globally accessible
cp -r ~/.claude /home/agent/.claude
chown -R agent:agent /home/agent
su - agent
```
Then run the launch as that user.

### Step 2: Kill existing session if running

```
tmux kill-session -t great-minds 2>/dev/null
```

### Step 3: Create shared directory

```
mkdir -p /tmp/claude-shared/prompts /tmp/claude-shared/status /tmp/claude-shared/messages
```

### Step 4: Write persona prompts

Write these files to `/tmp/claude-shared/prompts/`:

**admin.md** — The orchestrator (Phil Jackson):
```
# You are the ORCHESTRATOR of the Great Minds Agency (Phil Jackson).
Read these files for context:
1. SOUL.md — agency identity
2. AGENTS.md — full roster and hierarchy
3. TASKS.md — master task board
4. STATUS.md — current state
5. HEARTBEAT.md — cron schedule
6. MEMORY.md — shared memory

You coordinate Steve Jobs (worker1) and Elon Musk (worker2).
Dispatch tasks from TASKS.md. Monitor progress.
Use feature branches + PRs. Never push to main.
```

**worker1.md** — Steve Jobs:
```
# You are STEVE JOBS, Chief Design & Brand Officer at Great Minds Agency.
Read personas/steve-jobs.md for your full identity.
Read SOUL.md, AGENTS.md, TASKS.md for context.

RULES:
- You are a DIRECTOR — spawn sub-agents (model haiku) for parallel work
- Before creating a PR, spawn jony-ive-designer (haiku) to review visual quality
- Use feature branches. Never push to main.
- Self-direct: check TASKS.md for work if no dispatch comes.
```

**worker2.md** — Elon Musk:
```
# You are ELON MUSK, Chief Product & Growth Officer at Great Minds Agency.
Read personas/elon-musk.md for your full identity.
Read SOUL.md, AGENTS.md, TASKS.md for context.

RULES:
- You are a DIRECTOR — spawn sub-agents (model haiku) for parallel work
- Before creating a PR, spawn margaret-hamilton-qa (haiku) to test endpoints
- Use feature branches. Never push to main.
- Self-direct: check TASKS.md for work if no dispatch comes.
```

### Step 5: Create tmux session with windows

Create session + named windows (one command per window):
```
tmux new-session -d -s great-minds -n admin -c {project-dir}
tmux new-window -t great-minds -n worker1 -c {project-dir}
tmux new-window -t great-minds -n worker2 -c {project-dir}
tmux new-window -t great-minds -n monitor -c {project-dir}
```

For additional workers beyond 2, create more windows: worker3, worker4, etc.

### Step 6: Launch Claude in each window (staggered)

Launch admin first, then workers with 12-second gaps to avoid memory spikes (~500MB per agent):

```
tmux send-keys -t great-minds:admin "claude --dangerously-skip-permissions" Enter
```
Wait 12 seconds.
```
tmux send-keys -t great-minds:worker1 "claude --dangerously-skip-permissions" Enter
```
Wait 12 seconds.
```
tmux send-keys -t great-minds:worker2 "claude --dangerously-skip-permissions" Enter
```

### Step 7: Wait for agents to boot, then send personas

Wait 15 seconds after last launch, then send each agent their prompt:

```
tmux send-keys -t great-minds:admin "Read /tmp/claude-shared/prompts/admin.md and execute it." Enter
```
Wait 3 seconds.
```
tmux send-keys -t great-minds:worker1 "Read /tmp/claude-shared/prompts/worker1.md and execute it." Enter
```
Wait 3 seconds.
```
tmux send-keys -t great-minds:worker2 "Read /tmp/claude-shared/prompts/worker2.md and execute it." Enter
```

### Step 8: Start monitor

```
tmux send-keys -t great-minds:monitor "watch -n 30 'echo === STATUS === && cat STATUS.md 2>/dev/null | head -10 && echo && echo === RECENT COMMITS === && git log --oneline -5 2>/dev/null'" Enter
```

### Step 9: Report success

Tell the user:
```
Great Minds Agency launched!

  Attach:    tmux attach -t great-minds
  Admin:     Ctrl+B then 0
  Worker 1:  Ctrl+B then 1
  Worker 2:  Ctrl+B then 2
  Monitor:   Ctrl+B then 3
  Detach:    Ctrl+B then d (agents keep running)

Next: Run /agency-crons to set up automated monitoring.
```

## Notes
- Each agent uses ~500MB RAM. 3 agents = ~1.5GB minimum.
- Agents persist across SSH disconnects (tmux).
- On server restart, re-run /agency-launch.
- Persona prompts are in /tmp — they're lost on reboot. The launch recreates them.
