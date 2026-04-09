# Requirements: GitHub Intake (Intake)

**Project:** github-intake
**Product Name:** Intake
**Version:** v1.0 MVP
**Generated:** 2025-04-09
**Source Documents:**
- PRD: `prds/github-intake.md`
- Decisions: `rounds/github-intake/decisions.md`

**Build Target:** ~80 lines of new code in `health.ts`, 4 hours, one agent session

---

## Core Requirements

### REQ-001: Add Intake Logic to health.ts
**Requirement:** Implement GitHub intake as new functions in the existing `daemon/src/health.ts` file, NOT as a separate module.
**Acceptance Criteria:**
- New functions added to `health.ts` (~80 lines total):
  - `pollGitHubIssuesWithLabels()` — extends existing poll with label filter
  - `convertIssueToPRD()` — transforms issue to PRD markdown
  - `loadIntakeState()` / `saveIntakeState()` — JSON state management
  - `isIssueAlreadyConverted()` — deduplication check
- No new `github-intake.ts` module created in v1
- Can be extracted to separate module at v1.1 if code exceeds 200 lines
**Source:** Decision 1 (Module Architecture) — Elon Musk won, OVERRIDES PRD Section 1

### REQ-002: Poll GitHub Issues in Parallel
**Requirement:** Poll all configured repos simultaneously using `Promise.all()` for performance.
**Acceptance Criteria:**
- Repos fetched in parallel, not sequentially
- Total poll time ~15 seconds worst-case (vs. 90 seconds sequential)
- Use existing `GITHUB_REPOS` array from `config.ts`
- Timeout handling prevents hanging on any single repo (15 second timeout)
**Source:** Decision 5 (Polling Strategy) — Elon Musk won

### REQ-003: Filter Issues by p0/p1 Labels Only
**Requirement:** Convert ONLY issues labeled `p0` OR `p1`. No other labels.
**Acceptance Criteria:**
- Issues without `p0` or `p1` label are ignored
- No exclude logic (`question`, `wontfix`, etc.) — completely cut
- Label filter is hardcoded, not configurable
- gh CLI query: `gh issue list --label p0 --label p1` (OR logic)
**Source:** Decision 4 (Label Filtering) — Consensus, OVERRIDES PRD Section 3 (6 labels)

### REQ-004: Track Converted Issues in JSON State File
**Requirement:** Persist converted issue IDs to `.github-intake-state.json` at repo root.
**Acceptance Criteria:**
- File location: `${REPO_PATH}/.github-intake-state.json`
- Format: JSON object with issue keys `"{repo}#{number}"`
- Debuggable via `cat .github-intake-state.json`
- Portable, restorable from git history
- Handles 100,000+ issue IDs without performance issues
- State file committed to git (not gitignored)
**Source:** Decision 3 (State Management) — Elon Musk won

### REQ-005: Skip Already-Converted Issues
**Requirement:** Before converting an issue, check if it was previously converted.
**Acceptance Criteria:**
- Load state file on poll start
- Check if `{repo}#{number}` exists in state
- If already converted: skip issue, log debug message
- If not converted: convert and add to state
**Source:** Decision 6 (Timestamp vs Issue Number) — Steve partial win (v1: numbers only)

### REQ-006: Convert Issue to PRD File
**Requirement:** Transform GitHub issue into a PRD markdown file with structured header.
**Acceptance Criteria:**
- Output path: `prds/github-issue-{repo-slug}-{number}.md`
- Repo slug sanitized (alphanumeric + dash only): `sethshoultes/great-minds-plugin` → `sethshoultes-great-minds-plugin`
- PRD format includes:
  ```
  # PRD: {issue title}

  > Auto-generated from GitHub issue {repo}#{number}
  > {issue URL}

  ## Metadata
  - **Repo:** {repo}
  - **Issue:** #{number}
  - **Author:** {author}
  - **Labels:** {labels}
  - **Created:** {created_at}

  ## Problem
  {issue body}

  ## Success Criteria
  - Issue {repo}#{number} requirements are met
  - All tests pass
  ```
**Source:** Decision 7 (PRD Format) — Elon Musk won (structured translation layer)

