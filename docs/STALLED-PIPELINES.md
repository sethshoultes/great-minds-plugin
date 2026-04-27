# Stalled-Pipeline Pattern

When great-minds personas (or any constellation personas) run inside a long-running autonomous pipeline — like Shipyard AI on DigitalOcean, or any cron-driven multi-agent system — the most common failure mode is **analysis without progress**: agents generate scout reports, risk matrices, requirements analyses, validation matrices, sometimes multiple versions of each, while no code commits land. This doc names the pattern, explains why a new persona plugin won't fix it, and points at the load-bearing fix.

## The pattern

**Symptom:** repo accumulates analysis docs (`RISK-*`, `PULSE_*`, `CODEBASE_SCOUT_*`, `REQUIREMENTS_*`, `VALIDATION-MATRIX-*`) at root or in a planning directory. Multiple versions of the same analysis from different agents. Some projects ship; many stall in a "PLAN" or "DEBATE" phase that never crosses into BUILD.

**Cause:** the pipeline's loop has no forcing function. Every agent, given any state, can generate more analysis. The Debate persona will debate. The Risk Scanner will scan risks. The Requirements Analyst will refine requirements. Nothing in the loop says *"given these analyses, are we shipping or killing?"* — so the analyses pile up and projects drift off the daemon's radar.

**Why a new persona plugin won't fix it:** adding more PM voices (Ken Norton, Shreyas Doshi, Lenny Rachitsky) gives the pipeline more analysts. The failure mode is too many analysts. More voices = more analysis = same failure, faster.

**Why infrastructure fixes it:** a stall-detector cron + a forcing-function persona dispatch + a hard cap on dispatches + escalation to human after the cap. The persona surface is already there (Cagan in great-operators is the canonical decision-forcer). The missing piece is the loop that asks Cagan to decide.

## The fix (canonical recipe)

Three components, all infrastructure (not a new plugin):

### 1. Stall detector cron

Walks `projects/*` (or whatever your project directory is). For each project, computes:

- Time since last commit touching the project path
- Count of analysis docs (regex against known patterns)
- Time since the project entered its current phase
- Count of code commits vs. analysis docs

Classifies as GREEN / YELLOW / RED / BLACK based on tunable thresholds. Writes Cagan dispatch entries to a queue file.

### 2. Forcing-function persona — Cagan

Cross-dispatched from great-operators:

```js
Agent({
  subagent_type: "great-designers:marty-cagan-designer",
  prompt: "Stall detected for project <slug>. Reasons: <reasons>. Read the analysis docs. Write a build-or-kill recommendation. Recommend ONE of: BUILD (with smallest viable scope and the riskiest assumption to test first), PIVOT (with the new framing), or KILL (with the reason the four risks failed). Do NOT defer. Do NOT request more analysis."
})
```

Cagan's literal job is "the four risks before engineering commits" and "outcome over output." He looks at the analyses and asks: *"Which of value / usability / feasibility / viability did the analyses test, and was the answer no?"* That question ends the analysis loop.

### 3. Hard cap + escalation

`max_per_project_per_week: 2`. If Cagan dispatches twice on the same project and the project is still stalled, the third dispatch is the **escalation to the human**. Don't loop forever. The escalation is the part the constellation cannot decide for you.

## The constellation invariant (don't violate)

**Persona plugins are channels.** They produce craft-register artifacts when invoked. They do not have agency to wake themselves up.

**Infrastructure is what decides when to invoke channels.** Crons, state machines, escalation rules, dispatch queues. Lives in the consumer system, not in the constellation.

Putting cron daemons inside great-minds, great-operators, etc. would bend the constellation rule "one craft per plugin" and confuse channels with conductors. The infrastructure layer goes where the consumer system lives — typically `<consumer>/pipeline/auto/<daemon>.mjs` or similar.

## Canonical case study: Shipyard AI

Shipyard AI is the autonomous Emdash-building agency on DigitalOcean using great-minds personas. On 2026-04-27, Shipyard had:

- A working 7-phase pipeline (PRD → Debate → Plan → Build → QA → Creative Review → Board Review → Ship)
- 14 named great-minds agents
- Three crons firing reliably (Phil dispatch every 29 min, Jensen review at :17, system heartbeat every 5 min)
- Regular ships (multiple `daemon: auto-commit` entries per week in git log)

But the repo's top level had **17+ analysis docs** with names like `RISK-CHECKLIST-blog-infrastructure.md`, `PULSE_RISK_SCANNER_REPORT.md`, `CODEBASE_SCOUT_REPORT.md`, three `WARDROBE-*` files, five `REQUIREMENTS*` variants. `.planning/` had 33 files including `phase-1-plan-old.md`, `phase-1-plan-spark.md.backup`, etc. State files (`STATUS.md`, `TASKS.md`) had drifted weeks behind git reality.

