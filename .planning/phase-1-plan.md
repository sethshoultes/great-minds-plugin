# Phase 1 Plan — Mirror v1 (Daemon Sync Tool)

**Generated**: 2025-04-09
**Requirements**: `.planning/REQUIREMENTS.md`
**Total Tasks**: 6
**Waves**: 3

**Product Name**: Mirror
**Core Promise**: Plugin is truth. Repo is reflection.
**Build Target**: ~100 lines of new code in `scripts/mirror.ts`, 2 hours

---

## Requirements Traceability

| Requirement | Task(s) | Wave |
|-------------|---------|------|
| REQ-001: Copy daemon source files | phase-1-task-1 | 1 |
| REQ-002: Copy daemon config files | phase-1-task-1 | 1 |
| REQ-005: Run npm install | phase-1-task-3 | 2 |
| REQ-006: Git commit changes | phase-1-task-4 | 2 |
| REQ-007: Git push to origin | phase-1-task-4 | 2 |
| REQ-008: Quiet, declarative output | phase-1-task-1, phase-1-task-2 | 1 |
| REQ-009: Zero confirmation dialogs | phase-1-task-2 | 1 |
| REQ-010: Human-initiated trigger | phase-1-task-5 | 3 |
| REQ-012: Fail fast on uncommitted changes | phase-1-task-2 | 1 |
| REQ-013: Error handling for npm install | phase-1-task-3 | 2 |
| REQ-014: Error handling for git push | phase-1-task-4 | 2 |
| REQ-015: Create mirror.ts script | phase-1-task-1, phase-1-task-2 | 1 |

---

## Wave Execution Order

### Wave 1 (Parallel — Core Script)

These tasks create the mirror script structure. They can execute in parallel.

```xml
<task-plan id="phase-1-task-1" wave="1">
  <title>Create mirror.ts with file copy logic</title>
  <requirement>REQ-001, REQ-002, REQ-008, REQ-015: Copy daemon files with quiet output</requirement>
  <description>Create the main mirror.ts script in scripts/ that copies the 6 daemon files from plugin to great-minds repo. Implements quiet, past-tense output style per Decision 7.</description>

  <context>
    <file path="daemon/src/pipeline.ts" reason="Source file to copy (483 lines, core GSD pipeline)" />
    <file path="daemon/src/agents.ts" reason="Source file to copy (282 lines, 14 persona prompts)" />
    <file path="daemon/src/config.ts" reason="Source file to copy (89 lines, paths and timeouts)" />
    <file path="daemon/src/daemon.ts" reason="Source file to copy (305 lines, main event loop)" />
    <file path="daemon/package.json" reason="Source file to copy (has better-sqlite3 dependency)" />
    <file path="daemon/README.md" reason="Source file to copy (209 lines, daemon docs)" />
    <file path="rounds/sync-great-minds/decisions.md" reason="Decision 7 specifies output format" />
    <file path="prds/sync-great-minds.md" reason="PRD file list is authoritative" />
  </context>

  <steps>
    <step order="1">Create scripts/ directory if it doesn't exist: mkdir -p scripts</step>
    <step order="2">Create scripts/mirror.ts with imports:
      ```typescript
      #!/usr/bin/env npx tsx
      /**
       * Mirror — Sync daemon files from great-minds-plugin to great-minds
       *
       * Usage: npx tsx scripts/mirror.ts
       *
       * Per decisions.md Decision 7: Output is quiet, declarative, past-tense.
       * Per decisions.md Decision 3: Zero confirmation dialogs.
       */

      import { copyFileSync, existsSync, mkdirSync } from "fs";
      import { execSync } from "child_process";
      import { resolve, dirname, basename } from "path";
      ```
    </step>
    <step order="3">Add configuration constants (no hardcoded /Users/ paths per BANNED-PATTERNS.md):
      ```typescript
      // Paths relative to this script's location
      const SCRIPT_DIR = dirname(new URL(import.meta.url).pathname);
      const PLUGIN_ROOT = resolve(SCRIPT_DIR, "..");
      const DEST_ROOT = resolve(PLUGIN_ROOT, "..", "great-minds");

      // File manifest per PRD (NOT decisions.md hypothetical list)
      const FILES_TO_MIRROR = [
        { src: "daemon/src/pipeline.ts", desc: "Core GSD pipeline" },
        { src: "daemon/src/agents.ts", desc: "14 persona prompts" },
        { src: "daemon/src/config.ts", desc: "Paths and timeouts" },
        { src: "daemon/src/daemon.ts", desc: "Main event loop" },
        { src: "daemon/package.json", desc: "Dependencies" },
        { src: "daemon/README.md", desc: "Daemon documentation" },
      ];
      ```
    </step>
    <step order="4">Add quiet output helper:
      ```typescript
      function log(message: string): void {
        console.log(message);
      }
      ```
    </step>
    <step order="5">Add copyFiles function with quiet output:
      ```typescript
      function copyFiles(): void {
        for (const file of FILES_TO_MIRROR) {
          const srcPath = resolve(PLUGIN_ROOT, file.src);
          const destPath = resolve(DEST_ROOT, file.src);

          if (!existsSync(srcPath)) {
            throw new Error(`Source not found: ${srcPath}`);
          }

          // Ensure destination directory exists
          const destDir = dirname(destPath);
          if (!existsSync(destDir)) {
            mkdirSync(destDir, { recursive: true });
          }

          copyFileSync(srcPath, destPath);
          log(`Mirrored ${basename(file.src)}`);
        }
      }
      ```
    </step>
    <step order="6">Verify file manifest matches PRD (not decisions.md hypothetical list)</step>
  </steps>

  <verification>
    <check type="build">npx tsx --version</check>
    <check type="manual">Verify scripts/mirror.ts exists and has copyFiles function</check>
    <check type="manual">Verify file manifest has 6 files: pipeline.ts, agents.ts, config.ts, daemon.ts, package.json, README.md</check>
  </verification>

  <dependencies>
    <!-- No dependencies - foundational task -->
  </dependencies>

  <commit-message>feat(mirror): create mirror.ts with file copy logic

- Add 6-file manifest per PRD (not decisions.md hypothetical list)
- Implement quiet, past-tense output per Decision 7
- Use relative paths (no hardcoded /Users/ per BANNED-PATTERNS.md)</commit-message>
</task-plan>
```

