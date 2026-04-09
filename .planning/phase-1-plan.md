# Phase 1 Plan — GitHub Intake (Intake) MVP

**Generated**: 2025-04-09
**Requirements**: `.planning/REQUIREMENTS.md`
**Total Tasks**: 7
**Waves**: 3

**Product Name**: Intake
**Core Promise**: File an issue, walk away, it ships.
**Build Target**: ~80 lines of new code in `health.ts`, 4 hours

---

## Requirements Traceability

| Requirement | Task(s) | Wave |
|-------------|---------|------|
| REQ-001: Add Intake Logic to health.ts | phase-1-task-1 | 1 |
| REQ-002: Poll GitHub Issues in Parallel | phase-1-task-2 | 1 |
| REQ-003: Filter Issues by p0/p1 Labels Only | phase-1-task-2 | 1 |
| REQ-004: Track Converted Issues in JSON State File | phase-1-task-3 | 1 |
| REQ-005: Skip Already-Converted Issues | phase-1-task-3 | 1 |
| REQ-006: Convert Issue to PRD File | phase-1-task-4 | 1 |
| REQ-007: Zero Configuration | All tasks (implicit) | 1 |
| REQ-008: Poll Only Open Issues | phase-1-task-2 | 1 |
| REQ-009: Integrate into Daemon Event Loop | phase-1-task-5 | 2 |
| REQ-010: Loud Auth Failure | phase-1-task-2 | 1 |
| REQ-017: Use Project Logger | All tasks (implicit) | 1 |
| REQ-018: Avoid Banned Patterns | All tasks (implicit) | 1 |
| REQ-019: Sanitize Repo Names for Filenames | phase-1-task-4 | 1 |
| REQ-020: Integration Test | phase-1-task-6, phase-1-task-7 | 3 |

---

## Wave Execution Order

### Wave 1 (Parallel — Core Functions)

These tasks create the core intake functions in `health.ts`. They are independent and can execute in parallel.

```xml
<task-plan id="phase-1-task-1" wave="1">
  <title>Add intake interfaces and constants to health.ts</title>
  <requirement>REQ-001: Add Intake Logic to health.ts</requirement>
  <description>Add TypeScript interfaces for intake issues and state, plus helper functions for repo slug sanitization. This establishes the type foundation for all other intake functions.</description>

  <context>
    <file path="daemon/src/health.ts" reason="Target file for all intake code per Decision 1" />
    <file path="daemon/src/config.ts" reason="Imports GITHUB_REPOS, PRDS_DIR, REPO_PATH" />
    <file path="daemon/src/logger.ts" reason="Import log() function pattern" />
    <file path=".planning/REQUIREMENTS.md" reason="REQ-006 defines PRD filename format, REQ-019 defines sanitization rules" />
  </context>

  <steps>
    <step order="1">Read daemon/src/health.ts to understand existing structure and imports</step>
    <step order="2">Add new import: import { writeFileSync, readFileSync, existsSync } from "fs"</step>
    <step order="3">Add import for PRDS_DIR from config.ts if not already imported</step>
    <step order="4">Add IntakeIssue interface after existing GitHubIssue interface (around line 101):
      ```typescript
      interface IntakeIssue {
        repo: string;
        number: number;
        title: string;
        body: string;
        labels: string[];
        author: string;
        createdAt: string;
        url: string;
      }

      interface IntakeState {
        convertedIssues: string[];  // Format: "{repo}#{number}"
      }
      ```
    </step>
    <step order="5">Add helper function to sanitize repo names for filenames:
      ```typescript
      function sanitizeRepoSlug(repo: string): string {
        return repo.replace(/[^a-zA-Z0-9-]/g, "-");
      }
      ```
    </step>
    <step order="6">Add constant for state file path:
      ```typescript
      const INTAKE_STATE_FILE = resolve(REPO_PATH, ".github-intake-state.json");
      ```
    </step>
  </steps>

  <verification>
    <check type="build">cd daemon && npm run build</check>
    <check type="manual">Verify health.ts has IntakeIssue interface and sanitizeRepoSlug function</check>
  </verification>

  <dependencies>
    <!-- No dependencies - this is foundational -->
  </dependencies>

  <commit-message>feat(intake): add TypeScript interfaces and helpers for GitHub intake</commit-message>
</task-plan>
```

