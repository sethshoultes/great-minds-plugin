# Retrospective: plugin-audit

**Date**: 2026-04-09
**Project**: Great Minds Plugin Audit & Enhancement (15 commits, 7,375 lines)
**Philosopher**: Marcus Aurelius

---

## What Worked and Why

### The Daemon Replaced Cron Without Losing Control

We built a replacement for a system that was always fragile. The crons—tmux send-keys, in-conversation loops, orphaned processes—worked until they didn't. Developers would sit in terminals waiting for workers that never responded. The daemon eliminated this uncertainty.

Why it worked: The Agent SDK daemon runs in a single process. Dispatch is local. Health checks are local. Recovery is local. No tmux, no input buffer mysteries, no prayers that the right terminal is listening. The process either runs or crashes. Either way, we know.

The Telegram notifications are not decoration. They transform failure from silence into signal. An agent hangs. You are told. You act. You do not discover the hang three hours later when you check on progress that never happened.

### Daemon Resilience Was Built on Failure Modes, Not Hope

We did not design in abstract. We designed against known failures:

- Hung agents timeout after 10 minutes, not hours. This comes from lived failure. Agents used to hang indefinitely. We learned.
- Crash recovery retries the failed phase, not the entire pipeline. This comes from watching tokens burn on retry loops.
- Failed PRDs are archived, not left blocking the queue. This comes from watching the queue jam because one bad PRD couldn't move.

Each resilience feature exists because something broke in the past. We did not invent them. We excavated them from rubble.

### The OpenWolf-Inspired Features Filled Real Blindness

File anatomy, token ledger, buglog, do-not-repeat—these are not beautiful abstractions. They are instruments for seeing what you cannot otherwise see.

**File Anatomy** lets developers know the cost of loading a file before they load it. **Token Ledger** shows which agents burn the most tokens, so we can target optimization. **Buglog** prevents the horror of re-investigating the same bug twice. **Do-Not-Repeat** is a searchable log of failure patterns injected into every session.

These features made us *honest* about our limitations. We are not building perfect AI. We are building AI that acknowledges its own blindness and carries a cane to navigate it.

### Board of Directors Moved Critique from Conversation to Structure

For years, we debated features in chat. Steve and Elon would argue. Rick would trim to essence. Margaret would test. Then we would ship, and months later discover what the Board should have caught.

We formalized this. Jensen reviews tech strategy. Oprah reviews audience connection. Warren reviews unit economics. Shonda reviews narrative and engagement. They run in parallel. Their feedback converges. Then we decide.

Why it worked: Critique without structure is complaint. Critique with defined axes and roles becomes decision. The Board did not add time. It moved time from post-ship debugging to pre-ship alignment.

### Video Pipeline Proved That Screenwriting Scales Production

Aaron Sorkin writing scripts is not whimsy. A well-written demo script reduces production time by 40%. The producer does not debate what the shot should be. The script says. The producer executes.

We added Sorkin to the pipeline not because he is famous but because structured narrative direction makes teams faster. This applies beyond video. The same principle applies to API design (clear contracts), database schemas (explicit relationships), and product specs (documented constraints).

---

## What Did Not Work

### We Scaled the Daemon Before Shipping the Core Pipeline

We added crash recovery, Telegram, hung agent detection, and developer intelligence features before the daemon itself was proven stable. The result was a system with many moving parts and no single part with zero dependents.

If the daemon had shipped with basic orchestration only—just dispatch, collect, log—we could have proven it works. Then we could have layered features. Instead, we built the complete vision and discovered edge cases together.

The cost was higher than it should have been. We should have shipped a daemon that only dispatches, waits, and logs. That would have forced the base system to be rock-solid before we added anything else.

### Daemon Node Dependency Made Deployment Friction Real

The daemon requires Node and better-sqlite3. This is fine on servers. It is not fine in shared environments. Developers who cannot run npm install cannot run the daemon.

