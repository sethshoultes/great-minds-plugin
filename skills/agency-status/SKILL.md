---
name: agency-status
description: Check the status of the Great Minds agency swarm — what agents are doing, file counts, recent commits, blockers.
allowed-tools: [Bash, Read, Glob]
---

# Great Minds Agency — Status Check

Check the swarm status:

1. Check if tmux session exists: `tmux list-sessions 2>/dev/null | grep claude-swarm`
2. If running, capture each agent's state:
   - `tmux capture-pane -t claude-swarm:admin -p | tail -10`
   - `tmux capture-pane -t claude-swarm:worker1 -p | tail -10`
   - `tmux capture-pane -t claude-swarm:worker2 -p | tail -10`
3. Count source files in the active project
4. Read STATUS.md for current state
5. Check recent git commits: `git log --oneline -5`

Report format — keep it SHORT:
- Current phase (from STATUS.md)
- File count
- What each agent is doing (1 line each)
- Any blockers
- Whether they committed anything new

If any agent is idle, nudge them with a task.
