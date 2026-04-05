# Great Minds — Claude Code Plugin

A multi-agent AI agency that takes a product idea from concept to deployed software.

Drop in a PRD. The agents debate strategy, plan in waves, build in parallel with isolated worktrees, verify with QA, and ship.

## Install

```bash
npx plugins add sethshoultes/great-minds-plugin
```

## What You Get

### 14 Agent Personas

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

### 14 Skills (Slash Commands)

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

### Decoupled Cron System

Crons run via system crontab, write to log files, never interrupt the main agent:

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

```bash
# Install the plugin
npx plugins add sethshoultes/great-minds-plugin

# Start a new project
/agency-start my-product

# Drop a PRD in prds/my-product.md

# Launch the pipeline
/agency-launch

# Check status anytime
/agency-status
```

## Related Projects

- [great-minds](https://github.com/sethshoultes/great-minds) — The agency repo
- [shipyard-ai](https://github.com/sethshoultes/shipyard-ai) — Autonomous site builder (spun out)
- [localgenius](https://github.com/sethshoultes/localgenius) — First product built by the agency

## License

MIT
