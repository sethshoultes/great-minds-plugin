# Requirements: Hindsight (Git Intelligence)

**Project:** git-intelligence
**Product Name:** Hindsight
**Version:** v1.0 MVP
**Generated:** 2025-04-09
**Source Documents:**
- PRD: `prds/git-intelligence.md`
- Decisions: `rounds/git-intelligence/decisions.md`

---

## Core Requirements

### REQ-001: Single Function Architecture
**Requirement:** Implement git intelligence as one function, <100 lines of TypeScript, no classes or interfaces
**Acceptance Criteria:**
- File created at `daemon/src/git-intelligence.ts`
- Total lines <100 (including imports and comments)
- No `class` or `interface` definitions
- Single exported function: `generateHindsightReport()`
**Source:** Decision 2 (Architecture Pattern) — Elon Musk won

### REQ-002: No User Configuration
**Requirement:** Ship v1 without configuration options or toggles
**Acceptance Criteria:**
- No CLI flags or environment variables for behavior customization
- All parameters hardcoded (lookback periods, count limits)
- Configuration deferred to v2 roadmap
**Source:** Decision 3 (Configuration Options) — Steve Jobs won

### REQ-003: Churn Hotspots Report
**Requirement:** Identify most-changed files in the last 90 days
**Acceptance Criteria:**
- Git command: `git log --since="90 days ago" --name-only --pretty=format: --max-count=1000`
- Output: Top 10 files with change frequency counts
- Sorted descending by change count
- Section header: `## Churn Hotspots`
**Source:** PRD Section 1a

### REQ-004: Bug Clustering Report
**Requirement:** Identify files associated with bug fix commits
**Acceptance Criteria:**
- Pattern: `fix|bug|broken|revert` (case-insensitive, no expansion)
- Git command: `git log --all --grep="fix\|bug\|broken\|revert" --name-only --pretty=format: --max-count=1000`
- Output: Top 10 bug-prone files with frequency counts
- Section header: `## Bug-Prone Files`
**Source:** PRD Section 1b, Decision 9 (Bug Pattern Matching)

### REQ-005: Recent Failures Log
**Requirement:** Report commits mentioning failures/reverts in last 30 days
**Acceptance Criteria:**
- Git command: `git log --oneline --since="30 days ago" --grep="fail\|revert\|hotfix\|broken\|rollback" --max-count=1000`
- Output: Up to 10 recent failure-related commits
- Section header: `## Recent Failures`
**Source:** PRD Section 1c

### REQ-006: Agent Activity CUT from v1
**Requirement:** Do NOT implement shortlog/agent activity analysis
**Acceptance Criteria:**
- `git shortlog` command NOT implemented
- Bus factor analysis completely omitted
- Deferred to v2 roadmap
**Source:** Decision 5 (Agent Activity) — Elon Musk won

### REQ-007: Uncommitted State Report
**Requirement:** Detect and report uncommitted changes
**Acceptance Criteria:**
- Git command: `git status --short`
- Git command: `git diff --stat`
- Output: List of uncommitted files
- Section header: `## Uncommitted Changes`
**Source:** PRD Section 1e

### REQ-008: Monorepo Safeguard
**Requirement:** Add `--max-count=1000` to all git log commands
**Acceptance Criteria:**
- ALL `git log` commands include `--max-count=1000`
- Function completes in <2 seconds on standard repos
- Large monorepos (100k+ commits) do not cause timeouts
**Source:** Decision 6 (Monorepo Handling) — Elon Musk won

### REQ-009: Markdown Report Output
**Requirement:** Generate risk report at `.planning/git-intelligence.md`
**Acceptance Criteria:**
- Output path: `.planning/git-intelligence.md`
- Contains all sections: churn, bugs, failures, uncommitted, summary
- Generated before every plan phase
- NOT committed to git (ephemeral)
- Properly formatted markdown
**Source:** PRD Section 2, Decision (Report Location)

### REQ-010: Lightweight Risk Summary
**Requirement:** Add "Risk Summary" section with <50 words
**Acceptance Criteria:**
- Section header: `## Risk Summary`
- Content: 1-3 sentences synthesizing risk posture
- Word count: <50 words
- Dense, factual language (not prose)
**Source:** Decision 4 (Risk Summary Generation) — Compromise

---

## Integration Requirements

### REQ-011: Pipeline Integration
**Requirement:** Call git intelligence in pipeline.ts before plan phase
**Acceptance Criteria:**
- Import: `import { generateHindsightReport } from "./git-intelligence.js";`
- Call location: After `runDebate()`, before `runPlan()`
- Single line addition: `await generateHindsightReport(REPO_PATH);`
- Order: debate → git-intelligence → plan → build → QA
**Source:** PRD Section 3

