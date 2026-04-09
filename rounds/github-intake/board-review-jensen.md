# Board Review: GitHub Intake

**Reviewer:** Jensen Huang — CEO of NVIDIA, Board Member
**Project:** github-intake (Intake)
**Date:** Board Review Session

---

## Executive Assessment

You've built a data ingestion layer for an AI pipeline. That's infrastructure. That's good. But let me tell you what I see that you might not.

---

## What's the Moat? What Compounds Over Time?

**Current moat: None.**

Right now, you have a GitHub polling script that writes markdown files. Every developer who's spent a weekend with the `gh` CLI could build this. That's not a moat — that's table stakes.

**What COULD compound:**

1. **Context accumulation.** Every issue you convert carries metadata: who filed it, what labels, from which repo, how long it took to ship. That's training data for understanding *your* specific codebase. Today you throw it away. Tomorrow it should feed a model that knows "P0 bugs in the auth module take 3x longer than P0 bugs in the UI."

2. **Issue quality scoring.** After 1000 issues, you'll know which issues convert to PRDs that ship clean vs. which ones bounce through 4 QA cycles. That pattern recognition is your moat. GitHub doesn't have it. Linear doesn't have it. You could.

3. **Cross-repo intelligence.** You're polling 6 repos. You're treating them as independent. They're not. Issues in `great-minds-plugin` affect `great-minds` and `localgenius`. The system that understands those dependencies compounds. The system that doesn't stays linear.

**Verdict: 3/10 on moat today. The bones are there for 8/10.**

---

## Where's the AI Leverage? Are We Using AI Where It 10x's the Outcome?

**Current AI leverage: Zero in the intake itself.**

The pipeline downstream uses Claude for debate, build, QA. But the intake? It's a shell script dressed in TypeScript. The "conversion" from issue to PRD is string concatenation:

```typescript
const prdContent = `# PRD: ${issue.title}
...
## Problem
${issue.body}
```

That's not leverage. That's copy-paste.

**Where AI should be 10x-ing this:**

1. **Issue triage.** "Button broken" with no steps is garbage. AI should recognize this and either reject it or ask clarifying questions before conversion. You're feeding noise into your pipeline.

2. **PRD synthesis.** The issue body is rarely the full problem. AI should read the issue, grep the relevant code, understand the context, and write a *real* PRD with reproduction steps, affected files, and scope estimate. That's what a senior engineer does. That's what AI should do here.

3. **Duplicate detection.** You're tracking issue *numbers* to avoid re-processing. But what about issue *semantics*? "Login page slow" and "Authentication takes forever" are the same issue. Your state file doesn't know that. AI does.

4. **Priority inference.** You're relying on humans to label `p0` and `p1`. Humans are inconsistent. AI that reads the issue, checks commit history on affected files, and says "this is actually P0 because this function handles payments" — that's leverage.

**Verdict: 2/10 on AI leverage. You have a pipeline full of AI that starts AFTER the hard problem (understanding the issue) is punted to humans.**

---

## What's the Unfair Advantage We're NOT Building?

The unfair advantage you're leaving on the table:

**"Zero-human pipeline from problem to production."**

Right now: Human files issue → (wait for human to label P0/P1) → Intake converts → Pipeline builds → Code ships.

The human labeling step is friction. It's latency. It's where issues die.

The unfair advantage: **AI reads every open issue across all repos, every hour, and autonomously decides what to build next.** Not just P0/P1-labeled issues. ALL issues. AI becomes the PM.

You're building automation. You should be building *agency*.

Also missing: **Feedback loops.** You convert an issue. The pipeline ships. Does the original reporter know? Do you track whether the shipped code actually resolved the problem? You cut GitHub status updates from v1. I understand the velocity argument. But without the loop, you don't learn. And systems that don't learn die.

**Verdict: You're building a faster typewriter when you should be building a word processor.**

---

## What Would Make This a Platform, Not Just a Product?

Right now, Intake is a feature of the Great Minds daemon. It's internal plumbing.

**Platform pivot:**

1. **Multi-tenant intake.** Other teams connect their GitHub repos. You handle the conversion, the pipeline, the shipping. SaaS model: $X per issue shipped.

2. **Intake-as-API.** Expose an endpoint: `POST /intake` with an issue URL. Returns a PRD. Other AI coding tools integrate with you. You become the issue-to-spec layer for the industry.

3. **Intake plugins.** GitHub today. Linear tomorrow. Jira next week. Notion tasks. Slack threads. Every "intent" source becomes an intake adapter. The pipeline doesn't care where it came from.

4. **Issue marketplace.** This is the bold one. Open issues that your pipeline CAN'T solve get surfaced to humans who can. You become the layer between "what users want" and "who can build it."

**Platform characteristics missing today:**
- No API
- No multi-tenancy
- No pluggable sources
- No billing/metering
- No third-party integrations

**Verdict: This is infrastructure, not platform. Which is fine for v1. But the PRD doesn't even mention the platform path.**

---

## Risk Assessment

| Risk | Severity | Your Mitigation | My Concern |
|------|----------|-----------------|------------|
| Pipeline saturation (5 P0s = 100+ min queue) | High | "v1 accepts this" | You're accepting the wrong thing. Parallel pipelines should be v1.1, not "someday." |
| Stale PRDs from edited issues | Medium | Log warning | Logging is not mitigation. It's documentation of failure. |
| `gh` CLI rate limits | Medium | "Monitor for 429s" | What happens when you hit one? Auto-backoff? Or crash? |
| Zero feedback to issue reporters | High | "v1.1 feature" | Users filing issues will assume nothing is happening. Trust erodes. |

---

## What NVIDIA Would Do Differently

At NVIDIA, when we build infrastructure, we ask: "How does this become a multiplier for everything else?"

Your intake is additive. It adds one input channel. It should be multiplicative — making every input channel smarter, faster, and more context-aware.

Specific changes I'd mandate:

1. **Every issue conversion creates a vector embedding stored alongside the state file.** Duplicate detection becomes trivial. Pattern recognition becomes possible. Training data accumulates.

2. **AI pre-triage.** Before conversion, Claude reads the issue and returns: `{quality: 0.7, priority: "P1", clarifications_needed: ["reproduction steps"]}`. Low-quality issues don't become PRDs — they get a comment asking for more info.

3. **Pipeline telemetry.** Every pipeline run records: time-to-ship, QA pass rate, lines of code changed. Feed this back to intake so future conversions include historical context ("issues like this typically take 4 hours").

4. **Parallel pipeline architecture.** Even if you don't build it now, the daemon should be designed for it. One global `pipelineRunning` boolean is a scaling dead-end.

---

## Score: 5/10

**Justification:** Solid execution of a minimal-viable-feature that creates the foundation for compounding intelligence, but currently captures none of that intelligence and uses AI where it doesn't matter while ignoring where it would 10x the outcome.

---

## The Jensen Question

I ask this of every project: **"If this works perfectly, what's the next thing it makes possible that wasn't possible before?"**

Your answer should be: "If intake works perfectly, AI can autonomously prioritize and execute our entire product backlog without human intervention."

If that's not the answer — if the answer is just "issues become PRDs faster" — you're optimizing a local maximum.

**Build the system that makes the next system inevitable.**

---

*"The more you can delegate to AI, the more you can scale your ambition. The intake layer isn't about converting issues. It's about compressing the human-in-the-loop to zero."*

— Jensen Huang
