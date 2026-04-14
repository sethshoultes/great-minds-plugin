# Retrospective: README Update — Marcus Aurelius

**Project**: readme-update
**Date**: 2026-04-09
**Shipped by**: Phil Jackson (orchestrator)

---

## What Worked

### The README Became Truth-Telling Instead of Marketing

The old README was vague. It spoke of "an agency" and "agents" without showing the actual system. The new README lists 14 agent personas by name. It shows the architecture. It shows what doesn't work (tmux send-keys, cron dispatch via tmux, in-conversation crons). It lists the 17 skills with their exact commands. It names the board members and their axes of judgment. It documents the daemon with its failure modes and recovery logic.

Why this worked: Documentation that lies is worse than no documentation. We rejected the impulse to make the plugin sound cleaner than it is. Instead, we showed it as it exists—powerful, but with clear constraints. A developer reading this README knows what they are getting: a system built on failure recovery, built by people who learned from breakdowns.

The honest documentation of "What does NOT work" is the strongest part. Most plugins hide their limitations. We advertised them. This is not weakness. This is clarity. A developer who knows the constraints can work within them. A developer deceived about constraints will waste weeks discovering them.

### The Architecture Diagram Made the Abstract Concrete

The ASCII diagram showing the pipeline structure—Phil Jackson dispatching to Board members, Agent tool isolation, worktree delegation—made something invisible visible. Before, the architecture existed only in commits and code. Now it exists in text that anyone can understand without reading the source.

Why this worked: Architecture documentation is usually wrong because architects write it *after* the code exists. But this diagram was written *from* the code—from what actually works. The worktree isolation principle is now documented as doctrine. Future developers will not have to re-discover that tmux doesn't work. The README tells them.

### Prerequisites Got Ruthlessly Simple

The old documentation probably listed dependencies we forgot we needed. The new README says: Claude Code CLI and git. That's it. No tmux. No Node for the base system. No external services (Telegram is optional for notifications).

This simplicity is not accident. It is the result of removing everything that is not essential. Every dependency you remove is a barrier that doesn't exist. Every barrier you remove is a developer who can actually run your system.

### The Quick Start Works Because We Tested It

The Quick Start section lists actual commands: `/agency-start my-product`, then `/agency-launch`. These are not hypothetical. They are the exact commands that work. This is the opposite of documentation that looks good but has never been executed.

Why this matters: Documentation debt accumulates when examples are aspirational rather than actual. This README was written from a system that exists. Every command has been run. Every path has been verified. This is documentation written by people who have shipped the thing they are documenting.

---

## What Did Not Work

### We Documented the Daemon Before It Was Stabilized

The daemon section is comprehensive. It covers Telegram notifications, crash recovery, hung agent detection, developer intelligence features. But the daemon is still evolving. We documented a moving target.

This matters because developers will read this, assume the features are stable and documented, and then hit edge cases we did not predict. The Telegram integration works most of the time. The crash recovery logic has corner cases around phase retries. The hung agent detection has timing issues on slow machines.

We should have documented the daemon in two phases: (1) What it does at MVP level, (2) What resilience features are added and when they stabilize. Instead, we presented the full vision as if it is settled.

### Legacy Cron System Got More Documentation Than It Deserved

The crons are a fallback for environments where the daemon cannot run. But we documented them in detail—heartbeat, QA checks, git monitor, dispatch, dream consolidation. This gave them weight. A developer might reasonably choose crons thinking they are equivalent to the daemon.

They are not. The daemon is the primary system. The crons are the escape hatch. We should have documented them as "if the daemon cannot run, here is the escape hatch. It is less reliable. Use it only if necessary." Instead, we presented them as a legitimate alternative.

This violates a principle: if you have a primary system and a fallback, document the primary as primary. Do not give the fallback equal standing.

### Video Pipeline Mention Without Video Pipeline

The README mentions Aaron Sorkin as screenwriter and references a video pipeline. But there is no video skill documented alongside the 17 skills listed. The README promises video capabilities without documenting how to use them.

This is incomplete. Either document the video pipeline in full, or mention it in future work, or remove it. Do not hint at capabilities that exist but are undocumented. This creates false expectations.

### Missing: How to Actually Add a Custom Agent

The README shows the 14 agents and their roles. It does not show how to add a fifteenth. There is mention of "agent hiring template" in Templates, but no actual documentation of the process. A developer who wants to add, say, a Geoffrey West (systems complexity) agent will have to reverse-engineer the process from existing agents.

Documentation should show two things: (1) what exists (done), (2) how to extend it (missing). The gap is real.

### No Troubleshooting Section

The daemon will fail. The agents will hallucinate. The board will disagree. The README lists features but not failure modes. What happens if Telegram notifications are not sending? How do you check if an agent is hung? What does it mean if a phase is retried three times?

