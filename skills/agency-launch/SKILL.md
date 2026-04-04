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

**Phil Jackson IS the main session.** He is not spawned as a sub-agent — he is the orchestrator running in the Opus main session. All other agents are dispatched by Phil through the Agent tool. Phil manages the full pipeline lifecycle, consolidates outputs at ship time, and maintains the SCOREBOARD. See `AGENT-TRIGGERS.md` in the plugin root for the complete agent trigger map.

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

### Step 4: Pipeline — PRD → Debate → /agency-plan → /agency-execute → /agency-verify → /agency-ship

The agency follows a structured pipeline. GSD skills are called automatically at each phase transition.

#### Phase 1: DEBATE (Rounds 1-2)
Spawn Steve and Elon in parallel via Agent tool with worktree isolation:
```
Agent(isolation: "worktree", subagent_type: "steve-jobs-visionary", run_in_background: true,
  prompt: "Read the PRD. Stake positions on design, naming, UX. Write to rounds/{project}/round-1-steve.md")
Agent(isolation: "worktree", subagent_type: "elon-musk-persona", run_in_background: true,
  prompt: "Read the PRD. Stake positions on architecture, performance, distribution. Write to rounds/{project}/round-1-elon.md")
```
After Round 1, dispatch Round 2 (each reads the other's positions and challenges).
Then consolidate decisions into `rounds/{project}/decisions.md`.

#### Phase 2: PLAN (GSD-style)
**Call `/agency-plan`** — this creates structured XML task plans from the debate decisions:
- Breaks work into atomic tasks with clear inputs/outputs
- Groups tasks into waves (independent tasks run in parallel)
- Verifies plan coverage against PRD requirements
- Outputs to `.planning/` directory

#### Phase 3: EXECUTE (GSD-style)
**Call `/agency-execute`** — wave-based parallel execution:
- Each task spawns a fresh Agent with worktree isolation
- Independent tasks in the same wave run simultaneously
- Each agent gets only its task plan (no context rot)
- Atomic git commit per completed task
- Failed tasks don't block other tasks

#### Phase 4: VERIFY (GSD-style)
**Call `/agency-verify`** — automated UAT:
- Spawns Margaret Hamilton agent for QA
- Runs build, lint, tests
- Checks deliverables against PRD requirements
- Debug agents for any failures
- Blocks ship if P0 issues found

#### Phase 5: SHIP (GSD-style)
**Call `/agency-ship`** — merge, report, and clean up:
- Squash merge all feature branches to main
- Update STATUS.md (set state to shipped, update metrics)
- Update SCOREBOARD.md (increment counts)
- Write completion summary to deliverables/{project}/ship-report.md
- Save operational learnings to memory
- Clean up merged feature branches
- Verify deploy (curl the live URL if applicable)

### Step 5: Monitor progress

Check on spawned agents. When they complete:
- Review their PRs
- Merge if quality passes
- Advance to next phase

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
