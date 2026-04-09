# GitSense — Requirements Traceability

**Generated**: 2026-04-09
**Sources**:
- PRD: `prds/git-intelligence.md`
- Decisions: `rounds/git-intelligence/decisions.md`

---

## Conflict Resolution Applied

| Topic | PRD Says | Decisions Say | Resolution |
|-------|----------|---------------|------------|
| Product Name | "git-intelligence" | "GitSense" | **Decisions win** |
| Git Commands | 5 commands (incl. shortlog) | 4 commands (shortlog cut) | **Decisions win** |
| Risk Summary | LLM-generated prose | Template-based, zero API calls | **Decisions win** |
| Architecture | Separate `git-intelligence.ts` module | Single inline function in pipeline.ts (~150 lines) | **Decisions win** |
| Configuration | Implicit thresholds | Zero configuration in v1 | **Decisions win** |
| Timeout | Not specified | 10-second timeout per git command | **Decisions win** |

---

## Requirements by Group

### GROUP 1: Core Architecture

| ID | Requirement | Source | Verification |
|----|-------------|--------|--------------|
| REQ-001 | Implement GitSense as a single inline function (`runGitSense()`) in pipeline.ts | Decisions (Architecture) | Code review: verify no separate module created |
| REQ-002 | Function size constraint: ~100-150 lines total | Decisions | `wc -l` on function |
| REQ-003 | No external npm dependencies beyond existing pipeline.ts imports | Both | Grep for new imports |
| REQ-004 | Use `execSync` from `child_process` for git commands (not agent-delegated) | Decisions (inline) | Code review: verify execSync usage |

### GROUP 2: Git Commands (4 total)

| ID | Requirement | Source | Verification |
|----|-------------|--------|--------------|
| REQ-005 | Run `git log --since="90 days ago" --format="%H"` — commit count | Decisions | Grep source for command |
| REQ-006 | Run `git log --since="90 days ago" --name-only --format=""` — file change frequency (hotspots) | Decisions | Grep source for command |
| REQ-007 | Run `git log --since="90 days ago" --oneline --grep="revert"` — revert detection | Decisions | Grep source for command |
| REQ-008 | Run `git log --since="90 days ago" --format="" --name-only --diff-filter=M` — churn analysis | Decisions | Grep source for command |
| REQ-CUT-01 | ~~Do NOT run `git shortlog` (Agent Activity)~~ | Decisions (cut) | Grep source: must not contain shortlog |

### GROUP 3: Timeout & Graceful Degradation

| ID | Requirement | Source | Verification |
|----|-------------|--------|--------------|
| REQ-009 | Each git command must timeout after 10 seconds | Decisions | Code review: verify `{ timeout: 10_000 }` on execSync |
| REQ-010 | On timeout, report "analysis incomplete — repo too large" in output | Decisions | Test on large repo, verify message |
| REQ-011 | On timeout, continue pipeline without blocking | Decisions | Test: timeout should not throw |
| REQ-012 | Catch ETIMEDOUT and SIGTERM signals gracefully | Risk Scanner | Code review: verify try-catch pattern |

### GROUP 4: Output File

| ID | Requirement | Source | Verification |
|----|-------------|--------|--------------|
| REQ-013 | Write output to `.planning/git-intelligence.md` | Both | `ls .planning/`, verify file exists |
| REQ-014 | Create `.planning/` directory if it doesn't exist (`mkdir -p` equivalent) | Both | Test on fresh repo |
| REQ-015 | Output format: Markdown with sections for each analysis type | PRD | Parse generated file, verify sections |
| REQ-016 | Include template-based risk summary (no LLM calls) | Decisions | Code review: verify no API calls |

### GROUP 5: Report Content Structure

| ID | Requirement | Source | Verification |
|----|-------------|--------|--------------|
| REQ-017 | Section: Top 10-20 churn hotspots with change counts | PRD/Decisions | Parse report, verify section |
| REQ-018 | Section: Recent reverts/failures from last 90 days | PRD/Decisions | Parse report, verify section |
| REQ-019 | Section: High-churn files (modified frequently) | PRD/Decisions | Parse report, verify section |
| REQ-020 | Section: Uncommitted state (git status output) | PRD | Parse report, verify section |
| REQ-021 | Section: Risk Summary using template (e.g., `"${hotspotCount} hotspots, ${revertCount} reverts"`) | Decisions | Parse report, verify template format |
| REQ-CUT-02 | ~~Do NOT include LLM-generated summary~~ | Decisions (cut) | Code review: no runAgent for summary |

### GROUP 6: Pipeline Integration

| ID | Requirement | Source | Verification |
|----|-------------|--------|--------------|
| REQ-022 | Inject GitSense phase AFTER debate and BEFORE plan | Both | Read pipeline.ts, verify order |
| REQ-023 | Add `notifyPhase(project, "git-sense", "start/done")` around execution | Existing pattern | Code review: verify notifications |
| REQ-024 | GitSense runs in runPipeline() between lines 421-423 (after debate done, before plan start) | Codebase Scout | Code review: verify injection point |
| REQ-025 | Do NOT rewrite or refactor existing pipeline.ts logic | PRD (CRITICAL) | Code review: minimal changes only |

### GROUP 7: Agent Prompt Updates

