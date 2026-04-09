# Intake: Consolidated Decisions

**Debate Participants:** Steve Jobs (Chief Design & Brand Officer), Elon Musk (Architecture & Velocity)
**Arbiter:** Phil Jackson
**Date:** Locked for Build Phase

---

## Executive Summary

**Product Name:** Intake
**Core Promise:** File an issue, walk away, it ships.
**Build Target:** 4 hours, one agent session

---

## Locked Decisions

### Decision 1: Module Architecture

| Aspect | Outcome |
|--------|---------|
| **Proposed by** | Steve: Separate `github-intake.ts` module |
| **Counter-proposal** | Elon: Extend existing `health.ts` (~80 lines) |
| **Winner** | **Elon** |
| **Rationale** | V1 ships fast. The code earns its own module at 200+ lines. Architectural purity is a v1.1 concern. Steve's separation-of-concerns argument is valid long-term, but premature for an 80-line feature. We can extract later without breaking anything. |

**Build instruction:** Add intake logic to `health.ts`. Revisit extraction when the feature exceeds 200 lines.

---

### Decision 2: Status Updates to GitHub (Comments + Auto-Close)

| Aspect | Outcome |
|--------|---------|
| **Proposed by** | Steve: Core to v1 experience ("Shipped. See PR #47") |
| **Counter-proposal** | Elon: Cut to v1.1, ship intake-only first |
| **Winner** | **Elon** |
| **Rationale** | Status updates require OAuth scopes, rate limit handling, comment formatting, failure recovery, and edit detection. That's 200+ lines for a 5-word comment. Ship trust first (does it actually convert issues correctly?), then ship convenience (does it tell you about it?). |

**Build instruction:** V1 does NOT comment on issues or auto-close them. PRD generation is the only output.

---

### Decision 3: State Management

| Aspect | Outcome |
|--------|---------|
| **Proposed by** | Elon: JSON file (`.github-intake-state.json`) committed to repo |
| **Counter-proposal** | (Implicit: KV store or database) |
| **Winner** | **Elon** |
| **Rationale** | Debuggable via `cat`. Portable. Restorable from git history. Zero infrastructure. At 100,000 issue IDs, still fine. |

**Build instruction:** State lives in `.github-intake-state.json` at repo root. Track issue numbers already converted.

---

### Decision 4: Label Filtering

| Aspect | Outcome |
|--------|---------|
| **Proposed by** | Original PRD: 6 include labels, 4 exclude labels |
| **Counter-proposal** | Both Steve & Elon: Just `p0` and `p1` |
| **Winner** | **Consensus (Steve + Elon)** |
| **Rationale** | Configuration theater. If a human labeled it high-priority, convert it. Everything else waits. |

**Build instruction:** Filter for labels `p0` OR `p1` only. No exclude logic. No configuration.

---

### Decision 5: Polling Strategy

| Aspect | Outcome |
|--------|---------|
| **Proposed by** | Elon: Parallel repo polling via `Promise.all()` |
| **Supported by** | Steve (conceded in Round 2) |
| **Winner** | **Elon** |
| **Rationale** | Sequential shells to 6 repos = 90 seconds worst-case. Parallel = ~15 seconds. No reason to waste time. |

**Build instruction:** Wrap repo fetches in `Promise.all()`. Do not shell out sequentially.

---

### Decision 6: Timestamp vs. Issue Number Tracking

| Aspect | Outcome |
|--------|---------|
| **Proposed by** | Steve: Track "created or updated since last poll" (catches edits) |
| **Counter-proposal** | Elon: Track issue numbers only (simpler) |
| **Winner** | **Steve (partial)** |
| **Rationale** | Elon's approach is simpler but creates invisible drift when issues are edited after conversion. Compromise: Track issue numbers AND store a hash of the issue body. If body changes, flag for re-conversion in v1.1. For v1, track numbers only but log a warning if this becomes a problem. |

**Build instruction:** V1 tracks issue numbers only. Log when encountering a previously-seen issue. Revisit if drift becomes measurable.

---

### Decision 7: PRD Format

| Aspect | Outcome |
|--------|---------|
| **Proposed by** | Steve: The issue IS the PRD (minimal transformation) |
| **Counter-proposal** | Elon: Issue bodies are garbage, PRD is translation layer |
| **Winner** | **Elon** |
| **Rationale** | "Button broken" with no reproduction steps is not a PRD. The conversion step exists to translate human issues into agent-readable specs. |

**Build instruction:** PRD includes structured header (repo, issue number, labels, author, date) plus issue body. Output to `prds/github-issue-{repo}-{number}.md`.

---

### Decision 8: Configuration Philosophy

| Aspect | Outcome |
|--------|---------|
| **Proposed by** | Steve: Zero configuration, no templates, no settings |
| **Supported by** | Elon (implicitly, via "ship minimal") |
| **Winner** | **Steve** |
| **Rationale** | If someone needs to configure it, we built it wrong. Defaults work. |

