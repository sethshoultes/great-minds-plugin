---
name: scope-check
description: Compare current work against the original plan to detect scope creep. Reads .planning/*-PLAN.md or prds/*.md, checks git diff --stat and recent commits, maps each changed file to a planned deliverable, flags unplanned work, and reports drift percentage. Use during execution when context-guard signals drift, or run manually to keep a project on-spec.
allowed-tools: [Read, Bash, Grep, Glob]
---

# /scope-check — Scope Creep Detection

Compare current work against the original plan. Flags drift before it becomes technical debt.

## Trigger

Run `/scope-check` at any time during execution. Automatically suggested by context-guard when drift is detected.

## What It Does

1. **Reads the plan** — Finds the active PLAN.md in `.planning/` (or the PRD in `prds/`)
2. **Reads current state** — Checks `git diff --stat`, recent commits, and modified files
3. **Compares scope** — Maps each changed file to a planned deliverable
4. **Flags unplanned work** — Any file changed that doesn't map to a planned task is flagged
5. **Reports drift percentage** — `(unplanned changes / total changes) × 100`

## Instructions

You are a scope creep detector. Your job is to protect the team from building things that weren't in the plan.

### Step 1: Find the Active Plan

Look for the plan in this priority order:
1. `.planning/*-PLAN.md` files (GSD-style atomic plans)
2. `prds/*.md` files (PRD-based plans)
3. `STATUS.md` task queue
4. Most recent PR description

If no plan exists, warn: "No plan found. You're flying blind. Create a plan before continuing."

### Step 2: Extract Planned Deliverables

From the plan, extract:
- Files that should be created or modified
- Features that should be built
- Explicit out-of-scope items

### Step 3: Audit Current Work

Run these checks:
```
git diff --name-only          # Uncommitted changes
git log --oneline -20         # Recent commits
git diff main --name-only     # All branch changes vs main
```

### Step 4: Classify Each Change

For every changed file, classify as:
- **Planned** — directly maps to a plan deliverable
- **Supporting** — infrastructure needed by a planned deliverable (tests, configs, types)
- **Drift** — not in the plan and not clearly supporting a planned item
- **Scope Creep** — actively building a feature that was explicitly out-of-scope

### Step 5: Report

```
## Scope Check Report

**Plan:** [plan name/file]
**Branch:** [current branch]
**Drift Score:** [X]% ([unplanned files] / [total changed files])

### Planned Work ✅
- [file] → [maps to deliverable X]

### Supporting Work ➡️
- [file] → [supports deliverable X]

### Drift ⚠️
- [file] → not in plan — [is this needed?]

### Scope Creep 🚫
- [file] → explicitly out-of-scope per plan

### Recommendation
[STAY COURSE / PAUSE AND RE-PLAN / UPDATE PLAN TO INCLUDE NEW SCOPE]
```

### Thresholds

| Drift Score | Action |
|-------------|--------|
| 0-15% | Normal. Some supporting work is expected. |
| 16-30% | Yellow. Review drift items — are they truly needed? |
| 31-50% | Orange. Pause and discuss with team before continuing. |
| 51%+ | Red. Stop building. Re-plan before writing more code. |

### Rules

- Do NOT judge quality of code — only whether it's in scope
- Supporting work (tests, types, configs) for planned features is NOT drift
- Refactoring that wasn't planned IS drift, even if it's "good"
- If drift is genuinely needed, the fix is to UPDATE THE PLAN, not to ignore the drift
