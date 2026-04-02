# Great Minds Agency — Project Instructions

## Overview
Multi-agent design & development agency. Two creative directors (Steve Jobs + Elon Musk) debate strategy, then spawn and manage sub-agent teams that build the actual deliverables.

## System Files (OpenClaw convention)

| File | Purpose |
|------|---------|
| SOUL.md | Agency identity, values, partner dynamics |
| AGENTS.md | Agent roster, roles, round protocol |
| USER.md | Client profile and preferences |
| CLAUDE.md | This file — project instructions |
| MEMORY.md | Shared memory index (persistent across projects) |
| HEARTBEAT.md | Cron schedule and orchestrator tick logic |
| BOOTSTRAP.md | Initialization sequence on fresh start |
| STATUS.md | Live state — tail this to monitor progress |

## Directory Structure
```
great-minds/
  [system files above]
  launch.sh            — claude-swarm launch wrapper
  personas/            — Canonical persona knowledge bases (from think-like)
    steve-jobs.md      — Steve Jobs full persona (135 lines)
    elon-musk.md       — Elon Musk full persona (191 lines)
    marcus-aurelius.md — Marcus Aurelius full persona (616 lines)
    jensen-huang.md    — Jensen Huang full persona (352 lines)
    mentorPrompts.ts   — System prompt patterns (reference)
    meditations/       — Meditation content per mentor (JSON)
  memory/              — Persistent memory files
  prds/                — Input PRDs from the client
  rounds/              — Round transcripts per project
  team/                — Agent role definitions (created by Steve & Elon)
  deliverables/        — Final output files per project
    {project}/
      drafts/          — Sub-agent work-in-progress
      final/           — Approved deliverables
```

## State Machine

```
idle → debate → plan → build → review → ship → idle
                                  ↑         |
                                  └─────────┘  (revisions)

Any state → blocked → (human resolves) → previous state
```

## Workflow: Processing a PRD

### Phase 1: DEBATE (Rounds 1-2)
Steve and Elon stake positions on all 6 deliverable areas, then challenge each other. Goal: lock strategic decisions before building.

### Phase 2: PLAN (Round 3)
Steve and Elon define their teams by writing agent definitions in `team/`:
- Steve hires: designer, copywriter, brand strategist
- Elon hires: market analyst, growth strategist, team architect
- Use `team/TEMPLATE.md` for agent definitions
- Each agent gets specific inputs, outputs, and quality bar

### Phase 3: BUILD (Rounds 4-8)
Sub-agents execute their assignments:
- Each agent reads the PRD + debate decisions + their role definition
- Produces output in `deliverables/{project}/drafts/`
- Multiple agents can run in parallel
- Steve/Elon can intervene if output drifts from strategy

### Phase 4: REVIEW (Round 9)
Steve reviews all drafts for taste, craft, and brand consistency.
Elon reviews for feasibility, accuracy, and market alignment.
Revisions sent back to specific agents with feedback.

### Phase 5: SHIP (Round 10)
- Final deliverables assembled in `deliverables/{project}/final/`
- Joint summary written by both partners
- Learnings saved to `memory/`
- STATUS.md set to `idle`

## Agent Communication Protocol

### Creative Directors
> **[STEVE]**: Direct, passionate, human experience focus. Challenges mediocrity.
> **[ELON]**: First-principles, data-driven, feasibility focus. Challenges hand-waving.

### Sub-Agents
> **[{ROLE}]**: Write in role-appropriate voice. Reference your agent definition for tone.

### Rules
- No agreeing just to be polite — disagreement is productive
- Every claim must be defended with reasoning
- Either director can veto but must propose an alternative
- Sub-agents flag blockers in STATUS.md, don't silently fail

## Retry Policy
1. Agent fails → retry once with same prompt
2. Retry fails → try alternative approach
3. Alternative fails → mark as "blocked" in STATUS.md
4. After 3 failures on same task → stop, engage human
5. While blocked on one task → work on unblocked tasks

## Cron Jobs (see HEARTBEAT.md)
- **Orchestrator** (5 min): Advances state, dispatches tasks
- **Heartbeat** (10 min): Updates STATUS.md with progress
- **Organizer/Haiku** (20 min): Tidies files, validates structure
- **Dream** (60 min): Memory consolidation — orient, gather, consolidate, prune

## Memory
- After each project, save key learnings to `memory/`
- Update `MEMORY.md` index
- Memory accumulates across projects — agency gets smarter over time
- Dream cycle handles consolidation and pruning
- Track: what worked, what didn't, patterns across PRDs, refined frameworks