**Build instruction:** No configuration UI. No template customization. Hardcoded defaults.

---

### Decision 9: Notification Strategy

| Aspect | Outcome |
|--------|---------|
| **Proposed by** | Steve: GitHub comments only, no Slack/email/dashboard |
| **Supported by** | Elon (agreed completely) |
| **Winner** | **Consensus** |
| **Rationale** | GitHub is the source of truth. Fragmenting attention is a tax. |

**Build instruction:** No notifications in v1 (since status updates are cut). When v1.1 ships, GitHub comment is the ONLY channel.

---

### Decision 10: Product Name & Voice

| Aspect | Outcome |
|--------|---------|
| **Proposed by** | Steve: "Intake" |
| **Supported by** | Elon (explicitly praised the name) |
| **Winner** | **Steve** |
| **Rationale** | One word. What lungs do. What engines do. What this system does. |

**Build instruction:** Internal name is "Intake." Code references can use `intake` prefix for functions/variables.

---

## MVP Feature Set (v1 Ships This)

1. Poll GitHub issues from configured repos (parallel, via `Promise.all()`)
2. Filter for `p0` or `p1` labels only
3. Convert qualifying issues to PRD files at `prds/github-issue-{repo}-{number}.md`
4. Track converted issue numbers in `.github-intake-state.json`
5. Skip already-converted issues
6. Zero configuration required

**What v1 does NOT include:**
- GitHub comments ("Shipped. See PR #47")
- Auto-close of issues
- Dashboard or monitoring UI
- Slack/email notifications
- Configurable templates
- Complex label filtering
- Batching multiple issues into one PRD

---

## File Structure (What Gets Built)

```
/daemon/
  health.ts          # Extended with intake logic (~80 new lines)

/prds/
  github-issue-{repo}-{number}.md   # Generated PRDs (one per issue)

/.github-intake-state.json          # State: converted issue numbers
```

**New functions to add to `health.ts`:**
- `pollGitHubIssuesWithLabels()` — extends existing poll with label filter
- `convertIssueToPRD()` — transforms issue to PRD markdown
- `loadIntakeState()` / `saveIntakeState()` — JSON state management
- `isIssueAlreadyConverted()` — deduplication check

---

## Open Questions (Requires Resolution Before or During Build)

| # | Question | Owner | Blocking? |
|---|----------|-------|-----------|
| 1 | What happens when a PRD file already exists but issue was edited? Overwrite or create `{number}-v2`? | Architect | No (v1: skip, log warning) |
| 2 | Should the poll interval be configurable or hardcoded at 5 minutes? | Architect | No (hardcode 5 min) |
| 3 | How do we handle issues that span multiple repos (cross-repo references)? | Architect | No (v1: ignore, treat as separate) |
| 4 | What's the PRD filename when repo name contains special characters? | Build | Yes (sanitize to alphanumeric-dash) |
| 5 | Should `.github-intake-state.json` be gitignored or committed? | Architect | Yes (Elon says committed; confirm) |
| 6 | What if `gh` CLI is not authenticated? Fail silently or error loudly? | Build | Yes (error loudly, log auth instructions) |

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **GitHub API rate limits** | Medium | High | Use authenticated `gh` CLI (5000 req/hr). Monitor for 429s. |
| **Pipeline queue saturation** | High | High | If 5 P0 issues arrive simultaneously, queue backs up 100+ minutes. V1 accepts this. V2 needs batching or parallel pipelines. |
| **Stale PRDs from edited issues** | Medium | Medium | V1: log warning. V1.1: implement body hash comparison. |
| **`gh` CLI not installed/authenticated** | Low | High | Fail loudly with clear error message on first poll. |
| **Orphaned issues (API timeout mid-conversion)** | Low | Medium | State is written AFTER PRD file. Incomplete PRDs don't update state. Retry on next poll. |
| **State file corruption** | Low | High | JSON is atomic-ish. If corrupted, delete file and re-convert all (idempotent). |
| **Repo access revoked mid-operation** | Low | Medium | Log error, skip repo, continue with others. |

---

## v1.1 Roadmap (Post-MVP)

1. **Status updates to GitHub** — Comment "Shipped. See PR #47" and auto-close
2. **Edit detection** — Hash issue body, re-convert if changed
3. **Module extraction** — Move to `github-intake.ts` when > 200 lines
4. **Batching** — Combine small P2 issues into single PRD (if pipeline throughput is the bottleneck)

---

## Build Authorization

This document represents locked decisions from the Steve/Elon debate.

**Scope:** ~80 lines of new code in `health.ts`
**Estimated build time:** 4 hours, one agent session
**Ship target:** This week

The debate is closed. Build begins now.

---

*"The strength of the team is each individual member. The strength of each member is the team."* — Phil Jackson

Steve brought the soul. Elon brought the knife. Together: a product that ships.
