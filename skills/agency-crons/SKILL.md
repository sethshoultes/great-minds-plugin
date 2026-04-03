---
name: agency-crons
description: Install decoupled cron system — bash scripts for monitoring, haiku for smart dispatch/dream. Crons run independently via crontab, never bottleneck the main agent.
allowed-tools: [Bash, Read, Write]
---

# Great Minds Agency — Install Cron System

Install the decoupled cron architecture. Crons run via system crontab, write to log files, and NEVER interrupt the main conversation.

## Architecture

| Layer | Crons | Model | Cost |
|-------|-------|-------|------|
| **Bash (free)** | heartbeat, QA, git monitor, DO check | None | Free |
| **Haiku (cheap)** | dispatch, dream consolidation | claude --model haiku | ~5x cheaper than Opus |
| **Main agent** | Reads logs when asked, never runs crons | Opus | Zero cron overhead |

## Instructions

### Step 1: Copy cron scripts from plugin

```bash
PLUGIN_DIR="${CLAUDE_PLUGIN_ROOT:-$(dirname $(dirname $0))}"
PROJECT_DIR="$(pwd)"
mkdir -p "$PROJECT_DIR/crons"
cp "$PLUGIN_DIR/crons/"*.sh "$PROJECT_DIR/crons/"
chmod +x "$PROJECT_DIR/crons/"*.sh
```

### Step 2: Create log directory

```bash
mkdir -p /tmp/claude-shared
touch /tmp/claude-shared/cron-reports.log /tmp/claude-shared/alerts.log
```

### Step 3: Install crontab

Edit paths in each script to match the project directory, then install:

```bash
crontab -l 2>/dev/null > /tmp/existing-crons || true
cat >> /tmp/existing-crons << 'CRON'
# Great Minds — Decoupled Crons
*/5 * * * * PROJECT_DIR/crons/heartbeat.sh
7,36 * * * * PROJECT_DIR/crons/margaret-qa.sh
*/15 * * * * PROJECT_DIR/crons/git-monitor.sh
*/10 * * * * PROJECT_DIR/crons/do-check.sh
3,33 * * * * PROJECT_DIR/crons/haiku-dispatch.sh
47 * * * * PROJECT_DIR/crons/haiku-dream.sh
CRON
sed -i '' "s|PROJECT_DIR|$PROJECT_DIR|g" /tmp/existing-crons
crontab /tmp/existing-crons
```

### Step 4: Verify

```bash
crontab -l
```

### Step 5: Report

Tell the user:
```
Cron system installed!

  Reports:  cat /tmp/claude-shared/cron-reports.log
  Alerts:   cat /tmp/claude-shared/alerts.log
  Status:   Ask "what's the status?" — reads log, no interruption

Crons run independently. Main agent is never bottlenecked.
```

## Included Scripts

| Script | Schedule | What it does |
|--------|----------|-------------|
| heartbeat.sh | Every 5 min | File count, site status, memory check |
| margaret-qa.sh | :07/:36 | Site content verification, image checks, PR detection |
| git-monitor.sh | Every 15 min | Uncommitted changes across repos |
| do-check.sh | Every 10 min | SSH health check on remote server |
| haiku-dispatch.sh | :03/:33 | Read TASKS.md, dispatch idle agents (haiku model) |
| haiku-dream.sh | :47 | Detect drift in system files (haiku model) |
