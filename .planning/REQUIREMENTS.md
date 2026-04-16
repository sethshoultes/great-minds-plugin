# Requirements Traceability — git-intelligence (Hindsight)

**Project:** Hindsight — Git intelligence pre-build step
**Generated:** 2026-04-16
**Source Documents:**
- PRD: `/prds/git-intelligence.md`
- Decisions: `/rounds/git-intelligence/decisions.md`

---

## Executive Summary

Hindsight is **60% implemented** but **0% integrated**. The core git-intelligence modules exist and are well-designed, but they are completely disconnected from the pipeline. Agents receive no git intelligence, making the feature effectively dead code.

**Critical Finding:** The code was shipped to production but never wired into the pipeline. This phase plan completes the integration.

---

## Atomic Requirements

### CORE FUNCTIONALITY (Already Implemented ✓)

#### REQ-001: Git Command Execution
**Status:** ✓ IMPLEMENTED
**Description:** Execute 4 git diagnostic commands to analyze repository health
**Source:** Decisions §MVP Feature 1
**Verification:** `generateHindsightReport()` executes all 4 commands successfully
**Location:** `daemon/src/git-intelligence.ts` lines 35-52

#### REQ-002: Churn Hotspots Analysis
**Status:** ⚠️ PARTIAL (threshold mismatch)
**Description:** Identify files with 10+ changes in 90 days as high-churn
**Source:** Decisions §5 (10+ commits = danger zone)
**Issue:** Code uses threshold of 3, not 10
**Verification:** Output contains "High-Churn Files" section with correct threshold
**Location:** `daemon/src/git-intelligence.ts` line 44

#### REQ-003: Bug-Associated Files
**Status:** ✓ IMPLEMENTED
**Description:** Identify files appearing in fix/bug/broken/revert commits
**Source:** PRD §1b
**Verification:** Output contains "Bug-Associated Files" section
**Location:** `daemon/src/git-intelligence.ts` lines 47-48

#### REQ-004: Uncommitted State Check
**Status:** ✓ IMPLEMENTED
**Description:** Detect and report uncommitted changes
**Source:** PRD §1e + Decisions §MVP Feature 1
**Verification:** Output shows git status results
**Location:** `daemon/src/git-intelligence.ts` lines 50-52

#### REQ-005: Risk Assessment
**Status:** ✓ IMPLEMENTED
**Description:** Calculate risk level (LOW/MEDIUM/HIGH) based on churn and bugs
**Source:** Decisions §6 (opinionated curation)
**Verification:** Report includes risk summary with calm veteran engineer tone
**Location:** `daemon/src/git-intelligence.ts` lines 26-30, 55

#### REQ-006: Markdown Report Generation
**Status:** ✓ IMPLEMENTED
**Description:** Generate template-based markdown report (no LLM calls)
**Source:** Decisions §2 (Elon's format + Steve's philosophy)
**Verification:** Report is static markdown with structured sections
**Location:** `daemon/src/git-intelligence.ts` lines 68-92

---

### PIPELINE INTEGRATION (NOT IMPLEMENTED ❌)

#### REQ-007: Create .great-minds/ Directory
**Status:** ❌ NOT IMPLEMENTED
**Description:** Create `.great-minds/` directory for report output
**Source:** Decisions §6 (brand namespace)
**Verification:** Directory exists before report generation
**Implementation:** Add `await mkdir(resolve(REPO_PATH, ".great-minds"), { recursive: true })` in pipeline

#### REQ-008: Pre-Plan Report Generation
**Status:** ❌ NOT IMPLEMENTED (CRITICAL)
**Description:** Generate Hindsight report before plan phase begins
**Source:** PRD §3 + Decisions §MVP Feature 5
**Verification:** `.great-minds/hindsight.md` exists before planner agent runs
**Implementation:** Call `generateProjectHindsight()` at start of `runPlan()`

#### REQ-009: Pre-Build Report Regeneration
**Status:** ❌ NOT IMPLEMENTED (CRITICAL)
**Description:** Regenerate Hindsight report before build phase (code may have changed)
**Source:** Decisions §Risk Register (agent activity tracking)
**Verification:** Fresh report generated before builder agent runs
**Implementation:** Call `generateProjectHindsight()` at start of `runBuild()`

#### REQ-010: Planner Prompt Injection
**Status:** ❌ NOT IMPLEMENTED (CRITICAL)
**Description:** Inject instruction to read Hindsight report into planner prompt
**Source:** PRD §3-4 + Decisions §7
**Verification:** Planner prompt includes explicit reference to `.great-minds/hindsight.md`
**Implementation:** Use `hindsightPlannerContext()` helper in `runPlan()` prompt

#### REQ-011: Builder Prompt Injection
**Status:** ❌ NOT IMPLEMENTED (CRITICAL)
**Description:** Inject Hindsight context into all builder prompts (setup, execute, hotfix)
**Source:** PRD §4 + Decisions §7
**Verification:** Builder prompts reference Hindsight and instruct extra care for flagged files
**Implementation:** Use `hindsightExecutorContext()` helper in `runBuild()` prompts

