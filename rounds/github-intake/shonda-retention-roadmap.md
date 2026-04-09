# Shonda Retention Roadmap: Intake v1.1
## What Keeps Users Coming Back

**Author:** Shonda Rhimes (Narrative & Retention)
**Date:** April 9, 2026
**Focus:** Transforming infrastructure into an emotionally engaging product

---

## The Core Problem

Intake v1 asks users to invest (file an issue) but delivers no visible payoff. Users operate in a "dopamine desert" — no confirmation, no progress, no closure. This is faith-based user acquisition, not product design.

**The fix:** Create a narrative arc with clear beats that pull users forward.

---

## Retention Philosophy

### Television Retention Model
Shows retain viewers through: **Investment -> Payoff -> Reinvestment**

1. You watch Episode 1 (investment)
2. You see the resolution (payoff)
3. You're hooked for Episode 2 (reinvestment)

### Intake Retention Model (Target)
1. User files issue (investment)
2. User sees "Shipped. See PR #47" (payoff)
3. User files next issue with confidence (reinvestment)

---

## V1.1 Features: The Minimum Viable Story

### Feature 1: Completion Comment (CRITICAL)

**The One Feature That Makes This a Product**

```
When pipeline completes successfully:
  -> Post comment: "Shipped. See PR #{number}"
  -> Close the issue
```

**Implementation:**
```bash
gh issue comment {issue_number} --body "Shipped. See PR #{pr_number}."
gh issue close {issue_number}
```

**Why This Matters:**
- It's the only moment users actually experience
- It's shareable (screenshots, tweets, proof)
- It builds trust through verification
- It closes the narrative loop

**Estimated Effort:** ~100 LOC
**Priority:** NON-NEGOTIABLE

---

### Feature 2: Receipt Comment (HIGH PRIORITY)

**Acknowledge the Investment Immediately**

```
When issue is converted to PRD:
  -> Post comment: "Received. Queued for processing."
```

**Why This Matters:**
- Eliminates "did anyone see this?" anxiety
- Creates first emotional beat in the story
- Low effort, high psychological impact

**Estimated Effort:** ~30 LOC
**Priority:** HIGH

---

### Feature 3: Failure Comment (HIGH PRIORITY)

**Don't Let Users Wonder Why Things Went Silent**

```
When pipeline fails:
  -> Post comment: "Unable to complete. [Reason]. Issue remains open for manual review."
```

**Failure Scenarios to Handle:**
- Tests failed (provide test output summary)
- Build failed (provide error context)
- QA rejected (explain why)
- Timeout (pipeline exceeded time limit)

**Why This Matters:**
- Silence after failure is worse than reported failure
- Users can take action if they know what happened
- Maintains trust even when things break

**Estimated Effort:** ~150 LOC
**Priority:** HIGH

---

## V1.1 Retention Hooks

| Timeframe | Hook | V1.0 | V1.1 |
|-----------|------|------|------|
| **Immediate** | "Issue received" confirmation | MISSING | Receipt comment |
| **Hours** | Progress visibility | MISSING | Future (v1.2) |
| **Same day** | Completion notification | MISSING | Completion comment |
| **On failure** | Failure explanation | MISSING | Failure comment |
| **Next week** | Pattern of delivered value | IMPOSSIBLE | Enabled by above |

---

## The Content Flywheel

### How Retention Creates Growth

```
Issue filed
    |
    v
Receipt comment posted ("Received. Queued.")
    |
    v
Pipeline runs (invisible but acknowledged)
    |
    v
Completion comment posted ("Shipped. See PR #47")
    |
    v
User screenshots the comment
    |
    v
User shares on Twitter/LinkedIn/Discord
    |
    v
Others see proof the system works
    |
    v
Others file issues to test it
    |
    v
More shipped issues
    |
    v
More screenshots
    |
    v
Repeat
```

**The flywheel depends entirely on the comment.** Without it:
- Nothing to screenshot
- Nothing to share
- No proof the system works
- No viral loop

---

## V1.2+ Roadmap (Future Retention Features)

