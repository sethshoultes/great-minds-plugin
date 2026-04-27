# Great Minds Agency — Operations Guide

How to run the agency successfully. Read this before your first session.

## Quick Start

```bash
# Install the plugin
npx plugins add sethshoultes/great-minds-plugin

# Create a project
/agency-start my-project

# Drop a PRD
# Edit prds/my-project.md

# Launch the pipeline
/agency-launch
```

No tmux, no claude-swarm, no external dependencies. Just Claude Code + git.

## Cron Jobs to Set Up

These run in your orchestrator session (not inside the swarm). Set them up after launching:

### Monitor (every 7 min)
Checks agent status, file counts, recent commits.

### Organizer (every 19 min)
Nudges idle agents. Checks live site HTTP status. Verifies MEMORY.md size.

### Git Monitor (every 13 min)
Commits and pushes uncommitted work across all repos. Checks GitHub issues. Ensures nothing is unpushed.

### Stall Detector (every 4 hours, recommended)

Watches projects for the analysis-as-progress failure mode — analysis docs piling up while no code commits land. Dispatches Marty Cagan from `great-designers` (`great-designers:marty-cagan-designer` — product discovery is a design-management craft) to force build-or-kill decisions when projects stall. Has a hard cap (2 dispatches per project per week) before escalating to the human.

**This is the load-bearing fix for autonomous pipelines** running great-minds personas at scale (Shipyard AI is the canonical case study). See [docs/STALLED-PIPELINES.md](./STALLED-PIPELINES.md) for the full pattern, and `shipyard-ai/pipeline/auto/stall-detector.mjs` for reference daemon code. Crons should NOT be auto-installed — review with the human first, then activate.

### Jensen Board Review (every 60 min)
Launches Jensen Huang agent for strategic review. Files GitHub issues for new findings.

### Dream Consolidation (every 60 min, optional)
Updates AGENTS.md, STATUS.md, MEMORY.md, SCOREBOARD.md with current reality. Syncs plugin.

## Key Rules

### Directors Must Delegate
Steve and Elon are DIRECTORS, not individual contributors. They should:
- Break tasks into sub-tasks
- Dispatch via the Agent tool (Layer 2 named specialists or Layer 3 functional implementers — see "The three-layer model" below)
- Do highest-judgment work themselves (vision, critique, decisions)
- Have 2-3 sub-agents running at all times during BUILD phases

### The Three-Layer Model (v1.2)

The agency uses three layers, each best at different work — grounded in 2026 research on persona prompting (Wharton, USC). Named expert personas excel at open-ended judgment but reduce factual accuracy by 3–4 points on knowledge-heavy tasks. Functional roles excel at correctness but lack the judgment voice.

| Layer | Naming | Model | What this layer is for |
|-------|--------|-------|------------------------|
| **1. Named directors** | Real historical figures (Jobs, Musk, Hamilton, Aurelius, Board) | Sonnet | Vision, judgment, conflict mediation, "what kind of thing is this" |
| **2. Named specialists** | Real historical figures (Ive, Angelou, Rubin, Sorkin, Blakely) | Sonnet | Domain craft with character — visual design, copywriting voice, growth psychology |
| **3a. Functional code-writers** | Job titles only (`backend-engineer`, `frontend-developer`, `database-architect`, `devops-engineer`, `test-engineer`) | Sonnet | Code that compiles, tests that pass, queries that return the right rows — code work needs Sonnet's reasoning even without a named voice |
| **3b. Functional reviewers / doc-writers** | Job titles only (`code-reviewer`, `security-auditor`, `documentation-writer`) | Haiku | Reviewing code, auditing for issues, writing docs from settled facts — recall and pattern-matching work where Haiku's speed and cost win |

**The dispatch rule:** when judgment matters more than rote correctness, use Layer 1 or 2. When correctness matters more than voice, use Layer 3.

**Examples:**
- *"Critique this design"* → Steve Jobs (Layer 1, judgment)
- *"Write the marketing copy for this feature"* → Maya Angelou (Layer 2, voice)
- *"Implement the new API endpoint"* → `backend-engineer` (Layer 3, correctness)
- *"Audit auth on the protected routes"* → `security-auditor` (Layer 3, correctness)
- *"Should we ship this?"* → Marcus Aurelius (Layer 1, judgment about judgment)

### Layer 3 Implementers (v1.2)

