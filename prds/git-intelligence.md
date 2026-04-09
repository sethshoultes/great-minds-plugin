# PRD: Git Intelligence Pre-Build Step

## Problem
Agents build code without understanding the history of what they're touching. They don't know which files are fragile, which areas have repeated bugs, or where past builds failed. This leads to agents making the same mistakes in the same places.

## Inspiration
Based on the approach from https://piechowski.io/post/git-commands-before-reading-code/ — run git diagnostics before touching code to understand risk areas.

## CRITICAL: Do NOT Start Over
Add a new module and integrate it into the existing pipeline. Do not rewrite pipeline.ts.

## Requirements

### 1. Create `daemon/src/git-intelligence.ts`
A module that runs 5 git diagnostic commands on the target repo and produces a risk report:

**a. Churn Hotspots** — most-changed files in the last 90 days
```bash
git log --since="90 days ago" --name-only --pretty=format: | sort | uniq -c | sort -rn | head -20
```
Files that change constantly are fragile — agents should be extra careful.

**b. Bug Clustering** — files associated with bug fix commits
```bash
git log --all --oneline --grep="fix\|bug\|broken\|revert" --name-only --pretty=format: | sort | uniq -c | sort -rn | head -15
```
Files that keep getting patched instead of properly fixed.

**c. Recent Failures** — commits mentioning failures or reverts
```bash
git log --oneline --since="30 days ago" --grep="fail\|revert\|hotfix\|broken\|rollback" | head -10
```
Shows what went wrong recently so agents don't repeat it.

**d. Agent Activity** — who (which agent/author) changed what
```bash
git shortlog -sn --since="90 days ago" | head -10
```
Shows if one agent is doing everything (bus factor risk).

**e. Uncommitted State** — dirty files that might conflict
```bash
git status --short | head -20
```

### 2. Produce a Risk Report
Output a markdown file at `.planning/git-intelligence.md` with:
- Top 10 churn hotspots with change counts
- Top 10 bug-prone files
- Recent failures/reverts
- Agent activity distribution
- Uncommitted files that might conflict
- A "Risk Summary" section: 1-3 sentences about where the danger is

### 3. Integrate into Pipeline
In `pipeline.ts`, add a call to `runGitIntelligence(project)` **before** the plan phase:
```
debate → GIT INTELLIGENCE → plan → build → QA → ...
```
The planner agent prompt should include: "Read `.planning/git-intelligence.md` for risk areas before creating your plan."

### 4. Feed to Planner and Builder
Update the planner prompt to say:
- "Read the git intelligence report at .planning/git-intelligence.md"
- "Pay extra attention to files flagged as churn hotspots or bug-prone"
- "If your plan touches high-risk files, add verification steps"

Update the builder prompt to say:
- "Check .planning/git-intelligence.md for risk areas before editing files"
- "If you're editing a churn hotspot, be extra careful and test thoroughly"

## Files to Create/Modify
- Create: `daemon/src/git-intelligence.ts`
- Modify: `daemon/src/pipeline.ts` — add git intelligence step before plan phase
- Modify: planner and builder prompts to reference the report

## Success Criteria
- `.planning/git-intelligence.md` is generated before every plan phase
- Report contains all 5 diagnostic sections
- Planner reads the report (visible in plan output referencing risk areas)
- No new dependencies required (uses git CLI only)
