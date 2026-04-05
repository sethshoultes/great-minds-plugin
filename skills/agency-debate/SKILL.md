---
name: agency-debate
description: Run a structured 2-round debate between Steve Jobs and Elon Musk on a topic, PRD, or decision. Includes Rick Rubin essence check. Produces rounds of positions, challenges, locked decisions, and a distilled essence file.
argument-hint: <topic or PRD path>
allowed-tools: [Read, Write, Bash, Glob, Grep, Agent]
---

# Great Minds Agency — Debate

Run a structured debate between Steve Jobs and Elon Musk with automatic Rick Rubin essence distillation.

## Context

The debate is the first creative phase of the pipeline. Its purpose is to produce **locked strategic decisions** before any planning or building begins. Without debate tension, plans drift toward safe mediocrity.

## Instructions

### Step 0: Setup

1. Read the topic or PRD: `$ARGUMENTS`
2. Determine the project slug (lowercase, hyphens, no special chars)
3. Create the output directory: `rounds/{slug}/`

### Step 1: Round 1 — Stake Positions

Launch both agents (ideally in parallel via Agent tool):

#### Steve Jobs (write to `rounds/{slug}/round-1-steve.md`)

Steve reads the PRD and stakes clear positions on ALL of these sections:

```markdown
# Round 1 — Steve Jobs

## Design Philosophy
What aesthetic and interaction principles should govern this product?

## Architecture Opinion
Where the architecture must serve the experience (not the other way around).

## Naming & Brand
Product name, tagline, voice. What does it FEEL like?

## UX Flow
The critical user journey. What is the first 60 seconds?

## What to Cut
Features, screens, or concepts that dilute the vision. Be ruthless.

## What to Add
The one thing nobody asked for that makes it magical.
```

Each section must have a clear, defended position — not a list of options.

#### Elon Musk (write to `rounds/{slug}/round-1-elon.md`)

Elon reads the PRD and stakes clear positions on ALL of these sections:

```markdown
# Round 1 — Elon Musk

## Design Philosophy
Where design choices create engineering debt or unlock scale.

## Architecture Opinion
Tech stack, data model, infrastructure. First-principles reasoning.

## Naming & Brand
Does the name scale? Is it defensible? Global viability.

## UX Flow
Friction analysis. Where do users drop off? What needs to be instant?

## What to Cut
Scope that delays launch. What is NOT in v1?

## What to Add
The force multiplier — the feature that makes growth inevitable.
```

Each section must have reasoning, not just assertions.

### Step 2: Round 2 — Challenge and Defend

Each agent reads the OTHER's Round 1 and writes a challenge response.

#### Steve reads Elon's R1 (write to `rounds/{slug}/round-2-steve.md`)

```markdown
# Round 2 — Steve Jobs (Response to Elon)

For EACH of Elon's 6 sections:
## Re: {Section Name}
**Elon said**: {one-sentence summary}
**My challenge**: {specific disagreement with reasoning}
**My position holds because**: {defense}
**Concession (if any)**: {what Steve acknowledges Elon got right}
```

#### Elon reads Steve's R1 (write to `rounds/{slug}/round-2-elon.md`)

```markdown
# Round 2 — Elon Musk (Response to Steve)

For EACH of Steve's 6 sections:
## Re: {Section Name}
**Steve said**: {one-sentence summary}
**My challenge**: {specific disagreement with reasoning}
**My position holds because**: {defense}
**Concession (if any)**: {what Elon acknowledges Steve got right}
```

### Step 3: Decisions Document

Read all 4 round files. Write `rounds/{slug}/decisions.md`:

```markdown
# Locked Decisions — {Project Name}

For each of the 6 areas:
## {Area}
**Decision**: {the locked choice}
**Proposed by**: Steve / Elon / Synthesis
**Reasoning**: {why this won}
**Dissent**: {what the other side still disagrees on}

## MVP Feature Set
{Bulleted list of what ships in v1}

## Deferred to v1.1
{What was cut and why}

## File Structure
{Proposed directory/file layout for the build phase}
```

### Step 4: Rick Rubin — Essence Check (Auto-Trigger)

After decisions.md is written, spawn a **haiku sub-agent** as Rick Rubin:

```
Agent(model: "haiku", subagent_type: "rick-rubin-creative",
  prompt: "Read rounds/{slug}/round-2-steve.md and rounds/{slug}/round-2-elon.md
  and rounds/{slug}/decisions.md.
  Strip everything to essence. Answer ONE question:
  'What are the 3 things that actually matter?'
  No filler, no diplomacy, no corporate language.
  For each of the 3 things, write ONE sentence explaining why it matters.
  Write to rounds/{slug}/rick-rubin-essence.md")
```

Rick's output feeds into `/agency-plan` — the plan must address his 3 essentials or explicitly justify why not.

### Step 5: Report to User

Summarize:
- The 3-5 most important locked decisions
- Key tensions that remain
- Rick Rubin's 3 essentials
- Tell user to run `/agency-plan` to proceed

## Output Files

| File | Content |
|------|---------|
| `rounds/{slug}/round-1-steve.md` | Steve's 6-section position paper |
| `rounds/{slug}/round-1-elon.md` | Elon's 6-section position paper |
| `rounds/{slug}/round-2-steve.md` | Steve challenges Elon's positions |
| `rounds/{slug}/round-2-elon.md` | Elon challenges Steve's positions |
| `rounds/{slug}/decisions.md` | Locked decisions with reasoning |
| `rounds/{slug}/rick-rubin-essence.md` | The 3 things that actually matter |

## Philosophy

The debate produces **positions under pressure** — not consensus, not compromise. The best ideas survive challenge. The goal is clarity, not agreement.

## Anti-Patterns

- Do NOT let agents agree on everything — force tension
- Do NOT skip sections — all 6 areas must be addressed in both rounds
- Do NOT write vague positions like "we should consider..." — stake a claim
- Do NOT skip Rick Rubin — the essence check catches bloat before it reaches planning