### REQ-007: Zero Configuration
**Requirement:** No configuration options, no toggles, no templates.
**Acceptance Criteria:**
- No `GITHUB_INTAKE_ENABLED` env var
- No CLI flags or configuration files
- Label filter hardcoded to `p0`/`p1`
- Poll interval hardcoded (5 minutes, same as heartbeat)
- If someone needs to configure it, we built it wrong
**Source:** Decision 8 (Configuration Philosophy) — Steve Jobs won

### REQ-008: Poll Only Open Issues
**Requirement:** Filter for open issues only, exclude closed.
**Acceptance Criteria:**
- gh CLI query includes `--state open`
- Closed issues never appear in poll results
**Source:** PRD Section 3 (Issue Filtering Rules)

### REQ-009: Integrate into Daemon Event Loop
**Requirement:** Intake runs on the existing 5-minute GitHub poll interval in `daemon.ts`.
**Acceptance Criteria:**
- Modify `checkGitHubIssues()` in `daemon.ts` to call intake conversion
- Or add separate call in `runPeriodicTasks()` on same interval
- Does not block other daemon operations
- Error in intake does not crash daemon (try-catch)
**Source:** PRD Section 4 & Decision 1

### REQ-010: Loud Auth Failure
**Requirement:** If `gh` CLI is not authenticated, fail loudly with clear instructions.
**Acceptance Criteria:**
- Detect auth failure (non-zero exit code or specific error message)
- Log error: `INTAKE ERROR: gh CLI not authenticated. Run 'gh auth login' to configure.`
- Do NOT silently skip (unlike current `pollGitHubIssues` which catches silently)
**Source:** Decision Open Question #6 — resolved: error loudly

---

## Exclusion Requirements (NOT in v1)

### REQ-011: NO GitHub Status Comments
**Requirement:** Do NOT implement GitHub issue comments or auto-close in v1.
**Acceptance Criteria:**
- No "Shipped. See PR #47" comments
- No auto-close of issues when shipped
- PRD generation is the ONLY output
- Status updates deferred to v1.1
**Source:** Decision 2 (Status Updates) — Elon Musk won, OVERRIDES PRD Section 2

### REQ-012: NO Complex Label Filtering
**Requirement:** Do NOT implement exclude labels or multi-label configuration.
**Acceptance Criteria:**
- No exclude labels (`question`, `wontfix`, `duplicate`, `discussion`)
- No whitelist/blacklist configuration
- Simple binary: has `p0` OR `p1`? Convert it.
**Source:** Decision 4 (Label Filtering) — Consensus

### REQ-013: NO Edit Detection
**Requirement:** Do NOT implement body hash or timestamp-based edit detection in v1.
**Acceptance Criteria:**
- Track issue numbers only, not body content
- If issue edited after conversion, no re-conversion
- Log warning if previously-seen issue encountered
- Hash comparison deferred to v1.1
**Source:** Decision 6 (Timestamp vs Issue Number) — v1 compromise

### REQ-014: NO Dashboard or UI
**Requirement:** Do NOT build any monitoring UI for intake.
**Acceptance Criteria:**
- No dashboard component
- No toggle or configuration UI
- No visualization or analytics
- Completely invisible infrastructure
**Source:** Implicit from Decision 2 & MVP Feature Set

### REQ-015: NO Notifications
**Requirement:** Do NOT implement Slack, email, or any notifications in v1.
**Acceptance Criteria:**
- No Slack notifications
- No email notifications
- When v1.1 ships status updates, GitHub comment is the ONLY channel
**Source:** Decision 9 (Notification Strategy) — Consensus

### REQ-016: NO Batching
**Requirement:** Each issue converts to its own PRD. No batching multiple issues.
**Acceptance Criteria:**
- One issue = one PRD file
- No combining multiple P2 issues into single PRD
- Batching deferred to v1.1 (if pipeline throughput becomes bottleneck)
**Source:** MVP Feature Set (Explicit Exclusion)

---

## Quality Requirements

### REQ-017: Use Project Logger
**Requirement:** Follow daemon logging patterns.
**Acceptance Criteria:**
- Use `log()` from `./logger.js`, NOT `console.log`
- Log format: `INTAKE: <message>`
- Log: start of poll, each conversion, completion, errors
**Source:** BANNED-PATTERNS.md, daemon conventions