```xml
<task-plan id="phase-1-task-2" wave="1">
  <title>Implement pollGitHubIssuesWithLabels function</title>
  <requirement>REQ-002: Poll GitHub Issues in Parallel, REQ-003: Filter by p0/p1, REQ-008: Open Issues Only, REQ-010: Loud Auth Failure</requirement>
  <description>Create the main polling function that fetches issues from all configured repos in parallel, filters for p0/p1 labels, and returns only open issues. Must fail loudly if gh CLI is not authenticated.</description>

  <context>
    <file path="daemon/src/health.ts" reason="Existing pollGitHubIssues() at line 103 as pattern reference" />
    <file path="daemon/src/config.ts" reason="GITHUB_REPOS array at line 15-22 is source of truth" />
    <file path="rounds/github-intake/decisions.md" reason="Decision 5 specifies Promise.all() for parallel polling" />
  </context>

  <steps>
    <step order="1">Read existing pollGitHubIssues() function (lines 103-128) for pattern reference</step>
    <step order="2">Add new async function pollGitHubIssuesWithLabels() after existing poll function:
      ```typescript
      export async function pollGitHubIssuesWithLabels(): Promise<IntakeIssue[]> {
        log("INTAKE: Polling GitHub for p0/p1 issues");

        const fetchRepo = async (repo: string): Promise<IntakeIssue[]> => {
          try {
            // Note: gh CLI --label uses OR logic by default when multiple labels specified
            const output = execSync(
              `gh issue list --repo "${repo}" --state open --label p0,p1 --json number,title,body,labels,author,createdAt,url 2>&1`,
              { encoding: "utf-8", timeout: 15_000 }
            );
            const parsed = JSON.parse(output || "[]");
            return parsed.map((issue: any) => ({
              repo,
              number: issue.number,
              title: issue.title,
              body: issue.body || "",
              labels: issue.labels?.map((l: any) => l.name) || [],
              author: issue.author?.login || "unknown",
              createdAt: issue.createdAt,
              url: issue.url,
            }));
          } catch (err) {
            const errMsg = String(err);
            if (errMsg.includes("auth") || errMsg.includes("login") || errMsg.includes("401")) {
              log("INTAKE ERROR: gh CLI not authenticated. Run 'gh auth login' to configure.");
              throw new Error("gh CLI not authenticated");
            }
            log(`INTAKE: Error fetching ${repo}: ${errMsg}`);
            return [];
          }
        };

        const results = await Promise.all(GITHUB_REPOS.map(fetchRepo));
        const issues = results.flat();
        log(`INTAKE: Found ${issues.length} p0/p1 issue(s) across ${GITHUB_REPOS.length} repos`);
        return issues;
      }
      ```
    </step>
    <step order="3">Verify the function uses Promise.all() for parallel execution per Decision 5</step>
    <step order="4">Verify timeout is 15 seconds per existing pattern</step>
  </steps>

  <verification>
    <check type="build">cd daemon && npm run build</check>
    <check type="manual">Test manually: npx tsx -e "import { pollGitHubIssuesWithLabels } from './daemon/src/health.js'; pollGitHubIssuesWithLabels().then(console.log)"</check>
  </verification>

  <dependencies>
    <!-- No hard dependency on task-1 - can develop in parallel -->
  </dependencies>

  <commit-message>feat(intake): add parallel p0/p1 issue polling with loud auth errors</commit-message>
</task-plan>
```

```xml
<task-plan id="phase-1-task-3" wave="1">
  <title>Implement state management functions</title>
  <requirement>REQ-004: Track Converted Issues in JSON State File, REQ-005: Skip Already-Converted Issues</requirement>
  <description>Create functions to load, save, and query the intake state file that tracks which issues have been converted to PRDs.</description>

  <context>
    <file path="daemon/src/health.ts" reason="Target file for state functions" />
    <file path="rounds/github-intake/decisions.md" reason="Decision 3 specifies JSON file at repo root, committed to git" />
  </context>

  <steps>
    <step order="1">Add loadIntakeState function:
      ```typescript
      function loadIntakeState(): IntakeState {
        try {
          if (existsSync(INTAKE_STATE_FILE)) {
            const content = readFileSync(INTAKE_STATE_FILE, "utf-8");
            return JSON.parse(content);
          }
        } catch (err) {
          log(`INTAKE: Error loading state file, starting fresh: ${err}`);
        }
        return { convertedIssues: [] };
      }
      ```
    </step>
    <step order="2">Add saveIntakeState function:
      ```typescript
      function saveIntakeState(state: IntakeState): void {
        try {
          writeFileSync(INTAKE_STATE_FILE, JSON.stringify(state, null, 2));
        } catch (err) {
          log(`INTAKE ERROR: Failed to save state file: ${err}`);
        }
      }
      ```
    </step>
    <step order="3">Add isIssueAlreadyConverted function:
      ```typescript
      function isIssueAlreadyConverted(state: IntakeState, repo: string, number: number): boolean {
        const key = `${repo}#${number}`;
        return state.convertedIssues.includes(key);
      }
      ```
    </step>
    <step order="4">Add markIssueConverted function:
      ```typescript
      function markIssueConverted(state: IntakeState, repo: string, number: number): void {
        const key = `${repo}#${number}`;
        if (!state.convertedIssues.includes(key)) {
          state.convertedIssues.push(key);
        }
      }
      ```
    </step>
  </steps>

  <verification>
    <check type="build">cd daemon && npm run build</check>
    <check type="manual">Verify state functions compile without errors</check>
  </verification>

  <dependencies>
    <!-- No hard dependency - can develop in parallel -->
  </dependencies>

  <commit-message>feat(intake): add JSON state management for tracking converted issues</commit-message>
</task-plan>
```