```xml
<task-plan id="phase-1-task-2" wave="1">
  <title>Add pre-flight checks and main execution</title>
  <requirement>REQ-009, REQ-012, REQ-015: Zero confirmation, fail fast on uncommitted changes</requirement>
  <description>Add pre-flight validation that checks destination repo status before any operations. Implements fail-fast behavior per Decision Risk Register.</description>

  <context>
    <file path="scripts/mirror.ts" reason="Target file from task-1" />
    <file path="rounds/sync-great-minds/decisions.md" reason="Risk Register specifies fail-fast on uncommitted changes" />
    <file path="BANNED-PATTERNS.md" reason="No hardcoded paths, use relative or env vars" />
  </context>

  <steps>
    <step order="1">Add checkDestinationClean function:
      ```typescript
      function checkDestinationClean(): void {
        // Check if destination repo exists
        if (!existsSync(DEST_ROOT)) {
          throw new Error(`Destination repo not found: ${DEST_ROOT}`);
        }

        // Check for uncommitted changes (fail fast per Risk Register)
        try {
          const status = execSync(`git -C "${DEST_ROOT}" status --porcelain`, {
            encoding: "utf-8",
          }).trim();

          if (status) {
            throw new Error(
              "Error: Destination has uncommitted changes. Commit or stash first."
            );
          }
        } catch (err) {
          if (err instanceof Error && err.message.includes("uncommitted")) {
            throw err;
          }
          throw new Error(`Error checking destination git status: ${err}`);
        }
      }
      ```
    </step>
    <step order="2">Add main execution function (no confirmation per Decision 3):
      ```typescript
      async function main(): Promise<void> {
        // No confirmation dialogs per Decision 3
        // Execution begins immediately

        // Pre-flight checks
        checkDestinationClean();

        // Copy files
        copyFiles();

        // npm install (added in task-3)
        // runNpmInstall();

        // Git commit + push (added in task-4)
        // commitAndPush();
      }

      // Run immediately
      main().catch((err) => {
        console.error(err.message);
        process.exit(1);
      });
      ```
    </step>
    <step order="3">Verify no confirmation prompts exist in the code</step>
    <step order="4">Verify error messages are clear and actionable</step>
  </steps>

  <verification>
    <check type="build">npx tsx scripts/mirror.ts --help || true</check>
    <check type="manual">Verify script fails with clear error if destination has uncommitted changes</check>
    <check type="manual">Verify no confirmation dialogs or prompts</check>
  </verification>

  <dependencies>
    <!-- Can run in parallel with task-1, both build the same file -->
  </dependencies>

  <commit-message>feat(mirror): add pre-flight checks and zero-confirmation execution

- Check destination repo exists
- Fail fast if uncommitted changes (per Risk Register)
- Zero confirmation dialogs (per Decision 3)</commit-message>
</task-plan>
```

---

### Wave 2 (After Wave 1 — Operations)