| ID | Requirement | Source | Verification |
|----|-------------|--------|--------------|
| REQ-026 | Update planner prompt to include: "Read .planning/git-intelligence.md for risk areas" | PRD | Grep pipeline.ts for planner prompt |
| REQ-027 | Update planner prompt: "Pay extra attention to files flagged as churn hotspots" | PRD | Grep pipeline.ts for planner prompt |
| REQ-028 | Update planner prompt: "If your plan touches high-risk files, add verification steps" | PRD | Grep pipeline.ts for planner prompt |
| REQ-029 | Update builder prompt: "Check .planning/git-intelligence.md for risk areas before editing files" | PRD | Grep pipeline.ts for builder prompt |
| REQ-030 | Update builder prompt: "If editing a churn hotspot, be extra careful and test thoroughly" | PRD | Grep pipeline.ts for builder prompt |

### GROUP 8: Git Availability & Error Handling

| ID | Requirement | Source | Verification |
|----|-------------|--------|--------------|
| REQ-031 | Check for git availability before running commands | Risk Register | Test without git, verify graceful failure |
| REQ-032 | If git not found, log warning and skip GitSense (don't block pipeline) | Risk Register | Test: pipeline continues without git |
| REQ-033 | Handle git command failures gracefully (log error, continue to next command) | Decisions | Test: corrupt repo, verify partial results |
| REQ-034 | Use REPO_PATH constant for git command working directory | BANNED-PATTERNS | Code review: no hardcoded paths |

### GROUP 9: Configuration (Zero Config v1)

| ID | Requirement | Source | Verification |
|----|-------------|--------|--------------|
| REQ-035 | No configuration options exposed in v1 | Decisions | Code review: no new config constants |
| REQ-036 | Use hardcoded defaults (90 days lookback, top 20 files, etc.) | Decisions | Code review: verify hardcoded values |
| REQ-037 | Defer `hotspot_threshold` config to v1.1 if complaints arise | Decisions | Document in code comments |

---

## CUT Features (Does NOT Ship in v1)

| ID | Feature | Source | Reason |
|----|---------|--------|--------|
| REQ-CUT-01 | Agent Activity / shortlog section | Decisions #3 | Contributor identity is noise for AI agents |
| REQ-CUT-02 | LLM-generated risk summary | Decisions #2 | Adds 200ms+ latency, API cost, hallucination risk |
| REQ-CUT-03 | Configuration options | Decisions #4 | Zero config for v1; escape hatch in v1.1 |
| REQ-CUT-04 | Visualizations or charts | Decisions | Text-only markdown output |
| REQ-CUT-05 | Trend analysis | Decisions | Deferred to v2 |
| REQ-CUT-06 | Cross-referencing hotspots with bug files | Decisions | Deferred to v2 |
| REQ-CUT-07 | CI/CD log integration | Decisions | Rejected |
| REQ-CUT-08 | Caching or incremental updates | Decisions | Rejected; fresh analysis each run |

---

## Architectural Constraints (from DO-NOT-REPEAT.md)

| Constraint | Applies To | Mitigation |
|------------|-----------|------------|
| No `grep -oP` (Linux-only) | Parsing git output | Use `split('\n').filter()` pattern |
| No `timeout` shell command | Git timeout | Use `execSync({ timeout: 10_000 })` |
| No hardcoded paths | REPO_PATH | Use `REPO_PATH` constant from config.ts |
| PRD watcher race condition | N/A | GitSense writes file, no watcher needed |
| Agent timeout coordination | Pipeline phases | GitSense must complete in <2 min (well under 20min timeout) |

---

## Banned Patterns (from BANNED-PATTERNS.md)

| Pattern | Risk | Check |
|---------|------|-------|
| Hardcoded paths (`/Users/...`) | Cross-machine failure | `grep -rn '/Users/' daemon/src/pipeline.ts` |
| `console.log` in daemon code | Missing timestamps/levels | Use `log()` from logger.ts |
| Unprotected setTimeout | Hung processes | Wrap with Promise.race or use timeout param |

---

## Success Criteria

| # | Criterion | Verification |
|---|-----------|--------------|
| 1 | Pipeline runs GitSense before agent task begins | Check logs for "PHASE: git-sense" |
| 2 | Output appears at `.planning/git-intelligence.md` | `ls -la .planning/` |
| 3 | Agent reads and acknowledges the report | Grep agent output for "git-intelligence.md" |
| 4 | No pipeline failures introduced | Run full pipeline, verify completion |
| 5 | Timeout handles large repos gracefully | Test on monorepo, verify "incomplete" message |
| 6 | Completes in under 2 minutes | Time the GitSense phase |

---

## Total Requirements: 37

| Group | Count |
|-------|-------|
| Core Architecture | 4 |
| Git Commands | 5 (1 cut) |
| Timeout & Degradation | 4 |
| Output File | 4 |
| Report Content | 6 (1 cut) |
| Pipeline Integration | 4 |
| Agent Prompt Updates | 5 |
| Git Availability | 4 |
| Configuration | 3 |

---

## Open Questions Resolved

| # | Question | Resolution |
|---|----------|------------|
| 1 | Exact injection point in pipeline.ts? | Between lines 421-423 (after debate done, before plan start) |
| 2 | Hotspot threshold definition? | Use sensible default (10+ changes = hotspot), observe in production |
| 3 | Output filename? | Use `git-intelligence.md` (matches existing references in PRD) |
| 4 | Does `.planning/` directory exist? | Created in runPlan(), but GitSense should also ensure it exists |
| 5 | Agent prompt update location? | Lines 264-272 (planner) and 292-303 (builder) in pipeline.ts |
