# Great Minds — Claude Code Plugin

A multi-agent AI agency that takes a product idea from concept to deployed software.

Drop in a PRD. The agents debate strategy, plan in waves, build in parallel with isolated worktrees, verify with QA, and ship.

## Install

```bash
npx plugins add sethshoultes/great-minds-plugin
```

## What You Get

### 14 Agent Personas + 2 Internal Consolidation Functions

| Agent | Role |
|-------|------|
| `phil-jackson-orchestrator` | Orchestrator — system coordination, dispatch, resource optimization |
| `steve-jobs-visionary` | Design & Brand — simplicity, taste, the human experience |
| `elon-musk-persona` | Product & Growth — first principles, feasibility, scale |
| `jensen-huang-board` | Board Member — tech strategy, data moats, platform economics |
| `oprah-winfrey-board` | Board Member — audience connection, storytelling, accessibility |
| `warren-buffett-board` | Board Member — business model, unit economics, moat durability |
| `shonda-rhimes-board` | Board Member — narrative & engagement, retention loops, cliffhangers |
| `margaret-hamilton-qa` | QA Director — zero-defect methodology, continuous testing |
| `rick-rubin-creative` | Creative Director — strip to essence, authenticity |
| `jony-ive-designer` | Visual Design — spacing, hierarchy, craft, inevitability |
| `maya-angelou-writer` | Copywriting — warmth, rhythm, dignity, emotional resonance |
| `aaron-sorkin-screenwriter` | Screenwriter — video scripts, demos, tutorials, launch videos |
| `sara-blakely-growth` | Growth Strategy — scrappy, customer-first, grassroots |
| `marcus-aurelius-mod` | Moderator — Stoic orchestration, conflict mediation |

The daemon pipeline also uses 2 internal consolidation functions (not standalone agents):
- `philJacksonConsolidation` — Merges debate decisions into a single blueprint after Round 2
- `boardConsolidation` — Consolidates all 4 board member reviews into a unified verdict

### 17 Skills (Slash Commands)

| Command | Description |
|---------|-------------|
| `/agency-start <name>` | Initialize a new agency project with full system files, dirs, memory, and crons |
| `/agency-launch` | Launch the pipeline: debate → plan → execute → verify → ship |
| `/agency-status` | Comprehensive health check — pipeline, crons, memory, server, GitHub, commits |
| `/agency-debate <topic>` | Structured 2-round Steve vs. Elon debate with Rick Rubin essence check |
| `/agency-plan` | GSD-style structured task planning with XML plans |
| `/agency-execute` | Wave-based parallel execution with fresh context per task |
| `/agency-verify` | Automated UAT verification + QA pipeline (build, a11y, security, live site) |
| `/agency-board-review` | Full board review — Jensen, Oprah, Warren, Shonda review in parallel, then consolidate |
| `/agency-ship` | Ship phase — merge, deploy, retrospective, scoreboard update |
| `/agency-crons` | Install decoupled cron system (bash + haiku, no bottleneck) |
| `/agency-memory` | Memory operations — store, recall, consolidate learnings |
| `/agency-publish` | Publish deliverables to external platforms |
| `/agency-video` | Generate video scripts and storyboards |
| `/agency-daemon` | Long-running Agent SDK daemon -- continuous orchestration, replaces cron pipeline |
| `/agency-anatomy` | File anatomy -- token estimates per file for context budgeting |
| `/agency-tokens` | Token ledger -- cost tracking per agent across pipeline runs |
| `/scope-check` | Detect scope creep against original plan |

### Hooks

- **SubagentStop** — Reminds directors to review output and not go idle
- **Context Guard** — Warns when context is getting large, suggests fresh agents

### Templates

- Project system files (SOUL.md, AGENTS.md, TASKS.md, STATUS.md, etc.)
- `.planning/` directory (GSD-style: PROJECT.md, REQUIREMENTS.md, ROADMAP.md, STATE.md)
- PRD template
- Agent hiring template

## The Pipeline

```
PRD → Debate (2 rounds) → /agency-plan → /agency-execute → /agency-verify → Ship
```

