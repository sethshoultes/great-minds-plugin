# Great Minds Agency — Heartbeat

This file defines what happens on each scheduled tick. The orchestrator reads this file to determine what actions to take.

## Cron Schedule

| Job | Interval | Agent | Purpose |
|-----|----------|-------|---------|
| orchestrator | 5 min | Marcus (Moderator) | Advance project state — dispatch next round/task |
| heartbeat | 10 min | Marcus (Moderator) | Write STATUS.md — progress, blockers, health check |
| organizer | 20 min | Haiku | Tidy files, validate structure, consolidate memory |
| jensen-review | 60 min | Jensen (Board) | Strategic review, spawn ideas as GitHub issues, advise |
| dream | 60 min | Haiku | Reflect on work, extract patterns, prune memory |

## Orchestrator Tick (every 5 min) — Marcus Aurelius

```
1. Read STATUS.md for current state
2. If state == "idle": check prds/ for new PRDs → start project
3. If state == "debate":
   - Check current round number
   - If round < debate_rounds: run next debate round (Steve + Elon)
   - If round == debate_rounds: transition to "plan" state
4. If state == "plan":
   - Steve + Elon define their teams in team/
   - Write agent definitions
   - Transition to "build" state
5. If state == "build":
   - Dispatch sub-agents based on team/ definitions
   - Each agent writes output to deliverables/{project}/drafts/
   - Track completion in STATUS.md
   - When all agents complete: transition to "review"
6. If state == "review":
   - Steve reviews all deliverables for taste/quality
   - Elon reviews for feasibility/accuracy
   - If revisions needed: send back to specific agents, stay in "review"
   - If approved: transition to "ship"
7. If state == "ship":
   - Assemble final deliverables
   - Write joint-summary.md
   - Update MEMORY.md with learnings
   - Transition to "idle"
8. If state == "blocked":
   - Log blocker to STATUS.md
   - Work on non-blocked tasks if available
   - Await human intervention
```

## Jensen Board Review (every 60 min)

```
1. Read STATUS.md — current state
2. Read latest round file or deliverable drafts
3. Write board review to rounds/{project}/board-review-{timestamp}.md
4. If idea spotted: create GitHub issue on sethshoultes/great-minds
   - Label: board-idea, jensen-review, or strategic
5. Check /tmp/claude-shared/messages/jensen-request.md for advisory requests
6. Respond to any pending requests
```

## Organizer/Dream (every 20 min / 60 min)

```
Organizer (20 min):
1. Validate directory structure
2. Check STATUS.md accuracy
3. Flag orphaned or missing files
4. Ensure MEMORY.md index is clean

Dream (60 min):
1. Orient — scan all memory files
2. Gather Signal — identify patterns across rounds and projects
3. Consolidate — merge related entries, remove redundancies
4. Prune & Index — update MEMORY.md, keep under 200 lines
```

## Retry Policy
- If an agent fails: retry once
- If retry fails: try alternative approach
- If alternative fails: mark as "blocked", log to STATUS.md, continue other work
- After 3 total failures on same task: stop and engage human

## State Machine

```
idle → debate → plan → build → review → ship → idle
                                  ↑         |
                                  └─────────┘  (revisions)

Any state → blocked → (human resolves) → previous state
```
