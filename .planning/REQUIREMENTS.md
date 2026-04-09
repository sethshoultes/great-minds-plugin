# Hindsight v1.0 — Requirements Specification

**Project:** Git Intelligence for AI Agents (Hindsight)
**Generated:** April 9, 2026
**Sources:**
- `rounds/git-intelligence/decisions.md` (Final Build Blueprint)
- `prds/completed/git-intelligence.md` (Original PRD)

---

## Executive Summary

Hindsight is a pre-build git analysis tool that surfaces risk areas before agents modify code. It runs git diagnostics, produces a markdown report at `.planning/hindsight-report.md`, and injects context into planner/executor prompts so agents "proceed with awareness."

**Key Decisions Locked:**
- Product name: "Hindsight" (Steve Jobs won vs "git-intel")
- Output: Markdown file artifact (Steve won vs direct injection)
- Architecture: Single function <100 lines, no classes (Elon won)
- Performance: Parallel git commands with `--max-count=1000` safeguard (Elon won)
- Config: Zero user-facing options ("ships opinions, not options")
- Voice: Mentor tone, not alarm ("tread carefully" not "WARNING")

---

## Requirements by Category

### CORE Requirements (P0 — Must Ship)

| ID | Description | Acceptance Criteria | Source |
|----|-------------|-------------------|--------|
| REQ-001 | Create `generateHindsightReport(repoPath, outputPath?)` | Function exists, exported, runs in <2 seconds | decisions.md: MVP Feature Set |
| REQ-002 | Generate markdown to `.planning/hindsight-report.md` | File created, contains structured analysis, not committed | decisions.md: Decision 2 |
| REQ-003 | Git Command: Recent changes | `git log --oneline -20 --max-count=1000` results in report | decisions.md: Git Command 1 |
| REQ-004 | Git Command: File churn | `git log --name-only --format= -100 --max-count=1000` identifies churn | decisions.md: Git Command 2 |
| REQ-005 | Git Command: Bug-associated files | `git log --grep="fix\|bug\|broken\|revert" -i ...` executed | decisions.md: Git Command 3 |
| REQ-006 | Git Command: Uncommitted state | `git status --short` + `git diff --stat` captured | decisions.md: Git Command 4 |
| REQ-007 | Parallel git execution | All git commands use `Promise.all()` for <2s total | decisions.md: Decision 8 |
| REQ-008 | Risk assessment function | `assessRisk(churn, bugs)` returns LOW/MEDIUM/HIGH | decisions.md: Risk Assessment |
| REQ-009 | Core <100 lines | `hindsight.ts` under 100 lines, no classes | decisions.md: Decision 7 |
| REQ-010 | Named constants | `RECENT_COMMITS=20`, `ANALYSIS_DEPTH=100`, `CHURN_THRESHOLD=3` | decisions.md: Code Quality |
| REQ-011 | Consistent error handling | Return `null` for git failures, not empty strings | decisions.md: Code Quality |
| REQ-012 | Risk summary <50 words | Terse synthesis, not prose | decisions.md: Decision 5 |
| REQ-013 | Product named "Hindsight" | All docs/refs use "Hindsight" externally | decisions.md: Decision 1 |

### INTEGRATION Requirements (P0)

| ID | Description | Acceptance Criteria | Source |
|----|-------------|-------------------|--------|
| REQ-014 | Pipeline integration point | `generateProjectHindsight()` called before plan phase | decisions.md: MVP |
| REQ-015 | Planner prompt context | `hindsightPlannerContext()` injected into planner prompt | decisions.md: Prompt Modifiers |
| REQ-016 | Executor prompt context | `hindsightExecutorContext()` injected into executor prompt | decisions.md: Prompt Modifiers |
| REQ-017 | Outcome tracking | `trackHindsightOutcome()` logs flagged file + build failure correlation | decisions.md: Outcome Tracking |
| REQ-018 | First-run acknowledgment | Print: `"Hindsight: ${n} high-risk files identified. Proceed with awareness."` | decisions.md: Board Condition |
| REQ-019 | No pipeline rewrite | Add module to existing pipeline.ts, don't rewrite | git-intelligence.md: CRITICAL |