These tasks add npm install and git operations. They depend on Wave 1.

```xml
<task-plan id="phase-1-task-3" wave="2">
  <title>Add npm install with error handling</title>
  <requirement>REQ-005, REQ-013: Run npm install, handle failures</requirement>
  <description>Add npm install step that runs in destination daemon directory after files are copied. Stops execution if npm install fails.</description>

  <context>
    <file path="scripts/mirror.ts" reason="Target file" />
    <file path="daemon/package.json" reason="Has better-sqlite3 dependency that requires install" />
    <file path="rounds/sync-great-minds/decisions.md" reason="Operation 2: npm install, Risk: don't commit if install fails" />
  </context>

  <steps>
    <step order="1">Add runNpmInstall function:
      ```typescript
      function runNpmInstall(): void {
        const daemonPath = resolve(DEST_ROOT, "daemon");

        try {
          execSync(`cd "${daemonPath}" && npm install`, {
            encoding: "utf-8",
            stdio: "pipe", // Capture output, don't print npm spam
            timeout: 120_000, // 2 minute timeout
          });
          log("Installed dependencies");
        } catch (err) {
          // Per REQ-013: Stop immediately if npm install fails
          const errMsg = err instanceof Error ? err.message : String(err);
          throw new Error(`npm install failed: ${errMsg}`);
        }
      }
      ```
    </step>
    <step order="2">Uncomment runNpmInstall() call in main():
      ```typescript
      // Copy files
      copyFiles();

      // npm install
      runNpmInstall();
      ```
    </step>
    <step order="3">Verify error handling stops execution on failure</step>
    <step order="4">Verify output is quiet ("Installed dependencies" only)</step>
  </steps>

  <verification>
    <check type="build">cd daemon && npm run build</check>
    <check type="manual">Verify npm install runs in destination daemon directory</check>
    <check type="manual">Verify failure stops execution with clear error</check>
  </verification>

  <dependencies>
    <depends-on task-id="phase-1-task-1" reason="Needs copyFiles to exist" />
    <depends-on task-id="phase-1-task-2" reason="Needs main() function structure" />
  </dependencies>

  <commit-message>feat(mirror): add npm install with error handling

- Run npm install in destination daemon directory
- Quiet output: "Installed dependencies"
- Stop execution if npm install fails (per REQ-013)</commit-message>
</task-plan>
```

```xml
<task-plan id="phase-1-task-4" wave="2">
  <title>Add git commit and push with error handling</title>
  <requirement>REQ-006, REQ-007, REQ-014: Git commit + push, handle push failures</requirement>
  <description>Add atomic git commit and push operations. Commit message follows Decision 7 format. Push failures don't rollback commit.</description>

  <context>
    <file path="scripts/mirror.ts" reason="Target file" />
    <file path="rounds/sync-great-minds/decisions.md" reason="Operation 3: git commit + push, Decision 7: output format" />
  </context>

  <steps>
    <step order="1">Add commitAndPush function:
      ```typescript
      function commitAndPush(): void {
        const commitMessage = "Mirror sync from plugin";

        try {
          // Stage all changes
          execSync(`git -C "${DEST_ROOT}" add -A`, { encoding: "utf-8" });

          // Check if there are changes to commit
          const status = execSync(`git -C "${DEST_ROOT}" status --porcelain`, {
            encoding: "utf-8",
          }).trim();

          if (!status) {
            log("No changes to commit");
            return;
          }

          // Commit
          execSync(`git -C "${DEST_ROOT}" commit -m "${commitMessage}"`, {
            encoding: "utf-8",
          });
          log(`Committed: "${commitMessage}"`);

          // Push (per REQ-014: don't rollback on failure)
          try {
            execSync(`git -C "${DEST_ROOT}" push`, { encoding: "utf-8" });
            log("Pushed to origin");
          } catch (pushErr) {
            const errMsg = pushErr instanceof Error ? pushErr.message : String(pushErr);
            console.error(`Push failed: ${errMsg}`);
            console.error("Commit was successful. Resolve push issues and run: git -C great-minds push");
            process.exit(1);
          }
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : String(err);
          throw new Error(`Git operation failed: ${errMsg}`);
        }
      }
      ```
    </step>
    <step order="2">Uncomment commitAndPush() call in main():
      ```typescript
      // npm install
      runNpmInstall();

      // Git commit + push
      commitAndPush();
      ```
    </step>
    <step order="3">Verify commit message matches Decision 7 format</step>
    <step order="4">Verify push failure doesn't rollback commit</step>
    <step order="5">Verify output format: `Committed: "..."`, `Pushed to origin`</step>
  </steps>

  <verification>
    <check type="build">npx tsx scripts/mirror.ts || true</check>
    <check type="manual">Verify commit message is "Mirror sync from plugin"</check>
    <check type="manual">Verify push failure leaves commit intact</check>
    <check type="manual">Verify output matches Decision 7 format</check>
  </verification>

  <dependencies>
    <depends-on task-id="phase-1-task-3" reason="Must run after npm install" />
  </dependencies>

  <commit-message>feat(mirror): add git commit and push with error handling

- Atomic commit with message "Mirror sync from plugin"
- Push to origin, don't rollback on push failure (per REQ-014)
- Output format per Decision 7: `Committed: "..."`, `Pushed to origin`</commit-message>
</task-plan>
```

