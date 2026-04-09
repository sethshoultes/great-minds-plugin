# Elon Musk — Round 1 Position: GitHub Intake

## Architecture: What's the simplest system that could work?

**Cut the new module. Extend `health.ts`.**

You already have `pollGitHubIssues()` in `health.ts` that fetches issues from 6 repos every 5 minutes. The PRD wants a *separate* `github-intake.ts` module. That's organizational vanity, not engineering.

The simplest system:
1. Add a `labels` field to the existing `pollGitHubIssues()` call (one line change to `gh issue list`)
2. Filter for actionable labels in the existing loop
3. Write PRD files directly from `checkGitHubIssues()` in `daemon.ts`
4. State tracking: a 50-line JSON file. Not KV. Not a database. A file that gets committed.

**Total: ~80 lines of new code, zero new modules.**

---

## Performance: Where are the bottlenecks?

The real bottleneck isn't polling. It's the pipeline.

Each PRD triggers a **20+ minute pipeline** with 15+ agent calls. If 5 GitHub issues arrive simultaneously, you're looking at a 100+ minute queue. The poll interval (15 min vs 5 min) is noise.

**The 10x path:** Batch small issues. Three P2 bugs could share one pipeline run with a combined PRD. The current PRD doesn't address this at all.

Also: `gh issue list` shells out per-repo sequentially. At 6 repos × 15 second timeout = 90 seconds worst-case. Make it parallel: `Promise.all()` the repos.

---

## Distribution: How does this reach 10,000 users without paid ads?

This is internal tooling. It has zero distribution strategy because it's not a product — it's plumbing.

**But if you wanted it to be a product:** The "AI converts GitHub issues to shipped code" angle is a demo worth recording. Ship one issue → commit video loop. That's viral-worthy. The PRD is 100% implementation, 0% "why would anyone care."

---

## What to CUT (v2 features masquerading as v1)

1. **Issue Status Updates (Section 2)** — Commenting back to GitHub and auto-closing issues is polish. Ship v1 *without* it. Validate that issue-to-PRD conversion works first. Add the feedback loop in v1.1.

2. **Label filtering complexity** — Six include labels, four exclude labels. Start with just `p0` and `p1`. If a human labeled it high-priority, convert it. Everything else waits.

3. **"Created or updated since last poll"** — Over-engineered. Just track issue numbers you've seen. A Set in memory, persisted to JSON. Don't parse timestamps.

4. **PRD format with "Success Criteria" section** — The issue body *is* the requirement. Don't add boilerplate. Copy the issue verbatim with a header.

---

## Technical Feasibility: Can one agent session build this?

**Yes, but barely.**

The core feature (poll → filter → write PRD) is ~100 lines. One session can do that.

The status update feature (comment → close) adds GitHub API auth complexity, error handling for rate limits, and edge cases (what if the issue was edited? what if it's already closed?). That's a second session.

**Recommendation:** Split into two PRDs. Ship intake first. Ship feedback loop second.

---

## Scaling: What breaks at 100x usage?

At 100x:
- **600 repos instead of 6:** `gh` CLI shells out per repo. At 600, you'd hit GitHub rate limits (5000 req/hour authenticated). Need to batch API calls or use GraphQL.
- **100 issues/hour:** Pipeline queue becomes infinite. Need priority-based scheduling and parallel pipelines.
- **State file:** JSON file with 10,000 converted issue IDs is fine. 100,000 is still fine. This scales.

The real limit is **pipeline throughput**, not intake. You can ingest 1000 issues/hour but only process 3-4. That's a fundamentally different problem than this PRD addresses.

---

## Bottom Line

This PRD is 70% correct, 30% premature optimization.

**Ship this:**
- Poll issues with labels `p0`, `p1`
- Write PRD to `prds/github-issue-{repo}-{number}.md`
- Track converted issues in `.github-intake-state.json`
- Done in ~80 lines

**Cut this:**
- Status updates to GitHub (v1.1)
- Complex label filtering (v1.1)
- New module (just extend `health.ts`)

Build time: One focused agent session. Four hours max.
