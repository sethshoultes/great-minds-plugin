---
name: agency-start
description: Initialize a Great Minds agency project. Creates all system files, directory structure, memory store, crons, and sets the project to idle state ready for a PRD.
argument-hint: <project-name>
allowed-tools: [Read, Write, Bash, Glob, Grep, Agent]
---

# Great Minds Agency — Initialize Project

Bootstrap a new Great Minds agency project from scratch.

## Context

This is the entry point for the entire agency. It creates the full operating environment — system files, directories, memory infrastructure, and cron jobs. After this runs, the user drops a PRD into `prds/` and launches the pipeline.

## Instructions

### Step 1: Validate Arguments

1. Parse project name from `$ARGUMENTS`
2. If no name given, ask the user
3. Sanitize: lowercase, hyphens for spaces, strip special chars
4. Set `PROJECT_ROOT` to the current working directory (or the directory the user specifies)

### Step 2: Create Directory Structure

Create ALL of these directories:

```
{PROJECT_ROOT}/
  prds/                — Input PRDs (drop your brief here)
  rounds/              — Debate transcripts per project
  deliverables/        — Final outputs per project
  memory/              — Persistent learnings across projects
  .planning/           — GSD-style task plans, requirements, state
  dreams/              — Dream cycle consolidation logs
  crons/               — Cron scripts (heartbeat, pipeline, etc.)
  engineering/         — Technical architecture docs, phase plans
  personas/            — Agent persona knowledge bases
  team/                — Agent role definitions + hiring templates
```

```bash
mkdir -p prds rounds deliverables memory .planning dreams crons engineering personas team
```

### Step 3: Create System Files

Create each file from templates if available (`${CLAUDE_PLUGIN_ROOT}/templates/`), otherwise generate with sensible defaults:

#### SOUL.md
Agency identity. Copy from template or generate:
- Agency name: Great Minds Agency
- Mission: Ship products that matter through creative tension
- Values: Taste over consensus, first principles over best practices, ship over perfect

#### AGENTS.md
Agent roster with all 14 personas:
- Phil Jackson (orchestrator), Steve Jobs, Elon Musk, Jensen Huang, Oprah Winfrey, Warren Buffett, Shonda Rhimes, Margaret Hamilton, Rick Rubin, Jony Ive, Maya Angelou, Aaron Sorkin, Sara Blakely, Marcus Aurelius
- For each: name, role, model preference (opus/sonnet/haiku), when they activate

#### STATUS.md
Live state tracking. Initialize with:
```markdown
# Agency Status

**state**: idle
**pipeline**: idle
**active project**: (none)
**last updated**: {current timestamp}
**phase**: —
**blockers**: none
```

#### SCOREBOARD.md
Project tracking. Initialize empty:
```markdown
# Scoreboard

| Project | Started | Shipped | Duration | Phases | Notes |
|---------|---------|---------|----------|--------|-------|
| (none yet) | — | — | — | — | — |
```

#### MEMORY.md
Memory index. Initialize:
```markdown
# Memory Index

Persistent learnings across all projects. Updated by dream cycle.

## Projects
(none yet)

## Patterns
(none yet)

## Frameworks
(none yet)
```

#### TASKS.md
Task tracking. Initialize empty:
```markdown
# Active Tasks

No active tasks. Drop a PRD in `prds/` and run `/agency-launch`.
```

#### HEARTBEAT.md
Cron schedule documentation:
```markdown
# Heartbeat Configuration

| Cron | Interval | Model | Purpose |
|------|----------|-------|---------|
| heartbeat.sh | 5 min | Bash | Status updates, file monitoring |
| pipeline-runner.sh | 10 min | claude -p | Advance pipeline state machine |
| dream-cycle.sh | 60 min | Haiku | Memory consolidation |

## Health
Last heartbeat: (not yet started)
Crons installed: (pending /agency-crons)
```

### Step 4: Create Template Files

#### prds/TEMPLATE.md
```markdown
# PRD: {Product Name}

## Problem
What problem does this solve? Who has it?

## Solution
What are we building? One paragraph.

## Requirements
- REQ-001: {requirement}
- REQ-002: {requirement}

## Success Metrics
How do we know this worked?

## Constraints
Timeline, budget, tech limitations.
```

#### team/TEMPLATE.md
```markdown
# Agent: {Role Name}

**Hired by**: Steve / Elon
**Model**: haiku / sonnet
**Inputs**: {what this agent reads}
**Outputs**: {what this agent produces}
**Quality bar**: {acceptance criteria}
**Voice**: {how this agent communicates}
```

### Step 5: Initialize Memory Store

If `memory-store/` exists with a `package.json`:
```bash
cd memory-store && npm install && npm run import 2>/dev/null || true
```

If not, skip gracefully — memory store is optional infrastructure.

### Step 6: Initialize Git

```bash
git init 2>/dev/null || true
git add -A
git commit -m "Initialize Great Minds agency project: {project-name}" 2>/dev/null || true
```

### Step 7: Install Crons

Invoke `/agency-crons` to install the decoupled cron system (heartbeat, pipeline runner, dream cycle). If the skill is not available or fails, log a warning but do not block initialization.

### Step 8: Set Final State

Ensure STATUS.md shows:
```
**state**: idle
**pipeline**: idle
```

### Step 9: Report to User

Print a summary:
```
Great Minds Agency initialized for: {project-name}

Created:
  - {count} system files (SOUL.md, AGENTS.md, STATUS.md, etc.)
  - {count} directories (prds/, rounds/, deliverables/, etc.)
  - Memory store: {initialized / skipped}
  - Crons: {installed / skipped}

Next steps:
  1. Drop a PRD in prds/{project-name}.md (see prds/TEMPLATE.md)
  2. Run /agency-launch to start the pipeline
  3. Run /agency-status anytime to check progress
```

## File Checklist

| File | Purpose |
|------|---------|
| SOUL.md | Agency identity and values |
| AGENTS.md | Full agent roster |
| STATUS.md | Live pipeline state |
| SCOREBOARD.md | Project history |
| MEMORY.md | Cross-project learnings |
| TASKS.md | Active task list |
| HEARTBEAT.md | Cron health and schedule |
| prds/TEMPLATE.md | PRD template for new projects |
| team/TEMPLATE.md | Agent hiring template |

## Error Handling

- If any file already exists, do NOT overwrite — warn the user
- If git init fails, continue without git
- If memory store install fails, continue without it
- If cron install fails, warn but do not block
- Always leave the project in a usable state