```xml
<task-plan id="phase-1-task-4" wave="1">
  <title>Implement convertIssueToPRD function</title>
  <requirement>REQ-006: Convert Issue to PRD File, REQ-019: Sanitize Repo Names for Filenames</requirement>
  <description>Create the function that transforms a GitHub issue into a PRD markdown file with the structured format specified in Decision 7.</description>

  <context>
    <file path="daemon/src/health.ts" reason="Target file" />
    <file path="daemon/src/config.ts" reason="PRDS_DIR constant for output path" />
    <file path="rounds/github-intake/decisions.md" reason="Decision 7 specifies PRD format as structured header + body" />
    <file path=".planning/REQUIREMENTS.md" reason="REQ-006 has exact PRD format template" />
  </context>

  <steps>
    <step order="1">Verify PRDS_DIR is imported from config.ts</step>
    <step order="2">Add convertIssueToPRD function:
      ```typescript
      function convertIssueToPRD(issue: IntakeIssue): string {
        const repoSlug = sanitizeRepoSlug(issue.repo);
        const filename = `github-issue-${repoSlug}-${issue.number}.md`;
        const filepath = resolve(PRDS_DIR, filename);

        const prdContent = `# PRD: ${issue.title}

> Auto-generated from GitHub issue ${issue.repo}#${issue.number}
> ${issue.url}

## Metadata
- **Repo:** ${issue.repo}
- **Issue:** #${issue.number}
- **Author:** ${issue.author}
- **Labels:** ${issue.labels.join(", ")}
- **Created:** ${issue.createdAt}

## Problem
${issue.body}

## Success Criteria
- Issue ${issue.repo}#${issue.number} requirements are met
- All tests pass
`;

        writeFileSync(filepath, prdContent);
        log(`INTAKE: Created PRD ${filename}`);
        return filename;
      }
      ```
    </step>
    <step order="3">Verify filename uses sanitizeRepoSlug() for safe filenames</step>
    <step order="4">Verify PRD format matches REQ-006 specification</step>
  </steps>

  <verification>
    <check type="build">cd daemon && npm run build</check>
    <check type="manual">Verify sanitizeRepoSlug converts "sethshoultes/great-minds-plugin" to "sethshoultes-great-minds-plugin"</check>
  </verification>

  <dependencies>
    <!-- Uses sanitizeRepoSlug from task-1, but can be developed in parallel -->
  </dependencies>

  <commit-message>feat(intake): add issue-to-PRD converter with structured format</commit-message>
</task-plan>
```

---

### Wave 2 (After Wave 1 — Integration)

These tasks integrate the core functions into the daemon event loop. They depend on Wave 1 tasks.