---

### Wave 3 (After Wave 2 — Verification & Documentation)

Final verification and documentation tasks.

```xml
<task-plan id="phase-1-task-5" wave="3">
  <title>Add npm script and usage documentation</title>
  <requirement>REQ-010: Human-initiated trigger with clear invocation</requirement>
  <description>Add npm script to root package.json for easy invocation and document usage in README or inline comments.</description>

  <context>
    <file path="scripts/mirror.ts" reason="Script to document" />
    <file path="package.json" reason="Add npm script (if exists at root)" />
    <file path="rounds/sync-great-minds/decisions.md" reason="Decision 4: human-initiated trigger" />
  </context>

  <steps>
    <step order="1">Check if root package.json exists. If not, document CLI usage only.</step>
    <step order="2">If package.json exists, add mirror script:
      ```json
      {
        "scripts": {
          "mirror": "npx tsx scripts/mirror.ts"
        }
      }
      ```
    </step>
    <step order="3">Update scripts/mirror.ts header comment with usage:
      ```typescript
      /**
       * Mirror — Sync daemon files from great-minds-plugin to great-minds
       *
       * Usage:
       *   npx tsx scripts/mirror.ts
       *   # or if npm script added:
       *   npm run mirror
       *
       * Operations (per decisions.md):
       *   1. Copy 6 daemon files
       *   2. Run npm install
       *   3. Git commit + push
       *
       * Exit codes:
       *   0 - Success
       *   1 - Error (uncommitted changes, npm install failed, git push failed)
       */
      ```
    </step>
    <step order="4">Verify human must explicitly run command (no git hooks)</step>
  </steps>

  <verification>
    <check type="manual">Verify usage documentation in script header</check>
    <check type="manual">Verify npm run mirror works (if package.json exists)</check>
    <check type="manual">Verify no git hooks installed</check>
  </verification>

  <dependencies>
    <depends-on task-id="phase-1-task-4" reason="Script must be complete first" />
  </dependencies>

  <commit-message>docs(mirror): add usage documentation and npm script

- Document CLI usage in script header
- Add `npm run mirror` script (if package.json exists)
- No git hooks (v1.1 feature per Decision 4)</commit-message>
</task-plan>
```

```xml
<task-plan id="phase-1-task-6" wave="3">
  <title>End-to-end verification test</title>
  <requirement>All requirements: Verify complete Mirror flow works</requirement>
  <description>Run Mirror end-to-end and verify all operations complete successfully. Verify output format matches Decision 7.</description>

  <context>
    <file path="scripts/mirror.ts" reason="Script to test" />
    <file path="rounds/sync-great-minds/decisions.md" reason="Expected output format from Decision 7" />
  </context>

  <steps>
    <step order="1">Ensure destination repo exists: ls -la ../great-minds/daemon/</step>
    <step order="2">Ensure destination repo is clean: git -C ../great-minds status</step>
    <step order="3">Run mirror: npx tsx scripts/mirror.ts</step>
    <step order="4">Verify output format matches Decision 7:
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
    </step>
    <step order="5">Verify files were copied: diff daemon/src/pipeline.ts ../great-minds/daemon/src/pipeline.ts</step>
    <step order="6">Verify commit exists: git -C ../great-minds log -1 --oneline</step>
    <step order="7">Verify push succeeded: git -C ../great-minds status (should say "up to date")</step>
  </steps>

  <verification>
    <check type="manual">Output matches Decision 7 format (quiet, past-tense)</check>
    <check type="manual">All 6 files copied successfully</check>
    <check type="manual">npm install ran without errors</check>
    <check type="manual">Commit created with correct message</check>
    <check type="manual">Push succeeded to origin</check>
  </verification>

  <dependencies>
    <depends-on task-id="phase-1-task-5" reason="Script must be fully documented" />
  </dependencies>

  <commit-message>test(mirror): verify end-to-end Mirror flow

- All 6 files copied
- npm install succeeded
- Commit created and pushed
- Output format matches Decision 7</commit-message>
</task-plan>
```

