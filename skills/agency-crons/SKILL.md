---
name: agency-crons
description: Install the autonomous cron system — pipeline runner, heartbeat, QA, git monitor, dispatch, dream. The pipeline runner IS the autonomous loop — Claude agents don't loop, the cron does.
allowed-tools: [Bash, Read, Write]
---

# Great Minds Agency — Install Cron System

Install the autonomous pipeline and monitoring crons.

**Key insight:** Claude Code agents complete a task and stop. They don't loop. The `pipeline-runner.sh` cron IS the loop — it reads STATUS.md, detects the current phase, and dispatches `claude -p` with the right prompt to advance to the next phase.

## Architecture

```
pipeline-runner.sh (every 15 min)
  ├── Reads STATUS.md → determines current phase
  ├── idle: scans prds/ for new PRDs → starts DEBATE
  ├── debate: checks for decisions.md → starts PLAN
  ├── plan: checks for .planning/ files → starts BUILD
  ├── build: checks open PRs → starts VERIFY
  ├── verify: checks QA report → starts BOARD REVIEW
  ├── review: checks board reviews → starts SHIP
  └── ship: merges, updates docs → sets idle
```

Each phase dispatches `claude -p "prompt" --dangerously-skip-permissions` which:
- Spawns sub-agents via Agent tool with worktree isolation
- Creates branches, builds, commits, pushes, creates PRs
- Updates STATUS.md when phase completes

## Cron Table

| Script | Schedule | Model | Purpose |
|--------|----------|-------|---------|
| pipeline-runner.sh | */15 min | Opus (claude -p) | **THE LOOP** — auto-advance pipeline phases |
| heartbeat.sh | */5 min | Bash + Haiku on error | Health monitoring, issue pickup |
| margaret-qa.sh | :07/:36 | Bash | Site content verification |
| git-monitor.sh | */15 min | Bash | Uncommitted changes, open PRs |
| do-check.sh | */10 min | Bash | SSH health check on remote server |
| haiku-dispatch.sh | :03/:33 | Haiku | Read TASKS.md, assign idle agents |
| haiku-dream.sh | :47 | Haiku | Detect drift in system files |

## Installation

### Step 1: Copy cron scripts
```bash
cp $CLAUDE_PLUGIN_ROOT/crons/*.sh ./crons/
chmod +x ./crons/*.sh
```

### Step 2: Create log directory
```bash
mkdir -p /tmp/claude-shared
touch /tmp/claude-shared/cron-reports.log /tmp/claude-shared/alerts.log /tmp/claude-shared/pipeline.log
```

### Step 3: Install crontab
```bash
(crontab -l 2>/dev/null; cat << 'CRON'
# Great Minds — Autonomous Pipeline + Monitoring
*/15 * * * * cd PROJECT_DIR && PROJECT_DIR/crons/pipeline-runner.sh
*/5 * * * * PROJECT_DIR/crons/heartbeat.sh
7,36 * * * * PROJECT_DIR/crons/margaret-qa.sh
*/15 * * * * PROJECT_DIR/crons/git-monitor.sh
*/10 * * * * PROJECT_DIR/crons/do-check.sh
3,33 * * * * PROJECT_DIR/crons/haiku-dispatch.sh
47 * * * * PROJECT_DIR/crons/haiku-dream.sh
CRON
) | sed "s|PROJECT_DIR|$(pwd)|g" | crontab -
```

### Step 4: Start a project
Drop a PRD in `prds/` and the pipeline-runner will detect it on the next run and start the full pipeline automatically.

## How to use

1. Write a PRD → save to `prds/my-project.md`
2. Walk away
3. The pipeline runner detects it, starts debate, advances through all phases
4. Check `cat /tmp/claude-shared/pipeline.log` for progress
5. Check `cat /tmp/claude-shared/alerts.log` for problems
6. Product ships to main when complete
