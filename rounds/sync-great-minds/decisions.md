# Decisions: Sync Great Minds

**Arbitrated by:** Phil Jackson, The Zen Master
**Date:** Final Consolidation
**Status:** Blueprint for Build Phase

---

## Executive Summary

Two visionaries debated the path forward. Steve Jobs championed beautiful simplicity and emotional trust. Elon Musk demanded first-principles engineering and systemic solutions. Both contributed essential wisdom. This document captures what we're building.

---

## Decision Log

### Decision 1: Product Name

| Aspect | Detail |
|--------|--------|
| **Proposed by** | Steve Jobs |
| **Winner** | Steve Jobs |
| **Decision** | **MIRROR** |
| **Rationale** | The name shapes behavior. "Mirror" communicates instant, complete, unidirectional reflection. It's a promise, not a description. Elon did not contest the naming — his silence is consent. |

---

### Decision 2: Source of Truth Architecture

| Aspect | Detail |
|--------|--------|
| **Proposed by** | Both (unanimous) |
| **Winner** | Consensus |
| **Decision** | **Unidirectional flow only** |
| **Rationale** | Plugin is truth. Repo is reflection. No bidirectional sync. No merge conflicts. No "which version is newer?" Both Steve and Elon locked this as non-negotiable. |

---

### Decision 3: User Confirmation Model

| Aspect | Detail |
|--------|--------|
| **Proposed by** | Steve Jobs |
| **Winner** | Steve Jobs (with conditions) |
| **Decision** | **Zero confirmation for execution** |
| **Rationale** | Steve: "If you trust the source, act on it." No dry-run previews, no approval dialogs. Elon raised valid concern about "conviction without verification" breaking things — but for v1 internal tooling with 3 users, speed beats ceremony. |
| **Condition** | If Mirror expands to production environments or external users, revisit dry-run capability. |

---

### Decision 4: Trigger Mechanism

| Aspect | Detail |
|--------|--------|
| **Proposed by** | Contested |
| **Steve's Position** | Human-initiated, immediate execution. "A human decides 'now' and it happens now." |
| **Elon's Position** | Automated via git hooks or CI. "Humans forget. Systems don't." |
| **Winner** | **Elon Musk** |
| **Decision** | **v1: Human-initiated. v1.1: Git hook automation** |
| **Rationale** | Elon's critique is fatal: "You've wrapped a manual process in beautiful language." A tool you must remember to run will be forgotten. Ship human-initiated for v1 (fastest path), but the immediate follow-up is git hook integration. The daemon is only as good as its automation. |

---

### Decision 5: v1 Scope

| Aspect | Detail |
|--------|--------|
| **Proposed by** | Elon Musk |
| **Winner** | Elon Musk |
| **Decision** | **Three operations only** |
| **Rationale** | Steve conceded: "He's right about scope creep." Emdash CMS Reference, CLAUDE.md updates — these are documentation debt, not sync. Cut them. The build phase executes exactly three operations. Nothing more. |

---

### Decision 6: Long-term Architecture

| Aspect | Detail |
|--------|--------|
| **Proposed by** | Elon Musk |
| **Winner** | Elon Musk (deferred) |
| **Decision** | **Eventually: npm package extraction** |
| **Rationale** | Steve conceded: "We should eventually extract the daemon to its own repo. But 'eventually' isn't 'today.'" Elon is architecturally correct — npm packages are mirrors that actually work. But the daemon is evolving weekly. Ship Mirror now. Extract to npm when the daemon stabilizes. |
| **Timeline** | Post-v1, when daemon API is stable. |

---

### Decision 7: Brand Voice / Output Style

| Aspect | Detail |
|--------|--------|
| **Proposed by** | Steve Jobs |
| **Winner** | Steve Jobs |
| **Decision** | **Quiet, declarative, past-tense** |
| **Rationale** | Elon conceded: "`Mirrored pipeline.ts` beats `Copying file 1 of 6... [=====>] 50%`." Output style is confident and quiet. Short sentences. Past tense. It already did it. |

**Output Format:**
```
Mirrored pipeline.ts
Mirrored agents.ts
Mirrored errors.ts
Installed dependencies
Committed: "Mirror sync from plugin"
Pushed to origin
```

---

## MVP Feature Set (v1 Ships This)

### Core Operations

| # | Operation | Description |
|---|-----------|-------------|
| 1 | **Copy daemon files** | 6 files from plugin to great-minds repo |
| 2 | **Run npm install** | Ensure dependencies are synchronized |
| 3 | **Git commit + push** | Atomic commit with clear message |

### File Manifest (What Gets Copied)