### Progressive Status Updates
```
-> "Issue #47 received. Queued for processing."
-> "Issue #47: PRD generated. Pipeline starting."
-> "Issue #47: Code complete. Tests running..."
-> "Issue #47: Tests passed. Deploying."
-> "Shipped. See PR #47."
```

Each update is a mini-cliffhanger that resolves into the next. Users stay engaged because they're following a story with forward momentum.

**Priority:** MEDIUM (v1.2)
**Estimated Effort:** ~200 LOC

---

### Personal Stats Dashboard (Optional)
```
Your Intake Stats:
- Issues filed: 12
- Auto-shipped: 9
- Average time to ship: 4.2 hours
- Longest streak: 5 issues shipped same day
```

**Priority:** LOW (v1.3+)
**Why:** Gamification drives return visits, but core loop must work first.

---

### Weekly Digest Email
```
This week in your repos:
- 7 issues auto-shipped
- 2 issues need clarification
- 1 issue failed (tests)
- Highlight: Issue #89 shipped in 47 minutes
```

**Priority:** LOW (v1.3+)
**Why:** Re-engagement for users who don't check daily.

---

## Emotional Journey Map

### Current State (V1.0)
```
File issue -> ??? -> ??? -> ??? -> Maybe check manually someday?
Emotion:    Hope   Uncertainty   Anxiety   Abandonment
```

### Target State (V1.1)
```
File issue -> "Received" -> [Pipeline runs] -> "Shipped. See PR #47"
Emotion:    Hope       Relief            Anticipation    Satisfaction
```

### Ideal State (V1.2+)
```
File issue -> "Received" -> "PRD done" -> "Tests pass" -> "Shipped!"
Emotion:    Hope       Relief      Progress     Excitement   Triumph
```

---

## Metrics to Track

### Retention Metrics
| Metric | Definition | Target |
|--------|------------|--------|
| **Return rate** | % of users who file >1 issue | >60% |
| **Time to second issue** | Days between first and second issue | <7 days |
| **Completion visibility** | % of shipped issues that get user acknowledgment | 100% |
| **Share rate** | % of completion comments that get screenshotted/shared | >5% |

### Trust Metrics
| Metric | Definition | Target |
|--------|------------|--------|
| **Issue abandonment** | Issues filed but never checked by user | <20% |
| **Manual override** | Issues where user intervenes before pipeline completes | <10% |
| **Repeat failure tolerance** | Users who continue after a failed pipeline | >80% |

---

## Implementation Priority Matrix

| Feature | Effort | Impact | Priority |
|---------|--------|--------|----------|
| Completion comment | ~100 LOC | Critical | **V1.1 MUST-HAVE** |
| Receipt comment | ~30 LOC | High | **V1.1 SHOULD-HAVE** |
| Failure comment | ~150 LOC | High | **V1.1 SHOULD-HAVE** |
| Progress updates | ~200 LOC | Medium | V1.2 |
| Personal stats | ~300 LOC | Low | V1.3+ |
| Weekly digest | ~400 LOC | Low | V1.3+ |

---

## The Showrunner's Summary

### What Keeps Users Coming Back

1. **Acknowledgment** — "We see you. Your issue matters."
2. **Progress** — "Things are happening. You're not forgotten."
3. **Closure** — "Done. Here's the proof."
4. **Trust** — "We do what we say. Every time."

### V1.1 Minimum Viable Retention

Three features. ~280 lines of code. One complete story arc:

```
Receipt comment + Completion comment + Failure comment
= A product that tells a story from start to finish
```

Without these, Intake is infrastructure.
With these, Intake is a product that earns loyalty.

---

## Final Words

> "Everybody wants a happy ending, right? But it doesn't always roll that way."
> — Olivia Pope, Scandal

The good news: **we control this ending.**

V1.1 isn't about adding features. It's about completing the story we started telling. The user filed an issue. They're invested. They're waiting.

Don't leave them on a cliffhanger with no next episode.

**Ship the comment. Close the loop. Earn the return.**

---

*Retention Roadmap by Shonda Rhimes*
*Board Member, Great Minds Agency (Narrative & Retention)*
