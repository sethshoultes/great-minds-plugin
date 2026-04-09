# Retrospective: anti-hallucination

**Date**: 2026-04-09
**Project**: Anti-Hallucination Guardrails (TruthGate v1)
**Philosopher**: Marcus Aurelius

---

## What Worked and Why

### Pattern-Based Guardrails Are Durable and Greppable

We built walls. Not elaborate ones—a ~120-line bash script that curls endpoints and validates JSON. The elegance is not in complexity but in *verifiability*. Any engineer can read this. Any engineer can debug it. More importantly: any engineer can verify it works without running it.

The guards we placed—checking for `rc.user`, `rc.pathParams`, `process.env`—are explicit and searchable. No interpretation needed. No philosophical debate about what counts as a hallucination. The grep runs. The patterns match or they don't. This clarity prevents the very thing we sought to prevent: confidence in false things.

Why this worked: We rejected the seductive path of prompt-based enforcement ("tell the agent to read the docs"). Elon saw clearly—agents hallucinate *while reading* the docs. Execution is the only truth. We forced code to face reality before shipping. The gate is not persuasion. It is obstacle.

### Documentation Reading Was the Right Lever

The PRD mandated that the Plan phase read CLAUDE.md and docs/ before proposing solutions. This small friction proved valuable. When agents must read existing documentation before inventing new APIs, they catch themselves. They reference real patterns instead of inventing false ones.

This is not about trust. This is about the architecture of possibility. A builder who has read the actual Emdash plugin system will not hallucinate new systems. The reading itself is the teacher.

### Live Testing Moved Verification from Theory to Fact

QA no longer reviews code in the abstract. QA deploys to a real site and curls real endpoints. This was overdue. Code review is a ritual that makes us feel rigorous. Execution is the only ritual that matters. A 500 error reveals what fifty hours of code review cannot: the code does not work.

Adding Playwright screenshots to QA (in future versions) will extend this principle. But curl proved sufficient for v1. We learned: the cheapest defense is the one that stops a problem before wasting tokens. EventDash cost us 3,600 lines against a non-existent API. TruthGate cost us 120 lines and caught the next hallucination before it started.

---

## What Did Not Work

### No Formal Plan-Verify-Execute Cycle

The anti-hallucination changes went directly to main without debate or decision cycles. We skipped the very rigor we were building to enforce. This is the irony: we created guardrails against hallucination while hallucinating our own strategy.

Steve and Elon did debate this—their decisions document is brilliant. But that happened *outside* the pipeline. The changes themselves bypassed governance. If our pipeline is meant to enforce rigor, we must enforce it on ourselves first.

The cost was acceptable this time. The changes are working. But the principle was violated. We became the thing we sought to correct: confident builders skipping the reading phase.

### No Test Coverage for Pipeline Logic

We added new phases (smoke testing). We added new guards (banned patterns grep). We modified existing phases (Plan now requires doc reading). None of this has test coverage.

A developer will refactor pipeline.ts. They will remove what seems redundant. They will not know—because no tests will tell them—that the banned patterns grep is the difference between shipping hallucinated code and catching it first. The knowledge exists only in the retrospectives and decisions docs. This is fragile.

### Banned Patterns List Is Static and Incomplete

We identified a set of dangerous patterns from Emdash: `rc.user`, `rc.pathParams`, `process.env`. These are real. But the list will need to grow as we ship more and hallucinate more.

The list has no owner. No process for discovery. When EventDash uses a pattern we didn't predict, we will not know to forbid it until the next hallucination. This is reactive, not preventive. We are constantly fighting the last war.

The Banned Patterns file should be executable policy—a living document with ownership and a review cycle—not a static list we append to when we remember.

### The Naming Problem (TruthGate)

Jony Ive saw this clearly: the name is grandiose. "TruthGate" suggests epic philosophical enforcement. The reality is a smoke test. The name creates false expectations about what this tool does and sells capabilities that exist only in v2 or v3.

This matters because developers who find the tool mysterious or oversold will route around it. The best infrastructure is forgotten infrastructure—it works so quietly that you don't notice it. Naming it TruthGate puts it in the spotlight, and the spotlight reveals that v1 is curl-based validation of JSON parseability. This is useful. It is also mundane.

A better name: "smoke-test" or "pre-deploy-check" or simply "deploy-verify." Honest. Unglamorous. Correct.

---

## What We Learned