Each phase uses the right tool:
- **Debate**: Agent tool with worktree isolation (Steve + Elon in parallel)
- **Plan**: Structured XML task plans verified against PRD requirements
- **Execute**: Wave-based parallel agents, each with fresh context + isolated worktree
- **Verify**: Margaret QA — build, lint, tests, requirement coverage
- **Ship**: Merge, update scoreboard, memory write

## Architecture

```
You (Phil Jackson — Orchestrator)
  ├── Board of Directors (parallel via /agency-board-review)
  │    ├── Jensen Huang — Tech Strategy (cron reviews, GitHub issues)
  │    ├── Oprah Winfrey — Audience & Accessibility
  │    ├── Warren Buffett — Business & Economics
  │    └── Shonda Rhimes — Narrative & Engagement
  ├── Agent tool (worktree) → Steve Jobs — Creative Director
  │    └── Agent tool (haiku) → Jony Ive, Maya Angelou, Rick Rubin
  ├── Agent tool (worktree) → Elon Musk — Product Director
  │    └── Agent tool (haiku) → Sara Blakely + engineering sub-agents
  └── Agent tool (worktree) → Margaret Hamilton — QA Director
```

**Key insight:** Agent tool with worktree isolation is the reliable dispatch method. Each agent gets an isolated copy of the repo, creates a branch, builds, commits, pushes. No conflicts, no context rot.

### What does NOT work

- `tmux send-keys` — Claude Code's input buffer rejects pasted prompts. Workers sit idle.
- Cron dispatch via tmux — can't reliably send commands to other terminals
- In-conversation crons — bottleneck the main agent

### Daemon (Primary Orchestration)

The daemon (`/agency-daemon`) is an Agent SDK-based long-running process that replaces the cron pipeline. It handles dispatch, health checks, dream consolidation, and memory maintenance in a single persistent process.

### Daemon Resilience

The daemon includes production-grade resilience features:

- **Telegram Notifications** — Real-time alerts for pipeline starts, completions, failures, and hung agents. Requires `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` environment variables.
- **Crash Recovery** — Failed pipeline phases retry up to 2 times with exponential backoff. If all retries fail, the PRD is archived to `prds/failed/` so it does not block the queue.
- **Hung Agent Detection** — Individual agents timeout after 20 minutes (`AGENT_TIMEOUT_MS`). The entire pipeline timeout is 60 minutes (`PIPELINE_TIMEOUT_MS`). Hung agents are killed and the phase is retried or skipped.

#### Telegram Setup

