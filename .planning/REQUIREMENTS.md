# Requirements Document — Sync Great Minds Phase

**Generated:** 2026-04-16
**Project Slug:** sync-great-minds
**Source PRD:** `/Users/sethshoultes/Local Sites/great-minds-plugin/prds/sync-great-minds.md`
**Source Decisions:** `/Users/sethshoultes/Local Sites/great-minds-plugin/rounds/sync-great-minds/decisions.md`

---

## Executive Summary

**What We're Building:** A zero-configuration command (`sync`) that enforces one-way truth propagation from great-minds-plugin daemon to great-minds repository. 8 files. Under 5 seconds. Zero apologies.

**Why It Exists:** Architectural debt. Two repos contain duplicate daemon code. This is a surgical band-aid, not a permanent solution.

**Success Criteria:** Ships in one agent session. Works perfectly or fails loudly. Scheduled for deletion once shared package architecture is implemented.

---

## Atomic Requirements

### R1: Create Sync Bash Script
**Description:** Create `/sync.sh` bash script at repo root with hardcoded source and destination paths. Script must execute file copy operations with proper error handling using `set -e` directive.

**Files Affected:**
- Create: `/Users/sethshoultes/Local Sites/great-minds-plugin/sync.sh`

**Verification:**
1. Script file exists and is readable
2. Script contains `set -e` at the top
3. Script includes hardcoded paths: `PLUGIN_ROOT` and `GREAT_MINDS_ROOT`
4. Script must be executable (`chmod +x`)

**Dependencies:** None

---

### R2: Validate Destination Repository State (No Uncommitted Changes)
**Description:** Before syncing, script must check that `/home/agent/great-minds` has no uncommitted changes. Script must abort with exit code 1 and display error message "❌ Error: great-minds has uncommitted changes. Commit or stash first." if changes exist.

**Files Affected:**
- Modify: `/Users/sethshoultes/Local Sites/great-minds-plugin/sync.sh`

**Verification:**
1. Run `git status -s` in destination repo
2. Abort if non-empty output (exit 1)
3. Error message is displayed to stderr/stdout

**Dependencies:** R1 (script must exist)

---

### R3: Validate Source Files Exist
**Description:** Script must verify that source daemon directory exists at `$PLUGIN_ROOT/daemon/src`. Abort with exit code 1 and error message "❌ Error: Source daemon/src not found in plugin repo." if missing.

**Files Affected:**
- Modify: `/Users/sethshoultes/Local Sites/great-minds-plugin/sync.sh`

**Verification:**
1. Check for directory existence: `[[ -d "$PLUGIN_ROOT/daemon/src" ]]`
2. Abort with proper error if missing

**Dependencies:** R1

---

### R4: Validate npm is Available in PATH
**Description:** Script must check that `npm` command is available in the system PATH. Abort with appropriate error if not found.

**Files Affected:**
- Modify: `/Users/sethshoultes/Local Sites/great-minds-plugin/sync.sh`

**Verification:**
1. Use `command -v npm` or `which npm` check
2. Abort with error if command not found

**Dependencies:** R1

---

### R5: Copy daemon/src/*.ts Files
**Description:** Copy all TypeScript source files from `$PLUGIN_ROOT/daemon/src/` to `$GREAT_MINDS_ROOT/daemon/src/`. Must include: agents.ts, config.ts, daemon.ts, and all other .ts files in that directory (currently 11 files).

**Files Affected:**
- Destination: `/home/agent/great-minds/daemon/src/*.ts` (multiple files)

**Verification:**
1. File copy operation succeeds (no errors)
2. All source .ts files present in destination with identical content
3. File permissions preserved

**Dependencies:** R2, R3 (validations must pass)

---

### R6: Copy daemon/package.json
**Description:** Copy `/daemon/package.json` from plugin repo to destination daemon directory, preserving the npm package configuration including version 1.0.0, dependencies (better-sqlite3, chokidar, @anthropic-ai/claude-agent-sdk), and all scripts.

**Files Affected:**
- Source: `/Users/sethshoultes/Local Sites/great-minds-plugin/daemon/package.json`
- Destination: `/home/agent/great-minds/daemon/package.json`

**Verification:**
1. File copy succeeds
2. Destination file is identical to source
3. JSON is valid

**Dependencies:** R2, R3

---

