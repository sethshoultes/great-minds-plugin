# Great Minds Daemon

Autonomous agent daemon that replaces all cron scripts with a single persistent process.

## Quick Start

```bash
cd daemon && npm install && ./bin/greatminds-daemon
```

## What It Does

The daemon runs a continuous event loop that:

1. **Watches for new PRDs** in `prds/` using chokidar file watcher — triggers the full pipeline instantly
2. **Polls GitHub issues** every 5 minutes across all monitored repos
3. **Runs heartbeat** health checks every 5 minutes (site status, git status, memory)
4. **Runs featureDream** every 4 hours when idle (board reviews or brainstorms new products)
5. **Runs memory maintenance** every 6 hours (prunes duplicates, consolidates)

## Pipeline Phases

When a PRD is detected, the full GSD pipeline runs:

| Phase | Agents | What Happens |
|-------|--------|-------------|
| Debate R1 | Steve + Elon (parallel) | Stake positions on design vs. engineering |
| Debate R2 | Steve + Elon (parallel) | Challenge each other, lock decisions |
| Essence | Rick Rubin | Distill the core idea |
| Consolidation | Phil Jackson | Merge decisions into blueprint |
| Plan | Planner + Sara Blakely | Create build plan + gut-check |
| Build | Builder agent | Execute the plan, produce deliverables |
| QA Pass 1 | Margaret Hamilton | Verify requirements, auto-fix if BLOCK |
| QA Pass 2 | Margaret Hamilton | Integration check |
| Creative Review | Jony Ive + Maya Angelou + Aaron Sorkin | Visual, copy, and demo script |
| Board Review | Jensen + Oprah + Buffett + Shonda | Strategic evaluation |
| Ship | Shipper + Marcus Aurelius | Deploy + retrospective |

## Architecture

```
daemon/
  bin/greatminds-daemon    Shell launcher
  src/
    daemon.ts              Main event loop (watcher + timers + queue)
    pipeline.ts            GSD pipeline as TypeScript functions
    agents.ts              Prompt templates for all 14 personas
    dream.ts               featureDream cycle (IMPROVE / DREAM)
    health.ts              Heartbeat, git monitor, memory maintenance
    config.ts              Paths, intervals, repo list, timeouts
    logger.ts              Console + file logging
    telegram.ts            Telegram Bot API notifications
```

## Configuration

Edit `src/config.ts` to change:
- Repo paths
- GitHub repos to monitor
- Sites to health-check
- Polling intervals
- Dream/maintenance intervals

## Telegram Notifications

The daemon can send real-time status updates to a Telegram chat. To enable:

1. Create a bot via [@BotFather](https://t.me/BotFather) on Telegram.
2. Send a message to your bot, then call `https://api.telegram.org/bot<TOKEN>/getUpdates` to get your `chat_id`.
3. Set the environment variables:
   ```bash
   export TELEGRAM_BOT_TOKEN="123456:ABC-DEF..."
   export TELEGRAM_CHAT_ID="123456789"
   ```

The daemon notifies on:
- Pipeline start (new PRD detected)
- Each phase transition (debate, plan, build, QA, creative review, board review, ship)
- QA verdicts (PASS / BLOCK)
- Pipeline completion or failure
- Agent crashes (after retry exhaustion)
- Hung agent / pipeline watchdog triggers
- Daemon startup

If no token is configured, notifications are silently skipped (no errors).

The module also supports **inline keyboard buttons** (`notifyWithButtons`) and **polling for button responses** (`pollForResponse`) for future interactive workflows.

## Crash Recovery

Agent calls are wrapped with automatic retry:

- Each agent gets **2 attempts** by default.
- On failure, the daemon waits with **exponential backoff** (5s, 10s, ...) before retrying.
- After all retries are exhausted, the error is logged, a Telegram notification is sent, and the agent failure propagates up.
- If an entire pipeline fails, the daemon **does not crash**. Instead it:
  1. Logs the error
  2. Sends a Telegram notification
  3. Archives the failed PRD to `prds/failed/`
  4. Continues watching for new work

## Hung Agent Detection

Two layers of timeout protection:

### Agent Timeout (`AGENT_TIMEOUT_MS`)
- Default: **20 minutes** (1,200,000 ms)
- If a single agent call exceeds this limit, it is aborted and retried.
- Set via environment variable: `AGENT_TIMEOUT_MS=1200000`

### Pipeline Watchdog (`PIPELINE_TIMEOUT_MS`)
- Default: **60 minutes** (3,600,000 ms)
- The daemon checks on every tick whether the current pipeline has been running too long.
- If exceeded, the pipeline is force-skipped and the daemon moves to the next PRD.
- Set via environment variable: `PIPELINE_TIMEOUT_MS=3600000`

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PIPELINE_REPO` | `../../` (relative to daemon) | Path to the target repo the daemon builds in |
| `AGENT_TIMEOUT_MS` | `1200000` (20 min) | Max time for a single agent call before abort |
| `PIPELINE_TIMEOUT_MS` | `3600000` (60 min) | Max time for an entire pipeline run |
| `MEMORY_DB` | `${PIPELINE_REPO}/memory-store/memory.db` | Path to SQLite memory store |
| `TELEGRAM_BOT_TOKEN` | _(none)_ | Telegram bot token for notifications |
| `TELEGRAM_CHAT_ID` | _(none)_ | Telegram chat ID for notifications |
| `TEST_SITE_URL` | _(none)_ | URL for smoke test deployment verification |

## Running Locally

```bash
# From the great-minds-plugin repo
cd daemon
npm install

# Point at your target repo
PIPELINE_REPO=/path/to/your/repo npx tsx src/daemon.ts

# Or run in background
PIPELINE_REPO=/path/to/your/repo nohup npx tsx src/daemon.ts >> /tmp/daemon.log 2>&1 &
```

The daemon will watch `${PIPELINE_REPO}/prds/` for new `.md` files and run the full pipeline.

## Running on a Server (systemd)

```ini
# /etc/systemd/system/shipyard-daemon.service
[Unit]
Description=Great Minds Pipeline Daemon
After=network.target

[Service]
Type=simple
User=agent
WorkingDirectory=/home/agent/great-minds-plugin/daemon
Environment=PIPELINE_REPO=/home/agent/shipyard-ai
Environment=HOME=/home/agent
ExecStart=/usr/bin/npx tsx src/daemon.ts
Restart=always
RestartSec=10
StandardOutput=append:/tmp/claude-shared/daemon.log
StandardError=append:/tmp/claude-shared/daemon.log

[Install]
WantedBy=multi-user.target
```

```bash
systemctl daemon-reload
systemctl enable shipyard-daemon
systemctl start shipyard-daemon
```

## Running with Docker

```bash
cd daemon
docker build -t greatminds-daemon .
docker run -d \
  -e PIPELINE_REPO=/repo \
  -v /path/to/your/repo:/repo \
  greatminds-daemon
```

## Anti-Hallucination Rules

The pipeline enforces these rules to prevent agents from building against hallucinated APIs:

1. **Planner** must read `CLAUDE.md` and `docs/` in the target repo before planning
2. **Builder** must read docs, `CLAUDE.md`, and `BANNED-PATTERNS.md` before writing code
3. **Builder** must grep own output for banned patterns before committing
4. **QA** must deploy and test against a live system — code review alone is not sufficient
5. **QA** must run banned patterns grep — any match = automatic BLOCK

See `BANNED-PATTERNS.md` in the plugin root for the full list of patterns that auto-fail QA.

## Auto-Merge

After the Ship phase, the pipeline automatically merges the feature branch into `main` and pushes. This ensures completed work is always accessible on the main branch.

## Logs

Logs write to both console and `/tmp/claude-shared/daemon.log`.

## Stopping

Send SIGINT (Ctrl+C) or SIGTERM. The daemon will finish its current agent call before exiting.