1. Message [@BotFather](https://t.me/BotFather) on Telegram and create a new bot (`/newbot`)
2. Copy the bot token
3. Send a message to your bot, then fetch your chat ID via `https://api.telegram.org/bot<TOKEN>/getUpdates`
4. Set environment variables:
   ```bash
   export TELEGRAM_BOT_TOKEN="your-bot-token"
   export TELEGRAM_CHAT_ID="your-chat-id"
   ```

### Developer Intelligence

Inspired by [OpenWolf](https://github.com/open-wolf), the daemon includes developer intelligence features:

- **File Anatomy** (`/agency-anatomy`) — Token estimates per file, helping agents budget context windows and avoid loading oversized files.
- **Token Ledger** (`/agency-tokens`) — Tracks token usage and cost per agent across pipeline runs. Shows which agents are expensive and where to optimize.
- **Bug Memory** — 8 known bugs stored in a searchable buglog (`daemon/buglog.json`). Agents query this before debugging to avoid re-investigating known issues.
- **Do-Not-Repeat List** — A list of past mistakes and anti-patterns (`daemon/do-not-repeat.json`) injected into every agent session to prevent regression.

### Legacy Cron System (Fallback)

Crons are still available via `/agency-crons` for environments where the daemon cannot run:

| Cron | Model | Cost |
|------|-------|------|
| Heartbeat (5 min) | Bash | Free |
| QA checks (29 min) | Bash | Free |
| Git monitor (15 min) | Bash | Free |
| Dispatch (30 min) | Haiku | Cheap |
| Dream consolidation (60 min) | Haiku | Cheap |

## Prerequisites

- [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code)
- git

That's it. No tmux, no claude-swarm, no external dependencies.

## Quick Start

### Option 1: Claude Code Plugin (Interactive)

Use the plugin directly inside Claude Code for interactive, command-driven builds.

```bash
# 1. Install the plugin
npx plugins add sethshoultes/great-minds-plugin

# 2. Start a new project (creates SOUL.md, AGENTS.md, TASKS.md, STATUS.md, prds/)
/agency-start my-product

# 3. Write a PRD
#    Create prds/my-product.md describing what you want built.
#    Use prds/TEMPLATE.md as a starting point.

# 4. Launch the pipeline (one-shot, runs all phases in sequence)
/agency-launch

# 5. Or run individual phases
/agency-debate "Should we use React or Astro?"
/agency-plan
/agency-execute
/agency-verify
/agency-board-review
/agency-ship

# 6. Check status anytime
/agency-status
```

### Option 2: Daemon (Autonomous)

Run the daemon for continuous, autonomous builds. Drop PRDs in and walk away.

```bash
# 1. Clone the plugin and your target repo
git clone https://github.com/sethshoultes/great-minds-plugin.git
git clone https://github.com/your-org/your-project.git

# 2. Install daemon dependencies
cd great-minds-plugin/daemon
npm install

# 3. Start the daemon pointed at your repo
PIPELINE_REPO=/path/to/your-project npx tsx src/daemon.ts

# 4. Drop a PRD in your repo's prds/ directory
cp prds/TEMPLATE.md /path/to/your-project/prds/my-feature.md
# Edit the PRD with your requirements

# 5. The daemon automatically:
#    - Detects the new PRD
#    - Runs debate (Steve vs Elon, 2 rounds + Rick Rubin + Phil Jackson)
#    - Plans (task breakdown + Sara Blakely gut check)
#    - Builds (code, tests, commits)
#    - QA (2 passes by Margaret Hamilton — including live testing)
#    - Creative review (Jony Ive, Maya Angelou, Aaron Sorkin)
#    - Board review (Jensen, Oprah, Buffett, Shonda)
#    - Ships (commit, push, merge to main, retrospective)
#    - Archives the PRD to prds/completed/
```

### Option 3: Docker

```bash
cd great-minds-plugin/daemon
docker build -t greatminds-daemon .
docker run -d \
  -e PIPELINE_REPO=/repo \
  -v /path/to/your-project:/repo \
  greatminds-daemon
```

### Option 4: Server (systemd)

For always-on autonomous builds on a remote server:

```bash
# Create the service
sudo cat > /etc/systemd/system/greatminds-daemon.service << 'EOF'
[Unit]
Description=Great Minds Pipeline Daemon
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/great-minds-plugin/daemon
Environment=PIPELINE_REPO=/path/to/your-project
Environment=HOME=/home/your-user
ExecStart=/usr/bin/npx tsx src/daemon.ts
Restart=always
RestartSec=10
StandardOutput=append:/tmp/claude-shared/daemon.log
StandardError=append:/tmp/claude-shared/daemon.log

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable greatminds-daemon
sudo systemctl start greatminds-daemon
```

### Writing a Good PRD

Your PRD is the input that drives everything. A good PRD includes:

1. **Problem** — What problem does this solve?
2. **Solution** — What are you building?
3. **Requirements** — Specific, testable requirements
4. **Technical constraints** — Framework, language, deployment target
5. **Success criteria** — How do we know it's done?

See `prds/TEMPLATE.md` for the full template.

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PIPELINE_REPO` | `../../` | Target repo the daemon builds in |
| `AGENT_TIMEOUT_MS` | `1200000` (20 min) | Max time per agent call |
| `PIPELINE_TIMEOUT_MS` | `3600000` (60 min) | Max time per pipeline run |
| `TELEGRAM_BOT_TOKEN` | _(none)_ | Telegram notifications |
| `TELEGRAM_CHAT_ID` | _(none)_ | Telegram chat ID |

## Related Projects

- [great-minds](https://github.com/sethshoultes/great-minds) — The agency repo
- [shipyard-ai](https://github.com/sethshoultes/shipyard-ai) — Autonomous site builder (spun out)
- [localgenius](https://github.com/sethshoultes/localgenius) — First product built by the agency

## License

MIT
