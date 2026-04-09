# Decisions: sync-great-minds

**Arbitrated by:** Phil Jackson, The Zen Master
**Date:** April 9, 2026
**Status:** LOCKED FOR BUILD

---

*"The strength of the team is each individual member. The strength of each member is the team."*

Two brilliant minds debated. Both were partially right. Neither was completely wrong. This document captures what we build—and why.

---

## Decision 1: Product Name

| Aspect | Decision |
|--------|----------|
| **Winner** | Elon Musk |
| **Proposed by** | Steve: "Mirror" / Elon: `sync-to-standalone.sh` |
| **Decision** | No brand name. Internal filename only. |
| **Rationale** | This is internal tooling for three developers. Branding a utility creates identity confusion and invites scope creep. The file is named `mirror.ts` as a compromise—functional, not marketed. |

**LOCKED:** No logos, no taglines, no marketing copy. It's a script.

---

## Decision 2: Architecture — Script vs. Daemon

| Aspect | Decision |
|--------|----------|
| **Winner** | Elon Musk (v1) / Steve Jobs (v1.1+) |
| **Proposed by** | Steve: Background daemon, invisible / Elon: Manual script, explicit |
| **Decision** | v1 ships as a manually-invoked script. v1.1 adds git hook automation. |
| **Rationale** | Elon's "ship now, iterate later" bias is correct for v1. Steve's "invisible certainty" requires automation—deferred to v1.1 to avoid shipping fragile infrastructure. |

**LOCKED:**
- v1.0 = Manual invocation via `npx ts-node mirror.ts`
- v1.1 = Git hook or watch-mode automation (owner TBD)

---

## Decision 3: Sync Direction

| Aspect | Decision |
|--------|----------|
| **Winner** | Unanimous |
| **Proposed by** | Steve Jobs (Round 1), affirmed by Elon (Round 2) |
| **Decision** | Unidirectional. Plugin repo is source of truth. Standalone repo receives. |
| **Rationale** | Bidirectional sync is chaos pretending to be flexibility. One canonical source prevents merge conflicts, drift, and the "which version is real?" anxiety that this tool exists to eliminate. |

**LOCKED:**
- Source: `great-minds-plugin/daemon/`
- Target: `great-minds/daemon/`
- Direction: One-way only. Always.

---

## Decision 4: Failure Handling

| Aspect | Decision |
|--------|----------|
| **Winner** | Steve Jobs |
| **Proposed by** | Steve: "Fail loud, never silent" / Elon: "Exit codes are enough" |
| **Decision** | Explicit failure modes with non-zero exit codes and human-readable errors. |
| **Rationale** | Elon's exit codes satisfy the machine. Steve's loud failures satisfy the human at 2 AM. Both win: proper exit codes AND clear error messages. No silent failures. No partial states. |

**LOCKED:**
- On conflict: STOP. Do not overwrite. Exit 1. Print what blocked.
- On success: Exit 0. Minimal output.
- On partial: Never. Atomic operation or full rollback.

---

## Decision 5: Configuration

| Aspect | Decision |
|--------|----------|
| **Winner** | Unanimous |
| **Proposed by** | Steve Jobs (Round 1), affirmed by Elon (Round 2) |
| **Decision** | Config file only. No UI. No wizard. No prompts. |
| **Rationale** | Power users read files. Config-as-code is version-controllable, diffable, and explicit. This is a tool for professionals who trust themselves. |

**LOCKED:** YAML or JSON config file. Zero interactive prompts.

---

## Decision 6: Conflict Resolution Strategy

| Aspect | Decision |
|--------|----------|
| **Winner** | Steve Jobs |
| **Proposed by** | Steve: "Don't guess, don't merge, scream" |
| **Decision** | No automatic conflict resolution. Ever. |
| **Rationale** | "Smart" merging is how you get code that compiles but doesn't work. If source and target have diverged unexpectedly, that's a human decision. The tool surfaces the problem; the human solves it. |

**LOCKED:** On any conflict or unexpected state, halt and report. Human intervenes.

---

## Decision 7: Underlying Architecture Problem

| Aspect | Decision |
|--------|----------|
| **Winner** | Elon Musk |
| **Proposed by** | Elon: "Fix the architecture, not the sync" |
| **Decision** | Acknowledge but defer. Sync ships now; architecture discussion scheduled. |
| **Rationale** | Elon correctly identified that duplicate code across repos is technical debt. Sync treats symptoms. However, architectural refactoring (submodules, shared npm package, or repo consolidation) requires broader team input. Ship the bandage; schedule the surgery. |

**LOCKED:**
- v1 ships the sync tool
- Architecture discussion scheduled within 30 days (owner: TBD)
- Options to evaluate: git submodule, npm package, repo merge

---

## MVP Feature Set (v1.0)

What ships now. No more. No less.

### Core Operations
1. **Copy daemon source files** from plugin to standalone
2. **Run `npm install`** in target directory
3. **Git commit and push** with standardized message

### Files Synced
```
Source: great-minds-plugin/daemon/
Target: great-minds/daemon/

Files:
- src/pipeline.ts
- src/agents.ts
- src/config.ts
- src/daemon.ts
- package.json
- README.md
```

