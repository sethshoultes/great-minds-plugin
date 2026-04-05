# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

A Claude Code plugin that provides a multi-agent AI agency. It ships 10 agent personas, 11 slash-command skills, 3 hooks, 6 cron scripts, and a full set of project templates. The pipeline: **PRD → Debate → Plan → Execute → Verify → Ship**.

## Plugin Structure

```
.claude-plugin/       Plugin manifests (plugin.json, marketplace.json)
agents/               10 agent persona definitions (.md with YAML frontmatter)
skills/               11 slash commands (each dir has a SKILL.md)
hooks/                hooks.json + setup-deps.sh + context-guard.sh
crons/                6 bash/haiku cron scripts (decoupled automation)
templates/            Project system files copied by /agency-start
```

## Key Conventions

### Skill Format
Each skill lives in `skills/{name}/SKILL.md` with YAML frontmatter:
```yaml
---
name: skill-name
description: one-line description
argument-hint: <expected-args>
allowed-tools: [Read, Write, Bash, ...]
---
```
The body is the full prompt Claude receives when the slash command runs.

### Agent Format
Each agent lives in `agents/{name}.md` with YAML frontmatter specifying `model` (sonnet or haiku) and `description`. The body defines the persona's mentality, rules, and behavioral instructions.

**Model tiers:** Directors (Steve, Elon, Marcus, Jensen, Margaret, Phil) use Sonnet. Sub-agents (Rick, Jony, Maya, Sara) use Haiku.

**Memory:** Only Steve, Elon, Jensen, and Margaret have persistent memory (`~/.claude/agent-memory/{name}/`).

### Hook Format
`hooks/hooks.json` defines event hooks with matchers (regex on event content) that trigger shell scripts. Three events: `SessionStart`, `Notification`, `SubagentStop`.

### Cron Scripts
Bash crons (heartbeat, git-monitor, margaret-qa, do-check) are free. Haiku crons (dispatch, dream) use `claude --model haiku` and cost ~$0.0001/run. All write to `/tmp/claude-shared/` logs. Crons never bottleneck the main agent.

## GSD Pipeline (Plan → Execute → Verify)

The core workflow uses fresh-context sub-agents to prevent context rot:

1. **`/agency-plan`** — 3 parallel haiku research agents → XML task plans → dependency-ordered waves
2. **`/agency-execute`** — 1 fresh haiku sub-agent per task, atomic commits, wave gates (build+tests between waves)
3. **`/agency-verify`** — 5 parallel verification agents (build, tests, requirements, regression, code quality) → SHIP/FIX/BLOCK

Tasks are defined in XML with `<context>`, `<steps>`, `<verification>`, `<dependencies>`. Each sub-agent gets only its task plan + relevant code — no accumulated history.

## Context Rot Thresholds

| Signal | Threshold | Action |
|--------|-----------|--------|
| Agent output | >200KB | Spawn fresh agent |
| STATE.md staleness | >30 min | Update before continuing |
| Uncommitted diff | >500 lines | Commit immediately |
| Drift score | >30% | Re-plan before building |

## Agent Hierarchy

```
Human → Phil Jackson (Orchestrator)
         ├── Steve Jobs (Creative) → Rick Rubin, Jony Ive, Maya Angelou
         ├── Elon Musk (Product)   → Sara Blakely
         └── Margaret Hamilton (QA, continuous)
Jensen Huang (Board, periodic reviews → GitHub issues)
```

## Install & Test

```bash
# Install locally
./install.sh

# Verify plugin loads — restart Claude Code, then:
/agency-start test-project
/agency-status
```

The install script clones the repo to `~/.cache/plugins/github.com-sethshoultes-great-minds-plugin` and patches `~/.claude/settings.json` with the `extraKnownMarketplaces` and `enabledPlugins` entries.

## Editing Guidelines

- When adding a new skill, create `skills/{name}/SKILL.md` with the frontmatter format above. No registration step needed — Claude Code discovers skills by directory.
- When adding a new agent, create `agents/{name}.md` with frontmatter. Reference it in `templates/AGENTS.md` if it should appear in new projects.
- Templates in `templates/` are copied verbatim by `/agency-start`. Use `{{PROJECT_NAME}}` as the only placeholder.
- Hook scripts must output valid JSON to stdout for Claude Code to parse. See existing scripts for the `hookSpecificOutput` pattern.
- Cron scripts should be self-contained bash with log rotation (max 200 lines per log file).