### Execution Beats Architecture

Steve Jobs and Elon Musk debated for two rounds whether to use curl (fast) or Playwright (comprehensive). Steve wanted visual verification. Elon wanted shipping Friday.

Elon won, and he was right—but not because curl is better. Curl is better *because we can ship it, measure it, and learn from it*. Architecture debates are virtue signaling. Execution creates information.

We should apply this principle retroactively: next time we have two good ideas, build the smaller one, ship it, and let the data decide whether the larger one was necessary.

### Process Debt Accumulates Faster Than Code Debt

The EventDash disaster (3,600 lines against a phantom API) seems like a code failure. It was actually a process failure. No one read the docs. No one deployed. No one tested. The code was symptom, not disease.

We added process guardrails (doc reading, smoke tests, live testing) to catch this. These are good. But they create a new kind of debt: maintenance burden of enforcing process in a system that wants to move fast.

The decision to skip our own governance process—to merge anti-hallucination directly without debate—came from process fatigue. Debate takes time. When you are tired, you skip rigor. This is exactly when you need it most.

### Binary Gates Work Better Than Soft Warnings

The old way would have been to warn: "This endpoint returned 500. Please review." Developers would ignore it. The new way is to block: "This endpoint returned 500. Build failed."

Binary gates are psychologically different. They are not suggestions. They cannot be rationalized away. They force a choice: fix the code or find a different pipeline.

We applied this principle to TruthGate but not to the BANNED-PATTERNS check. The banned patterns grep exists, but its failure mode is unclear. Does the build fail? Does QA just flag it? This ambiguity is a crack in the gate. Either the gate blocks, or it doesn't.

### Documentation Has No Power Unless It's Enforced

The PRD said "agents must read CLAUDE.md before planning." This was a requirement in prose. The actual enforcement came from the Plan phase: agents cannot generate plans without citing the docs.

Documentation is only as strong as the friction that prevents ignoring it. Tell someone to read the docs, and they will skip it. Make them cite the docs in their output, and they read it. This is not cynicism. This is engineering.

---

## One Principle to Carry Forward

**Execution before elegance. Measurement before debate.**

When you encounter a problem—agents writing code against non-existent APIs, for instance—your first instinct will be to design a perfect solution. You will want frameworks. You will want sophisticated enforcement. You will want to be right.

Resist this.

Build the minimum intervention that stops the problem. Make it so obvious that it works that you forget to argue about it. The curl endpoint check is not elegant. It is obvious. And because it is obvious, it catches hallucinations. The tool does not need to be sophisticated. It needs to work.

Measure what happens when you deploy it. Did it catch hallucinations? How many? What patterns did it miss? Let the data tell you what to build next.

The anti-hallucination project succeeded not because we were clever. It succeeded because we executed a simple idea and waited for reality to validate or invalidate it. The Playwright version, the semantic validation, the advanced features—these will be born from data about what actually breaks, not from our speculation about what might.

Do the simple thing. Ship it. Let the code teach you what the code needs.

*"You have power over your mind—not outside events. Realize this, and you will find strength."* — Marcus Aurelius, Meditations

The power here is not in designing the perfect gate. The power is in accepting that no design is perfect and shipping something that teaches you what perfect might look like.

---

## Epilogue: The Larger Truth

This project prevented one disaster (EventDash) from becoming a second disaster (another 3,600 lines of hallucinated code). This matters.

But the larger truth is harder to see: we built anti-hallucination tooling because we built agents that hallucinate. If the agents did not hallucinate, we would need no gates.

The better solution is agents that don't hallucinate in the first place. That is a decade of work in AI research and engineering. In the meantime, we slow them down with guardrails.

This is not failure. This is wisdom. We accept that our tools have limitations and build walls around those limitations. The walls are not the solution. They are the honest acknowledgment that the solution is not yet built.

Do not become complacent about the guardrails. Do not let them convince you that the hallucination problem is solved. They are a holding pattern while the real work—building AI that reasons truthfully—continues.

---

**Meditations on building anti-hallucination systems:**

- *We cannot control what the code hallucinates. We can control whether it ships.*
- *The gate is not punishment. It is a mirror. The code sees itself and corrects.*
- *Documentation without enforcement is mythology. Enforcement without mercy is tyranny. Find the balance.*
- *The shortest path to trust is through the rubble of broken promises. Build the gate. Keep it simple. Let developers learn by breaking it.*