```xml
<task-plan id="phase-1-task-5" wave="2">
  <title>Integrate intake into daemon event loop</title>
  <requirement>REQ-009: Integrate into Daemon Event Loop</requirement>
  <description>Create the main processIntake() orchestration function and integrate it into daemon.ts to run on the existing 5-minute GitHub poll interval.</description>

  <context>
    <file path="daemon/src/health.ts" reason="Add main processIntake() function" />
    <file path="daemon/src/daemon.ts" reason="Modify checkGitHubIssues() at line 153 to call intake processing" />
    <file path="rounds/github-intake/decisions.md" reason="Decision 1 - integrate into existing health.ts/daemon.ts" />
  </context>

  <steps>
    <step order="1">Add main processIntake() export function to health.ts:
      ```typescript
      export async function processIntake(): Promise<number> {
        log("INTAKE: Starting intake processing");
        const state = loadIntakeState();

        let issues: IntakeIssue[];
        try {
          issues = await pollGitHubIssuesWithLabels();
        } catch (err) {
          log(`INTAKE ERROR: Failed to poll issues: ${err}`);
          return 0;
        }

        let convertedCount = 0;
        for (const issue of issues) {
          if (isIssueAlreadyConverted(state, issue.repo, issue.number)) {
            log(`INTAKE: Skipping already-converted issue ${issue.repo}#${issue.number}`);
            continue;
          }

          try {
            convertIssueToPRD(issue);
            markIssueConverted(state, issue.repo, issue.number);
            convertedCount++;
          } catch (err) {
            log(`INTAKE ERROR: Failed to convert ${issue.repo}#${issue.number}: ${err}`);
          }
        }

        if (convertedCount > 0) {
          saveIntakeState(state);
          log(`INTAKE: Converted ${convertedCount} issue(s) to PRDs`);
        } else {
          log("INTAKE: No new issues to convert");
        }

        return convertedCount;
      }
      ```
    </step>
    <step order="2">Read daemon/src/daemon.ts and locate checkGitHubIssues() function (line 153)</step>
    <step order="3">Modify checkGitHubIssues() in daemon.ts to call processIntake():
      ```typescript
      import { ..., processIntake } from "./health.js";

      // Replace the function body:
      async function checkGitHubIssues(): Promise<void> {
        if (pipelineRunning) return;

        try {
          await processIntake();
        } catch (err) {
          logError("Intake processing failed", err);
        }
      }
      ```
    </step>
    <step order="4">Make checkGitHubIssues async if it isn't already</step>
    <step order="5">Update the call site in runPeriodicTasks() to use await if needed</step>
  </steps>

  <verification>
    <check type="build">cd daemon && npm run build</check>
    <check type="manual">Run daemon and verify "INTAKE: Starting intake processing" appears in logs every 5 minutes</check>
  </verification>

  <dependencies>
    <depends-on task-id="phase-1-task-1" reason="Needs IntakeIssue interface" />
    <depends-on task-id="phase-1-task-2" reason="Needs pollGitHubIssuesWithLabels()" />
    <depends-on task-id="phase-1-task-3" reason="Needs state management functions" />
    <depends-on task-id="phase-1-task-4" reason="Needs convertIssueToPRD()" />
  </dependencies>

  <commit-message>feat(intake): integrate intake processing into daemon event loop</commit-message>
</task-plan>
```

---

### Wave 3 (After Wave 2 — Verification)

Final verification and testing tasks.

```xml
<task-plan id="phase-1-task-6" wave="3">
  <title>Manual integration test</title>
  <requirement>REQ-020: Integration Test</requirement>
  <description>Manually test the complete intake flow by creating a test issue, verifying PRD generation, and confirming state tracking.</description>

  <context>
    <file path="daemon/src/health.ts" reason="Contains all intake functions to test" />
    <file path="daemon/src/daemon.ts" reason="Event loop integration to verify" />
    <file path="prds/" reason="PRD output directory to check" />
    <file path=".github-intake-state.json" reason="State file to verify" />
  </context>

  <steps>
    <step order="1">Build the daemon: cd daemon && npm run build</step>
    <step order="2">Create a test issue on one of the configured repos with label p0 or p1</step>
    <step order="3">Run the intake manually: npx tsx -e "import { processIntake } from './daemon/dist/health.js'; processIntake().then(console.log)"</step>
    <step order="4">Verify PRD file created in prds/github-issue-{repo-slug}-{number}.md</step>
    <step order="5">Verify .github-intake-state.json contains the issue key</step>
    <step order="6">Run intake again and verify issue is skipped (not re-converted)</step>
    <step order="7">Verify daemon watcher detects the new PRD (check logs)</step>
  </steps>

  <verification>
    <check type="manual">PRD file exists with correct format</check>
    <check type="manual">State file tracks the converted issue</check>
    <check type="manual">Re-running intake skips already-converted issues</check>
    <check type="manual">Daemon watcher logs "New PRD detected"</check>
  </verification>

  <dependencies>
    <depends-on task-id="phase-1-task-5" reason="Needs complete integration" />
  </dependencies>

  <commit-message>test(intake): manual verification of end-to-end intake flow</commit-message>
</task-plan>
```