### Behavioral Requirements
- Single source of truth (plugin is canonical)
- Fail loud on any conflict
- Non-zero exit code on failure
- No partial states
- Minimal success output
- Config file for paths (no hardcoding)

### Explicitly NOT in v1.0
- Automatic/scheduled execution
- Watch mode
- Bidirectional sync
- Conflict resolution
- Progress bars or notifications
- Web UI or configuration wizard
- CLAUDE.md merge automation (requires human judgment)

---

## File Structure (What Gets Built)

```
great-minds-plugin/
├── daemon/
│   └── src/
│       ├── mirror.ts          # Main sync script (NEW)
│       ├── mirror.config.yaml # Configuration (NEW)
│       ├── pipeline.ts        # Existing - synced
│       ├── agents.ts          # Existing - synced
│       ├── config.ts          # Existing - synced
│       └── daemon.ts          # Existing - synced
│   └── package.json           # Existing - synced
│   └── README.md              # Existing - synced
└── rounds/
    └── sync-great-minds/
        ├── decisions.md       # This document
        ├── essence.md         # Product soul
        ├── retrospective.md   # Post-mortem
        └── round-*.md         # Debate transcripts
```

### mirror.ts Responsibilities
1. Read config file for source/target paths
2. Validate source files exist
3. Check target directory state (clean git status)
4. Copy files (atomic operation)
5. Run `npm install` in target
6. Git add, commit, push
7. Report success or failure

### mirror.config.yaml Structure
```yaml
source:
  root: ./
  files:
    - src/pipeline.ts
    - src/agents.ts
    - src/config.ts
    - src/daemon.ts
    - package.json
    - README.md

target:
  root: /path/to/great-minds/daemon

git:
  auto_commit: true
  commit_message: "sync: mirror from great-minds-plugin"
  auto_push: true
```

---

## Open Questions (Require Resolution)

### 1. CLAUDE.md Merge Strategy
**Status:** UNRESOLVED
**Raised by:** Elon (Round 1), Steve (Round 2)
**Question:** The original PRD mentions syncing/updating CLAUDE.md, but the merge logic is unspecified. What content goes where?
**Required:** Explicit before/after specification or removal from v1 scope.
**Recommendation:** Remove from v1. CLAUDE.md changes are editorial decisions, not automation candidates.

### 2. Target Repository Path
**Status:** NEEDS CONFIRMATION
**Question:** Is `/home/agent/great-minds/` the correct target path, or is this environment-specific?
**Required:** Confirm actual filesystem paths before build.

### 3. v1.1 Automation Owner
**Status:** UNOWNED
**Raised by:** Retrospective
**Question:** Who owns the git hook / watch-mode implementation?
**Required:** Named owner, target date, and dependency list.

### 4. Architecture Discussion Owner
**Status:** UNOWNED
**Raised by:** Elon (Round 1)
**Question:** Who facilitates the submodule/package/merge architecture discussion?
**Required:** Named owner and scheduled date within 30 days.

### 5. Product Identity
**Status:** UNRESOLVED
**Raised by:** Board review (per retrospective)
**Question:** Is Mirror internal tooling (build and forget) or platform foundation (invest and compound)?
**Required:** One-page Product Identity document before v1.1 planning.

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **Silent failure if script not run** | HIGH | HIGH | v1.1 automation. Until then: calendar reminders, checklist enforcement |
| **Target repo has uncommitted changes** | MEDIUM | HIGH | Pre-flight check: require clean git status before sync |
| **Source files deleted/renamed** | LOW | HIGH | Validate all source files exist before any copy operation |
| **npm install fails in target** | MEDIUM | MEDIUM | Capture npm output, fail loud, rollback file copies |
| **Network failure during git push** | LOW | MEDIUM | Retry logic or clear "push failed" message; files are synced locally |
| **Config file misconfigured** | MEDIUM | HIGH | Validate config schema on load; fail fast with specific error |
| **User forgets tool exists** | HIGH | HIGH | This is the v1 achilles heel. Automation in v1.1 is critical. |
| **Drift between decisions.md and PRD** | OCCURRED | MEDIUM | Already happened per retrospective. This document is now canonical. |

---

## Version Roadmap

### v1.0 (Current Build)
- Manual script execution
- Core sync: copy, npm install, commit, push
- Config file for paths
- Loud failure on any issue

### v1.1 (Next)
- Git hook automation (post-commit trigger)
- Watch mode option
- Owner: TBD
- Target: TBD

### v2.0 (Future Consideration)
- Architecture resolution (submodule, package, or merge)
- Depends on architecture discussion outcome

---

## Sign-Off

This document represents the synthesis of:
- Steve Jobs: Design philosophy, failure modes, unidirectional truth
- Elon Musk: Technical simplicity, first-principles critique, ship-now bias
- Marcus Aurelius: Process observation and retrospective wisdom
- Essence document: Product soul anchor

**The debate is closed. The decisions are locked. Build begins.**

---

*"Good teams become great ones when the members trust each other enough to surrender the Me for the We."*

— Phil Jackson
Zen Master, Great Minds Agency
