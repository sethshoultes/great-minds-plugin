# Board Review: Intake (github-intake)
## Shonda Rhimes — Narrative & Retention

**Review Date:** April 9, 2026
**Status:** Re-evaluation post-merge

---

## Executive Summary

I reviewed Intake when it was in feature branch. Now it's merged to main, and my previous review stands: **the story arc is broken because v1 shipped without the GitHub comment**.

The product still delivers Act 1 and Act 2 but cuts to black before Act 3. The user files an issue, Intake converts it to a PRD, the pipeline processes it — and then silence. No closure. No "Shipped. See PR #47." The emotional payoff that makes this product worth using doesn't exist in the shipped code.

---

## Story Arc Analysis

### Act 1: The Setup (Strong)
The pain point is real and visceral. The demo script captures it perfectly:

> "Nine days. That's the average. Nine days from 'someone should fix this' to someone actually fixing it."

Every developer knows this death spiral. Issues filed at 2 AM, buried by morning standups, lost to backlog purgatory. The setup creates genuine emotional resonance.

### Act 2: The Turn (Functional)
The mechanics work. `pollGitHubIssuesWithLabels()` fetches p0/p1 issues across repos. `convertIssueToPRD()` transforms issue → structured markdown. `processIntake()` orchestrates the pipeline. State management prevents duplicates via `.github-intake-state.json`.

The code is clean. Promise.all() for parallel polling. Proper error handling for auth failures. Sanitized repo slugs for safe filenames. This is competent engineering.

But competent engineering isn't a story. It's infrastructure.

### Act 3: The Resolution (MISSING)

From `health.ts` lines 202-230 — the entire PRD conversion:

```typescript
writeFileSync(filepath, prdContent);
log(`INTAKE: Created PRD ${filename}`);
return filename;
```

That's it. Write file. Log. Done.

No GitHub comment. No "Shipped. See PR #47." No closure.

The user experience:
1. File issue → hope
2. ... silence ...
3. ... more silence ...
4. Maybe manually check the repo weeks later?
5. ???

**This is not a story. This is a prayer.**

---

## Retention Hooks: The Void

| Timeframe | What Brings Them Back | Current State |
|-----------|----------------------|---------------|
| **Same day** | Confirmation issue was seen | MISSING |
| **Tomorrow** | Update that work is in progress | MISSING |
| **Next week** | Notification it shipped | MISSING |
| **Next month** | Pattern of delivered value | IMPOSSIBLE without above |

### The Dopamine Desert

Television retention works on a simple principle: investment → payoff → reinvestment. You watch Episode 1, you see the resolution, you're hooked for Episode 2.

Intake v1 asks for investment (file an issue) but delivers no visible payoff. The pipeline runs invisibly. The code might ship invisibly. The issue sits there, open, mocking you.

Users don't return to products that feel like voids. They return to products that acknowledge them, reward them, close loops.

**Current retention model:** Faith-based user acquisition. "Trust us, it works." That's not a retention hook — that's a religion.

---

## Content Flywheel: Non-Existent

### What Should Exist

Every shipped issue is a potential story:
- "Filed at 2:47 PM, shipped at 9:15 PM"
- "23 issues auto-shipped this month, zero human intervention"
- "From GitHub issue to production in 4 hours"

These are tweets. Case studies. Social proof that compounds.

### What Actually Exists

Nothing user-facing. The state file tracks converted issues, but users can't see it. Logs capture pipeline activity, but users don't read daemon logs. The system generates zero shareable artifacts.

### The Missed Flywheel

```
Issue filed
    → PRD created (invisible)
    → Code shipped (invisible)
    → Comment posted (MISSING)
    → User screenshots "Shipped. See PR #47"
    → User shares on Twitter/LinkedIn
    → Others file issues to test it
    → More shipped issues
    → More screenshots
    → Repeat
```

The entire flywheel depends on exactly one thing: the comment. Without it, there's nothing to screenshot, nothing to share, nothing to prove the system works.

---

## Emotional Cliffhangers: Anxiety, Not Anticipation

### Good Cliffhangers (What Great Shows Do)

Grey's Anatomy ends episodes with questions that pull you forward:
- "Will the surgery succeed?"
- "Will they reconcile?"
- "What's the test result?"

You can't stop watching because you *need* to know.

### Intake's Cliffhangers (What v1 Actually Delivers)