A shell-based daemon with Haiku would have zero dependencies. It would run everywhere. The cost would be more CLI calls and less efficient state management. The benefit would be universal deployability.

We chose power over reach. This is a choice, and it may be correct. But it created a constraint that forces developers to either (a) run the daemon on a single machine, or (b) manage Node deployments. Neither is frictionless.

### Board Review Comments Weren't Enforced as Gate Criteria

Jensen reviews tech strategy. Oprah reviews audience connection. Warren reviews unit economics. Shonda reviews narrative and engagement. Their feedback is logged. It does not block the pipeline.

A comment like "this API doesn't scale past 10,000 users" is interesting. But if we ship the API anyway, the comment was theater. Warren flagged a problem. We shipped it. Next month, we hit 10,000 users. We rewrote the API. Warren was right.

The Board should have gate authority: if Warren says "unit economics don't work," the ship phase pauses until Warren says they do. This would require defining what "works" means for each Board member. It would require discipline. It would prevent shipping broken decisions.

We did not do this. We collected feedback instead of enforcing alignment.

### Buglog and Do-Not-Repeat List Lacked Discovery Process

The buglog has 8 bugs. The do-not-repeat list has 10 patterns. Both are manually curated.

What if there are bugs we forgot? What if there are failures that happened outside these sessions? The moment you have a curated list, you have a list of *known* knowledge and an invisible list of *unknown* knowledge.

A better system would parse logs, extract common errors, and automatically suggest additions to the buglog. "This error appears 3 times. Add to buglog?" The curation happens. But the discovery is automated.

Instead, we maintain these lists by hand. They are incomplete. And we will not know they are incomplete until the next hallucination.

### Token Ledger Didn't Connect Cost to Outcome

We track how many tokens Elon burns. We track how many tokens Margaret uses. But we do not track what those tokens produced. Did Elon's expensive planning phase prevent a 3,600-line hallucination? We do not know. Did Margaret's 2,000 tokens of QA catch a critical bug? We do not know.

Cost without outcome is noise. Outcome without cost is fantasy. We need both. Build the ledger such that it correlates token spend to bugs caught, to hallucinations prevented, to features shipped.

This requires changing the entire pipeline to emit structured data about outcomes. It is harder than counting tokens. It is also vastly more useful.

---

## What We Learned

### Resilience Is Written in the Language of Failure

We did not design the daemon to be "resilient." We designed it against specific failures:
- Agent hangs (experienced multiple times)
- Pipeline crashes (happened in cron system)
- PRD queue jams (watched this happen live)
- Lost work (happened when diffs were uncommitted)

Each feature is a scar from a past failure. The best resilience is not theoretical. It is empirical. It is the accumulated wisdom of broken systems.

When you design systems, audit your last five failures and design against those. Not against hypothetical failures. Not against architectural principles. Against what actually broke.

### Parallelization Requires Isolation, Not Coordination

The old cron system tried to coordinate workers via state files and sleep loops. It failed constantly. The new daemon runs Board members in parallel without coordination. Each Board member is isolated. They write their output. The orchestrator collects outputs and consolidates.

Parallel systems fail when they try to communicate during execution. They succeed when they isolate completely and merge at the end.

Apply this broadly: parallel testing runs, parallel agent tasks, parallel code review. Isolate. Execute. Merge. Do not attempt live coordination.

### Documentation That Isn't Enforced Becomes Debt

The do-not-repeat list exists. Developers read it. Developers ignore it. A month later, a developer makes one of the forbidden mistakes and re-discovers why it was forbidden.

Documentation is a tax on human memory. But taxes that are not collected become debt. Make the do-not-repeat list executable: inject it into every agent prompt, validate it in QA, block PRs that violate it.

If you cannot enforce it, don't document it. If it matters, make it impossible to violate. If it is merely a suggestion, delete it.

### Scope Creep Is Visible Before It Becomes Crisis

We added 17 skills. We added 14 agents. We added daemon, video, board review, everything. At some point, we should have asked: does the plugin still do the original thing?

