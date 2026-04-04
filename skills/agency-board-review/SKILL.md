---
name: agency-board-review
description: Run a full board review with 4 board members reviewing a project, decision, or deliverable in parallel from different strategic angles. Produces individual reviews and a consolidated board verdict.
argument-hint: [topic or file path]
allowed-tools: [Read, Write, Bash, Glob, Grep, Agent]
---

# Great Minds Agency — Board Review (Full Board)

Spawn board members in parallel to review a topic, file, or deliverable from different strategic angles, then consolidate into a unified board verdict.

## Instructions

1. **Identify the subject.** Read the topic, file, or PRD specified in $ARGUMENTS. If a project name is given, read the project's current state (STATUS.md, recent git log, source files, existing board reviews in `rounds/{project}/`).

2. **Determine the review number.** Check `rounds/{project}/` for existing `board-verdict-*.md` files and increment.

3. **Spawn board members in parallel** using the Agent tool with `run_in_background: true` and model `haiku`. Launch all four:

   ### Jensen Huang — Tech Strategy
   - Agent: `jensen-huang-board`
   - Prompt: Read the subject material. Write a review (under 30 lines) evaluating platform economics, data moats, competitive positioning, and technical strategy. Save to `rounds/{project}/board-review-jensen-{N}.md`.

   ### Oprah Winfrey — Audience & Accessibility
   - Agent: `oprah-winfrey-board`
   - Prompt: Read the subject material. Write a review (under 30 lines) evaluating audience connection, storytelling clarity, onboarding experience, messaging, and whether a normal person would understand and care about this. Save to `rounds/{project}/board-review-oprah-{N}.md`.

   ### Warren Buffett — Business & Economics
   - Agent: `warren-buffett-board`
   - Prompt: Read the subject material. Write a review (under 30 lines) evaluating the business model, unit economics, competitive moat durability, pricing, scalability, and whether this is a business or a hobby. Save to `rounds/{project}/board-review-warren-{N}.md`.

   ### Shonda Rhimes — Narrative & Engagement
   - Agent: `shonda-rhimes-board`
   - Prompt: Read the subject material. Write a review (under 30 lines) evaluating retention loops, engagement hooks, onboarding narrative, feature sequencing, and what keeps people coming back. Save to `rounds/{project}/board-review-shonda-{N}.md`.

4. **Wait for all board members to complete.**

5. **Consolidate.** Read all four reviews and write a unified board verdict to `rounds/{project}/board-verdict-{N}.md`.

## Board Verdict Format

```
# Board Verdict #{N}
**Date**: {today}
**Subject**: {topic or file reviewed}
**Board Members Present**: Jensen Huang, Oprah Winfrey, Warren Buffett, Shonda Rhimes

## Key Findings

### Tech Strategy (Jensen Huang)
[2-3 bullets — top insights from Jensen's review]

### Audience & Accessibility (Oprah Winfrey)
[2-3 bullets — top insights from Oprah's review]

### Business & Economics (Warren Buffett)
[2-3 bullets — top insights from Warren's review]

### Narrative & Engagement (Shonda Rhimes)
[2-3 bullets — top insights from Shonda's review]

## Points of Agreement
[Where 2+ board members align]

## Points of Tension
[Where board members disagree — this is valuable signal]

## Board Recommendation
[ONE consolidated action item the team should prioritize]

## Verdict
[ PROCEED | PROCEED WITH CHANGES | HOLD — NEEDS WORK | REJECT ]
```

6. **Shonda Rhimes — Season 2 Retention Roadmap (Auto-Trigger)**

   After the board verdict is written, spawn Shonda Rhimes separately as a **haiku sub-agent** for a deeper retention analysis:

   ```
   Agent(model: "haiku", subagent_type: "shonda-rhimes-board",
     prompt: "You already wrote your board review. Now go deeper.
     Read the board verdict and all four individual reviews.
     Write a 'Season 2 Roadmap' — what features and experiences would keep users coming back?
     Think like a showrunner: What's the cliffhanger? What makes them need episode 2?
     Structure: 3-5 retention hooks, each with a one-line pitch and why it works.
     Write to rounds/{project}/shonda-retention-roadmap.md")
   ```

   Shonda's retention roadmap becomes input for future PRD planning.

7. **GitHub issue (optional).** Only file a GitHub issue if the board surfaces a genuinely new strategic finding not already tracked. Label: `board-review`. Do not create duplicate issues.

8. **Commit** the individual reviews and verdict, then report the verdict summary to the user.