```xml
<task-plan id="phase-1-task-7" wave="3">
  <title>Code quality check and final commit</title>
  <requirement>REQ-017: Use Project Logger, REQ-018: Avoid Banned Patterns</requirement>
  <description>Verify code follows daemon conventions, no banned patterns, and prepare final commit.</description>

  <context>
    <file path="daemon/src/health.ts" reason="Review all new intake code" />
    <file path="daemon/src/daemon.ts" reason="Review integration changes" />
    <file path="BANNED-PATTERNS.md" reason="Check for banned patterns if exists" />
  </context>

  <steps>
    <step order="1">Grep for console.log in new code: grep -n "console.log" daemon/src/health.ts daemon/src/daemon.ts</step>
    <step order="2">Grep for hardcoded /Users/ paths: grep -n "/Users/" daemon/src/health.ts daemon/src/daemon.ts</step>
    <step order="3">Verify all log statements use log() from logger.js with "INTAKE:" prefix</step>
    <step order="4">Verify all paths use REPO_PATH or PRDS_DIR from config.ts</step>
    <step order="5">Run TypeScript build to ensure no type errors: cd daemon && npm run build</step>
    <step order="6">Run linter if configured: cd daemon && npm run lint || true</step>
    <step order="7">Create final commit with all intake code</step>
  </steps>

  <verification>
    <check type="build">cd daemon && npm run build</check>
    <check type="manual">No console.log statements in daemon code</check>
    <check type="manual">No hardcoded paths</check>
    <check type="manual">All log statements use INTAKE: prefix</check>
  </verification>

  <dependencies>
    <depends-on task-id="phase-1-task-6" reason="Verify after integration test" />
  </dependencies>

  <commit-message>feat(intake): GitHub Intake v1.0 - poll p0/p1 issues, convert to PRDs

- Add IntakeIssue interface and state management
- Parallel repo polling with Promise.all() (Decision 5)
- Filter for p0/p1 labels only (Decision 4)
- Track converted issues in .github-intake-state.json (Decision 3)
- Integrate into daemon 5-minute poll interval (Decision 1)
- PRD format with structured header (Decision 7)
- Loud auth errors for gh CLI (Open Question 6)

Closes: github-intake MVP</commit-message>
</task-plan>
```

---

## Wave Summary

```
Wave 1: [task-1, task-2, task-3, task-4]  ← parallel, core functions
Wave 2: [task-5]                          ← integration, after wave 1
Wave 3: [task-6, task-7]                  ← verification, after wave 2
```

---

## Risk Notes

| Risk | Mitigation |
|------|------------|
| **gh CLI authentication** | Task-2 implements loud error with clear instructions. Test on fresh system. |
| **Parallel polling timeout** | Using 15-second timeout per repo (existing pattern). Promise.all fails fast on auth errors. |
| **State file corruption** | Task-3 implements try-catch with fallback to empty state. Idempotent recovery. |
| **Repo name with special chars** | Task-1 implements sanitizeRepoSlug(). Test with `dash-command-bar` repo. |
| **Pipeline queue saturation** | V1 accepts this risk per Decision 2. Batching deferred to v1.1. |

---

## Estimated Line Count

| Function | Est. Lines |
|----------|-----------|
| Interfaces + constants | 15 |
| sanitizeRepoSlug | 3 |
| pollGitHubIssuesWithLabels | 25 |
| loadIntakeState | 10 |
| saveIntakeState | 6 |
| isIssueAlreadyConverted | 4 |
| markIssueConverted | 5 |
| convertIssueToPRD | 20 |
| processIntake (orchestrator) | 25 |
| **Total new lines in health.ts** | **~113** |
| daemon.ts changes | ~10 |

**Note:** Slightly over the 80-line target from decisions.md, but Decision 1 allows extraction at 200+ lines. We're well under that threshold.

---

## What Gets Built (File Structure)

```
daemon/src/
  health.ts          # Extended with ~113 new lines of intake logic

prds/
  github-issue-{repo-slug}-{number}.md   # Generated PRDs (one per issue)

/.github-intake-state.json               # State: converted issue numbers (committed)
```

---

## What Does NOT Get Built (v1.1 Roadmap)

Per locked decisions, these are explicitly excluded from v1:

1. **Status updates to GitHub** — No comments, no auto-close
2. **Edit detection** — Hash issue body for change detection
3. **Module extraction** — Move to `github-intake.ts` when >200 lines
4. **Complex label filtering** — No exclude logic, no configuration
5. **Dashboard/UI** — No monitoring interface
6. **Notifications** — No Slack/email

---

*"The strength of the team is each individual member. The strength of each member is the team."* — Phil Jackson

Steve brought the soul. Elon brought the knife. Together: a product that ships.
