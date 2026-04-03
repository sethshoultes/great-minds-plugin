---
name: agency-launch
description: Launch the Great Minds agent swarm using Agent tool with worktree isolation. No tmux dispatch — proven unreliable. Phil orchestrates from admin, spawns sub-agents via Agent tool.
argument-hint: [project-dir]
allowed-tools: [Bash, Read, Write, Glob, Agent]
---

# Great Minds Agency — Launch Swarm

Launch a Great Minds agent swarm. Uses Agent tool with worktree isolation for reliable dispatch.

**Usage:** `/agency-launch [project-dir]`

**IMPORTANT:** tmux send-keys does NOT work for dispatching Claude Code agents. The Agent tool with worktree isolation is the proven approach (25+ successful runs on DO).

## Architecture

```
You (main session) = Phil Jackson (Orchestrator)
  ├── Spawns Agent tool (worktree) → Steve Jobs (design/frontend)
  ├── Spawns Agent tool (worktree) → Elon Musk (backend/architecture)
  ├── Spawns Agent tool (worktree) → Margaret Hamilton (QA)
  └── Crons via system crontab (bash scripts, no tmux)
```

## Instructions

### Step 1: Validate prerequisites

Check that `claude` is available:
```
which claude || which ~/.claude/bin/claude || which ~/.local/bin/claude
```

**CRITICAL**: Check if running as root:
```
whoami
```
If root, STOP. Claude Code refuses `--dangerously-skip-permissions` as root.

### Step 2: Create shared directory

```
mkdir -p /tmp/claude-shared/prompts /tmp/claude-shared/status /tmp/claude-shared/messages
```

### Step 3: Read project files

Read the project's system files to understand current state:
- SOUL.md — agency identity
- AGENTS.md — full roster
- TASKS.md — current task board
- STATUS.md — current state

### Step 4: Dispatch work using Agent tool

For each task that needs doing, spawn an Agent with worktree isolation:

```
Agent tool call:
  subagent_type: "general-purpose" (or persona agent if available)
  isolation: "worktree"
  prompt: "You are [PERSONA]. Your task: [TASK].
           Read [relevant files] for context.
           Create a feature branch, do the work, commit, push, create a PR.
           Use haiku sub-agents for parallel work."
```

**Key rules:**
- Each Agent gets its own worktree — no merge conflicts
- Each Agent creates a branch, does work, commits, pushes, creates a PR
- Launch multiple Agents in parallel when tasks are independent
- Use `run_in_background: true` for non-blocking dispatch

### Step 5: Monitor progress

Check on spawned agents. When they complete:
- Review their PRs
- Merge if quality passes
- Dispatch next tasks

### Step 6: Install crons (optional)

Run `/agency-crons` to set up system crontab for background monitoring.

## Example: Dispatch a debate

```
// Launch Steve and Elon in parallel with worktree isolation
Agent(
  description: "Steve Jobs debate round 1",
  isolation: "worktree",
  prompt: "You are Steve Jobs. Read prds/my-project.md. Stake your positions on design, naming, UX. Write to rounds/my-project/round-1-steve.md."
)

Agent(
  description: "Elon Musk debate round 1",
  isolation: "worktree",
  prompt: "You are Elon Musk. Read prds/my-project.md. Stake your positions on architecture, performance, distribution. Write to rounds/my-project/round-1-elon.md."
)
```

## What NOT to do

- **Do NOT use tmux send-keys** to dispatch work — Claude Code's input buffer rejects pasted prompts
- **Do NOT create tmux worker windows** for agent dispatch — only useful for human interaction
- **Do NOT run crons through the main conversation** — use system crontab

## Notes
- Each agent uses ~500MB RAM. Plan accordingly.
- Agent tool with worktree isolation creates temporary git worktrees that auto-cleanup.
- For scheduled/recurring work, use `claude -p "task"` via system cron.
