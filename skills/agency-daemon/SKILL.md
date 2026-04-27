---
name: agency-daemon
description: Install and run the Great Minds autonomous daemon — a single persistent Node.js process that watches for work and runs the full GSD pipeline. Replaces the cron-based scripts with a unified daemon. Use when setting up a new agency project's runtime infrastructure or restarting the daemon after a reboot.
allowed-tools: [Bash, Read]
---

# /agency-daemon — Autonomous Agent Daemon

## Purpose

Install and run the Great Minds autonomous daemon. This replaces ALL cron scripts with a single persistent Node.js process that watches for work and runs the full GSD pipeline.

## Install

```bash
cd "${PIPELINE_REPO:-$(git rev-parse --show-toplevel)}/daemon"
npm install
```

## Run

```bash
cd "${PIPELINE_REPO:-$(git rev-parse --show-toplevel)}/daemon"
./bin/greatminds-daemon
```

Or directly:

```bash
cd "${PIPELINE_REPO:-$(git rev-parse --show-toplevel)}/daemon" && npx tsx src/daemon.ts
```

## What It Replaces (or Complements)

The daemon can replace cron scripts for full pipeline automation, or run alongside them. Use crons (`/agency-crons`) for simpler setups or as a fallback if the daemon isn't running.

| Old Cron Script | Daemon Equivalent |
|----------------|-------------------|
| `crons/heartbeat.sh` (every 5 min) | Built-in heartbeat loop |
| `crons/git-monitor.sh` (every 15 min) | Built-in git status checks |
| `crons/memory-maintain.sh` (every 6 hours) | Built-in memory maintenance |
| `crons/feature-dream.sh` (every 4 hours) | Built-in featureDream cycle |
| `crons/pipeline-runner.sh` (crontab-managed) | File watcher + pipeline queue |
| `crons/margaret-qa.sh` | Integrated into pipeline QA phase |

## How It Works

1. **File watcher** (chokidar) monitors `prds/` for new `.md` files
2. **GitHub poller** checks for new issues every 5 minutes
3. When work is found, runs the full pipeline: Debate -> Plan -> Build -> QA -> Board Review -> Ship
4. When idle for 4 hours, runs featureDream (board improvement reviews or new product brainstorms)
5. Every 5 minutes, runs heartbeat (site checks, git status, memory check)
6. Every 6 hours, runs memory-store maintenance

## Architecture

All pipeline phases are TypeScript functions that call `query()` from `@anthropic-ai/claude-code-sdk`:

- Each agent call uses `permissionMode: "bypassPermissions"`
- `maxTurns: 30` per agent call (prevents runaway)
- Parallel execution where possible (e.g., Steve + Elon debate in parallel, all 4 board members review in parallel)
- State lives in TypeScript variables, not markdown files

## Stopping

Press Ctrl+C. The daemon finishes the current agent call and exits gracefully.

## Logs

Console output + `/tmp/claude-shared/daemon.log`

## Resilience Features

### Telegram Notifications
Set `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` env vars to receive real-time pipeline updates on Telegram. Covers: pipeline start/complete/fail, phase transitions, QA verdicts, agent crashes, hung agent alerts, and daemon startup. Silently skipped if not configured.

### Crash Recovery with Retry
Agent calls automatically retry up to 2 times with exponential backoff. If a pipeline fails entirely, the daemon archives the failed PRD to `prds/failed/`, sends a Telegram alert, and continues watching for new work (no crash).

### Hung Agent Detection
- **Agent timeout** (`AGENT_TIMEOUT_MS`, default 20 min): kills and retries individual agent calls that exceed the limit.
- **Pipeline watchdog** (`PIPELINE_TIMEOUT_MS`, default 60 min): force-skips entire pipelines that run too long.

## Hotfix Fast Path

PRDs with `hotfix: true` in frontmatter or "fix/hotfix/patch/config" in the title are auto-detected and run through a fast pipeline:

```
plan → structured-build → QA × 1 → ship
```

Skips: debate, QA-2, creative review, board review. Completes in ~15min vs 60min.

To trigger, add frontmatter to your PRD:
```markdown
---
hotfix: true
---
# PRD: Fix Something
```

Or just include "fix", "hotfix", "patch", or "config" in the PRD title.

## Structured Build

All builds (hotfix and full) use a 3-step structured approach:

1. **build-setup** — creates `spec.md` (goals + verification criteria), `todo.md` (atomic subtasks with checkboxes), and `tests/` (verification scripts) before any code is written
2. **builder** — works through `todo.md` item by item, running tests after each, checking off completed tasks
3. **build-reviewer** (full pipeline only) — fresh sub-agent adversarially reviews spec vs implementation, triggers fix pass if BLOCK

This prevents builder hangs by giving the agent structure, progress tracking, and self-verification.

## GitHub Issue Intake

The daemon polls GitHub every 5 minutes for issues labeled `p0`, `p1`, or `p2` across configured repos (see `config.ts` `GITHUB_REPOS`). New issues are auto-converted to PRDs in `prds/` and queued for pipeline processing.

Converted issues are tracked in `.github-intake-state.json` to prevent duplicates. Configure which labels trigger intake via `INTAKE_PRIORITY_LABELS` env var.

## Feature Dream Cycle

When idle for 4+ hours, the daemon runs `featureDream()` — an autonomous improvement cycle where board member agents (Jensen, Warren, Oprah, Shonda) review the current product portfolio and suggest improvements. Output goes to `dreams/`.

Dream types:
- **IMPROVE** — board reviews current state, suggests optimizations
- **DREAM** — Steve + Elon brainstorm new product ideas, voted on by the board

## Pipeline Watchdog

The daemon monitors running pipelines for hangs:

- **Agent timeout** (`AGENT_TIMEOUT_MS`, default 20 min) — kills individual agent calls that exceed the limit, triggers retry (up to 2 attempts with exponential backoff)
- **Pipeline watchdog** (`PIPELINE_TIMEOUT_MS`, default 60 min) — sets abort flag checked between phases; pipeline throws and archives PRD to `prds/failed/`

Failed PRDs are moved to `prds/failed/`. To retry, move them back to `prds/`.

## Configuration

Edit `daemon/src/config.ts` to change intervals, repos, sites, and paths.
Set `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `AGENT_TIMEOUT_MS`, `PIPELINE_TIMEOUT_MS` via environment variables (see `daemon/.env.example`).
