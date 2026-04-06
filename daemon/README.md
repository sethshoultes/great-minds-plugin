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
    config.ts              Paths, intervals, repo list
    logger.ts              Console + file logging
```

## Configuration

Edit `src/config.ts` to change:
- Repo paths
- GitHub repos to monitor
- Sites to health-check
- Polling intervals
- Dream/maintenance intervals

## Logs

Logs write to both console and `/tmp/claude-shared/daemon.log`.

## Stopping

Send SIGINT (Ctrl+C) or SIGTERM. The daemon will finish its current agent call before exiting.
