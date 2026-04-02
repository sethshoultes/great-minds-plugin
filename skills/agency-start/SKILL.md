---
name: agency-start
description: Initialize a Great Minds agency project. Creates the full system file structure (SOUL.md, AGENTS.md, HEARTBEAT.md, BOOTSTRAP.md, STATUS.md, MEMORY.md, USER.md) and prepares the project for PRD processing.
argument-hint: <project-name>
allowed-tools: [Read, Write, Bash, Glob, Grep, Agent]
---

# Great Minds Agency — Initialize Project

The user wants to start a new Great Minds agency project: $ARGUMENTS

## Instructions

1. Create the project directory structure:
```
{project-name}/
  SOUL.md          — Agency identity (copy from templates/)
  AGENTS.md        — Agent roster and hierarchy
  USER.md          — Client profile
  CLAUDE.md        — Project instructions and state machine
  MEMORY.md        — Shared memory index
  HEARTBEAT.md     — Cron schedule
  BOOTSTRAP.md     — Startup sequence
  STATUS.md        — Live state tracking
  launch.sh        — claude-swarm launch wrapper
  personas/        — Persona knowledge bases
  team/            — Agent role definitions + templates
  memory/          — Persistent learnings
  prds/            — Input PRDs (with TEMPLATE.md)
  rounds/          — Debate transcripts
  engineering/     — Technical architecture docs
  deliverables/    — Final outputs
```

2. Copy template files from `${CLAUDE_PLUGIN_ROOT}/templates/`
3. Initialize git repo
4. Set STATUS.md to `state: idle`
5. Tell the user to drop a PRD in `prds/` and run `./launch.sh {project-name}`

## The Pipeline
```
PRD → Debate (2 rounds) → Plan (hire sub-agents) → Build (parallel) → Review → Ship
```

## Available Agents
- steve-jobs-visionary — Design & Brand
- elon-musk-persona — Product & Growth
- marcus-aurelius-mod — Moderator
- jensen-huang-board — Board Member (cron)
- rick-rubin-creative — Creative Direction
- jony-ive-designer — Visual Design
- maya-angelou-writer — Copywriting
- sara-blakely-growth — Growth Strategy
