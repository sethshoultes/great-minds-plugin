---
name: agency-debate
description: Run a debate between Steve Jobs and Elon Musk on a topic, PRD, or decision. Produces structured output with positions, tensions, and resolutions.
argument-hint: <topic or PRD path>
allowed-tools: [Read, Write, Bash, Agent]
---

# Great Minds Agency — Debate

Run a structured debate between Steve Jobs and Elon Musk.

## Instructions

1. Read the topic or PRD: $ARGUMENTS
2. Launch both agents in parallel:
   - `steve-jobs-visionary`: Stake position on all areas (design, messaging, experience)
   - `elon-musk-persona`: Stake position on all areas (feasibility, metrics, scale)
3. Save Round 1 output
4. Launch Round 2: Each agent reads the other's position and challenges it directly
5. Save Round 2 with a scorecard:

```
## Scorecard
| Area | Agreement | Tension |
|---|---|---|
| ... | ... | ... |
```

6. If a moderator is needed, launch `marcus-aurelius-mod` to synthesize

The debate produces POSITIONS UNDER PRESSURE — not consensus, not compromise.