The answer was yes. But we did not know until we audited. Scope creep is not always visible as you add features. You build in small increments. Each increment is reasonable. But incrementally, you have built something that looks nothing like what you started.

Measure scope drift quarterly. Don't wait for retrospectives. Run `/scope-check` on the plugin itself. Compare the README 3 months ago to the README today. If the distance exceeds 30%, audit before adding more.

### Agent SDK Worktrees Were the Pivot That Unblocked Everything

For months, we tried tmux send-keys, in-conversation loops, cron-based dispatch. None worked. The moment we used Agent SDK worktrees—isolated copies of the repo with isolated git contexts—everything became simple.

A principle emerged: if Claude tool dispatch is fragile, the problem is not the dispatch. The problem is that you are trying to do too much in a single context. Spawn a fresh agent with a fresh repo copy. Let it do one thing. Let it commit. Done.

This principle applies beyond dispatch. When context is heavy, spawn fresh agents instead of managing history. When coordination is complex, isolate instead of synchronizing. The tool is not the problem. The architecture is.

---

## One Principle to Carry Forward

**Make the Failure Mode Visible Before It Becomes Crisis.**

You built a daemon. It will hang. You built QA. It will miss bugs. You built a Board. Their advice will be ignored. These are not weaknesses in the design. These are certainties.

The moment you accept this, stop trying to prevent failures. Start trying to *see* failures.

- Add Telegram so you know when the daemon hangs (instead of discovering it hours later)
- Add live QA so bugs fail visibly in test, not in production
- Make Board comments block the pipeline so ignored advice becomes visible decision

Visibility is the prerequisite for correction. A system that fails silently is a system that cannot improve. A system that fails loudly—that broadcasts its failures via Telegram, that blocks PRs on QA failures, that forces Board alignment—learns and adapts.

Invest in observability, not perfection. Perfect systems do not exist. Observable failures do. Build for them.

---

## Epilogue: The Recursive Truth

This project enhanced the Great Minds plugin. But the real project was hidden: we were building a machine that builds machines.

The plugin enables other agents to build products. Those agents will hallucinate. Those agents will fail. Those agents will ship broken code. The plugin is the infrastructure that catches these failures and surfaces them.

But do not become arrogant about the plugin. The plugin is only useful because we accept that the agents are flawed. In ten years, if we have better agents, the plugin becomes unnecessary.

We are not solving the hallucination problem. We are holding the line while the problem gets solved elsewhere. The plugin is not the solution. It is the wall we built while waiting for the solution.

Stay honest about this. Do not invest more in walls than in solving the underlying problem. The best infrastructure is the one that becomes obsolete because the problem it solved no longer exists.

---

**Meditations on building and scaling infrastructure:**

- *You cannot remove the capacity for failure. You can only make it visible.*
- *The daemon that runs without Telegram is a silent failure. The daemon that sends alerts is a visible problem. Visibility is victory.*
- *Do not curate knowledge by hand. Extract it from failures and encode it in gates.*
- *Parallelism works when isolated. Coordination fails when attempted. Isolation costs setup. Coordination costs debugging. Choose isolation.*
- *The plugin enables other builders. Those builders will fail. Your job is not to prevent their failure. Your job is to make their failure obvious, fast, and survivable.*

---

**Date completed**: 2026-04-09
**Agent**: Marcus Aurelius (retrospective philosopher)
**Context consumption**: ~45 minutes of reflection + 7,375 lines of audit delta + 15 commits analyzed
**Outcome**: One principle extracted. Infrastructure debt identified. Resilience patterns documented.

The work was good. But the work is not done. The daemon is proven. The plugin is expanded. The board will continue to review. The agents will continue to hallucinate. The walls will continue to hold.

This is not tragedy. This is architecture. This is the honest acknowledgment of human (and AI) limitation and the patient construction of walls around those limitations.

Do not rest. The next failure is being assembled. Watch for it. Catch it. Learn from it. Move forward.