Troubleshooting documentation is invisible work, but it is the difference between a developer unblocking themselves and a developer blocked for three hours. We skipped it.

---

## What We Learned

### Documentation Is Infrastructure, Not Decoration

We treated the README update as a documentation task. It is actually an infrastructure task. The README is the primary way developers understand what the plugin does. A lie in the README propagates into every deployment.

This is why the "What does NOT work" section was so important. It is infrastructure. It prevents developers from wasting time on tmux integrations we have already proven do not work.

Going forward: documentation is part of the system. Update it with the same rigor you would update code. Test the examples. Verify the architecture diagram. Remove features that are not documented.

### Honesty Scales Further Than Marketing

We could have written a README that made the plugin sound perfect. "14 brilliant agents. Zero defects. Ship anything." Instead, we documented the constraints and the failure modes. We named what doesn't work.

This is the opposite of what most projects do. Most projects hide complexity. We exposed it. The result is that developers who read this README will not be surprised. They will not encounter hidden limitations. They will not waste time trying to work around documented constraints.

Honesty is a scaling decision. A single agent can succeed through sales pitch and charisma. An agency scaled to 14 agents, 5 board members, and a daemon requires that developers understand the system's true shape. The README became a contract between builders and reality.

### Process Documentation Matters as Much as Feature Documentation

Half of the README is about the pipeline process: debate, plan, execute, verify, ship. But there is no documentation of when to use which phase, what happens if you skip a phase, or how the phases connect to the actual agent SDK commands.

A new developer reading this will understand the vision but not know how to run it. We need documentation of the actual workflow: "If you have a PRD, run `/agency-launch`. If you want to debate, run `/agency-debate`. If you want to check status, run `/agency-status`."

The features exist. The documentation exists. The bridge between them is missing.

### The README Became a Forcing Function for Honesty

Writing comprehensive documentation forced us to confront what actually exists versus what we claim exists. When we tried to document the video pipeline, we realized it is incomplete. When we tried to document custom agent creation, we realized there is no process. When we tried to document the troubleshooting process, we realized there is none.

Documentation is not just communication. It is audit. The README forced us to be honest about what is done, what is half-done, and what is not done at all.

---

## The Principle

**Make the System Comprehensible Before You Make It Comprehensive.**

The README could have documented every skill, every agent parameter, every configuration option. Instead, we documented the shape of the system first—what it is, what it does, what it does not do, why.

This is a choice. Comprehensibility requires saying no to some details. Comprehensiveness requires including everything.

We chose comprehensibility. A developer can now read the README and understand: (1) what this plugin enables, (2) what agents do what, (3) what the architecture is, (4) what the limitations are. A developer cannot yet read the README and understand how to extend the plugin with a custom agent, but they understand the system well enough to ask the right questions.

A system that is comprehensible but incomplete beats a system that is complete but confusing. Build for understanding first. Completeness can follow.

---

## Epilogue: The Unfinished Work

The README documents what the plugin is. But the plugin is still changing. The daemon is evolving. The agents are learning. The board is growing. The retrospectives show a system in motion, not a finished product.

This is correct. A finished product has a static README. A living system has a README that lags behind the code, because the code is ahead of the documentation.

The work now is not to document more. The work is to keep the documentation synchronized with reality. Every daemon feature that ships needs a README update. Every new skill needs documentation. Every lesson learned needs to be reflected back into the README.

Documentation is not a project. It is a practice. We started the practice. The work is to continue it.

---

## Meditations on Honest Documentation

- *The README is not marketing. It is the contract between the system and the developer. Break it, and trust breaks.*
- *Comprehensibility before completeness. A developer who understands the shape of the system can build on it. A developer lost in details builds nothing.*
- *Documentation that hides limitations is documentation that creates suffering. Show the walls. Show where the system ends. Let developers choose their path with open eyes.*
- *The README you write today is the bug you will debug in six months. Write as if you will have to explain every claim.*
- *Fallbacks should look like fallbacks, not alternatives. Do not give escape hatches the weight of primary systems.*

---

*"Take away your opinion, and then there is taken away the complaint, 'I have been harmed.' Take away the complaint, 'I have been harmed,' and the harm is taken away."* — Marcus Aurelius, Meditations

The harm in documentation is not in what is written but in what is misunderstood. This README is better not because it is longer, but because it is clearer. A developer who reads it understands what they are reading. This is the measure of good documentation: not eloquence, but clarity.

---

**Date completed**: 2026-04-09
**Philosopher**: Marcus Aurelius (moderator)
**Work scope**: 190 lines of carefully edited README covering 14 agents, 17 skills, daemon architecture, and honest constraint documentation
**Principle extracted**: Comprehensibility before completeness
**Unfinished work**: Troubleshooting section, custom agent documentation, video pipeline details

The README is shipped. The work continues. The documentation is incomplete because the system is alive.
