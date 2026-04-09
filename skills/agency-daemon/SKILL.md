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

## What It Replaces

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

## Configuration

Edit `daemon/src/config.ts` to change intervals, repos, sites, and paths.
Set `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `AGENT_TIMEOUT_MS`, `PIPELINE_TIMEOUT_MS` via environment variables (see `daemon/.env.example`).
