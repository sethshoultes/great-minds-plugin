# Round 1: Elon Musk — GitHub Intake

## Architecture: What's the Simplest System That Could Work?

This PRD describes 6 requirements. Wrong. It's two functions:
1. `pollAndConvert()` — fetch issues → filter → write PRD file
2. `updateIssueStatus()` — comment/close after ship

The daemon already has polling. The file watcher already triggers pipelines. **Don't invent new machinery.** The only new code is a translation layer.

State tracking with a JSON file? **Wrong answer.** GitHub already tracks state. When you process an issue, add a `prd-generated` label. Next poll, filter out labeled issues. Zero local state to corrupt, sync, or debug. Use the platform you're already paying for.

## Performance: Where Are the Bottlenecks?

`health.ts` already calls `pollGitHubIssues()`. The PRD wants a second polling system. **You're doing the work twice.** Consolidate: one poll, two consumers.

gh CLI takes 1-3 seconds per repo. 6 repos = 18 seconds. Fine for v1.

**10x path:** GraphQL. One query across all repos. But here's the honest answer: at 6 repos, this doesn't matter. Premature optimization is the root of all evil. Ship REST, measure, optimize if needed.

## Distribution: How Does This Reach 10,000 Users?

This **is** the distribution engine. The viral loop:

1. User files issue → system auto-ships fix → user is stunned
2. The auto-comment on closed issues says "Shipped by Great Minds Pipeline [link]"
3. Every shipped issue is a billboard in the GitHub activity feed

Target OSS maintainers drowning in issues. Five tweets from frustrated maintainers showing "filed issue, came back to merged PR" = 10k users. The product IS the marketing.

## What to CUT — Scope Creep Exposed

**Cut from v1:**
- **Section 2 (Issue Status Updates)** — This is polish. The core value is "issue → PRD → shipped code." Commenting back is nice, not necessary. Ship the pipe first.
- **"Updated since last poll" filtering** — Overengineered. If it's open and unlabeled with `prd-generated`, process it. Don't track timestamps with timezone bugs.
- **`GITHUB_INTAKE_ENABLED` toggle** — Feature flags for features nobody asked to disable. If they don't want intake, they don't add actionable labels. Cut.
- **Complex label matrix** — Start with `p0`, `p1`, `bug`. Add labels after you see what people actually use.

**v2 masquerading as v1:**
- Bi-directional sync (issue edits update PRD)
- Priority queue ordering
- Retry logic and rate limit handling
- Multi-org support

## Technical Feasibility: Can One Agent Session Build This?

**Yes, if you cut Section 2.**

Existing codebase has:
- `pollGitHubIssues()` in health.ts
- `GITHUB_REPOS` in config.ts
- PRD watcher in daemon.ts

New code needed:
- `github-intake.ts`: ~80 lines
- `daemon.ts` mod: ~10 lines
- `config.ts` mod: ~5 lines

Total: ~100 lines. One session. 30-45 minutes.

**With Section 2:** Pipeline modifications add coupling. "Detect GitHub-sourced PRD, trigger comment" = edge cases. That's a second session.

## Scaling: What Breaks at 100x?

**100x repos (600 repos):** gh CLI is dead. 3 seconds × 600 = 30 minutes per poll. Solution: GraphQL + parallel execution.

**100x issues per repo:** In-memory filter of 6000 issues. Trivial. <100ms.

**100x PRDs queued:** Pipeline processes sequentially. 600 PRDs × 60 min = 25 days. This is correct behavior—you don't want 600 parallel agents. Add priority ordering so p0 beats p1.

**API rate limit:** 5000 requests/hour. Current design uses ~24/hour. Not even close to the limit.

**Real breaking point:** Agent capacity, not intake. Don't optimize intake scaling until agent scaling is solved.

## Verdict

Ship minimal version:
1. One new file: `github-intake.ts`
2. Poll → filter (p0/p1/bug) → write PRD → add label
3. Let existing watcher handle the rest
4. No status updates, no JSON state, no feature flags

Time to ship: 2 hours. Complexity: minimal. Value: issues become shipped code.

The PRD is 80% right. Cut the 20% that's v2 scope creep. Ship Thursday.
