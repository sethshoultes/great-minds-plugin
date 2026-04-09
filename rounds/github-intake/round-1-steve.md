# Steve Jobs — Chief Design & Brand Officer

## Product Naming

**Intake.**

One word. It's what lungs do. It's what engines do. It's what this system does — it *breathes in* issues and *exhales* shipped code. Not "GitHub Issue Converter." Not "Auto-PRD Generator." **Intake.** When someone asks "How do issues become features?" the answer is: "Intake handles it."

## Design Philosophy

This is the invisible assistant. The best features are the ones users forget exist because they *just work*. Nobody should configure this. Nobody should babysit it. You file an issue, you walk away, and three days later it's shipped with a comment linking to the PR.

The current system is a Rube Goldberg machine — polling here, heartbeats there, manual PRD creation somewhere else. That's insane. **One pipeline. One truth. Zero friction.** The issue *is* the PRD. The PRD *is* the intent. The shipped code *is* the closure.

## User Experience: The First 30 Seconds

There is no "first 30 seconds." That's the point.

A developer files a GitHub issue at 2 PM. They label it `p1`. They go home. They wake up. There's a comment on their issue: "Shipped in commit abc123." The issue is closed. That's the experience. **The absence of experience is the experience.** Like electricity in the walls — you don't think about it until it's gone.

## Brand Voice

Quiet confidence. This system doesn't announce itself. It doesn't send Slack notifications saying "I found 3 new issues!" It doesn't beg for attention.

When it speaks — in issue comments — it's terse and factual:
- *"Shipped. See PR #47."*
- *"Failed: tests timeout in auth module. Issue remains open."*

No emojis. No "Hey team!" No corporate warmth. **Just signal.**

## What to Say NO To

**NO** to customizable PRD templates. One format. It works.

**NO** to Slack/Discord/email notifications. The issue comment *is* the notification. GitHub is the source of truth — stop fragmenting attention.

**NO** to a dashboard. If you need to "monitor" this system, you've already failed. Build it so it doesn't need monitoring.

**NO** to "partial conversions" or "draft PRDs." An issue either qualifies or it doesn't. Binary. No limbo states.

**NO** to manual intervention buttons. "Retry failed issue" is a crutch for bad architecture. Fix the root cause instead.

## The Emotional Hook

Developers will love this because it **respects their time**. Filing an issue already feels like work. Then someone asks you to write a PRD. Then someone asks you to follow up. Then you chase down if it shipped.

Intake says: *Your job ended when you filed the issue.* That's it. Go build something else. We'll handle the bureaucracy.

The emotional hook isn't excitement — it's *relief*. It's the feeling of putting something down and knowing it won't be dropped. It's trust. And trust, once earned, creates loyalty that no feature list ever could.

---

*"Simplicity is the ultimate sophistication."* This system should be so simple that explaining it takes longer than using it. If you can't describe Intake in one breath, you've overbuilt it.
