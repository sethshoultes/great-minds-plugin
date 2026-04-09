# PRD: Sync Great Minds Repo with Plugin Updates

## Problem
The great-minds repo has its own copy of the daemon at `daemon/` that is stale — missing anti-hallucination rules, banned patterns, updated agent prompts, timeout fixes, and the failed-dir watcher filter. The plugin is the source of truth.

## CRITICAL: Do NOT Start Over
Sync specific files from the plugin repo. Do not restructure the project.

## Requirements

### 1. Sync Daemon Code
Copy these files from this repo (great-minds-plugin) to great-minds:
- `daemon/src/pipeline.ts` → `/home/agent/great-minds/daemon/src/pipeline.ts`
- `daemon/src/agents.ts` → `/home/agent/great-minds/daemon/src/agents.ts`
- `daemon/src/config.ts` → `/home/agent/great-minds/daemon/src/config.ts`
- `daemon/src/daemon.ts` → `/home/agent/great-minds/daemon/src/daemon.ts`
- `daemon/package.json` → `/home/agent/great-minds/daemon/package.json`
- `daemon/README.md` → `/home/agent/great-minds/daemon/README.md`

### 2. Sync Documentation
Copy these files:
- `BANNED-PATTERNS.md` → `/home/agent/great-minds/BANNED-PATTERNS.md`
- `DO-NOT-REPEAT.md` → `/home/agent/great-minds/DO-NOT-REPEAT.md`

### 3. Update Great Minds CLAUDE.md
Add the Emdash CMS Reference section and anti-hallucination rules to great-minds CLAUDE.md (same as what's in shipyard-ai's CLAUDE.md).

### 4. Run npm install
After syncing package.json, run `cd /home/agent/great-minds/daemon && npm install` to get better-sqlite3.

### 5. Commit and Push
Commit all changes to great-minds repo and push to GitHub.

## Success Criteria
- Great-minds daemon code matches great-minds-plugin daemon code
- BANNED-PATTERNS.md exists in great-minds
- Anti-hallucination rules in CLAUDE.md
- `npm install` succeeds with no missing deps