### R7: Copy daemon/README.md
**Description:** Copy `/daemon/README.md` from plugin repo to destination. Before copying, append or prepend a warning section to the destination file indicating daemon code is synced and should not be edited directly.

**Files Affected:**
- Source: `/Users/sethshoultes/Local Sites/great-minds-plugin/daemon/README.md`
- Destination: `/home/agent/great-minds/daemon/README.md`

**Verification:**
1. File copy succeeds
2. Destination contains warning section about synced code
3. Warning text includes: "This daemon code is synced from great-minds-plugin" and "Do NOT edit files here directly"

**Dependencies:** R2, R3

---

### R8: Copy BANNED-PATTERNS.md
**Description:** Copy `BANNED-PATTERNS.md` from plugin root to great-minds repo root. File documents anti-hallucination rules and banned API patterns.

**Files Affected:**
- Source: `/Users/sethshoultes/Local Sites/great-minds-plugin/BANNED-PATTERNS.md`
- Destination: `/home/agent/great-minds/BANNED-PATTERNS.md`

**Verification:**
1. File copy succeeds
2. Destination file is identical to source
3. File contains all banned patterns (throw new Response, rc.user, process.env, etc.)

**Dependencies:** R2, R3

---

### R9: Copy DO-NOT-REPEAT.md
**Description:** Copy `DO-NOT-REPEAT.md` from plugin root to great-minds repo root. File documents patterns and commands that have failed and should not be repeated.

**Files Affected:**
- Source: `/Users/sethshoultes/Local Sites/great-minds-plugin/DO-NOT-REPEAT.md`
- Destination: `/home/agent/great-minds/DO-NOT-REPEAT.md`

**Verification:**
1. File copy succeeds
2. Destination file is identical to source
3. File contains all documented failure patterns

**Dependencies:** R2, R3

---

### R10: Update Great Minds CLAUDE.md with Daemon Sync Protocol
**Description:** Add a new section to `/home/agent/great-minds/CLAUDE.md` documenting the daemon sync protocol. Section must explain that daemon code is synced from great-minds-plugin, provide instructions to run `npm run sync` in plugin repo, and warn against editing daemon files directly in great-minds repo.

**Files Affected:**
- Destination: `/home/agent/great-minds/CLAUDE.md` (append/insert new section)

**Verification:**
1. File exists and is readable
2. New "Daemon Sync Protocol" section added
3. Section includes: source repo reference, command instructions, and editing warning
4. File is valid markdown

**Dependencies:** R2, R3

---

### R11: Copy Emdash CMS Reference and Anti-Hallucination Rules to Great Minds CLAUDE.md
**Description:** Extract Emdash CMS Reference section and anti-hallucination rules from the plugin repository's templates/CLAUDE.md and add to great-minds CLAUDE.md. Ensure consistency with existing daemon documentation.

**Files Affected:**
- Source: `/Users/sethshoultes/Local Sites/great-minds-plugin/templates/CLAUDE.md`
- Destination: `/home/agent/great-minds/CLAUDE.md`

**Verification:**
1. Anti-hallucination rules section exists in destination
2. Includes reference to BANNED-PATTERNS.md
3. Rules enforce pattern checks before execution

**Dependencies:** R10

---

### R12: Run npm install in Destination Daemon Directory
**Description:** Execute `npm install` in `/home/agent/great-minds/daemon/` after package.json is copied. Install must complete successfully with all dependencies (better-sqlite3, chokidar, etc.) installed.

**Files Affected:**
- Destination: `/home/agent/great-minds/daemon/node_modules/` (created/updated)

**Verification:**
1. `npm install` command returns exit code 0
2. `node_modules/` directory exists
3. All dependencies present: better-sqlite3, chokidar, @anthropic-ai/claude-agent-sdk
4. No missing dependencies warnings

**Dependencies:** R6 (package.json must be copied first)

---

### R13: Stage All Changes with Git
**Description:** Execute `git add .` in `/home/agent/great-minds/` to stage all copied files and modifications for commit.

**Files Affected:**
- Repository: `/home/agent/great-minds/` (git staging area)

**Verification:**
1. `git add .` executes without error
2. `git status` shows staged changes for all synced files

**Dependencies:** R5–R12 (all file operations must complete)

---