Eight functional-role agents, all dispatched by directors. Five code-writers on Sonnet (correctness in real codebases needs the better model), three reviewers/doc-writers on Haiku (recall and pattern-matching tasks where Haiku's speed and cost win).

**Code-writers (Sonnet):**

| Agent | Dispatched by | What they do |
|-------|---------------|--------------|
| `backend-engineer` | Elon | API logic, services, business logic, integrations |
| `frontend-developer` | Steve | UI components, accessibility, responsive layouts |
| `database-architect` | Elon | Schema, migrations, query optimization |
| `devops-engineer` | Elon | CI/CD, infra, observability, deploys |
| `test-engineer` | Margaret | Unit, integration, e2e, regression tests |

**Reviewers and doc-writers (Haiku):**

| Agent | Dispatched by | What they do |
|-------|---------------|--------------|
| `security-auditor` | Margaret | Pre-deploy security review, threat modeling |
| `code-reviewer` | Margaret | Pre-merge craft and convention review |
| `documentation-writer` | Steve | Technical docs, API references, README updates |

None of these agents have biographical voice — they're craft and conventions only. The model split (Sonnet for writing, Haiku for reviewing) reflects the actual difficulty of the work: writing code that integrates with a real codebase is judgment-heavy in a way that reviewing existing code isn't.

### Git Workflow (PR-Based)
Never push directly to main. Always:
1. Create a feature branch: `git checkout -b feature/description`
2. Commit work to the branch
3. Create a PR: `gh pr create --title "description" --body "summary"`
4. Margaret (QA) reviews the PR
5. Merge only after review: `gh pr merge --squash`

Vercel auto-generates preview URLs for every PR — use those for staging.

### QA Must Run Continuously
Margaret Hamilton (QA Director) should run as an Agent tool sub-agent during VERIFY phase:
- Check live site HTML content (not just status codes)
- Run tests and build
- Verify forms actually work (POST to endpoints)
- Write QA reports
- Flag bugs to Steve/Elon via GitHub issues or PR comments

### Honesty Pass
Before shipping anything customer-facing:
- Remove fake API documentation
- Remove fake statistics
- Don't claim features that don't work
- If the AI can't verify an action was performed, don't claim it was

### System File Maintenance
Run a dream consolidation periodically to keep these current:
- AGENTS.md — should list all active agents
- STATUS.md — should reflect current project state
- MEMORY.md — should capture operational learnings (under 200 lines)
- SCOREBOARD.md — should track all agent output

## The Pipeline (GSD-Inspired)

```
PLAN → EXECUTE → VERIFY → SHIP
```

Each phase has a clear entry gate, exit criteria, and context management strategy.
Inspired by the GSD (Get Shit Done) methodology — structured phases, atomic tasks, fresh context per agent.

### Phase 1: PLAN

**Entry:** PRD exists or requirements are gathered
**Who:** Directors (Steve/Elon) + Debate (2 rounds)

1. **Initialize** — Gather requirements. Spawn haiku research agents in parallel for domain knowledge.
2. **Debate** — Steve and Elon stake positions. Moderator logs decisions. Lock strategic choices.
3. **Scope** — Write `.planning/REQUIREMENTS.md` with v1/v2/out-of-scope boundaries.
4. **Decompose** — Break work into atomic PLAN.md tasks. Group into dependency-ordered waves.
5. **Staff** — Directors define agent assignments. Each agent gets specific inputs, outputs, and quality bar.

**Exit gate:** REQUIREMENTS.md, ROADMAP.md, and STATE.md exist. All tasks have owners.

### Phase 2: EXECUTE

**Entry:** Plan phase complete. All PLAN.md files approved.
**Who:** Sub-agents (haiku) supervised by Directors

1. **Wave execution** — Independent tasks run in parallel. Dependent tasks wait for prior waves.
2. **Fresh context** — Each sub-agent gets a clean 200k context with only its PLAN.md + relevant code. No accumulated conversation history.
3. **Atomic commits** — One commit per completed task. Feature branches only.
4. **Context guard** — `context-guard.sh` runs after every sub-agent completion. Warns when context is heavy.
5. **Scope check** — Run `/scope-check` periodically. If drift > 30%, pause and re-plan.
6. **STATE.md updates** — After each wave, update STATE.md with completions and blockers.

**Exit gate:** All planned tasks committed. Drift score < 30%. STATE.md current.

### Phase 3: VERIFY

**Entry:** All execute tasks committed.
**Who:** Margaret (QA) + automated checks

1. **Code QA** — Tests pass, build succeeds, types check.
2. **Visual QA** — Screenshots, broken images, contrast checks (Jony Ive sub-agent).
3. **Scope audit** — Run `/scope-check` final. Confirm no unplanned work shipped.
4. **Honesty pass** — No fake APIs, no fake stats, no unverified claims.
5. **Flow test** — End-to-end verification of the user story.

**Exit gate:** QA report clean. All issues filed and addressed.

### Phase 4: SHIP

**Entry:** QA passed. All PRs approved.
**Who:** Directors + Margaret

1. **PR assembly** — Squash-merge feature branches to main.
2. **Summary** — Write completion summary with what was built, decisions made, lessons learned.
3. **State update** — Update STATE.md, SCOREBOARD.md, AGENTS.md.
4. **Memory capture** — Save operational learnings that apply to future projects.
5. **Deploy** — Vercel auto-deploys from main. Verify preview URL before promoting.

**Exit gate:** Main branch clean. Live site verified. Learnings saved.

### Context Rot Prevention (GSD Pattern)

The #1 cause of quality degradation is accumulated context. Prevent it:

| Signal | Threshold | Action |
|--------|-----------|--------|
| Agent output > 200KB | Warning | Spawn fresh agent |
| STATE.md > 30min stale | Warning | Update before continuing |
| Uncommitted diff > 500 lines | Warning | Commit immediately |
| Drift score > 30% | Pause | Re-plan before building more |
| 3+ warnings | Critical | Stop. Commit. Update state. Fresh agents for everything. |

The `context-guard.sh` hook monitors these automatically. Directors should also run `/scope-check` after every wave.

## Day One Checklist (Do These Immediately)

These were learned the hard way. Do them at the START of every project, not after problems appear.

1. **Launch Margaret (QA) in worker3 from minute one.** Don't wait for the build to be "ready."
2. **Enforce PR workflow immediately.** No direct pushes to main, ever. Add the rule to worker override prompts.
3. **Create SCOREBOARD.md at project start.** Track every agent's output from the first commit.
4. **Set up all 5 crons** — run `/agency-crons` right after launching the swarm.
5. **Skip the moderator for teams under 5 agents.** Marcus Aurelius is available as an agent but the crons (monitor, organizer, git, Jensen, dream) do everything he does. The human + crons = better orchestrator. Only use Marcus for large swarms where coordination overhead justifies a dedicated agent.
6. **Create a task queue** — a simple list of known work items in STATUS.md that the organizer pulls from when nudging idle agents. Generic "keep improving" nudges waste tokens.

## Self-Review Before PR

Directors must review their own work before creating a PR. Dispatch persona sub-agents:

**Steve (Design Director):**
- After visual changes → spawn `jony-ive-designer` (haiku) to check contrast, spacing, images
- After writing copy → spawn `maya-angelou-writer` (haiku) to check brand voice
- After building a page → spawn `margaret-hamilton-qa` (haiku) to test it

**Elon (Product Director):**
- After building an API → spawn `margaret-hamilton-qa` (haiku) to test endpoints
- After building a page → spawn `jony-ive-designer` (haiku) to check visual quality
- After UX decisions → spawn `sara-blakely-growth` (haiku) to gut-check from customer perspective

**The pattern:** Build → dispatch reviewer → fix findings → THEN create PR. Not build → PR → wait for someone else to catch problems.

## Event-Driven QA Pipeline

QA triggers on events, not timers:

| Event | What Runs | Who |
|-------|-----------|-----|
| PR created | Code QA (tests, build, types) | Margaret |
| PR merged | Visual QA (screenshots, broken images, contrast) | Jony Ive sub-agent |
| New page deployed | Full page audit (nav, images, content, mobile) | Margaret + Jony |
| Feature launched | End-to-end flow test | Playwright |
| Hourly | Health check (HTTP status only) | Organizer cron |

## QA Issue Filing

Margaret must convert QA findings into GitHub issues — but consolidated, not one per bug:

1. **Review all recent QA reports** and group related findings by theme
2. **File ONE issue per theme**, listing all related findings with file paths
3. **Examples of good consolidation:**
   - "QA: Visual contrast issues across demo sites" (covers all button/text/hero problems)
   - "QA: Broken images on demo pages" (covers all missing images)
   - "QA: Navigation inconsistencies" (covers all nav gaps)
4. **Max 5-8 consolidated issues** per review cycle, not 70 individual bugs
5. **Labels:** `bug` for code/visual issues, `docs` for documentation issues
6. **Repos:** localgenius bugs → `sethshoultes/localgenius`, website/docs bugs → `sethshoultes/great-minds`

## Honesty Rules

These prevent agents from marketing features that don't exist:

1. **Never document an API endpoint that doesn't return real data.**
2. **Never claim a feature works unless Margaret has verified the live URL.**
3. **Never show fake statistics, user counts, or metrics.**
4. **If the AI can't verify an action was performed, don't claim it was.**
5. **Run an honesty pass before any customer-facing deploy.**

## Agent Self-Direction

Agents don't self-direct well. They build until done, then stop. Improve this by:

1. **Maintain a task queue** in STATUS.md — a prioritized list the organizer pulls from.
2. **Escalating nudges** — after 3 idle checks, give a SPECIFIC task, not "find gaps."
3. **Each agent should maintain their own "next 3 tasks" list** in their worktree.
4. **After completing a PR, agents should immediately check the task queue for the next item.**

## Common Problems

| Problem | Solution |
|---------|----------|
| Agents idle | Haiku dispatch cron assigns next task. Or spawn fresh Agent tool. |
| Usage limits hit | Wait for reset. Use Haiku for sub-agents. Stagger work. |
| Agents push to main | Remind them: feature branches + PRs only |
| Pages return 200 but show "Not Found" | Margaret must check HTML content, not just status codes |
| System files stale | Run dream consolidation |
| Plugin out of date | Sync files and push to plugin repo |
| Agent lost persona after restart | Spawn fresh Agent tool with persona prompt |

## Infrastructure Options

| Service | Purpose | Cost |
|---------|---------|------|
| Vercel | App hosting, preview deployments | Free tier works |
| Neon | PostgreSQL database | Free tier (0.5GB) |
| Cloudflare Workers AI | Whisper, Llama, SDXL, DistilBERT | Free tier |
| Stripe | Billing | Test mode free, live mode per-transaction |
| Resend | Email | Free tier (100 emails/day) |
| GitHub | Repos, issues, PRs | Free |
| Agent tool | Worktree-isolated agent dispatch | Built into Claude Code |