Source: `great-minds-plugin/daemon/`
Destination: `great-minds/daemon/`

| File | Purpose |
|------|---------|
| `pipeline.ts` | Core orchestration logic |
| `agents.ts` | Agent definitions |
| `errors.ts` | Error handling |
| `types.ts` | TypeScript definitions |
| `utils.ts` | Utility functions |
| `index.ts` | Entry point |

### What Does NOT Ship in v1

| Excluded | Reason | Owner |
|----------|--------|-------|
| CLAUDE.md updates | Documentation debt, not sync | Future sprint |
| Emdash CMS Reference | Scope creep | Future sprint |
| Dry-run mode | Erodes confidence per Steve | Revisit if needed |
| Git hook automation | v1.1 feature per decision | Immediate follow-up |
| npm package extraction | Long-term architecture | Post-stabilization |

---

## File Structure (What Gets Built)

```
great-minds-plugin/
scripts/
    mirror.ts          # Main execution script
    mirror.config.ts   # Configuration (source/dest paths)

great-minds/
daemon/
    pipeline.ts        # [MIRRORED]
    agents.ts          # [MIRRORED]
    errors.ts          # [MIRRORED]
    types.ts           # [MIRRORED]
    utils.ts           # [MIRRORED]
    index.ts           # [MIRRORED]
```

### Script Behavior

```typescript
// mirror.ts pseudocode
const FILES = ['pipeline.ts', 'agents.ts', 'errors.ts', 'types.ts', 'utils.ts', 'index.ts'];
const SOURCE = '../great-minds-plugin/daemon/';
const DEST = '../great-minds/daemon/';

// 1. Copy files
FILES.forEach(file => {
  copy(SOURCE + file, DEST + file);
  log(`Mirrored ${file}`);
});

// 2. Install dependencies
exec('npm install', { cwd: DEST_REPO });
log('Installed dependencies');

// 3. Commit and push
exec('git add .');
exec('git commit -m "Mirror sync from plugin"');
exec('git push');
log('Committed. Pushed.');
```

---

## Open Questions (Needs Resolution)

| # | Question | Stakes | Proposed Owner |
|---|----------|--------|----------------|
| 1 | **Where does mirror.ts live?** | In plugin repo? Standalone scripts folder? | Architect decision |
| 2 | **How are paths configured?** | Hardcoded vs config file vs CLI args | Build phase decision |
| 3 | **What's the commit message format?** | Static string vs timestamp vs file list | Style decision |
| 4 | **Does npm install run in plugin or destination?** | Elon's spec says destination, verify | Build phase |
| 5 | **Authentication for git push?** | SSH keys assumed, verify access | Pre-build check |
| 6 | **What if destination has uncommitted changes?** | Fail fast? Stash? Overwrite? | Error handling decision |
| 7 | **v1.1 git hook: pre-commit or post-commit?** | Trigger timing affects workflow | Next sprint |

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **Human forgets to run Mirror** | HIGH | HIGH | v1.1 git hook automation (Elon's point is valid) |
| **Destination repo has local changes** | MEDIUM | MEDIUM | Fail fast with clear error; force user to commit/stash first |
| **npm install fails** | LOW | MEDIUM | Log error clearly; don't continue to commit |
| **Git push fails (auth/network)** | LOW | HIGH | Clear error messaging; don't leave repo in partial state |
| **Wrong source files selected** | LOW | HIGH | Config file review; manifest in decisions.md |
| **Daemon changes break consumers** | MEDIUM | HIGH | Long-term: npm package with semver. Short-term: accept risk |
| **Mirror overwrites intentional local divergence** | LOW | MEDIUM | By design — but document that local changes will be lost |
| **Scope creep during build** | MEDIUM | MEDIUM | This document is the contract. Three operations only. |

---

## The Synthesis

Steve gave us the soul: **trust through invisible certainty**. The product is the absence of anxiety.

Elon gave us the spine: **three operations, no ceremony**. Ship the core, automate the trigger.

Both agreed on the doctrine: **one source of truth, unidirectional flow, no negotiation**.

---

## Build Phase Authorization

This document authorizes construction of Mirror v1 with:
- 6 file copy operations
- 1 npm install
- 1 atomic commit + push
- Quiet, confident output
- Zero confirmation dialogs
- Human-initiated trigger (git hook in v1.1)

**Do not add features. Do not subtract operations. Build exactly this.**

---

*"Before enlightenment, chop wood, carry water. After enlightenment, chop wood, carry water. Before Mirror, copy files. After Mirror, trust the reflection."*

— Phil Jackson, The Zen Master