### R14: Commit Changes with Static Message
**Description:** Execute `git commit -m "Sync daemon from plugin"` in `/home/agent/great-minds/` to create a commit with static message. No file list in message.

**Files Affected:**
- Repository: `/home/agent/great-minds/` (new commit on current branch)

**Verification:**
1. `git commit` returns exit code 0
2. `git log -1 --oneline` shows commit message "Sync daemon from plugin"
3. Commit includes all staged changes

**Dependencies:** R13 (changes must be staged)

---

### R15: Push Changes to Remote
**Description:** Execute `git push` in `/home/agent/great-minds/` to push the commit to the remote repository. If push fails, commit remains local and user can manually resolve.

**Files Affected:**
- Remote repository: github.com great-minds repo (new commit pushed)

**Verification:**
1. `git push` returns exit code 0
2. Remote branch is updated
3. If network fails, local commit remains (no rollback)

**Dependencies:** R14 (commit must exist)

---

### R16: Display Success Message
**Description:** After all operations complete successfully, script must display terminal output in format: "Syncing daemon code..." (at start) followed by "Done." (at end). Output must be minimal and confident.

**Files Affected:**
- stdout output

**Verification:**
1. "Syncing daemon code..." displayed when script starts
2. "Done." displayed when script completes successfully
3. No progress bars or intermediate messages

**Dependencies:** All R1–R15

---

### R17: Exit with Code 0 on Success
**Description:** Script must exit with exit code 0 when all operations (copy, npm install, git operations) complete successfully.

**Files Affected:**
- Script exit status

**Verification:**
1. Run sync.sh and check `echo $?`
2. Result must be 0

**Dependencies:** All R1–R16

---

### R18: Exit with Code 1 on Failure
**Description:** Script must exit with exit code 1 if ANY validation fails (uncommitted changes, missing source files, npm install failure, git operations failure) or if any file operation fails. No partial syncs allowed.

**Files Affected:**
- Script exit status

**Verification:**
1. Run sync.sh with uncommitted changes in destination
2. Verify exit code is 1
3. Verify error message displayed
4. Verify no files were synced

**Dependencies:** R2–R4 (validations must abort properly)

---

### R19: Add npm Script to package.json
**Description:** Add or update root-level `package.json` in great-minds-plugin to include `"sync": "./sync.sh"` script entry.

**Files Affected:**
- Modify: Root-level `package.json` in plugin repo

**Verification:**
1. Running `npm run sync` from plugin repo root executes the sync.sh script
2. Script behaves identically to direct execution

**Dependencies:** R1 (sync.sh must exist)

---

### R20: Make sync.sh Executable
**Description:** Set execute permissions on `/sync.sh` file using `chmod +x`.

**Files Affected:**
- Modify: `/Users/sethshoultes/Local Sites/great-minds-plugin/sync.sh` (permissions)

**Verification:**
1. `ls -l sync.sh` shows `x` in permissions (e.g., `-rwxr-xr-x`)
2. Script can be executed directly: `./sync.sh`

**Dependencies:** R1 (script must exist)

---

### R21: Add Shebang Line to sync.sh
**Description:** Add `#!/bin/bash` as the first line of the sync script to specify bash interpreter.

**Files Affected:**
- Modify: `/Users/sethshoultes/Local Sites/great-minds-plugin/sync.sh`

**Verification:**
1. First line is `#!/bin/bash`
2. File can be executed as `./sync.sh` without explicit `bash` prefix

**Dependencies:** R1

---

### R22: Add Sunset Warning to README
**Description:** Add warning to the plugin root README.md indicating the sync tool is temporary and scheduled for deprecation. Warning must state: "⚠️ TEMPORARY TOOL — Scheduled for deprecation once daemon is extracted to shared package."

**Files Affected:**
- Modify: `/Users/sethshoultes/Local Sites/great-minds-plugin/README.md`

**Verification:**
1. README contains sunset warning section
2. Warning mentions temporary nature
3. Roadmap for deprecation is referenced

**Dependencies:** None (documentation only)

---

### R23: Document Path Configuration in README
**Description:** Add setup instructions to README explaining that users must edit hardcoded paths in sync.sh for their environment. Provide examples of where to find path variables.

**Files Affected:**
- Modify: `/Users/sethshoultes/Local Sites/great-minds-plugin/README.md`

**Verification:**
1. README documents path editing requirements
2. Includes example paths and line numbers
3. Explains one-time setup process