### PROMPT Requirements (P0)

| ID | Description | Acceptance Criteria | Source |
|----|-------------|-------------------|--------|
| REQ-020 | Planner reads report | Prompt includes: "Read `.planning/hindsight-report.md`" | PRD: Section 4 |
| REQ-021 | Planner emphasizes risk | Prompt includes: "Pay extra attention to churn/bug-prone files" | PRD: Section 4 |
| REQ-022 | Planner adds verification | Prompt includes: "If touching high-risk files, add verification steps" | PRD: Section 4 |
| REQ-023 | Executor checks report | Prompt includes: "Check report for risk areas before editing" | PRD: Section 4 |
| REQ-024 | Executor tests hotspots | Prompt includes: "If editing churn hotspot, test thoroughly" | PRD: Section 4 |
| REQ-025 | Mentor voice | Guidance tone ("tread carefully"), not warnings | decisions.md: Decision 6 |

### OUTPUT Requirements (P0)

| ID | Description | Acceptance Criteria | Source |
|----|-------------|-------------------|--------|
| REQ-026 | Churn hotspots section | Top 15 files by change frequency with counts | decisions.md |
| REQ-027 | Bug-prone files section | Files with 3+ bug-fix commits listed | decisions.md |
| REQ-028 | Recent failures section | Commits mentioning failures/reverts included | PRD: Section 2c |
| REQ-029 | Uncommitted state section | Dirty files from `git status --short` | PRD: Section 2e |
| REQ-030 | Parseable markdown | Risk assessment leads, timestamp as footnote | decisions.md: Code Quality |
| REQ-031 | Clear structure | Sections: churn, bugs, failures, uncommitted, summary | PRD: Section 2 |
| REQ-032 | No risk badges | Show data only, no numeric scores | decisions.md: CUT |
| REQ-033 | Terse formatting | Technical language, not narrative prose | decisions.md: Decision 5 |

### CONFIG Requirements (P0)

| ID | Description | Acceptance Criteria | Source |
|----|-------------|-------------------|--------|
| REQ-034 | Zero user config | No config files, flags, or env vars for users | decisions.md: Decision 4 |
| REQ-035 | No dashboard/UI | No web interface, toggles, or visual dashboard | decisions.md: Decision 10 |
| REQ-036 | No artificial delays | ~1.5s runtime is natural analysis time | decisions.md: Decision 12 |
| REQ-037 | Performance safeguard | `--max-count=1000` on all git log commands | decisions.md: Decision 8 |

### DOCUMENTATION Requirements (P0)

| ID | Description | Acceptance Criteria | Source |
|----|-------------|-------------------|--------|
| REQ-038 | README boundaries | Document who this is for (English commits, standard git) | decisions.md: Board Condition |
| REQ-039 | Integration location docs | Document exact file paths for prompt integration | decisions.md: Open Question 4 |

### QUALITY Requirements (P0)

| ID | Description | Acceptance Criteria | Source |
|----|-------------|-------------------|--------|
| REQ-040 | Code breathing room | Blank lines between data gathering and synthesis | decisions.md: Jony Ive |
| REQ-041 | No unused parameters | Remove all `_project` prefixed params | decisions.md: Jony Ive |
| REQ-042 | Named constants | All magic numbers extracted | decisions.md: Jony Ive |
| REQ-043 | JSDoc manifesto | index.ts includes feature philosophy JSDoc | decisions.md: File Structure |

---

## CUT Features (NOT in v1.0)

| Feature | Reason | Source |
|---------|--------|--------|
| Caching/memoization | Fast enough without (1-2s) | decisions.md: DEFERRED |
| User configuration | "Ships opinions, not options" | decisions.md: Decision 4 |
| Dashboard/UI | "Invisible by design" | decisions.md: Decision 10 |
| Agent Activity (shortlog) | Churn captures this | decisions.md: Decision 3 |
| Risk scores/badges | "Show data, trust the agent" | decisions.md: CUT |
| Enforcement mechanisms | Soft guidance only | decisions.md: CUT |