### REQ-018: Avoid Banned Patterns
**Requirement:** Code must not contain banned patterns.
**Acceptance Criteria:**
- No hardcoded `/Users/` paths
- No `console.log` in daemon code
- Use `REPO_PATH` from config.ts for all paths
**Source:** BANNED-PATTERNS.md

### REQ-019: Sanitize Repo Names for Filenames
**Requirement:** Repo names with special characters must be sanitized.
**Acceptance Criteria:**
- Replace `/` with `-`
- Remove or replace other special characters
- Result is valid filename on all platforms
- Deterministic: same repo = same filename every time
**Source:** Decision Open Question #4 — resolved: sanitize to alphanumeric-dash

### REQ-020: Integration Test
**Requirement:** Verify feature works end-to-end.
**Acceptance Criteria:**
- Function runs without errors
- PRD generates with all sections
- State file updates correctly
- Daemon watcher picks up generated PRD
- Pipeline can process generated PRD
**Source:** Definition of Done (decisions.md)

---

## Traceability Matrix

| Requirement | Source Doc | Priority | Wave |
|-------------|-----------|----------|------|
| REQ-001 | Decision 1 | P0 | 1 |
| REQ-002 | Decision 5 | P0 | 1 |
| REQ-003 | Decision 4 | P0 | 1 |
| REQ-004 | Decision 3 | P0 | 1 |
| REQ-005 | Decision 6 | P0 | 1 |
| REQ-006 | Decision 7 | P0 | 1 |
| REQ-007 | Decision 8 | P1 | 1 |
| REQ-008 | PRD | P0 | 1 |
| REQ-009 | PRD 4, Decision 1 | P0 | 2 |
| REQ-010 | Open Question 6 | P0 | 1 |
| REQ-011 | Decision 2 | — | v1.1 |
| REQ-012 | Decision 4 | — | v1.1 |
| REQ-013 | Decision 6 | — | v1.1 |
| REQ-014 | Decision 2 | — | v1.1 |
| REQ-015 | Decision 9 | — | v1.1 |
| REQ-016 | MVP Feature Set | — | v1.1 |
| REQ-017 | BANNED-PATTERNS | P0 | 1 |
| REQ-018 | BANNED-PATTERNS | P0 | 1 |
| REQ-019 | Open Question 4 | P0 | 1 |
| REQ-020 | Definition of Done | P0 | 3 |

---

## Decision Overrides Summary

These decisions from `rounds/github-intake/decisions.md` OVERRIDE the original PRD:

| Override | PRD Proposed | Decision Locked | Winner |
|----------|-------------|-----------------|--------|
| Module location | New `github-intake.ts` | Add to `health.ts` (~80 lines) | Elon Musk |
| Label filtering | 6 include + 4 exclude labels | `p0` OR `p1` only, no excludes | Consensus |
| Status updates | Core v1 feature (comments + close) | Cut to v1.1 | Elon Musk |
| Configuration | `GITHUB_INTAKE_ENABLED` env var | Zero config, hardcoded defaults | Steve Jobs |
| PRD format | Minimal transformation | Structured header + body (translation layer) | Elon Musk |
| Notification | Comments + implicit Slack/email | GitHub only, cut for v1 | Consensus |
| Edit detection | Track created/updated since poll | Numbers only, hash in v1.1 | Steve partial |

---

## Risk Notes

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| GitHub API rate limits | Medium | High | Authenticated `gh` CLI (5000 req/hr). 6 repos × 5 min polling = ~288 calls/hr. Safe. |
| Pipeline queue saturation | High | High | V1 accepts this. 5 P0 issues = 100+ min queue. V2 needs batching. |
| Stale PRDs from edited issues | Medium | Medium | V1: log warning. V1.1: implement body hash. |
| gh CLI not authenticated | Low | High | Fail loudly with clear error message. |
| State file corruption | Low | High | JSON writes atomic-ish. Delete and re-convert if corrupted (idempotent). |
| Repo access revoked | Low | Medium | Log error, skip repo, continue with others. |