**Dependencies:** R1, R22

---

### R24: Validate Destination Structure
**Description:** Add pre-flight check to verify that destination `/home/agent/great-minds/daemon/src/` exists before attempting sync. Abort if structure missing.

**Files Affected:**
- Modify: `/Users/sethshoultes/Local Sites/great-minds-plugin/sync.sh`

**Verification:**
1. Check for directory existence: `[[ -d "$GREAT_MINDS_ROOT/daemon/src" ]]`
2. Abort with error if missing: "Error: Wrong destination path"

**Dependencies:** R1

---

### R25: Source File Count Sanity Check
**Description:** Verify that expected number of TypeScript files exist in source (11 files). If count differs, warn user.

**Files Affected:**
- Modify: `/Users/sethshoultes/Local Sites/great-minds-plugin/sync.sh`

**Verification:**
1. Count .ts files: `ls $PLUGIN_ROOT/daemon/src/*.ts | wc -l`
2. Compare to expected count (11)
3. Warn if mismatch

**Dependencies:** R3

---

## Requirements Traceability Matrix

| ID | Requirement | Priority | Complexity | Wave |
|----|-------------|----------|------------|------|
| R1 | Create Sync Bash Script | Must | High | 1 |
| R21 | Add Shebang Line | Must | Low | 1 |
| R20 | Make sync.sh Executable | Must | Low | 1 |
| R2 | Validate Destination (No Uncommitted Changes) | Must | Low | 1 |
| R3 | Validate Source Files Exist | Must | Low | 1 |
| R4 | Validate npm Available | Must | Low | 1 |
| R24 | Validate Destination Structure | Should | Low | 1 |
| R25 | Source File Count Sanity Check | Should | Low | 1 |
| R5 | Copy daemon/src/*.ts Files | Must | Medium | 2 |
| R6 | Copy daemon/package.json | Must | Low | 2 |
| R7 | Copy daemon/README.md | Must | Low | 2 |
| R8 | Copy BANNED-PATTERNS.md | Must | Low | 2 |
| R9 | Copy DO-NOT-REPEAT.md | Must | Low | 2 |
| R10 | Update CLAUDE.md (Sync Protocol) | Must | Medium | 2 |
| R11 | Add Anti-Hallucination Rules to CLAUDE.md | Must | Medium | 2 |
| R12 | Run npm install | Must | Medium | 3 |
| R13 | Stage Changes with git add | Must | Low | 4 |
| R14 | Commit with Static Message | Must | Low | 4 |
| R15 | Push to Remote | Must | Medium | 4 |
| R16 | Display Success Message | Must | Low | 4 |
| R17 | Exit Code 0 on Success | Must | Low | 4 |
| R18 | Exit Code 1 on Failure | Must | Low | 4 |
| R19 | Add npm Script to package.json | Should | Low | 5 |
| R22 | Add Sunset Warning to README | Should | Low | 5 |
| R23 | Document Path Configuration | Should | Low | 5 |

---

## Implicit Requirements

### IR1: Script Must Handle Shell Quoting
Variables containing spaces (like `/Users/sethshoultes/Local Sites/...`) must be properly quoted in all commands.

### IR2: Error Messages Must Be Distinguishable
All error messages must start with `❌` emoji or "Error:" prefix.

### IR3: Pre-flight Checks Must Run Before ANY File Operations
Order matters: validations first, then operations.

### IR4: Git Operations Must be Recoverable
If `git push` fails, local commit remains for manual recovery.

### IR5: npm install Must Fail Loudly
Exit code 1 with clear error message if npm install fails.

### IR6: No Interactive Input Required
Script must be fully non-interactive. No prompts.

---

## Success Criteria (From PRD)

- ✓ Great-minds daemon code matches great-minds-plugin daemon code (R5–R9)
- ✓ BANNED-PATTERNS.md exists in great-minds (R8)
- ✓ Anti-hallucination rules in CLAUDE.md (R11)
- ✓ `npm install` succeeds with no missing deps (R12)
- ✓ All changes committed and pushed (R13–R15)
- ✓ Exits 0 on success, 1 on failure (R17, R18)
- ✓ Binary outcomes only (no warnings)
- ✓ Speed target: <5 seconds for local operations

---

**Total Atomic Requirements: 25 (Must: 21, Should: 4)**