#### REQ-012: Report Path Standardization
**Status:** ⚠️ PARTIAL (uses configurable path)
**Description:** Always write report to `.great-minds/hindsight.md`
**Source:** Decisions §6 (locked file location)
**Verification:** Report always at expected location, not configurable
**Implementation:** Pass standardized path to `generateProjectHindsight()`

---

### PERFORMANCE OPTIMIZATION (NOT IMPLEMENTED ❌)

#### REQ-013: Parallel Git Command Execution
**Status:** ❌ NOT IMPLEMENTED
**Description:** Run 4 git commands concurrently via Promise.all() (5x speedup)
**Source:** Decisions §3 (Elon's optimization)
**Verification:** Commands execute in parallel, measured speedup
**Implementation:** Wrap git commands in Promise.all() in `generateHindsightReport()`

#### REQ-014: In-Memory Caching
**Status:** ❌ NOT IMPLEMENTED
**Description:** Cache results in memory keyed by HEAD commit hash + timestamp
**Source:** Decisions §3 & §6
**Verification:** Second run within 1 hour completes in <100ms
**Implementation:** Add cache Map at module level with HEAD-based keys

#### REQ-015: Cache Invalidation on HEAD Change
**Status:** ❌ NOT IMPLEMENTED
**Description:** Invalidate cache when git HEAD changes
**Source:** Decisions §3
**Verification:** Cache cleared after new commits
**Implementation:** Check current HEAD hash before cache lookup

#### REQ-016: Cache TTL (1 Hour)
**Status:** ❌ NOT IMPLEMENTED
**Description:** Expire cache entries after 1 hour regardless of HEAD
**Source:** Decisions §3
**Verification:** Cache expires exactly at 1 hour mark
**Implementation:** Store timestamp with cache entry, check on retrieval

#### REQ-017: Per-Command Timeout
**Status:** ❌ NOT IMPLEMENTED
**Description:** 10-second timeout per git command to prevent hangs
**Source:** Decisions §4 + §MVP Feature 4
**Verification:** Commands exceeding 10s are killed gracefully
**Implementation:** Wrap execSync in Promise.race() with timeout

#### REQ-018: Large Repo Auto-Skip
**Status:** ❌ NOT IMPLEMENTED
**Description:** Detect repos >500k commits and skip with explanation
**Source:** Decisions §4
**Verification:** Report shows "repo too large" message for massive repos
**Implementation:** Count commits first, skip if >500k

---

### EDGE CASES & GRACEFUL DEGRADATION (PARTIAL ⚠️)

#### REQ-019: Git Not Available
**Status:** ⚠️ PARTIAL (silent catch)
**Description:** If git command not found, skip gracefully with warning
**Source:** Decisions §MVP Feature 6
**Verification:** Non-git environments don't crash, show appropriate message
**Implementation:** Check `git --version` before running, log warning if missing

#### REQ-020: Non-Git Repository
**Status:** ⚠️ PARTIAL (silent catch)
**Description:** Silent skip for non-git repos
**Source:** Decisions §Open Questions #4
**Verification:** Non-git repos show minimal message, pipeline continues
**Implementation:** Current try-catch handles this but doesn't log

#### REQ-021: Empty Repository (0 commits)
**Status:** ⚠️ UNKNOWN (not tested)
**Description:** Handle empty repos gracefully
**Source:** Decisions §Open Questions #7
**Verification:** Zero-commit repos show appropriate message without errors
**Implementation:** Check commit count before analysis

---

### CONFIGURATION & THRESHOLDS (PARTIAL ⚠️)

#### REQ-022: 90-Day Lookback Window
**Status:** ⚠️ PARTIAL (inconsistent)
**Description:** All analyses use 90-day window
**Source:** Decisions §5
**Verification:** All git commands use `--since="90 days ago"`
**Implementation:** Standardize across all git commands

#### REQ-023: High-Churn Threshold (10+ commits)
**Status:** ⚠️ MISMATCH (code uses 3, spec says 10)
**Description:** Files with 10+ commits in 90 days = high-churn
**Source:** Decisions §5
**Verification:** Threshold correctly set to 10
**Implementation:** Change line 44 from `>= 3` to `>= 10`

#### REQ-024: Top 5 Curation (Not All Files)
**Status:** ⚠️ PARTIAL (uses 15)
**Description:** Show only top 5 hotspots, not all files
**Source:** Decisions §2 & §6
**Verification:** Output limited to 5 highest-change files
**Implementation:** Change `.slice(0, 15)` to `.slice(0, 5)`

#### REQ-025: Zero Configuration
**Status:** ✓ IMPLEMENTED
**Description:** No config files or user options in v1
**Source:** Decisions §5
**Verification:** Feature works out of the box with no setup
**Implementation:** Already achieved

---

### QUALITY & VOICE (MOSTLY IMPLEMENTED ✓)

#### REQ-026: Calm Veteran Engineer Voice
**Status:** ✓ MOSTLY IMPLEMENTED
**Description:** Direct, factual tone without panic or emojis
**Source:** Decisions §8
**Verification:** No emoji, no jargon, confident understatement
**Implementation:** Current prose is good; closing line is slightly poetic but acceptable

#### REQ-027: Template-Based (No LLM Calls)
**Status:** ✓ IMPLEMENTED
**Description:** No API calls for summary generation
**Source:** Decisions §2
**Verification:** No external API dependencies
**Implementation:** Pure template in formatMarkdown()

#### REQ-028: Product Name: "Hindsight"
**Status:** ✓ IMPLEMENTED
**Description:** Consistently called "Hindsight", not GitSense
**Source:** Decisions §1
**Verification:** All output uses "Hindsight Report" title
**Implementation:** formatMarkdown() line 69

---

## Requirements Traceability Matrix

| Requirement | Category | Status | Task(s) | Wave |
|-------------|----------|--------|---------|------|
| REQ-007 | Pipeline Integration | ❌ NOT IMPLEMENTED | phase-1-task-1 | 1 |
| REQ-008 | Pipeline Integration | ❌ NOT IMPLEMENTED | phase-1-task-2 | 1 |
| REQ-009 | Pipeline Integration | ❌ NOT IMPLEMENTED | phase-1-task-3 | 1 |
| REQ-010 | Pipeline Integration | ❌ NOT IMPLEMENTED | phase-1-task-2 | 1 |
| REQ-011 | Pipeline Integration | ❌ NOT IMPLEMENTED | phase-1-task-3 | 1 |
| REQ-012 | Pipeline Integration | ⚠️ PARTIAL | phase-1-task-2 | 1 |
| REQ-002 | Core Functionality | ⚠️ THRESHOLD MISMATCH | phase-1-task-4 | 2 |
| REQ-023 | Configuration | ⚠️ THRESHOLD MISMATCH | phase-1-task-4 | 2 |
| REQ-024 | Configuration | ⚠️ CURATION MISMATCH | phase-1-task-4 | 2 |
| REQ-013 | Performance | ❌ NOT IMPLEMENTED | phase-1-task-5 | 2 |
| REQ-014 | Performance | ❌ NOT IMPLEMENTED | phase-1-task-6 | 2 |
| REQ-015 | Performance | ❌ NOT IMPLEMENTED | phase-1-task-6 | 2 |
| REQ-016 | Performance | ❌ NOT IMPLEMENTED | phase-1-task-6 | 2 |
| REQ-017 | Performance | ❌ NOT IMPLEMENTED | phase-1-task-7 | 3 |
| REQ-018 | Performance | ❌ NOT IMPLEMENTED | phase-1-task-7 | 3 |
| REQ-019 | Edge Cases | ⚠️ PARTIAL | phase-1-task-8 | 3 |
| REQ-020 | Edge Cases | ⚠️ PARTIAL | phase-1-task-8 | 3 |
| REQ-021 | Edge Cases | ⚠️ UNKNOWN | phase-1-task-8 | 3 |

---

## Success Criteria (from Decisions.md §Build Mandate)

1. ✓ Pipeline runs Hindsight before agent task begins → **REQ-008, REQ-009**
2. ✓ Output appears at `.great-minds/hindsight.md` → **REQ-007, REQ-012**
3. ✓ Agent system prompt includes instruction to read Hindsight → **REQ-010, REQ-011**
4. ✓ Test on repo with >1000 commits shows reasonable output → **REQ-002, REQ-003, REQ-004**
5. ✓ No pipeline failures introduced → **All tasks**
6. ✓ Timeout handles large repos gracefully → **REQ-017, REQ-018**
7. ✓ Cache works (second run <100ms) → **REQ-014, REQ-015, REQ-016**
8. ✓ Parallel execution works → **REQ-013**

---

## Risk Assessment

### Critical Blockers
- **REQ-008, REQ-009:** Hindsight never runs (feature is dead code)
- **REQ-010, REQ-011:** Agents never receive intelligence (no value delivery)

### High Priority
- **REQ-013:** Performance 5x slower than spec (sequential vs parallel)
- **REQ-014-016:** No caching (every run re-executes all git commands)
- **REQ-017:** No timeout (could hang on large repos)

### Medium Priority
- **REQ-002, REQ-023, REQ-024:** Threshold mismatches (code doesn't match design decisions)

### Low Priority
- **REQ-019-021:** Edge case handling improvements (already graceful, just needs logging)

---

## Implementation Phases

### Phase 1 (This Plan): Complete Pipeline Integration
**Goal:** Make Hindsight actually run and feed agents intelligence

**Tasks:**
- Task 1: Create `.great-minds/` directory in pipeline
- Task 2: Integrate Hindsight into plan phase
- Task 3: Integrate Hindsight into build phase
- Task 4: Fix threshold mismatches

**Outcome:** Feature goes from 0% integration to 100% integration

### Phase 2 (Future): Performance Optimization
**Goal:** Meet spec performance targets (<500ms, <100ms cached)

**Tasks:**
- Task 5: Parallelize git commands
- Task 6: Implement caching
- Task 7: Add timeout protection
- Task 8: Enhance edge case handling

**Outcome:** Feature meets all performance and reliability requirements

---

**Document Status:** ✅ Complete
**Total Requirements:** 28 atomic requirements
**Critical Path:** REQ-007 through REQ-012 (Pipeline Integration)
