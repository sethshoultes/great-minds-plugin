# Agent Trigger Map

Complete mapping of all 14 agents to their auto-trigger points in the Great Minds pipeline.

## Pipeline Flow

```
PRD → Debate → Plan → Execute → Verify → Board Review → Ship → Launch
```

## Trigger Table

| Agent | Trigger | Phase | Model | Output |
|-------|---------|-------|-------|--------|
| Phil Jackson | Always -- IS the orchestrator | All | Opus (main session) | Consolidates all outputs, manages SCOREBOARD.md |
| Steve Jobs | Debate rounds + Build (frontend/design tasks) | Debate, Execute | Opus (worktree) | `rounds/{project}/round-*-steve.md` |
| Elon Musk | Debate rounds + Build (backend/arch tasks) | Debate, Execute | Opus (worktree) | `rounds/{project}/round-*-elon.md` |
| Rick Rubin | Auto: After Round 2 -- strip decisions to essence | Debate | Haiku | `rounds/{project}/rick-rubin-essence.md` |
| Sara Blakely | Auto: After plan is written -- customer gut-check | Plan | Haiku | `.planning/sara-blakely-review.md` |
| Jony Ive | Auto: Pre-PR -- visual review (UI/frontend tasks only) | Execute | Haiku | `rounds/{project}/jony-ive-review-{task-id}.md` |
| Maya Angelou | Auto: Pre-PR -- copy review (text/messaging tasks only) | Execute | Haiku | `rounds/{project}/maya-angelou-review-{task-id}.md` |
| Margaret Hamilton | QA pass -- runs full verification | Verify | Opus (worktree) | `engineering/phase-{N}-verification.md` |
| Aaron Sorkin | Auto: Post-QA -- writes demo script for the feature | Verify | Haiku | `rounds/{project}/aaron-sorkin-demo-script-phase-{N}.md` |
| Jensen Huang | Board review -- tech strategy evaluation | Board Review | Haiku | `rounds/{project}/board-review-jensen-{N}.md` |
| Oprah Winfrey | Board review -- audience & accessibility evaluation | Board Review | Haiku | `rounds/{project}/board-review-oprah-{N}.md` |
| Warren Buffett | Board review -- business & economics evaluation | Board Review | Haiku | `rounds/{project}/board-review-warren-{N}.md` |
| Shonda Rhimes | Board review + Auto: retention roadmap after verdict | Board Review | Haiku | `rounds/{project}/board-review-shonda-{N}.md`, `rounds/{project}/shonda-retention-roadmap.md` |
| Marcus Aurelius | Auto: Retrospective at ship time -- what worked, what didn't | Ship | Haiku | `memory/{project}-retrospective.md` |

## Auto-Trigger Details

### Debate Phase (`/agency-debate`)
1. Steve Jobs and Elon Musk run Rounds 1 and 2 (standard)
2. **Rick Rubin** auto-spawns after Round 2 to distill "the 3 things that actually matter"

### Plan Phase (`/agency-plan`)
1. Plan is generated with XML task plans (standard)
2. **Sara Blakely** auto-spawns to gut-check: "Would a real customer pay for this?"

### Execute Phase (`/agency-execute`)
1. Tasks execute in waves with atomic commits (standard)
2. Before any PR is created:
   - **Jony Ive** auto-spawns if the task touches UI/frontend/CSS/components
   - **Maya Angelou** auto-spawns if the task touches copy/messaging/landing pages/emails
3. If either reviewer returns FAIL, the task agent must address feedback before PR creation

### Verify Phase (`/agency-verify`)
1. **Margaret Hamilton** runs full QA (standard)
2. **Aaron Sorkin** auto-spawns after QA to write a 60-90 second demo script

### Board Review Phase (`/agency-board-review`)
1. Jensen Huang, Oprah Winfrey, Warren Buffett, and Shonda Rhimes review in parallel (standard)
2. **Shonda Rhimes** auto-spawns again after the verdict to write a "Season 2 Retention Roadmap"

### Ship Phase (`/agency-ship`)
1. **Phil Jackson** consolidates all agent outputs into SCOREBOARD.md
2. **Marcus Aurelius** auto-spawns to write the retrospective -- honest assessment of what worked and what didn't
3. Standard merge, cleanup, deploy verification proceeds

### Launch (`/agency-launch`)
- **Phil Jackson** IS the main session. He is not spawned -- he orchestrates everything.
- All other agents are dispatched through the Agent tool by Phil.

## Model Strategy

| Model | Used For | Why |
|-------|----------|-----|
| Opus (main session) | Phil Jackson orchestrator | Needs full pipeline context, manages all phases |
| Opus (worktree) | Steve Jobs, Elon Musk, Margaret Hamilton | Complex creative/technical/QA work requiring deep reasoning |
| Haiku | All other agents | Focused single-task reviews, 5x cheaper, fresh context per spawn |

## Conditional Triggers

Not every agent fires on every project. Conditions:

| Agent | Fires When |
|-------|-----------|
| Jony Ive | Task involves: UI, frontend, CSS, components, design, layout |
| Maya Angelou | Task involves: copy, messaging, landing pages, emails, user-facing text |
| Rick Rubin | Always fires after debate Round 2 |
| Sara Blakely | Always fires after plan generation |
| Aaron Sorkin | Always fires after QA verification |
| Shonda Rhimes (roadmap) | Always fires after board verdict |
| Marcus Aurelius | Always fires at ship time |