### REQ-012: Update Planner Prompt
**Requirement:** Modify planner agent prompt to reference git report
**Acceptance Criteria:**
- Add to prompt: "Read `.planning/git-intelligence.md` for risk areas"
- Add: "Pay extra attention to churn hotspots and bug-prone files"
- Add: "If plan touches high-risk files, add verification steps"
- Planner output must show awareness of risk areas
**Source:** PRD Section 4

### REQ-013: Update Builder Prompt
**Requirement:** Modify builder agent prompt to reference risk areas
**Acceptance Criteria:**
- Add to prompt: "Check `.planning/git-intelligence.md` before editing files"
- Add: "If editing a churn hotspot, be extra careful and test thoroughly"
- Builder demonstrates awareness of risk report
**Source:** PRD Section 4

---

## Constraint Requirements

### REQ-014: No Caching
**Requirement:** Generate report fresh on every run, no memoization
**Acceptance Criteria:**
- Report generated fresh each time
- No HEAD commit hashing or change detection
- Caching deferred to v2
**Source:** Decision 7 (Caching Strategy)

### REQ-015: No UI/Dashboard
**Requirement:** Feature is completely invisible infrastructure
**Acceptance Criteria:**
- No dashboard component
- No toggle or configuration UI
- No visualization or analytics interface
- Background wisdom only
**Source:** Decision 8 (UI/Dashboard) — Full alignment

### REQ-016: No New Dependencies
**Requirement:** Implement using git CLI and Node.js built-ins only
**Acceptance Criteria:**
- No npm packages added
- Uses `execSync` from `child_process`
- Only git and filesystem APIs required
**Source:** PRD Success Criteria

### REQ-017: Execution Time <2 Seconds
**Requirement:** Performance target for report generation
**Acceptance Criteria:**
- Completes in <2 seconds on standard repos
- Completes in <5 seconds on large monorepos
**Source:** Success Criteria (Definition of Done)

---

## Quality Requirements

### REQ-018: Use Project Logger
**Requirement:** Follow daemon logging patterns
**Acceptance Criteria:**
- Use `log()` from `./logger.js`, NOT `console.log`
- Log format: `HINDSIGHT: <message>`
- Log start, completion, and any errors
**Source:** BANNED-PATTERNS.md, daemon conventions

### REQ-019: Avoid Banned Patterns
**Requirement:** Code must not contain banned patterns
**Acceptance Criteria:**
- No hardcoded `/Users/` paths
- No `console.log` in daemon code
- Use `REPO_PATH` from config.ts for all paths
**Source:** BANNED-PATTERNS.md

### REQ-020: Integration Test
**Requirement:** Verify feature works end-to-end
**Acceptance Criteria:**
- Function runs without errors
- Report generates with all sections
- Planner output references git history
- Pipeline completes successfully
**Source:** Definition of Done (decisions.md)

---

## Traceability Matrix

| Requirement | Source Doc | Priority | Wave |
|-------------|-----------|----------|------|
| REQ-001 | Decision 2 | P0 | 1 |
| REQ-002 | Decision 3 | P1 | 1 |
| REQ-003 | PRD 1a | P0 | 1 |
| REQ-004 | PRD 1b, Decision 9 | P0 | 1 |
| REQ-005 | PRD 1c | P0 | 1 |
| REQ-006 | Decision 5 | P1 | — |
| REQ-007 | PRD 1e | P0 | 1 |
| REQ-008 | Decision 6 | P0 | 1 |
| REQ-009 | PRD 2 | P0 | 1 |
| REQ-010 | Decision 4 | P1 | 1 |
| REQ-011 | PRD 3 | P0 | 2 |
| REQ-012 | PRD 4 | P0 | 2 |
| REQ-013 | PRD 4 | P0 | 2 |
| REQ-014 | Decision 7 | P1 | 1 |
| REQ-015 | Decision 8 | P1 | — |
| REQ-016 | PRD | P0 | 1 |
| REQ-017 | Success Criteria | P1 | 3 |
| REQ-018 | BANNED-PATTERNS | P0 | 1 |
| REQ-019 | BANNED-PATTERNS | P0 | 1 |
| REQ-020 | Definition of Done | P0 | 3 |

---

## Decision Overrides Summary

These decisions from `rounds/git-intelligence/decisions.md` override the original PRD:

| Decision | PRD Said | Decision Says | Winner |
|----------|----------|---------------|--------|
| Architecture | Multi-file module | Single function <100 lines | Elon Musk |
| Configuration | Implied configurable | No configuration in v1 | Steve Jobs |
| Risk Summary | "Mentor voice" | <50 words, terse | Compromise |
| Agent Activity | Include shortlog | CUT from v1 | Elon Musk |
| Monorepo | No mention | `--max-count=1000` required | Elon Musk |
| Caching | No mention | No caching in v1 | Both (deferred) |
| UI | No mention | No UI ever | Both (aligned) |
| Bug Pattern | Implied extensible | Fixed: `fix\|bug\|broken\|revert` | Elon Musk |