---

## Wave Summary

```
Wave 1: [task-1, task-2]    <- parallel, core script structure
Wave 2: [task-3, task-4]    <- sequential, operations (npm install, then git)
Wave 3: [task-5, task-6]    <- documentation and verification
```

---

## Risk Notes

| Risk | Mitigation |
|------|------------|
| **Destination repo doesn't exist** | Task-2 adds pre-flight check with clear error |
| **Uncommitted changes in destination** | Task-2 implements fail-fast per Risk Register |
| **npm install fails** | Task-3 stops execution, doesn't proceed to commit |
| **git push fails (auth/network)** | Task-4 keeps commit, instructs user to retry manually |
| **Wrong files copied** | Task-1 uses PRD file list, not decisions.md hypothetical list |
| **Hardcoded paths** | All tasks use relative paths per BANNED-PATTERNS.md |

---

## What Gets Built (File Structure)

```
great-minds-plugin/
  scripts/
    mirror.ts          # ~100 lines, main sync script

great-minds/ (DESTINATION)
  daemon/
    src/
      pipeline.ts      # [MIRRORED]
      agents.ts        # [MIRRORED]
      config.ts        # [MIRRORED]
      daemon.ts        # [MIRRORED]
    package.json       # [MIRRORED]
    README.md          # [MIRRORED]
```

---

## What Does NOT Get Built (v1.1 Roadmap)

Per locked decisions, these are explicitly excluded from v1:

1. **Git hook automation** — v1.1 will add pre-commit or post-commit trigger
2. **Documentation sync** — BANNED-PATTERNS.md, DO-NOT-REPEAT.md, CLAUDE.md updates
3. **Dry-run mode** — "Erodes confidence" per Steve Jobs (Decision 3)
4. **npm package extraction** — Long-term architecture, post-stabilization
5. **Bidirectional sync** — Plugin is truth, repo is reflection (Decision 2)

---

## Expected Output (Decision 7)

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

---

## Codebase Research Summary

From the research agents:

### Codebase Scout Findings
- **Source files exist**: All 6 files in PRD are present and accounted for
- **Destination may exist**: `/Users/sethshoultes/Local Sites/great-minds/daemon/` was confirmed to exist
- **Pattern reference**: `health.ts` uses `execSync` for git operations — same pattern for mirror.ts
- **Config pattern**: Use relative paths, `resolve(__dirname, "..")` for location-independent paths

### Requirements Analyst Findings
- **PRD vs Decisions discrepancy**: File list in decisions.md is hypothetical (errors.ts, types.ts, etc. don't exist)
- **Authoritative file list**: PRD specifies pipeline.ts, agents.ts, config.ts, daemon.ts, package.json, README.md
- **Documentation sync deferred**: Decisions explicitly excludes BANNED-PATTERNS.md, DO-NOT-REPEAT.md, CLAUDE.md

### Risk Scanner Findings
- **No hardcoded paths**: grep found no `/Users/` in daemon source
- **Token ledger CWD issue**: Already fixed with explicit dbPath
- **PRD watcher race condition**: Already fixed with awaitWriteFinish
- **Destination repo exists**: Confirmed at local path

---

## Technical Notes

### Why PRD File List (Not Decisions)

The decisions.md file list (lines 119-130) appears to be a placeholder/example:
- `errors.ts` — Does not exist
- `types.ts` — Does not exist
- `utils.ts` — Does not exist
- `index.ts` — Does not exist

Actual daemon files (from `ls daemon/src/`):
- pipeline.ts, agents.ts, config.ts, daemon.ts, dream.ts, health.ts, logger.ts, telegram.ts, token-ledger.ts

The PRD selects the 4 core orchestration files (pipeline, agents, config, daemon) plus package.json and README.md. This is the correct manifest.

### Path Strategy (BANNED-PATTERNS.md Compliance)

Per BANNED-PATTERNS.md cross-project patterns:
> `/Users/sethshoultes/` (or any absolute home path) — Hardcoded paths break on other machines.

Solution: Use relative paths from script location:
```typescript
const SCRIPT_DIR = dirname(new URL(import.meta.url).pathname);
const PLUGIN_ROOT = resolve(SCRIPT_DIR, "..");
const DEST_ROOT = resolve(PLUGIN_ROOT, "..", "great-minds");
```

This works regardless of where the user runs the script from.

---

*"Before enlightenment, chop wood, carry water. After enlightenment, chop wood, carry water. Before Mirror, copy files. After Mirror, trust the reflection."*

— Phil Jackson, The Zen Master
