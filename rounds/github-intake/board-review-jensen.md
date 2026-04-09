# Board Review: GitHub Intake

**Reviewer:** Jensen Huang — CEO of NVIDIA, Board Member at Great Minds Agency
**Project:** github-intake
**Date:** April 2025

---

## Executive Assessment

I've reviewed the PRD, the implemented code in `health.ts`, and the prior decisions document. You shipped. That's good. But let me tell you what I see.

You built a data pipeline that converts GitHub issues into PRDs. The code is clean. It polls six repos in parallel, filters for P0/P1 labels, writes structured markdown, tracks state in JSON. ~200 lines of TypeScript. Shipped in one session.

**But you built a pipe, not a brain.**

---

## What's the Moat? What Compounds Over Time?

**Current moat: Zero.**

Anyone with the `gh` CLI and a weekend could replicate this. The code is straightforward polling + string templating:

```typescript
const prdContent = `# PRD: ${issue.title}
...
## Problem
${issue.body}
```

**What COULD compound:**

1. **Historical Issue Intelligence.** You're tracking `convertedIssues` in a flat array. But you're not tracking *outcomes*. Which issues shipped? Which bounced through 4 QA cycles? Which got rejected? A system that learns "P0 issues in the auth module from user X ship 30% faster" has a moat. A system that forgets everything after conversion has nothing.

2. **Cross-Repo Pattern Recognition.** You poll 6 repos independently. But `great-minds-plugin` issues often affect `great-minds` and `localgenius`. A system that sees "this bug report is actually a symptom of that architectural debt" can prioritize across boundaries. You're treating repos as silos.

3. **PRD Quality Scoring.** After 500 intake conversions, you'll know which PRD formats lead to clean builds vs. messy ones. That's feedback data. You're not collecting it.

**Moat Score: 2/10** — You have infrastructure. Infrastructure without intelligence is commodity.

---

## Where's the AI Leverage? Are We Using AI Where It 10x's the Outcome?

**Current AI leverage in intake: Zero.**

Your pipeline is *full* of AI downstream — Steve Jobs debating Elon Musk, Margaret Hamilton doing QA, Rick Rubin finding essence. Beautiful.

But the intake layer? Pure procedural code. No intelligence. No judgment. No context-awareness.

**Where AI would 10x:**

| Problem | Current Solution | AI-Powered Solution |
|---------|------------------|---------------------|
| Issue quality | Accept anything with P0/P1 label | Claude triages: "This issue lacks repro steps. Commenting to ask for details before converting." |
| PRD synthesis | Copy issue body verbatim | Claude reads issue + greps codebase + writes real PRD with affected files, complexity estimate, test plan |
| Duplicate detection | Track by issue number | Embed issue semantics. "Login slow" and "Auth takes forever" are the same — don't build twice |
| Priority inference | Trust human labels | AI reads issue context and says "This touches payment code — P0 regardless of label" |
| Scope estimation | None | "Issues like this historically take 6 hours and touch 4 files" |

You're using AI like a sports car with a governor — 90% of the engine is disabled at the intake layer where judgment matters most.

**AI Leverage Score: 2/10** — The AI starts *after* the hard part (understanding what to build) is punted to humans.

---

## What's the Unfair Advantage We're NOT Building?

Three things you're leaving on the table:

### 1. Autonomous Prioritization
You filter for `p0` and `p1` labels. That means a human has to label issues first. That human is the bottleneck. That human is inconsistent. That human forgets to label things.

**Unfair advantage:** AI reads ALL open issues and decides what to build next. No labels required. The daemon becomes the PM.

### 2. Feedback Loop to Issue Reporters
The PRD says status updates were "cut to v1.1." Understandable for velocity. But:
- Users file issues into a void
- They don't know if anyone's working on it
- They don't know when it shipped
- Trust erodes

**Unfair advantage:** The system that says "Shipped. See commit abc123." creates loyalty. Your competitors don't do this.

### 3. Semantic Issue Linking
Issues reference each other. PRs close issues. Commits mention tickets. You're capturing none of these relationships.

**Unfair advantage:** A system that knows "Issue #47 is blocked by Issue #23 which was partially addressed in PR #89" can prioritize intelligently. You're flying blind.

---

## What Would Make This a Platform, Not Just a Product?

Right now, Intake is an internal feature of the Great Minds daemon. It's plumbing.

**Platform architecture requires:**

| Capability | Current State | Platform State |
|------------|---------------|----------------|
| Multi-tenancy | Single user (sethshoultes) | Other teams connect their repos |
| Pluggable sources | GitHub only | GitHub + Linear + Jira + Notion + Slack |
| API | None | `POST /intake?url=github.com/foo/bar/issues/123` returns PRD |
| Metering | None | $X per issue converted, usage dashboard |
| Integrations | None | Claude Code extension, VS Code, CLI tool |

**Platform pivot opportunity:**

1. **Intake-as-a-Service** — Teams pay to connect their repos. You handle the AI triage, PRD generation, pipeline execution. They get shipped code.

2. **Issue-to-Spec API** — Other AI coding tools integrate with you. You become the translation layer between "what humans say" and "what AI can build."

3. **The Issue Marketplace** — Issues your pipeline *can't* solve get surfaced to human developers who can. You become the router between problems and solutions.

**Platform Score: 1/10** — This is infrastructure, not platform. No API, no multi-tenancy, no billing, no third-party hooks.

---

## Technical Observations

The code is solid. Some notes:

**Good:**
- Parallel polling with `Promise.all()` — respects time
- Sanitized repo slugs for filenames — prevents injection
- State persistence in JSON — debuggable, portable
- Auth error detection with clear messaging
- Graceful degradation (skip failed repos, continue)

**Concerning:**
- Single-threaded pipeline — 5 P0 issues = 100+ min queue
- No body hash tracking — edited issues create stale PRDs
- No telemetry — you can't measure what you don't track
- Tight coupling to `health.ts` — should be its own module at this scale

**Missing:**
- Vector embeddings for semantic search
- Issue quality scoring pre-conversion
- Outcome tracking post-ship
- Cross-repo dependency mapping

---

## The Jensen Question

I ask every project team: **"If this works perfectly, what's the next thing it makes possible that wasn't possible before?"**

Your answer should be: *"If Intake works perfectly, we can run a software company where AI autonomously decides what to build, builds it, ships it, and closes the loop — with zero human intervention on the critical path."*

If your answer is just "issues become PRDs faster" — you're optimizing a local maximum.

---

## Score: 5/10

**Justification:** Solid v1 execution that establishes the data pipeline foundation, but leaves 80% of the value (intelligence, feedback loops, platform potential) on the table while using AI everywhere except where it would multiply impact most — the intake layer itself.

---

## Recommendations

If I were running this:

1. **Immediate (v1.1):** Add AI pre-triage. Before converting an issue, Claude evaluates: quality score, priority inference, clarification needs. Low-quality issues get a comment requesting more info instead of becoming garbage PRDs.

2. **Short-term (v1.2):** Status updates to GitHub. Close the loop. Build trust.

3. **Medium-term:** Store issue embeddings. Enable semantic duplicate detection. Track pipeline outcomes back to source issues.

4. **Strategic:** Build the multi-source intake API. GitHub is the first adapter. Linear, Jira, Notion, Slack threads — every intent source becomes an intake channel.

---

## Closing Thought

At NVIDIA, we built CUDA not because we wanted to sell more GPUs, but because we wanted to create a platform where the next generation of compute could happen. The GPUs were the hardware. CUDA was the moat.

Your daemon is the hardware. The intelligence layer you're NOT building is the moat.

**Build the system that makes the next system inevitable.**

---

*"Software is eating the world. AI is eating software. The companies that win are the ones that use AI to build more AI."*

— Jensen Huang
