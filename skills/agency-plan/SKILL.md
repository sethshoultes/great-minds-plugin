---
name: agency-plan
description: Structured phase planning with XML task plans. Researches the codebase, generates atomic task plans in XML format, verifies them against requirements, and organizes them into dependency-aware execution waves. Inspired by GSD (Get Shit Done) methodology.
argument-hint: <phase-number or requirements-path>
allowed-tools: [Read, Write, Bash, Glob, Grep, Agent]
---

# Great Minds Agency — Phase Planning (GSD-Style)

Plan a phase of work using structured XML task plans verified against requirements.

## Context

This skill brings GSD (Get Shit Done) concepts into the Great Minds agency:
- **Spec-driven planning** — every task traces back to a requirement
- **XML task format** — structured, unambiguous plans optimized for agent execution
- **Wave organization** — independent tasks grouped for parallel execution
- **Fresh context** — each plan is self-contained so executors don't need prior history

## Instructions

### Step 1: Identify the Phase

Read $ARGUMENTS to determine:
- Phase number (from ROADMAP.md or STATUS.md)
- Or a requirements file path (PRD, spec, or issue)

If no phase specified, read STATUS.md to find the current/next phase.

### Step 2: Research (Spawn Haiku Sub-Agents)

Launch parallel research agents (model: haiku) to gather context:

1. **Codebase Scout** — Map relevant files, existing patterns, dependencies
2. **Requirements Analyst** — Extract atomic requirements from the PRD/spec
3. **Risk Scanner** — Identify files with high churn, complex dependencies, or known issues

Each agent reports back with structured findings. Do NOT proceed until research completes.

### Step 3: Generate XML Task Plans

For each atomic requirement, create a task plan in XML format:

```xml
<task-plan id="phase-{N}-task-{M}" wave="{W}">
  <title>{Short descriptive title}</title>
  <requirement>{Traced requirement from spec}</requirement>
  <description>{What this task accomplishes and why}</description>

  <context>
    <file path="{path}" reason="{why this file matters}" />
    <!-- List ALL files the executor needs to read -->
  </context>

  <steps>
    <step order="1">{Specific, atomic instruction}</step>
    <step order="2">{Next instruction}</step>
    <!-- Each step should be independently verifiable -->
  </steps>

  <verification>
    <check type="build">npm run build</check>
    <check type="test">npm run test -- --grep "{pattern}"</check>
    <check type="manual">{What to visually confirm}</check>
  </verification>

  <dependencies>
    <depends-on task-id="phase-{N}-task-{X}" reason="{why}" />
    <!-- Empty if task is independent (wave 1) -->
  </dependencies>

  <commit-message>{Conventional commit message for this task}</commit-message>
</task-plan>
```

### Step 4: Organize into Waves

Group tasks by dependency:
- **Wave 1**: All independent tasks (no dependencies) — run in parallel
- **Wave 2**: Tasks depending only on Wave 1 — run in parallel after Wave 1
- **Wave N**: Tasks depending on Wave N-1

```
Wave 1: [task-1, task-2, task-3]  ← parallel
Wave 2: [task-4, task-5]          ← parallel, after wave 1
Wave 3: [task-6]                  ← after wave 2
```

### Step 5: Verify Plans Against Requirements

Launch a verification agent to cross-check:

1. **Coverage**: Every requirement has at least one task plan
2. **Completeness**: No task references files that don't exist
3. **No Gaps**: Dependencies form a valid DAG (no cycles)
4. **Atomicity**: Each task can be committed independently
5. **Testability**: Every task has at least one verification check

Report any gaps back. Fix before proceeding.

### Step 6: Write the Phase Plan

Save to `engineering/phase-{N}-plan.md`:

```markdown
# Phase {N} Plan — {Phase Title}
**Generated**: {date}
**Requirements**: {source file}
**Total Tasks**: {count}
**Waves**: {count}

## Requirements Traceability
| Requirement | Task(s) | Wave |
|-------------|---------|------|
| ... | ... | ... |

## Wave Execution Order

### Wave 1 (Parallel)
{XML task plans for wave 1}

### Wave 2 (Parallel, after Wave 1)
{XML task plans for wave 2}

...

## Risk Notes
{Any concerns from the risk scanner}
```

Also update STATUS.md:
```
phase: {N}
state: planned
plan: engineering/phase-{N}-plan.md
tasks_total: {count}
tasks_complete: 0
```

## Agent Assignments

- **Steve Jobs** or **Elon Musk**: Reviews the plan for vision alignment
- **Marcus Aurelius**: Validates task ordering and resource allocation
- **Haiku sub-agents**: Do the research and verification grunt work

### Step 7: Sara Blakely — Customer Gut-Check (Auto-Trigger)

After the phase plan is written, spawn a **haiku sub-agent** as Sara Blakely:

```
Agent(model: "haiku", subagent_type: "sara-blakely-growth",
  prompt: "Read engineering/phase-{N}-plan.md and the original PRD.
  Gut-check from a real customer's perspective. Answer honestly:
  - Would a real customer pay for this?
  - What would make them say 'shut up and take my money'?
  - What feels like engineering vanity vs. customer value?
  Write to .planning/sara-blakely-review.md")
```

If Sara flags major customer-value gaps, the orchestrator should review the plan before proceeding to `/agency-execute`.

## Key Principles

1. **Plans are disposable** — regenerate if requirements change
2. **Fresh context per task** — each plan carries all context needed
3. **Atomic commits** — one task = one commit = one revertable unit
4. **Verify before execute** — catch bad plans before wasting execution tokens
