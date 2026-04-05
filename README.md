# Great Minds — Claude Code Plugin

A multi-agent AI agency that takes a product idea from concept to deployed software.

Drop in a PRD. The agents debate strategy, hire sub-agents, build deliverables, write code, run tests, and deploy.

## Install

### One-liner (recommended)

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/sethshoultes/great-minds-plugin/main/install.sh)
```

### Manual install

```bash
# 1. Clone the repo into the Claude Code plugin cache
git clone https://github.com/sethshoultes/great-minds-plugin.git \
  ~/.cache/plugins/github.com-sethshoultes-great-minds-plugin

# 2. Run the install script to register the plugin
~/.cache/plugins/github.com-sethshoultes-great-minds-plugin/install.sh

# 3. Restart Claude Code to load the plugin
```

### Update

```bash
cd ~/.cache/plugins/github.com-sethshoultes-great-minds-plugin && git pull
```

Then restart Claude Code.

## What You Get

### 9 Agent Personas

| Agent | Role |
|-------|------|
| `steve-jobs-visionary` | Design & Brand — simplicity, taste, the human experience |
| `elon-musk-persona` | Product & Growth — first principles, feasibility, scale |
| `marcus-aurelius-mod` | Moderator — Stoic orchestration, conflict mediation |
| `jensen-huang-board` | Board Member — strategic reviews, data moats, platform thinking |
| `rick-rubin-creative` | Creative Director — strip to essence, authenticity |
| `jony-ive-designer` | Visual Design — spacing, hierarchy, craft, inevitability |
| `maya-angelou-writer` | Copywriting — warmth, rhythm, dignity, emotional resonance |
| `sara-blakely-growth` | Growth Strategy — scrappy, customer-first, grassroots |
| `margaret-hamilton-qa` | QA Director — zero-defect methodology, continuous testing |

### 6 Skills (Slash Commands)

| Command | Description |
|---------|-------------|
| `/agency-start <name>` | Initialize a new agency project with full system files |
| `/agency-status` | Check swarm status — what agents are doing, blockers, commits |
| `/agency-review` | Run a Jensen Huang board review on the current project |
| `/agency-crons` | Set up all automation crons (monitor, organizer, git, Jensen, dream) |
| `/agency-debate <topic>` | Run a Steve vs. Elon debate on any topic or PRD |

### Hooks

- **SubagentStop** — Reminds directors to review output and not go idle after sub-agents complete

### Templates

- Project system files (SOUL.md, AGENTS.md, HEARTBEAT.md, BOOTSTRAP.md, etc.)
- PRD template
- Agent hiring template
- Launch script for claude-swarm

## The Pipeline

```
PRD → Debate (2 rounds) → Plan (hire sub-agents) → Build (parallel) → Review → Ship
```

## Architecture

```
Human (you)
  ├── Jensen Huang — Board Member (periodic reviews, GitHub issues)
  └── Marcus Aurelius — Moderator (orchestration)
       ├── Steve Jobs — Creative Director
       │    └── Jony Ive, Maya Angelou, Rick Rubin (design crew)
       ├── Elon Musk — Product Director
       │    └── sub-agents for engineering tasks
       └── Sara Blakely — Growth Strategy
```

## Prerequisites

- [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code)
- [claude-swarm](https://github.com/sethshoultes/claude-swarm) (for tmux orchestration)
- tmux (`brew install tmux`)
- git

## Quick Start

```bash
# Install the plugin (see Install section above)
bash <(curl -fsSL https://raw.githubusercontent.com/sethshoultes/great-minds-plugin/main/install.sh)

# Start a new project
/agency-start my-product

# Drop a PRD
# Edit prds/my-product.md

# Launch the swarm
./launch.sh my-product

# Check status anytime
/agency-status

# Run a board review
/agency-review
```

## Related Projects

- [great-minds](https://github.com/sethshoultes/great-minds) — The agency repo (first project: LocalGenius)
- [claude-swarm](https://github.com/sethshoultes/claude-swarm) — Multi-agent tmux orchestration
- [think-like](https://github.com/sethshoultes/think-like) — AI mentor personas platform

## License

MIT