---

## Deferred Features

### v1.1 (30 Days Post-Launch)

| Feature | Source |
|---------|--------|
| Vindication moments (success surfacing) | Shonda Rhimes |
| Delta reports ("what changed since last run") | Jensen Huang |
| Outcome persistence | Jensen Huang |
| i18n patterns (non-English commits) | Oprah Winfrey |

### v1.2 (60 Days)

| Feature | Source |
|---------|--------|
| Revenue path documentation | Warren Buffett |
| Cross-session memory | Shonda Rhimes |
| Human annotation (.hindsight-context.md) | Oprah Winfrey |

### v2.0 (90 Days)

| Feature | Source |
|---------|--------|
| Feedback loop (warning -> outcome -> learning) | Jensen Huang |
| ML classification (replace regex) | Jensen Huang |
| Risk API (query interface) | Jensen Huang |
| Cross-project learning | Jensen Huang |

---

## Success Criteria (v1.0 Definition of Done)

From decisions.md:

- [ ] `generateHindsightReport()` exists and runs in <2 seconds
- [ ] Report generated and written to `.planning/hindsight-report.md`
- [ ] Planner prompt references report
- [ ] Executor prompt includes flagged-file guidance
- [ ] No user-facing configuration or UI
- [ ] Total implementation <100 lines core TypeScript
- [ ] Acknowledgment line on first run
- [ ] Basic outcome tracking implemented
- [ ] README documents boundaries (English commits, standard git)

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Report ignored by agent | HIGH | HIGH | Strong prompt language; v1.1 context injection |
| No measurable impact | HIGH | MEDIUM | Basic outcome tracking |
| False positives | MEDIUM | HIGH | Keep logic simple; soft enforcement |
| Monorepo timeout | MEDIUM | MEDIUM | `--max-count=1000` safeguard |
| Token bloat | MEDIUM | MEDIUM | Terse formatting; test with large repos |
| English-only exclusion | HIGH | MEDIUM | v1.1: i18n patterns |

---

## Technical Notes

### File Structure

```
deliverables/git-intelligence/
  index.ts                    # Exports + JSDoc manifesto
  hindsight.ts                # Core logic (<100 lines)
  hindsight-integration.ts    # Pipeline hooks + outcome tracking
  README.md                   # User documentation

daemon/src/
  pipeline.ts                 # Integration point (runPlan, runBuild)
  config.ts                   # REPO_PATH constant

.planning/
  hindsight-report.md         # Generated per-build (not committed)
```

### Key Integration Points

1. **pipeline.ts:runPlan()** — Call `generateProjectHindsight()` before planner agent
2. **pipeline.ts:runBuild()** — Call `generateProjectHindsight()` before builder agent
3. **Planner prompt** — Inject `hindsightPlannerContext()` output
4. **Builder prompt** — Inject `hindsightExecutorContext()` output

### Git Commands Reference

```bash
# Recent changes (REQ-003)
git log --oneline -20 --max-count=1000

# File churn (REQ-004)
git log --name-only --format= -100 --max-count=1000

# Bug-associated (REQ-005)
git log --grep="fix\|bug\|broken\|revert" -i --name-only --format= -100 --max-count=1000

# Uncommitted state (REQ-006)
git status --short
git diff --stat
```

---

## Board Scores

| Reviewer | Score | Key Quote |
|----------|-------|-----------|
| Jensen Huang | 5/10 | "You named this thing 'Intelligence' and delivered 'Formatted Output.'" |
| Warren Buffett | 6/10 | "Wonderful engineering. Still looking for the company." |
| Oprah Winfrey | 7.5/10 | "You got the hardest part right: you made something that cares." |
| Shonda Rhimes | 4/10 | "Beautiful pilot that ends at the cold open." |

**Composite Score:** 5.6/10 — PROCEED with conditions

---

*Document generated for Great Minds Agency Phase Planning*
*The Build Phase Is Authorized.*
