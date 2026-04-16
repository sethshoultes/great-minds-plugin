---
name: agency-verify
description: UAT verification of executed phase work. Runs acceptance tests against requirements, spawns debug agents for failures, generates a verification report with SHIP/FIX/BLOCK recommendation. Inspired by GSD (Get Shit Done) methodology.
argument-hint: <phase-number>
allowed-tools: [Read, Write, Bash, Glob, Grep, Agent]
---

# Great Minds Agency — UAT Verification (GSD-Style)

Verify executed phase work against requirements with automated failure diagnosis.

## Context

This skill verifies work completed by `/agency-execute`:
- **Requirements-driven UAT** — every requirement gets explicitly verified
- **Automated debug agents** — failures spawn focused diagnosis sub-agents
- **Ship/Fix/Block** — clear recommendation, not ambiguous status
- **Regression safety** — ensures new work didn't break existing functionality

## Instructions

### Step 1: Load Phase Context

Read these files:
1. `engineering/phase-{N}-plan.md` — the task plans with requirements + verification checks
2. `engineering/phase-{N}-execution.md` — what was actually executed
3. The original requirements source (PRD, spec, or issue)
4. `STATUS.md` — current state

If execution report shows failed tasks, note them — they need extra scrutiny.

### Step 2: Run Automated Verification

Launch parallel haiku sub-agents for each verification category:

#### Agent 1: Build & Type Safety
```bash
npm run build 2>&1
npm run typecheck 2>&1
npm run lint 2>&1
```
Report: PASS/FAIL with full output on failure.

#### Agent 2: Test Suite
```bash
npm run test 2>&1
```
Report: X/Y passing, list any failures with stack traces.

#### Agent 3: Requirements Acceptance
For EACH requirement in the phase plan:
- Read the `<verification>` block from the corresponding task plan
- Execute each `<check>` (build, test, manual inspection)
- Verify the requirement is actually satisfied, not just that code exists

Report per-requirement:
```
REQ-001: "User can reset password"
  ✓ Route exists: /api/auth/reset
  ✓ Test passes: auth.reset.test.ts
  ✓ Email template renders correctly
  STATUS: VERIFIED
```

#### Agent 4: Regression Check
- Run the FULL test suite (not just new tests)
- Compare git diff against test coverage
- Check that no existing functionality is broken

#### Agent 5: Code Quality Spot-Check
- Read each committed file from this phase
- Check for: hardcoded values, missing error handling at boundaries, TODO/FIXME left behind
- Verify no secrets, API keys, or credentials in committed code
- Check that commit messages match the task plans

### Step 3: Debug Failures

For EACH failure found in Step 2, spawn a dedicated **haiku debug agent**:

```
You are a debug agent investigating a verification failure.

## Failure
{description of what failed}
{full error output}

## Context
{relevant file paths}
{the task plan that produced this code}

## Your Job
1. Read the failing code and related files
2. Identify the ROOT CAUSE (not just the symptom)
3. Propose a SPECIFIC fix (exact file, exact change)
4. Assess severity: CRITICAL (blocks ship) / MAJOR (should fix) / MINOR (can ship with)

## Report Format
ROOT_CAUSE: {one sentence}
SEVERITY: CRITICAL / MAJOR / MINOR
FIX: {specific change needed}
FILES: {files to modify}
ESTIMATED_EFFORT: {trivial / small / medium / large}
```

Collect all debug reports.

### Step 4: Generate Verification Report

Write to `engineering/phase-{N}-verification.md`:

```markdown
# Phase {N} Verification Report
**Date**: {date}
**Verified by**: Margaret Hamilton (QA) + Debug Agents
**Phase**: {N} — {title}

## Overall Status: SHIP / FIX FIRST / BLOCK

## Automated Checks
| Category | Status | Details |
|----------|--------|---------|
| Build | PASS/FAIL | ... |
| Types | PASS/FAIL | ... |
| Lint | PASS/FAIL | ... |
| Tests | X/Y PASS | ... |
| Regression | PASS/FAIL | ... |
| Code Quality | PASS/WARN | ... |

## Requirements Acceptance
| Requirement | Status | Evidence |
|-------------|--------|----------|
| REQ-001: ... | VERIFIED / FAILED / PARTIAL | ... |
| REQ-002: ... | VERIFIED / FAILED / PARTIAL | ... |

## Issues Found
### Critical (Must Fix Before Ship)
| Issue | Root Cause | Fix | Effort |
|-------|-----------|-----|--------|
| ... | ... | ... | ... |

### Major (Should Fix)
| Issue | Root Cause | Fix | Effort |
|-------|-----------|-----|--------|
| ... | ... | ... | ... |

### Minor (Can Ship With)
| Issue | Root Cause | Fix | Effort |
|-------|-----------|-----|--------|
| ... | ... | ... | ... |

## Recommendation

**{SHIP / FIX FIRST / BLOCK}**

{Rationale — 2-3 sentences explaining the recommendation}

### If FIX FIRST:
{List the specific fixes needed before shipping}
{Suggest re-running /agency-verify after fixes}

### If BLOCK:
{Explain what fundamental issue prevents shipping}
{Suggest whether to re-plan or re-execute}
```

