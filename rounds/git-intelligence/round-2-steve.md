# Steve Jobs — Round 2

## Where Elon Is Wrong

**He's optimizing for engineering purity, not product impact.**

Elon says cut the Risk Summary because "if it's an LLM call, you just added latency and cost." This is classic engineer thinking: measure what's easy to measure, ignore what matters.

The Risk Summary isn't about efficiency. It's about *comprehension*. An agent reading "High Risk: 3 active hotspots, recent revert in auth module, volatile core files" grasps the situation instantly. An agent parsing raw counts does arithmetic. We're not building a calculator. We're building *judgment*.

The latency argument is absurd. We're talking about 200ms for an LLM summary versus 2+ seconds of git commands. And this runs *once* before a task that might take 10 minutes. You don't skip the rearview mirror because it adds 0.1 seconds to your drive.

**On Agent Activity (shortlog):** Elon calls it "useless for the stated goal." Wrong. Knowing that one person made all recent changes tells the agent something crucial: *there's context you don't have*. That person knows why things are the way they are. The agent should be more conservative, not less. Bus factor isn't just for humans — it's a signal of concentrated, undocumented knowledge.

## Defending Design Quality

Elon will say my "NO to configuration" stance is arrogant. He'll want timeout options, threshold settings, output format toggles.

Here's why he's wrong: **every option is a decision the user has to make.** And every decision is cognitive load. And cognitive load is the enemy of adoption.

When you give people choices, most of them choose *nothing* — they never enable the feature. The ones who do choose waste time deciding. And then they blame you when their custom settings produce bad results.

Defaults aren't arrogance. They're *leadership*. We're saying: "We thought about this. Here's the right answer." If we're wrong, we fix the default. We don't abdicate responsibility to a configuration file.

## Where Elon Is Right

I'll concede three things:

1. **This is infrastructure, not product.** He's correct that nobody demos a risk report. The value is invisible. We shouldn't pretend otherwise. GitSense earns trust by preventing failures, not by looking impressive.

2. **The timeout for large repos is smart.** I was wrong to dismiss all operational concerns. A monorepo with 10M commits shouldn't block the pipeline. Fail gracefully, continue working. That's good design.

3. **One function, ~150 lines.** He's right about the architecture. No abstractions. No service layer. Inline it, run it, move on. Premature extraction is a form of procrastination.

## My Non-Negotiables

**1. The Risk Summary stays.**
Not because it's technically necessary — because it's the *product*. Raw data is not insight. The summary is the opinion. Ship the opinion.

**2. Zero configuration.**
No thresholds. No toggles. No settings file. The first version has one mode: *on*. If that's wrong, we learn and fix it. We don't ask users to debug our product.

**3. The name is GitSense.**
One word. Lowercase 'g' if we're being precious about it. But one word, evocative, memorable. Not "Git Intelligence Report." Not "git-diagnostic-output." Names matter because they shape expectations. This tool gives your agent a sixth sense about history. The name should say that.

---

*The goal isn't to build the simplest system. It's to build the simplest system that creates genuine value. Elon's right about avoiding complexity — but he's wrong about where the value lives.*
