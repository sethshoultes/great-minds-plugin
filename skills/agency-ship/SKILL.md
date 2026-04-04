---
name: agency-ship
description: Ship phase — merge feature branches to main, update status and scoreboard, write ship report, save learnings to memory, clean up branches, and verify deploy. Final phase in the GSD pipeline.
argument-hint: [project-name]
allowed-tools: [Read, Write, Bash, Glob, Grep, Edit, Agent]
---

# Great Minds Agency — Ship (GSD-Style)

Ship a verified project. Merges work, updates tracking, writes the completion report, and cleans up.

## Context

This is the final phase in the pipeline: PRD -> Debate -> /agency-plan -> /agency-execute -> /agency-verify -> /agency-ship

Only run this after `/agency-verify` returns a **SHIP** recommendation. If verify returned FIX FIRST or BLOCK, resolve those issues first.

## Instructions

### Step 1: Pre-Ship Gate

Read and validate:
1. `STATUS.md` — confirm `verification: SHIP`
2. `engineering/phase-{N}-verification.md` — confirm no CRITICAL issues
3. Confirm all PRs from `/agency-execute` are merged or ready to merge

```bash
# Confirm we're on the right branch and tree is clean
git status --porcelain
git branch --show-current

# List feature branches that need merging
git branch --list "feature/*"
```

If verification status is not SHIP, STOP and tell the user to run `/agency-verify` first.

### Step 2: Merge Feature Branches to Main

For each feature branch:

```bash
# Switch to main
git checkout main
git pull origin main

# Squash merge each feature branch
git merge --squash feature/{branch-name}
git commit -m "feat: {description of feature branch work}

Squash merge of feature/{branch-name}
Phase: {N}
Project: {project-name}

Co-Authored-By: Claude <noreply@anthropic.com>"
```

**Rules:**
- Use squash merge to keep main history clean
- One commit per feature branch
- If merge conflicts occur, resolve them. If unresolvable, STOP and escalate to the user
- Run `npm run build` after each merge to confirm nothing breaks

### Step 3: Update STATUS.md

Update STATUS.md to reflect shipped state:

```
state: shipped
phase: {N}
verification: SHIP
shipped_at: {ISO date}
shipped_by: Phil Jackson (orchestrator)
commit: {final merge commit SHA}
```

Include project-specific metrics:
- Total tasks completed
- Total commits merged
- Issues found and resolved during verify
- Time from plan to ship (if trackable)

### Step 4: Update SCOREBOARD.md

Increment the relevant counters in SCOREBOARD.md:
- Total commits (add the new merge commits)
- PRs merged (add count of merged feature branches)
- Any new test specs added
- Any new source files added
- Update live deployment URLs if changed

### Step 5: Write Ship Report

Write a completion summary to `deliverables/{project}/ship-report.md`:

```markdown
# Ship Report: {Project Name}

**Shipped**: {date}
**Pipeline**: PRD -> Debate -> Plan -> Execute -> Verify -> Ship
**Duration**: {time from first debate to ship}

## What Was Built
{2-3 paragraph summary of what was delivered}

## Branches Merged
| Branch | Commits | Description |
|--------|---------|-------------|
| feature/... | N | ... |

## Verification Summary
- Build: PASS
- Tests: X/Y passing
- Requirements: X/Y verified
- Critical issues: 0
- Issues resolved during verify: {count}

## Key Decisions (from Debate)
{Top 3-5 decisions that shaped the project, pulled from rounds/{project}/decisions.md}

## Metrics
| Metric | Value |
|--------|-------|
| Tasks planned | {count} |
| Tasks completed | {count} |
| Tasks failed & retried | {count} |
| Commits | {count} |
| Files changed | {count} |
| Lines added | {count} |
| Lines removed | {count} |

## Team
| Agent | Role | Contribution |
|-------|------|-------------|
| Steve Jobs | Creative Director | {summary} |
| Elon Musk | Technical Director | {summary} |
| Margaret Hamilton | QA | {summary} |
| Phil Jackson | Orchestrator | Pipeline management |

## Learnings
{3-5 bullet points on what worked well and what to improve next time}
```

### Step 5b: Phil Jackson — Consolidate All Agent Outputs (Auto-Trigger)

Before final ship, Phil Jackson (the orchestrator / main session) consolidates all agent outputs from the project into SCOREBOARD.md:

1. Read all files in `rounds/{project}/` — debate rounds, Rick Rubin essence, board reviews, Jony/Maya reviews, Sorkin demo scripts
2. Read `.planning/sara-blakely-review.md`
3. Read `engineering/phase-{N}-verification.md`
4. Update SCOREBOARD.md with:
   - Agent participation counts (who contributed, how many reviews)
   - Quality gate results (Jony pass/fail, Maya pass/fail)
   - Board verdict summary
   - Key quotes from each agent's output

This is Phil's job as orchestrator — he sees the full picture and makes sure nothing falls through the cracks.

### Step 5c: Marcus Aurelius — Retrospective (Auto-Trigger)

After Phil consolidates, spawn a **haiku sub-agent** as Marcus Aurelius:

```
Agent(model: "haiku", subagent_type: "marcus-aurelius-mod",
  prompt: "Read all project outputs: rounds/{project}/, engineering/phase-{N}-*.md, deliverables/{project}/.
  Write a Stoic retrospective:
  - What worked and why (with specific examples)
  - What didn't work and what we'd do differently
  - What we learned about our process
  - One principle to carry forward
  Be honest, not kind. The goal is growth, not comfort.
  Write to memory/{project}-retrospective.md")
```

The retrospective feeds into the agency's long-term memory for future projects.

### Step 6: Save Operational Learnings to Memory

Write learnings to `memory/` for future projects:

```bash
# Read existing memory index
cat MEMORY.md
```

Create or append to `memory/project_{project-name}.md`:

```markdown
# Project: {Project Name} — Learnings

**Shipped**: {date}
**Pipeline used**: Full GSD (debate -> plan -> execute -> verify -> ship)

## What Worked
- {pattern that should be repeated}
- {tool or approach that was effective}

## What Didn't Work
- {pattern to avoid}
- {where time was wasted}

## Refined Frameworks
- {any process improvements discovered}

## Agent Performance
- {which agents excelled and why}
- {which agent configurations need tuning}
```

Update `MEMORY.md` index with a link to the new learnings file.

### Step 7: Clean Up Branches

Delete merged feature branches:

```bash
# Delete local feature branches that were merged
git branch --list "feature/*" | while read branch; do
  git branch -d "$branch"
done

# Delete remote feature branches (if they exist)
git branch -r --list "origin/feature/*" | while read branch; do
  local_name="${branch#origin/}"
  git push origin --delete "$local_name" 2>/dev/null || true
done
```

**Safety:** Use `git branch -d` (not `-D`) so git refuses to delete unmerged branches.

### Step 8: Verify Deploy (if applicable)

If the project has a live URL:

```bash
# Check the live deployment
curl -s -o /dev/null -w "%{http_code}" https://{live-url}
# Should return 200

# Check key endpoints
curl -s -o /dev/null -w "%{http_code}" https://{live-url}/api/health
```

If the deploy is through Vercel with auto-deploy on main:
1. Push main to origin: `git push origin main`
2. Wait 60 seconds for deploy
3. Curl the live URL to confirm
4. Check Vercel deploy status if curl fails

Report deploy verification result:
- **LIVE**: URL returns 200, deploy confirmed
- **PENDING**: Push completed, waiting for deploy pipeline
- **FAILED**: URL returns non-200, investigate

### Step 9: Final Status Update

Set STATUS.md state back to idle (or to the next project if queued):

```
state: idle
last_ship: {project-name}
last_ship_date: {date}
```

Announce completion:

```
SHIP COMPLETE: {project-name}
- {X} feature branches merged to main
- {Y} tasks completed
- Deploy status: {LIVE/PENDING/FAILED}
- Ship report: deliverables/{project}/ship-report.md
- Learnings saved to memory/project_{project-name}.md
```

## Decision Matrix

| Condition | Action |
|-----------|--------|
| Verify status is SHIP, no conflicts | Proceed with full ship |
| Verify status is SHIP, merge conflicts | Resolve conflicts, re-verify build, then ship |
| Verify status is FIX FIRST | STOP — tell user to fix and re-run /agency-verify |
| Verify status is BLOCK | STOP — escalate to user |
| Deploy fails after merge | Report failure, do NOT rollback automatically |
| Branch delete fails | Log warning, continue (not a blocker) |

## Agent Assignments

| Role | Model | Purpose |
|------|-------|---------|
| Orchestrator (you) | Sonnet/Opus | Manage the full ship sequence |
| Deploy verifier | Haiku | Curl endpoints, check status |

## Key Principles

1. **Ship only what's verified** — never skip /agency-verify
2. **Squash merge keeps history clean** — one commit per feature branch on main
3. **Memory makes the agency smarter** — always save learnings
4. **Clean up after yourself** — delete merged branches
5. **Verify the deploy** — shipping code is not shipping product until it's live