### Step 5: Update State

Update STATUS.md:
```
phase: {N}
state: verified
verification: SHIP / FIX_FIRST / BLOCK
issues_critical: {count}
issues_major: {count}
issues_minor: {count}
```

If SHIP: Tell the user they can run `/agency-board-review` for a Jensen board review, then ship.
If FIX FIRST: List the fixes. User can fix and re-run `/agency-verify`.
If BLOCK: Escalate. May need `/agency-plan` re-run.

## Decision Matrix

| Condition | Recommendation |
|-----------|---------------|
| All checks pass, all requirements verified | **SHIP** |
| Minor issues only, all requirements verified | **SHIP** (with notes) |
| Any major issue OR unverified requirement | **FIX FIRST** |
| Build fails, critical regression, or >50% requirements unverified | **BLOCK** |

## Agent Assignments

| Role | Model | Purpose |
|------|-------|---------|
| Orchestrator (you) | Sonnet/Opus | Coordinate verification, write report |
| Verification agents | Haiku | Run checks in parallel (5 agents) |
| Debug agents | Haiku | One per failure, focused diagnosis |
| Margaret Hamilton | Sonnet | Final review if escalation needed |

### Step 6: Aaron Sorkin — Demo Script (Auto-Trigger)

After the verification report is written, spawn a **haiku sub-agent** as Aaron Sorkin:

```
Agent(model: "haiku", subagent_type: "aaron-sorkin-screenwriter",
  prompt: "Read engineering/phase-{N}-verification.md and the original PRD.
  Write a brief product demo script (60-90 seconds) that shows the feature in action.
  Structure: Setup (the problem) -> Demo (the solution) -> Payoff (the result).
  This becomes documentation and marketing material.
  Write to rounds/{project}/aaron-sorkin-demo-script-phase-{N}.md")
```

The demo script serves dual purpose: it validates that the feature tells a coherent story, and it becomes raw material for marketing/docs.

## QA Pipeline Checks

In addition to the requirements-based UAT above, run these QA checks as part of Step 2:

#### Agent 6: Live Site Verification (if deployed)
- Use Puppeteer or curl to check the live URL
- Check key pages: /, /welcome, /app (or whatever the app defines)
- Verify design tokens are rendering (colors, typography, spacing)
- Check mobile viewport (390x844)
- Screenshot critical pages for the report

#### Agent 7: API Smoke Test
```bash
curl -s {base-url}/api/health | jq .
curl -s -X POST {base-url}/api/auth/register -H 'Content-Type: application/json' -d '{"test": true}' | head -5
```
Report: list each endpoint, HTTP status, response shape.

#### Agent 8: Accessibility
- Check for ARIA roles on interactive elements
- Verify color contrast meets WCAG AA
- Check touch target sizes (44px minimum)
- Verify keyboard navigation on critical flows

#### Agent 9: Security Review
- Check API routes don't leak error details in production
- Verify auth middleware on protected routes
- Check for hardcoded secrets in source (`grep -r "sk-" "AKIA" "password="`)
- Verify CORS configuration

Add these categories to the verification report table:
```markdown
| Live Site | PASS/FAIL/SKIP | ... |
| API Smoke | PASS/FAIL/SKIP | ... |
| A11y | PASS/FAIL/SKIP | ... |
| Security | PASS/FAIL/SKIP | ... |
```

If the project has no live deployment, mark Live Site and API Smoke as SKIP.

## Key Principles

1. **Verify against requirements, not code** — code existing ≠ requirement met
2. **Debug before reporting** — don't just say "test failed", say WHY and HOW TO FIX
3. **Clear recommendation** — SHIP, FIX, or BLOCK. No "it depends"
4. **Regression is non-negotiable** — new work must not break old work
5. **Evidence-based** — every VERIFIED/FAILED claim needs proof
