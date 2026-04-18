---
name: plan
description: Generate a structured, spec-traced task plan for a feature, PRD, or requirements doc. Researches the codebase in parallel, produces atomic XML task cards organized into dependency waves, and verifies coverage against requirements. Single-session, no phase state machine.
argument-hint: <topic or requirements-file-path>
allowed-tools: [Read, Write, Bash, Glob, Grep, Agent]
---

# Plan — Structured Task Planning

Single-shot planning skill. Takes a topic or spec, produces an atomic, verifiable task plan. No phase numbers, no STATUS.md, no pipeline handoff.

## Instructions

### Step 1: Read the Input

Read `$ARGUMENTS`:
- If a file path → load it as the requirements source
- If a topic → treat the argument itself as the requirement and ask the user one clarifying question only if the scope is genuinely ambiguous

Derive a slug (lowercase, hyphens) for output filenames.

### Step 2: Parallel Research

Launch three Haiku sub-agents in parallel via the Agent tool. Do not proceed until all three return.

1. **Codebase Scout** (`general-purpose`, haiku) — Map files relevant to the requirement, existing patterns, conventions to follow. Report: file list with one-line reasons.
2. **Requirements Analyst** (`general-purpose`, haiku) — Extract atomic requirements from the input. Report: numbered list of requirements, each independently testable.
3. **Risk Scanner** (`general-purpose`, haiku) — Identify high-churn files, tangled dependencies, known footguns in the touched area. Report: risks with mitigation hints.

### Step 3: Generate Task Cards

For each atomic requirement, write an XML task card:

```xml
<task id="{slug}-task-{N}" wave="{W}">
  <title>Short descriptive title</title>
  <requirement>Traced requirement text</requirement>
  <description>What this accomplishes and why</description>
  <context>
    <file path="path/to/file" reason="why it matters" />
  </context>
  <steps>
    <step order="1">Specific, atomic instruction</step>
  </steps>
  <verification>
    <check type="build">command</check>
    <check type="test">command</check>
    <check type="manual">what to confirm</check>
  </verification>
  <dependencies>
    <depends-on task-id="{slug}-task-X" reason="why" />
  </dependencies>
  <commit-message>Conventional commit message</commit-message>
</task>
```

### Step 4: Organize into Waves

- **Wave 1** — tasks with no dependencies (run in parallel)
- **Wave 2** — tasks depending only on Wave 1
- **Wave N** — tasks depending on Wave N-1

Dependencies must form a DAG (no cycles).

### Step 5: Self-Verify

Before writing output, check:
- Every requirement maps to at least one task
- Every referenced file path exists (use Glob/Read to confirm)
- Every task has at least one verification check
- No dependency cycles
- Each task is committable independently

Fix gaps before writing. If a gap can't be closed, note it in the Risk Notes section.

### Step 6: Write the Plan

Save to `plans/{slug}-plan.md` (create `plans/` if missing):

```markdown
# {Title} — Task Plan
**Generated**: {ISO date}
**Source**: {input file or topic}
**Tasks**: {count}
**Waves**: {count}

## Requirements Traceability
| # | Requirement | Task(s) | Wave |
|---|-------------|---------|------|

## Wave Execution Order

### Wave 1 (parallel)
{task cards}

### Wave 2 (parallel, after Wave 1)
{task cards}

## Risk Notes
{risks from scanner + any unresolved self-verify gaps}
```

### Step 7: Report

Tell the user: plan path, task count, wave count, any risks. Under 5 lines.

## Principles

- Plans are disposable — regenerate when requirements shift.
- Fresh context per task — the executor should not need prior conversation history.
- Atomic commits — one task, one commit, one revertable unit.
- Verify before execute — catch bad plans before wasting execution tokens.
