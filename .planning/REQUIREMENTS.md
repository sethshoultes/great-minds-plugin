# Mirror v1 Requirements

**Project:** sync-great-minds
**Product Name:** Mirror
**Source:** PRD `prds/sync-great-minds.md` + Decisions `rounds/sync-great-minds/decisions.md`
**Generated:** 2025-04-09
**Status:** Approved for Build

---

## Requirements Traceability Matrix

| Req ID | Description | Source | Priority | Task(s) |
|--------|-------------|--------|----------|---------|
| REQ-001 | Copy daemon source files (pipeline.ts, agents.ts, config.ts, daemon.ts) | PRD | v1 | phase-1-task-1 |
| REQ-002 | Copy daemon config files (package.json, README.md) | PRD | v1 | phase-1-task-1 |
| REQ-003 | Copy documentation files (BANNED-PATTERNS.md, DO-NOT-REPEAT.md) | PRD | v1.1 (deferred) | — |
| REQ-004 | Update great-minds CLAUDE.md with anti-hallucination rules | PRD | v1.1 (deferred) | — |
| REQ-005 | Run npm install in destination daemon | PRD, Decisions | v1 | phase-1-task-3 |
| REQ-006 | Git commit all synced changes | PRD, Decisions | v1 | phase-1-task-4 |
| REQ-007 | Git push to origin | PRD, Decisions | v1 | phase-1-task-4 |
| REQ-008 | Implement quiet, declarative output style | Decisions (D7) | v1 | phase-1-task-1, phase-1-task-2 |
| REQ-009 | Zero confirmation dialogs | Decisions (D3) | v1 | phase-1-task-2 |
| REQ-010 | Human-initiated trigger (no git hooks in v1) | Decisions (D4) | v1 | phase-1-task-5 |
| REQ-011 | Use PRD file list (not Decisions hypothetical list) | Analysis | v1 | All tasks |
| REQ-012 | Fail fast on uncommitted changes in destination | Decisions (Risk) | v1 | phase-1-task-2 |
| REQ-013 | Error handling for npm install failure | Decisions (Risk) | v1 | phase-1-task-3 |
| REQ-014 | Error handling for git push failure | Decisions (Risk) | v1 | phase-1-task-4 |
| REQ-015 | Create mirror.ts script and config | Decisions | v1 | phase-1-task-1, phase-1-task-2 |

---

## v1 Requirements (Must Ship)

### REQ-001: Copy Daemon Source Files

**Source:** PRD lines 11-18
**Description:** Copy core TypeScript source files from plugin daemon to great-minds daemon.

**File Manifest:**
| Source | Destination |
|--------|-------------|
| `daemon/src/pipeline.ts` | `great-minds/daemon/src/pipeline.ts` |
| `daemon/src/agents.ts` | `great-minds/daemon/src/agents.ts` |
| `daemon/src/config.ts` | `great-minds/daemon/src/config.ts` |
| `daemon/src/daemon.ts` | `great-minds/daemon/src/daemon.ts` |

**Acceptance Criteria:**
- [ ] All 4 files copied successfully
- [ ] File contents byte-identical to source
- [ ] No manual edits applied during copy

---

### REQ-002: Copy Daemon Config Files

**Source:** PRD lines 17-18
**Description:** Copy package.json and README.md for daemon configuration and documentation.

**File Manifest:**
| Source | Destination |
|--------|-------------|
| `daemon/package.json` | `great-minds/daemon/package.json` |
| `daemon/README.md` | `great-minds/daemon/README.md` |

**Acceptance Criteria:**
- [ ] Both files copied successfully
- [ ] package.json includes `better-sqlite3` dependency
- [ ] README.md documents daemon usage

---

### REQ-005: Run npm Install

**Source:** PRD line 29, Decisions Operation 2
**Description:** Install dependencies in destination daemon after syncing package.json.

**Command:** `cd great-minds/daemon && npm install`

**Acceptance Criteria:**
- [ ] Command exits with code 0
- [ ] `better-sqlite3` installed successfully
- [ ] No missing peer dependencies
- [ ] `node_modules/` created/updated

---

### REQ-006: Git Commit Changes

**Source:** PRD line 32, Decisions Operation 3
**Description:** Create atomic git commit with all synced changes.

**Command:** `git add -A && git commit -m "Mirror sync from plugin"`

**Acceptance Criteria:**
- [ ] All copied files staged
- [ ] Commit message follows format: `Mirror sync from plugin`
- [ ] Commit created successfully
- [ ] Exit code 0

---

### REQ-007: Git Push to Origin

**Source:** PRD line 32, Decisions Operation 3
**Description:** Push committed changes to origin remote.

**Command:** `git push`

**Acceptance Criteria:**
- [ ] Push succeeds with SSH authentication
- [ ] Changes visible on GitHub
- [ ] No force push used
- [ ] Exit code 0

---

### REQ-008: Quiet, Declarative Output Style

**Source:** Decisions (Decision 7, lines 87-104)
**Description:** Mirror outputs short, past-tense, declarative status messages.

**Output Format:**
```
Mirrored pipeline.ts
Mirrored agents.ts
Mirrored config.ts
Mirrored daemon.ts
Mirrored package.json
Mirrored README.md
Installed dependencies
Committed: "Mirror sync from plugin"
Pushed to origin
```