**Diagnosis** in `shipyard-ai/docs/PRODUCT-MANAGEMENT-GAP.md` (full text — read it; this doc is the abstraction over that case study).

**Fix shipped to shipyard:** `pipeline/auto/stall-detector.mjs`, `pipeline/auto/state-sync.mjs`, `pipeline/auto/agent-registry.json` (with Cagan as cross-plugin dispatch, `max_per_project_per_week: 2`), `.daemon-queue.json` populated with schema, `pipeline/auto/STALL-DETECTOR.md` operator guide. ~150 lines of Node + ~470 lines of doc. **No new plugin built.**

## When this pattern applies

- Autonomous Claude/agent pipelines (shipyard, similar)
- Long-running PRD-driven systems where ideas flow in faster than they ship out
- Any agent system where "more analysis" is a possible move from any state
- Multi-agent coordination where no single agent has explicit "force the decision" authority

## When this pattern doesn't apply

- One-shot generation tasks (no time dimension)
- Pipelines where humans review every stage (humans ARE the forcing function)
- Pipelines with hard external deadlines (the deadline is the forcing function — though missed deadlines do recreate this pattern)

## Other forcing-function persona options

Cagan is the canonical decision-forcer for build-or-kill on a product question. Other forcing-function dispatches by signal:

| Stall shape | Forcing-function persona |
|---|---|
| "Should we build this at all? Have the four risks been tested?" | `great-designers:marty-cagan-designer` |
| "The team disagreed and a debate round didn't resolve it" | `great-minds:phil-jackson-orchestrator` |
| "The product feels off and nobody can articulate why" | `great-minds:rick-rubin-creative` (essence) or `great-minds:marcus-aurelius-mod` (Stoic mediation) |
| "The legal/policy/ethics question is blocking commitment" | `great-counsels:*` (NOT LEGAL ADVICE — see disclaimer) |
| "The capital allocation question is blocking commitment" | `great-minds:warren-buffett-persona` |

The principle is the same: dispatch a persona whose register is "decide, don't analyze," with a hard cap, with human escalation after.

## Operational checklist for adopting the pattern

For anyone building a Shipyard-style consumer system using great-minds (or any constellation plugin) personas:

- [ ] Identify the failure mode in your pipeline. Is it analysis-without-progress? Look at your repo's top level and your planning directory. Count analysis docs vs. code commits.
- [ ] Identify the forcing-function persona for your decision shape (table above). For most product pipelines, it's Cagan.
- [ ] Build a stall-detector cron in your consumer system (`<your-project>/pipeline/auto/stall-detector.mjs`). Use shipyard-ai's as a reference: <https://github.com/sethshoultes/shipyard-ai/blob/main/pipeline/auto/stall-detector.mjs>
- [ ] Build an agent registry (`agent-registry.json`) with throttle policies. Cagan gets `max_per_project_per_week: 2` and `after_max: escalate-to-human`.
- [ ] Wire your existing dispatcher (Phil Jackson cron in shipyard's case) to read the queue.
- [ ] Set the escalation channel — `HEARTBEAT.md` entry, Slack ping, email, whatever surfaces the human-decision moment.
- [ ] Dry-run for 48h before activating. Verify the classifications match your intuition before the daemon starts dispatching.
- [ ] When activated, commit the policy doc and the daemon code together so future agents reading the repo understand WHY the cron exists.

## See also

- **Shipyard's full diagnosis:** [shipyard-ai/docs/PRODUCT-MANAGEMENT-GAP.md](https://github.com/sethshoultes/shipyard-ai/blob/main/docs/PRODUCT-MANAGEMENT-GAP.md)
- **Reference daemon code:** [shipyard-ai/pipeline/auto/stall-detector.mjs](https://github.com/sethshoultes/shipyard-ai/blob/main/pipeline/auto/stall-detector.mjs)
- **Reference operator guide:** [shipyard-ai/pipeline/auto/STALL-DETECTOR.md](https://github.com/sethshoultes/shipyard-ai/blob/main/pipeline/auto/STALL-DETECTOR.md)
- **Cagan's persona file:** `great-designers-plugin/agents/marty-cagan-designer.md` (product discovery is a design-management craft, not an operations craft)
- **Phil Jackson's persona file:** `great-minds-plugin/agents/phil-jackson-orchestrator.md`
- **Constellation roadmap (architectural rules):** `brain/projects/caseproof-ai-company-constellation.md`
- **OPERATIONS.md** — the great-minds operations guide (links to this doc when relevant to a stalled great-minds pipeline)