- "Did my issue get picked up?" (No way to know)
- "Is it being worked on?" (Pipeline is invisible)
- "Did it ship?" (No notification)
- "Should I check the repo manually?" (Friction)
- "Is this thing even on?" (Trust erosion)

These aren't cliffhangers — they're abandonment anxiety. Good cliffhangers make you eager for the next episode. These make you wonder if the show was cancelled.

### What Progressive Disclosure Would Look Like

```
→ "Issue #47 received. Queued for processing."
→ "Issue #47: PRD generated. Pipeline starting."
→ "Issue #47: Tests running..."
→ "Issue #47: Tests passed. Deploying."
→ "Shipped. See PR #47."
```

Each update is a mini-cliffhanger that resolves into the next. The user stays engaged because they're following a story with forward momentum.

V1 has none of this. Not even the final beat.

---

## The Essence Contradiction

The essence document nails the aspiration:

> **The feeling it should evoke:** Relief. The weight of follow-up lifted.
>
> **The one thing that must be perfect:** Trust. If one issue gets dropped, the magic dies.

But v1 contradicts both:

- **Relief?** Users feel anxiety, not relief. They don't know if their issue shipped.
- **Trust?** Trust requires verification. "Invisible until it ships" works for electricity (flip switch → light on). It fails for async processes with no feedback.

The creative direction says "Invisible until it ships." But v1 is "Invisible even after it ships." That's not minimalism — that's negligence.

---

## What I'd Green-light vs. Send Back

### GREEN-LIGHT (Solid Foundation)
- **The name "Intake"** — single word, verb-like, exactly right
- **The demo script** — emotionally perfect, proper pacing, hits the pain point
- **The essence** — "relief" as core emotion is the right target
- **Technical execution** — parallel polling, state management, clean code
- **Minimalist philosophy** — no dashboards, no email spam, focused
- **Label filtering** — p0/p1 only, no label theater

### SEND BACK (Incomplete Story)
- **No GitHub comment** — the entire product experience is missing
- **No status visibility** — users operate blind
- **No proof of value** — nothing to screenshot, share, or verify
- **Shipped incomplete** — feature was merged without the critical path

---

## The Showrunner's Verdict

Let me be direct: **Intake v1 shipped the prologue and called it a pilot.**

The demo script promises a specific moment:

> **[SCREEN: Close-up on the comment. Three words: "Shipped. See PR #47." The issue status flips from "Open" to "Closed.]**

That moment doesn't exist in the shipped code. The demo script is aspirational fiction.

Every time we demo this product, we're showing what it *could* do, not what it *does*. That's not a product launch — that's a spec sheet.

### The Comment Is Not Optional

I've said it before, I'll say it again: **The comment is not a feature. The comment is the product.**

Everything else — polling, filtering, PRD generation, state tracking — is plumbing. The user never experiences any of it. The only moment the user touches is that five-word comment on their issue.

That's the entire show. That's where trust is built or broken. And we shipped without it.

---

## Score: 6/10

**Justification:** Exceptional narrative architecture and solid technical execution undercut by shipping the setup without the payoff — a Grey's pilot that fades to black before the surgery concludes.

---

## Conditions for Score Improvement

| Target | Required | Estimated Effort |
|--------|----------|------------------|
| **7/10** | GitHub comment on completion | ~100 LOC |
| **8/10** | Above + progress comments during pipeline | ~200 LOC |
| **9/10** | Above + failure comments with context | ~150 LOC |
| **10/10** | Above + usage telemetry for flywheel analytics | ~300 LOC |

---

## Final Recommendation

**Do not demo externally.** Do not market this version. Do not position it as shipped.

V1 is an internal beta at best. It proves the concept works. It does not deliver the user experience promised.

Priority one: Add the GitHub comment. One sentence: "Shipped. See PR #{number}." Post it via `gh issue comment`. Close the issue via `gh issue close`.

That's not v1.1. That's v1 complete.

Until then, Intake is infrastructure wearing product clothing. The bones are there. The soul is missing.

---

*"Everybody wants a happy ending, right? But it doesn't always roll that way."*
— Olivia Pope, Scandal

*The good news: you control this ending. Ship the comment.*

---

**Reviewed by:** Shonda Rhimes
**Role:** Board Member, Great Minds Agency (Narrative & Retention)
**Lens:** Does the product tell a story from signup to "aha moment"?