**Acceptance Criteria:**
- [ ] Each file copy outputs `Mirrored {filename}`
- [ ] npm install outputs `Installed dependencies`
- [ ] git commit outputs `Committed: "{message}"`
- [ ] git push outputs `Pushed to origin`
- [ ] No progress bars, spinners, or percentages
- [ ] No verbose multi-line messages

---

### REQ-009: Zero Confirmation Dialogs

**Source:** Decisions (Decision 3, lines 39-48)
**Description:** Execute immediately without dry-run or approval prompts.

**Acceptance Criteria:**
- [ ] No "Are you sure?" prompts
- [ ] No dry-run preview mode in v1
- [ ] No changelog preview before execution
- [ ] Execution begins immediately on invocation

---

### REQ-010: Human-Initiated Trigger

**Source:** Decisions (Decision 4, lines 51-61)
**Description:** Mirror requires manual invocation; no automated triggers in v1.

**Invocation:** `npx tsx scripts/mirror.ts` (or npm script)

**Acceptance Criteria:**
- [ ] Clear CLI command documented
- [ ] No git hooks installed in v1
- [ ] No file watchers for auto-trigger
- [ ] Human must explicitly run command

---

### REQ-012: Fail Fast on Uncommitted Changes

**Source:** Decisions (Risk Register, line 208)
**Description:** Detect and reject if destination repo has uncommitted changes.

**Acceptance Criteria:**
- [ ] Check `git status --porcelain` before any operations
- [ ] If output non-empty, fail immediately
- [ ] Error message: `Error: Destination has uncommitted changes. Commit or stash first.`
- [ ] Exit code non-zero

---

### REQ-013: Error Handling for npm Install

**Source:** Decisions (Risk Register, line 209)
**Description:** Stop execution if npm install fails.

**Acceptance Criteria:**
- [ ] If npm install exits non-zero, stop immediately
- [ ] Display npm error output to user
- [ ] Do NOT proceed to git commit
- [ ] Exit code non-zero

---

### REQ-014: Error Handling for Git Push

**Source:** Decisions (Risk Register, line 210)
**Description:** Handle git push failures gracefully.

**Acceptance Criteria:**
- [ ] If git push fails, display error message
- [ ] Local commit remains intact (not rolled back)
- [ ] User instructed to resolve and retry manually
- [ ] Exit code non-zero

---

## v1.1 Requirements (Deferred per Decisions)

### REQ-003: Copy Documentation Files (DEFERRED)

**Reason:** Decisions Decision 5 explicitly excludes documentation sync as "scope creep."

**Files:**
- `BANNED-PATTERNS.md`
- `DO-NOT-REPEAT.md`

### REQ-004: Update CLAUDE.md (DEFERRED)

**Reason:** Decisions Decision 5 explicitly excludes CLAUDE.md updates.

### REQ-016: Git Hook Automation (v1.1)

**Source:** Decisions (Decision 4)
**Description:** Automatic mirror on git commit via pre-commit or post-commit hook.

---

## Discrepancy Resolution

### File List: PRD vs Decisions

| PRD (Authoritative) | Decisions (Hypothetical) |
|---------------------|--------------------------|
| pipeline.ts | pipeline.ts |
| agents.ts | agents.ts |
| config.ts | errors.ts (WRONG) |
| daemon.ts | types.ts (WRONG) |
| package.json | utils.ts (WRONG) |
| README.md | index.ts (WRONG) |

**Resolution:** Use PRD file list. The decisions document's file list appears to be placeholder/example names that don't match the actual daemon structure. Verified via `ls daemon/src/`:
- Actual files: pipeline.ts, agents.ts, config.ts, daemon.ts, dream.ts, health.ts, logger.ts, telegram.ts, token-ledger.ts
- PRD selects the 4 core files + package.json + README.md
- No files named errors.ts, types.ts, utils.ts, or index.ts exist

### Documentation Sync: PRD vs Decisions

| PRD Says | Decisions Says | Resolution |
|----------|---------------|------------|
| Sync BANNED-PATTERNS.md | Excluded (scope creep) | Defer to v1.1 |
| Sync DO-NOT-REPEAT.md | Excluded (scope creep) | Defer to v1.1 |
| Update CLAUDE.md | Excluded (documentation debt) | Defer to v1.1 |

**Resolution:** Decisions document is authoritative for v1 scope. Documentation sync is deferred.

---

## Risk Considerations

From Risk Scanner analysis:

| Risk | Mitigation in v1 |
|------|------------------|
| Human forgets to run Mirror | Accepted (v1.1 adds git hooks) |
| Destination has uncommitted changes | REQ-012: Fail fast with error |
| npm install fails | REQ-013: Stop, don't commit |
| git push fails | REQ-014: Clear error, don't rollback |
| Wrong files selected | Use PRD manifest, verify in config |
| Path hardcoding | Use relative paths, no `/Users/` |

---

## Out of Scope for v1

Per Decisions document, these are explicitly excluded:
- CLAUDE.md updates
- Emdash CMS Reference
- Dry-run mode
- Git hook automation
- npm package extraction
- Bidirectional sync
- Merge conflict resolution
- Any file not in the 6-file manifest
