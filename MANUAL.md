# Great Minds — User Manual

**Audience:** developers, teams, and individual builders who want fourteen world-class advisors at the command line — debating, reviewing, planning, and (in agency mode) shipping work end-to-end.

This is the long-form reference. For a quick overview see the [README](README.md). For the underlying design philosophy across the trilogy see [Three Shapes of the Same Pattern](https://sethshoultes.com/blog/three-shapes.html).

## Companion manuals in the trilogy

- **Great Minds — User Manual (this document)** — fourteen strategic decision-makers (Jobs, Musk, Buffett, Ive, Rubin, Huang, Winfrey, Rhimes, Blakely, Hamilton, Angelou, Sorkin, Aurelius, Jackson)
- [Great Authors — User Manual](https://github.com/sethshoultes/great-authors-plugin/blob/main/MANUAL.md) — eleven prose craft personas (Hemingway, Didion, McCarthy, Morrison, Wallace, etc., plus Gottlieb the editor)
- [Great Filmmakers — User Manual](https://github.com/sethshoultes/great-filmmakers-plugin/blob/main/MANUAL.md) — twelve film craft personas (Scorsese, Kubrick, Kurosawa, Hitchcock, Spielberg, Lynch, Rhimes, Kaufman, Deakins, Schoonmaker, Zimmer, Ferretti)

---

## Table of Contents

1. [What this plugin is](#1-what-this-plugin-is)
2. [Pick your install format](#2-pick-your-install-format)
3. [Install](#3-install)
4. [The mental model](#4-the-mental-model)
5. [Quick start — your first ten minutes](#5-quick-start)
6. [The fourteen personas](#6-the-fourteen-personas)
7. [The seventeen skills](#7-the-seventeen-skills)
8. [Lite workflow — on-demand commands](#8-lite-workflow)
9. [Agency workflow — the autonomous PRD pipeline](#9-agency-workflow)
10. [Project structure and system files](#10-project-structure)
11. [Memory store](#11-memory-store)
12. [End-to-end walkthroughs](#12-end-to-end-walkthroughs)
13. [Patterns and best practices](#13-patterns-and-best-practices)
14. [Troubleshooting](#14-troubleshooting)
15. [Frequently asked questions](#15-frequently-asked-questions)
16. [Reference](#16-reference)

---

## 1. What this plugin is

Great Minds is a Claude Code plugin (also distributable as Claude Cowork plugin and Claude Desktop DXT) that ships **fourteen specialist personas** modeled after world-class operators — Steve Jobs, Elon Musk, Warren Buffett, Jony Ive, Rick Rubin, Jensen Huang, Oprah Winfrey, Shonda Rhimes, Sara Blakely, Margaret Hamilton, Maya Angelou, Aaron Sorkin, Marcus Aurelius, Phil Jackson — plus **seventeen orchestration skills** that route work between them.

You can use it two ways:

- **Lite mode** — fire `/agency-debate`, `/agency-board-review`, `/agency-plan` on demand. No project state, no cron, no daemon. Each command runs, produces output, exits.
- **Full agency mode** — initialize a project with `/agency-start`, drop in a PRD, run `/agency-launch`, and the agents go from PRD → debate → plan → execute → verify → ship as an autonomous pipeline coordinated by cron jobs or the Agent SDK daemon.

Both modes share the same fourteen personas. Pick the mode that matches how you want to work.

Great Minds is the first plugin in a trilogy:

- **`great-minds-plugin`** (this one) — strategic decision-makers (fourteen voices)
- [`great-authors-plugin`](https://github.com/sethshoultes/great-authors-plugin) — prose craft (ten voices)
- [`great-filmmakers-plugin`](https://github.com/sethshoultes/great-filmmakers-plugin) — film craft (twelve voices)

All three share the persona dispatch pattern. Great Minds adds the autonomous agency layer on top.

---

## 2. Pick your install format

The plugin ships in three forms. Choose the one that matches your environment.

| Format | Install target | What you get | Who it's for |
|--------|---------------|--------------|--------------|
| **Full agency** | Claude Code | All 14 personas + 17 skills + cron pipeline + daemon + memory store + worktree isolation | Power users running PRDs end-to-end as an autonomous pipeline |
| **Lite plugin** | Claude Cowork or Claude Code | All 14 personas + on-demand skills (`/agency-debate`, `/agency-board-review`, `/agency-plan`, etc.) | Developers and teams that want personas + co-work skills without the swarm |
| **DXT bundle** | Claude Desktop app | All 14 personas + the three core MCP tools (debate, board review, plan) | Non-technical teammates, one-click install, no CLI knowledge needed |

### Decision tree

- **Are you running a multi-day project from PRD to ship?** → Full agency.
- **Do you want to debate a decision, run a board review, or generate a plan, then move on?** → Lite plugin.
- **Are you sharing this with a non-technical teammate who doesn't live in a terminal?** → DXT bundle.

All three install the same fourteen personas — the difference is what's wrapped around them.

---

## 3. Install

### Full agency (Claude Code)

```bash
/plugin marketplace add sethshoultes/great-minds-plugin
/plugin install great-minds@sethshoultes
```

The full set of 17 skills becomes available in your next Claude Code session.

### Lite plugin (Claude Cowork or Code)

```bash
/plugin marketplace add sethshoultes/great-minds-plugin
/plugin install great-minds-lite@sethshoultes
```

The Lite version installs the personas and the on-demand skills (`/agency-debate`, `/agency-board-review`, `/agency-plan`, `/agency-content`) but skips the pipeline machinery (`/agency-launch`, `/agency-execute`, `/agency-verify`, `/agency-ship`, `/agency-daemon`, `/agency-crons`).

### DXT bundle (Claude Desktop)

```bash
cd ~/Local\ Sites/great-minds-plugin/distribution/dxt
npm install
npx @anthropic-ai/dxt pack
```

The build step produces a `great-minds.dxt` file. Share it with teammates — they double-click to install in the Claude Desktop app.

The DXT bundle exposes three MCP tools — `debate`, `board_review`, and `plan` — backed by the same fourteen personas. No file writing, no slash commands, no project state.

### Companion plugins

Most projects benefit from running great-minds alongside great-authors and great-filmmakers:

```bash
/plugin install great-authors@sethshoultes
/plugin install great-filmmakers@sethshoultes
```

Each plugin's personas know about the others. Phil Jackson (in great-minds) is the orchestrator who can dispatch into great-authors or great-filmmakers when the work needs a specialist voice.

### Companion plugin: Superpowers (engineering discipline)

Great Minds operates at the **agency altitude** — its built-in GSD pipeline orchestrates which kind of work happens when across the whole team. The [Superpowers](https://github.com/anthropics/skills) plugin operates at the **engineering altitude** — TDD, systematic debugging, plan-then-execute, worktree isolation, pre-merge verification, code review patterns.

The two compose well. Install Superpowers alongside Great Minds when you want the engineering-discipline layer beneath the agency-pipeline layer:

```bash
/plugin install superpowers
```

The directors at Layer 1 don't follow Superpowers TDD discipline (their work isn't TDD-shaped). But the Layer 3 functional implementers benefit from it directly:

| GSD pipeline phase | Apply Superpowers skill |
|--------------------|-------------------------|
| `/agency-plan` | `writing-plans`, `brainstorming` |
| `/agency-execute` | `subagent-driven-development`, `using-git-worktrees`, `dispatching-parallel-agents` |
| `/agency-verify` | `verification-before-completion`, `systematic-debugging` |
| Layer 3 code-writer dispatch (`backend-engineer`, `frontend-developer`, `test-engineer`, `database-architect`, `devops-engineer`) | `test-driven-development`, `requesting-code-review` |
| Pre-merge review (`code-reviewer`) | `receiving-code-review`, `finishing-a-development-branch` |

The two plugins keep their own identities and update cadences. Don't try to fork or merge them — that creates drift. Just install both, and the implementers pick up the engineering discipline automatically.

---

## 4. The mental model

Great Minds is built around four abstractions: **the agency**, **the three layers**, **the board**, and **the orchestrator**. Understanding these makes the seventeen skills self-explanatory.

### The agency

A project that uses Great Minds becomes a small AI agency. The structure mirrors a real creative shop with **three layers** of agents — directors at the top, named specialists in the middle, and functional implementers at the bottom:

```
Human (you)
  └── Marcus Aurelius — Moderator                       [Layer 1: named director, Sonnet]
       ├── Board of Directors (4 members, parallel)     [Layer 1: named directors]
       │    ├── Jensen Huang — Tech Strategy
       │    ├── Oprah Winfrey — Audience & Accessibility
       │    ├── Warren Buffett — Business & Economics
       │    └── Shonda Rhimes — Narrative & Engagement
       ├── Steve Jobs — Creative Director               [Layer 1: named director]
       │    ├── Jony Ive — Visual Design                [Layer 2: named specialist, Sonnet]
       │    ├── Maya Angelou — Copywriting              [Layer 2: named specialist]
       │    ├── Rick Rubin — Creative Direction         [Layer 2: named specialist]
       │    ├── Aaron Sorkin — Screenwriting            [Layer 2: named specialist]
       │    ├── frontend-developer                      [Layer 3: functional, Haiku]
       │    └── documentation-writer                    [Layer 3: functional, Haiku]
       ├── Elon Musk — Product Director                 [Layer 1: named director]
       │    ├── Sara Blakely — Growth Strategy          [Layer 2: named specialist]
       │    ├── backend-engineer                        [Layer 3: functional, Haiku]
       │    ├── database-architect                      [Layer 3: functional, Haiku]
       │    └── devops-engineer                         [Layer 3: functional, Haiku]
       └── Margaret Hamilton — QA Director              [Layer 1: named director]
            ├── test-engineer                           [Layer 3: functional, Haiku]
            ├── security-auditor                        [Layer 3: functional, Haiku]
            └── code-reviewer                           [Layer 3: functional, Haiku]
```

Phil Jackson (orchestrator) operates one level above the moderator — coordinating dispatch and resource allocation, particularly in pipeline mode.

### The three layers

Each layer is best at different work. The split is grounded in 2026 research (Wharton, USC) showing that named expert personas excel at open-ended judgment but reduce factual accuracy by 3–4 points on knowledge-heavy tasks.

| Layer | What it's named after | Model | Best at |
|-------|----------------------|-------|---------|
| **1. Named directors** | Real historical figures (Jobs, Musk, Hamilton, Aurelius, the Board) | Sonnet | Vision, judgment, conflict mediation, *what kind of thing is this* |
| **2. Named specialists** | Real historical figures (Ive, Angelou, Rubin, Sorkin, Blakely) | Sonnet | Domain craft with character — visual design, copy voice, growth psychology |
| **3a. Functional code-writers** | Job titles only (`backend-engineer`, `frontend-developer`, `database-architect`, `devops-engineer`, `test-engineer`) | Sonnet | Writing code that integrates with a real codebase — correctness work that needs Sonnet's reasoning even without a named voice |
| **3b. Functional reviewers / doc-writers** | Job titles only (`code-reviewer`, `security-auditor`, `documentation-writer`) | Haiku | Reviewing existing code, auditing for issues, writing docs — pattern-matching and recall tasks where Haiku's speed wins |

**The dispatch rule:** when judgment matters more than rote correctness, use Layer 1 or 2 (named persona). When correctness matters more than voice, use Layer 3 (functional role).

This isn't a stylistic preference — it's the architecture honoring what the research actually says about persona prompting. Named personas are good at being themselves; they're worse at recalling exact API signatures or running deterministic checks. Functional implementers are good at correctness because they don't have a voice fighting for attention.

### The board

Four agents who review work in parallel from different strategic angles. Jensen on tech, Oprah on audience, Warren on economics, Shonda on engagement. `/agency-board-review` spawns all four simultaneously and produces a consolidated verdict.

The board doesn't build. They review, advise, and file findings. In agency mode they wake up on a cron and check in unprompted.

### The orchestrator

Phil Jackson (or Marcus Aurelius, depending on context) is the coordinator — never the contributor. The orchestrator dispatches work, mediates between Steve and Elon when they disagree, decides what gets built next. In a Claude Code session, **you (the human) are also operating in this role** — you're orchestrating the orchestrator, telling Phil where to focus.

The trilogy's core principle: **dispatch, don't impersonate**. When you want Jobs's perspective, don't write *"Jobs would say…"* — run `/agency-channel jobs` (or invoke the persona via the Agent tool) and let the persona file produce its own voice.

### What varies between modes

The lite plugin gives you the personas and the on-demand commands. Full agency adds:

- **Project state** in markdown files (SOUL, AGENTS, STATUS, MEMORY, etc.)
- **Cron pipeline** that nudges idle agents and runs background reviews
- **Daemon** (the newer alternative to cron) — a long-running Agent SDK process
- **Memory store** with semantic search across past sessions
- **Worktree isolation** — each agent works on its own copy of the repo

If you remember nothing else from this section: **personas + on-demand skills = lite; personas + skills + project state + cron/daemon + memory = full agency**.

---

## 5. Quick start

Pick the path that matches your install.

### Lite quick start (5 minutes)

You'll run a debate and a board review without any project initialization.

```
/agency-debate Should we sunset the legacy API in Q3?
```

Steve Jobs and Elon Musk debate in two rounds. Rick Rubin distills the essence. Output lands in `rounds/<topic-slug>/` if you're in a git repo, or in conversation only if not.

```
/agency-board-review Our new pricing page
```

Jensen, Oprah, Warren, and Shonda review in parallel. A consolidated verdict appears with the four perspectives synthesized.

That's it. No state, no cron, no init. Use it as needed.

### Full agency quick start (10 minutes)

You'll initialize a project, drop in a PRD, and launch the pipeline.

```bash
mkdir -p ~/projects/my-launch && cd ~/projects/my-launch
```

In Claude Code:

```
/agency-start my-launch
```

This creates the full project structure: SOUL.md, AGENTS.md, USER.md, CLAUDE.md, MEMORY.md, HEARTBEAT.md, BOOTSTRAP.md, STATUS.md, plus directories for `prds/`, `rounds/`, `plans/`, `worktrees/`, and `memory-store/`.

```
/agency-crons
```

(Optional) Installs the cron pipeline — pipeline runner, heartbeat, QA, git monitor, dispatch. Skip this if you want to drive each phase manually.

Edit `prds/my-launch.md` (use `templates/PRD-TEMPLATE.md` as a starting point). Then:

```
/agency-launch
```

The pipeline begins: Steve and Elon debate the PRD → Phil consolidates the decisions into a blueprint → `/agency-plan` generates the XML task cards → `/agency-execute` runs the waves with worktree isolation → `/agency-verify` runs QA → `/agency-ship` merges and updates the scoreboard.

Watch progress with:

```
/agency-status
```

That's the agency in motion.

### DXT quick start

Install the `great-minds.dxt` file in Claude Desktop, then in any chat:

> *"Use the debate tool to argue whether we should switch from REST to GraphQL."*

Claude invokes the `debate` MCP tool, which runs the same Steve-vs-Elon flow and returns the result inline. No file system, no project state — just the conversation.

---

## 6. The fourteen personas

### Board of Directors (4)

Strategic review at altitude. Each one has a distinct lens; together they cover the four quadrants of *"is this a good idea?"*

| Persona | Channel | Lens | Best for |
|---------|---------|------|----------|
| Jensen Huang | `jensen-huang-board` | Tech strategy, data moats, platform economics | "What's the compounding advantage?" |
| Oprah Winfrey | `oprah-winfrey-board` | Audience connection, storytelling, accessibility | "Who is this actually for, and will they feel seen?" |
| Warren Buffett | `warren-buffett-board` | Business model, unit economics, moat durability | "Is this a good business?" |
| Shonda Rhimes | `shonda-rhimes-board` | Narrative, engagement, retention loops | "Why would anyone come back?" |

These four power `/agency-board-review`. They run in parallel and consolidate.

### Creative Directors (2)

Steve and Elon are the agency's two engines. Their disagreement is the productive friction.

| Persona | Channel | Strength | Best for |
|---------|---------|----------|----------|
| Steve Jobs | `steve-jobs-visionary` | Simplicity, taste, the human experience | Product critique, design decisions, brand voice |
| Elon Musk | `elon-musk-persona` | First principles, feasibility, scale | Technical strategy, growth math, "is this even possible?" |

These two power `/agency-debate`. They argue in two rounds, then Rick Rubin checks the essence and Marcus Aurelius locks the decision.

### Craft Specialists (5)

Sharpening on a single craft axis.

| Persona | Channel | Craft | Best for |
|---------|---------|-------|----------|
| Jony Ive | `jony-ive-designer` | Visual design — spacing, hierarchy, the inevitable form | UI/UX critique, layout, design systems |
| Rick Rubin | `rick-rubin-creative` | Creative direction — strip to essence | Removing what isn't working; finding the truth |
| Maya Angelou | `maya-angelou-writer` | Copywriting — warmth, rhythm, dignity | Customer-facing copy, brand voice, emails |
| Aaron Sorkin | `aaron-sorkin-screenwriter` | Screenwriting — dialogue that crackles | Demo scripts, launch videos, tutorials |
| Sara Blakely | `sara-blakely-growth` | Growth — scrappy, customer-first, grassroots | Go-to-market plans, conversion psychology, small-business empathy |

### Operations (3)

The agency runs on these three.

| Persona | Channel | Role | Best for |
|---------|---------|------|----------|
| Margaret Hamilton | `margaret-hamilton-qa` | QA — zero-defect methodology | Build verification, test coverage, "will this break in production?" |
| Marcus Aurelius | `marcus-aurelius-mod` | Stoic moderator | Conflict mediation, quality gates, "is this ready to ship?" |
| Phil Jackson | `phil-jackson-orchestrator` | Zen orchestrator | System coordination, dispatch, resource optimization |

### Functional implementers (8) — Layer 3

Functional-role agents that directors dispatch for correctness work. None have biographical voice. The five who write code use Sonnet because writing code that integrates with a real codebase needs the better model; the three who review or write docs use Haiku because their work is pattern-matching and recall.

**Code-writers (Sonnet):**

| Agent | Dispatched by | What they do |
|-------|---------------|--------------|
| `backend-engineer` | Elon | API logic, services, business logic, third-party integrations |
| `frontend-developer` | Steve | UI components, accessibility wiring, responsive layouts |
| `database-architect` | Elon | Schema design, migrations, query optimization, indexing |
| `devops-engineer` | Elon | CI/CD, IaC, observability, deploy pipelines |
| `test-engineer` | Margaret | Unit, integration, e2e, regression tests |

**Reviewers and doc-writers (Haiku):**

| Agent | Dispatched by | What they do |
|-------|---------------|--------------|
| `security-auditor` | Margaret | Pre-deploy security review — auth, input validation, secrets exposure |
| `code-reviewer` | Margaret | Pre-merge review for craft, convention, obvious correctness |
| `documentation-writer` | Steve | Technical docs, API references, README updates (NOT brand voice — that's Maya) |

You invoke these via the Agent tool the same way you'd invoke any subagent. They're typically dispatched by a Layer 1 director rather than directly by you, but you can invoke them directly when the work is purely correctness-focused.

### When you can't decide which persona to invoke

| Question | Persona |
|----------|---------|
| "Is this aesthetically right?" | Jobs or Ive |
| "Is this technically possible?" | Musk or Hamilton |
| "Is this a good business?" | Buffett |
| "Will real customers care?" | Winfrey or Blakely |
| "Why would anyone come back?" | Rhimes |
| "What's our defensible advantage?" | Huang |
| "Is this true?" | Rubin |
| "Does this copy connect?" | Angelou |
| "Does this script land?" | Sorkin |
| "Should we ship it?" | Hamilton or Aurelius |
| "How do we coordinate this?" | Jackson |

---

## 7. The seventeen skills

The skills break into two groups: **on-demand** (works in any install) and **pipeline-only** (full agency mode).

### On-demand commands

| Command | Purpose | Time |
|---------|---------|------|
| `/agency-debate <topic>` | Steve vs. Elon debate, 2 rounds, Rubin essence check, Aurelius lock | 1–3 min |
| `/agency-board-review <subject>` | 4 board members review in parallel, consolidated verdict | 1–3 min |
| `/agency-plan` | XML task cards in dependency waves (works without a PRD if you give it goals) | 2–5 min |
| `/agency-content` | End-to-end content pipeline — research → draft → publish | 5–15 min |
| `/agency-publish` | Maya → Rubin → Ive → Oprah review-and-publish for blog content | 2–5 min |
| `/agency-video` | Sorkin → Rhimes → Ive → Remotion video generation | 5–15 min |
| `/scope-check` | Diff current work against original plan; flag drift | <1 min |

### Pipeline commands (full agency only)

| Command | Purpose | Time |
|---------|---------|------|
| `/agency-start <name>` | Initialize project — system files, dirs, memory store | <1 min |
| `/agency-launch` | Full pipeline — debate → plan → execute → verify → ship | autonomous |
| `/agency-execute` | Wave-based parallel execution of XML task plans | varies |
| `/agency-verify` | UAT verification + Margaret QA pass | 5–10 min |
| `/agency-ship` | Merge feature branches, update status, write retrospective | 2–5 min |
| `/agency-crons` | Install the autonomous cron pipeline | <1 min |
| `/agency-daemon` | Start the Agent SDK long-running daemon | continuous |
| `/agency-status` | Project health — pipeline state, cron health, GitHub, commits | <1 min |
| `/agency-memory` | Query/store semantic memory across sessions | <1 min |
| `/agency-anatomy` | Token estimates per file for context budgeting | <1 min |
| `/agency-tokens` | Token ledger — cost tracking per agent across pipeline runs | <1 min |
| `/agency-setup` | Interactive wizard for project init | 2–5 min |

### Hooks (background, not invoked directly)

- **SubagentStop** — When a sub-agent finishes, reminds the director to review the output rather than going idle.
- **Context Guard** — Warns when the conversation context is getting large; suggests starting a fresh agent for the next task.

---

## 8. Lite workflow

For most users, the on-demand commands are the whole point. You don't need the pipeline; you need a board review or a debate when a decision needs sharpening.

### Use it like this

You're working on a project (any project — Great Minds doesn't need to be the project's owner). A decision comes up. You pause and run a command:

```
/agency-debate Should the onboarding flow ask for credit card upfront?
```

Steve argues for taste and trust; Elon argues for conversion math. The debate runs. Rubin checks essence. Aurelius locks the decision. The output lives in `rounds/<topic-slug>/` if you're in a repo (commit it as a record), or in conversation only.

You take the answer back to your real work.

### Common Lite patterns

**Decision pressure-test:**
```
/agency-debate <decision phrased as a question>
```

**Strategic review of a plan:**
```
/agency-board-review <link to plan, doc, or paste content>
```

**Generate a plan from goals:**
```
/agency-plan
```
Then prompt: *"Generate a phase plan for [goal]. The plan should be wave-based with atomic XML task cards."*

**Catch scope creep:**
```
/scope-check
```
This compares your current `git diff` against the most recent plan in `plans/`. Useful before merging a feature branch.

### What the Lite plugin does NOT do

- Does not write project state files (no SOUL.md, no STATUS.md).
- Does not run cron jobs or daemons.
- Does not manage worktrees or coordinate multi-agent execution.
- Does not have semantic memory across sessions.

If you want any of those, switch to full agency mode.

---

## 9. Agency workflow

Full agency mode is the autonomous PRD-to-ship pipeline. It's overkill for most tasks, but it's exactly right for multi-day projects where you want the agents to keep working when you're not watching.

### The pipeline

```
PRD  →  Debate  →  Plan  →  Execute  →  Verify  →  Ship
```

Each phase has its tool:

| Phase | Tool | What happens |
|-------|------|--------------|
| **PRD** | You write `prds/<project>.md` | Use `templates/PRD-TEMPLATE.md` as a starting point |
| **Debate** | `/agency-debate` (auto-invoked by `/agency-launch`) | Steve and Elon argue 2 rounds; Phil consolidates into a blueprint |
| **Plan** | `/agency-plan` | XML task cards organized into dependency waves |
| **Execute** | `/agency-execute` | Wave-based parallel agents, each with isolated worktree, atomic commits |
| **Verify** | `/agency-verify` | Margaret QA — build, lint, tests, requirement coverage, live site checks |
| **Ship** | `/agency-ship` | Merge feature branches, update STATUS, write retrospective, save learnings to memory |

### The supporting infrastructure

These run in the background while the pipeline executes:

| Cron / daemon job | Cadence | What it does |
|-------------------|---------|--------------|
| Pipeline runner | Driven by cron or daemon | Advances the project through the phases above |
| Heartbeat | Every 7 min | Checks agent status, file counts, recent commits — nudges idle agents |
| Git monitor | Every 13 min | Commits and pushes uncommitted work; checks GitHub issues |
| Organizer | Every 19 min | Verifies live site HTTP, MEMORY.md size |
| Jensen board review | Every 60 min | Strategic review; files GitHub issues for new findings |
| Dream consolidation | Every 60 min | Updates AGENTS.md, STATUS.md, MEMORY.md, SCOREBOARD.md to reflect reality |

### Cron pipeline vs. daemon

There are two implementations of the supporting infrastructure. Pick one:

**Cron pipeline (`/agency-crons`):**
- Decoupled bash scripts triggered by `crontab`
- Each cron runs independently, never blocks the main agent
- Works on any system with `crontab`
- Slightly older approach

**Agent SDK daemon (`/agency-daemon`):**
- Single long-running process built on the Agent SDK
- Handles dispatch, health checks, dream consolidation, memory in one persistent process
- Includes Telegram notifications for pipeline events
- Newer approach; recommended for new projects

You can use either, not both. The daemon is more reliable for continuous operation; cron is simpler to debug.

### Three rules that keep the agency working

The agency mode discipline is documented in `docs/OPERATIONS.md`. Three rules in particular matter:

**1. Directors must delegate to the right layer.** Steve and Elon are Layer 1 directors. When the work is craft with character (visual design, copy voice, growth psychology), they dispatch to a Layer 2 named specialist (Ive, Angelou, Rubin, Sorkin, Blakely) on Sonnet. When the work is correctness (code, tests, infra, security), they dispatch to a Layer 3 functional implementer (`backend-engineer`, `frontend-developer`, `test-engineer`, etc.) on Haiku. They do not write code or run tests themselves — and they do not collapse Layer 2 voice work into a Layer 3 functional role.

**2. Sonnet for everything that produces output; Haiku for review and recall.** Layer 1 directors, Layer 2 named specialists, and Layer 3 code-writers all use Sonnet because writing — whether code, copy, or judgment — needs the reasoning headroom. Only the three Layer 3 reviewer/doc-writer agents use Haiku, because their work (pattern-matching against existing code, surfacing known security issues, writing docs from settled facts) is recall-heavy in a way that benefits from Haiku's speed and cost. Don't try to save money by putting Haiku on a code-writer; you'll spend the savings (and more) re-running and debugging output that doesn't compile.

**3. Honesty pass before shipping.** Margaret Hamilton's QA pass must verify the work before `/agency-ship`. No fake API documentation. No fake statistics. No claiming features that don't work. If the AI can't verify an action was performed, don't claim it was.

---

## 10. Project structure

A `/agency-start <name>` initialization produces this structure at the project root:

```
my-project/
├── SOUL.md              — Agency identity, partners, values
├── AGENTS.md            — Agent roster, hierarchy, communication rules
├── USER.md              — Client profile (you), preferences, decision authority
├── CLAUDE.md            — Project instructions for Claude Code
├── MEMORY.md            — Shared memory index, persistent across projects
├── HEARTBEAT.md         — Cron schedule and orchestrator tick logic
├── BOOTSTRAP.md         — Initialization sequence on fresh start
├── STATUS.md            — Live state — tail this to monitor progress
├── SCOREBOARD.md        — Agent output tracking
├── prds/
│   └── <project>.md     — The PRD that started everything
├── rounds/              — Debate rounds
│   └── <topic-slug>/
├── plans/               — XML task plans
│   └── <phase>.xml
├── worktrees/           — Isolated git worktrees per agent (gitignored)
├── memory-store/        — SQLite semantic memory + embeddings
├── reviews/             — Board reviews + QA reports
└── ship-reports/        — Retrospectives from /agency-ship
```

### The system files in detail

**SOUL.md** — Identity. Why this agency exists, who Steve and Elon are in this context, the core philosophy. Edit this once at project init; it's stable.

**AGENTS.md** — The roster. Hierarchy, communication rules, who reports to whom, when each agent wakes up. Updated periodically via dream consolidation.

**USER.md** — Your profile. Role, preferences, decision authority. Tells the agents how you like to work — separate deliverable files vs. monolithic, joint summaries vs. side-by-side, etc.

**CLAUDE.md** — Project instructions for Claude Code. Read first by every fresh agent. The file is generated by `/agency-start` and can be customized.

**MEMORY.md** — Index of operational learnings, kept under 200 lines. Auto-trimmed by the dream consolidation cron. Lessons from past sessions live here so future-you doesn't have to re-discover.

**HEARTBEAT.md** — The cron schedule, in one place. When you change cadence, update this file and the actual `crontab` together.

**BOOTSTRAP.md** — What a fresh agent needs to know on its first wake-up. Read this if you're debugging "why does the agent not seem to know X."

**STATUS.md** — Live state. Tail this to monitor progress. Updated continuously during the pipeline.

**SCOREBOARD.md** — Agent output tracking. Who delivered what, when. Updated during `/agency-ship`.

### Where worktrees go

`worktrees/` is gitignored and holds isolated git worktrees, one per executing agent. Each worktree is a full copy of the repo on a feature branch, so agents can build and commit without conflicting. After `/agency-ship`, worktrees are cleaned up.

This is the proven dispatch pattern. **Do not** try to use tmux + `send-keys` to dispatch — that approach is documented as broken (Claude Code's input buffer rejects pasted prompts).

---

## 11. Memory store

The memory store is a SQLite database with embeddings, located at `<project>/memory-store/memory.db`. It enables semantic search across past sessions.

### What gets stored

- Significant decisions from `/agency-debate` (the locked decision, not the full transcript)
- Findings from board reviews
- Learnings extracted at `/agency-ship`
- Manual stores via `/agency-memory store <text>`

### Querying

```
/agency-memory query "how did we handle pricing decisions last quarter?"
```

Returns the top-N most relevant past memories with their session date and project tag. The agents use this on every fresh start to seed context — "what's relevant from prior work?"

### When to store explicitly

Most stores happen automatically during pipeline phases. But if you want to capture something that isn't part of the formal flow, run:

```
/agency-memory store "Decision: <what>. Reason: <why>. Date: <iso>."
```

Manual stores are tagged with the project name and the date, and they participate in semantic search like any other memory.

### Consolidation

The dream consolidation cron (every 60 min, optional) runs through MEMORY.md and trims it to under 200 lines, moving older entries into the SQLite store. This keeps the always-loaded MEMORY.md scannable while preserving everything.

---

## 12. End-to-end walkthroughs

Three walkthroughs, one per common use pattern.

### Walkthrough A — Lite, decision pressure-test

You're shipping a feature next week. Pricing isn't locked yet.

```
/agency-debate Should we charge $9/mo or $19/mo for the Personal tier?
```

Steve argues taste and trust; Elon argues conversion math. Two rounds. Rick Rubin distills:

> *"The price isn't $9 or $19. The price is what makes the buyer feel they got more than they paid for."*

Marcus Aurelius locks the decision: *"$9/mo for the first 1000 customers, $19/mo after — the early adopters carry the brand."*

Output: `rounds/pricing-personal-tier/round-1.md`, `round-2.md`, `essence.md`, `decision.md`. Commit them as a decision record.

That's it. Three minutes. Back to building.

### Walkthrough B — Lite, board review of a feature spec

You wrote a spec. Before implementation, sanity-check it across the four board lenses.

```
/agency-board-review docs/specs/2026-04-25-onboarding-redesign.md
```

Four reviews land in parallel:

- **Jensen** — *"This onboarding teaches the user nothing about your data moat. Your activation event has to demonstrate why your data is irreplaceable."*
- **Oprah** — *"There's no place in this flow where the user feels seen. The first three screens are forms. Add a moment of warmth before screen one."*
- **Warren** — *"Your activation rate assumption is 60%. Industry benchmark for this complexity is 30–40%. Plan for the lower number."*
- **Shonda** — *"There's no cliffhanger. After signup, the user has no reason to come back tomorrow. What's the hook for day two?"*

A consolidated verdict synthesizes the four into a single readable summary. Commit it next to the spec.

You revise the spec; it ships better.

### Walkthrough C — Full agency, PRD to ship

You have a multi-week project: build a small SaaS landing page + signup flow + Stripe integration.

```bash
mkdir -p ~/projects/saas-launch && cd ~/projects/saas-launch
```

In Claude Code:

```
/agency-start saas-launch
```

System files generated. Edit `prds/saas-launch.md` from the template — overview, problem, target market, core features, success metrics, constraints. Commit.

```
/agency-crons      # or /agency-daemon for the newer alternative
/agency-launch
```

The pipeline:

1. **Debate phase** — Steve and Elon debate the PRD. Steve pushes for an opinionated landing page that says one thing perfectly. Elon pushes for a faster activation funnel with measurable conversion at each step. They argue two rounds; Rubin distills; Aurelius locks: *"One landing page with one proposition; one signup form with three fields; one Stripe checkout."*

2. **Plan phase** — `/agency-plan` generates `plans/phase-1.xml` with atomic task cards in dependency waves: `wave-1` is the landing page, `wave-2` is the signup form (depends on wave-1's auth setup), `wave-3` is the Stripe integration. Each card has acceptance criteria and an estimated time.

3. **Execute phase** — `/agency-execute` spawns sub-agents for each task in wave-1 in parallel, each in its own worktree. They build, test, commit. Margaret QA monitors continuously; she files a GitHub issue if a sub-agent claims to have shipped something it hasn't actually verified.

4. **Verify phase** — When wave-3 finishes, `/agency-verify` runs the full QA pipeline: build, lint, type-check, tests, accessibility audit, security review, live site verification. Margaret produces a SHIP / FIX / BLOCK recommendation.

5. **Ship phase** — `/agency-ship` merges the feature branches, updates STATUS and SCOREBOARD, writes a retrospective, and saves learnings to the memory store.

Throughout, you monitor with `/agency-status` and intervene as needed. The cron jobs nudge idle agents and run periodic Jensen board reviews that file GitHub issues for strategic concerns.

For a small SaaS launch this might run two or three days; for a complex project, two or three weeks. You don't have to be present for the agents to keep advancing.

---

## 13. Patterns and best practices

### Orchestrator, not channel

You are operating in the orchestrator role. When you find yourself about to write *"Steve would say…"* or *"Margaret would respond with…"* — stop. Run `/agency-channel jobs` (in lite) or invoke the persona via the Agent tool (in agency mode) and let the persona file produce its own voice.

Inline impersonation collapses each persona into your default register and erases the reason the personas exist. The full pattern is documented at [orchestrator-not-channel](https://github.com/sethshoultes/brain/blob/main/learnings/orchestrator-not-channel.md).

### Use Lite for decisions, agency for projects

Lite is for *moments* — a decision, a review, a plan. Agency is for *projects* — multi-day work that benefits from persistent state and autonomous coordination. Don't initialize a full agency for a one-hour decision; don't try to run a multi-week project in conversation-only mode.

### Read the system files before extending

If you're customizing the agency for your domain (legal, healthcare, education), read SOUL.md and AGENTS.md before adding personas. The agency identity is established there; new personas need to fit the structure.

### Haiku for sub-agents, Sonnet for directors

Steve and Elon use Sonnet — they make judgment calls. Their sub-agents (Jony, Maya, Rick, Sara) use Haiku for the bulk of the work — Haiku is ~5× cheaper and the work fits within its capability.

The exception: Margaret. QA decisions need Sonnet because Margaret is gatekeeping production.

### Don't push to main

The agency uses PR-based git workflow. Each agent commits to a feature branch in its worktree; merges happen at `/agency-ship` after Margaret QA approves. Vercel auto-generates preview URLs for every PR — use those for staging.

The "no push to main" rule is enforced in `docs/OPERATIONS.md` as a hard rule. Don't override it.

### Honesty pass before ship

Margaret runs an honesty pass during `/agency-verify`:

- No fake API documentation
- No fake statistics
- No claiming features that don't work
- If the AI can't verify an action was performed, don't claim it was

If the honesty pass returns BLOCK, the ship phase does not run. Fix the issues, re-verify, then ship.

### The board can interrupt

In agency mode, board members (Jensen, Oprah, Warren, Shonda) wake up on their cron and check in. Jensen files GitHub issues for strategic concerns. If you see a new issue from `jensen-huang-board` in the middle of a build phase, read it — Jensen sees things from a higher altitude than the directors.

### When the agency goes idle

If `/agency-status` shows no activity for 30+ minutes during what should be an active phase, the issue is usually one of:

1. **A sub-agent stopped without reporting back.** The SubagentStop hook should catch this; if it didn't, restart the daemon (`/agency-daemon`) or trigger the heartbeat manually.
2. **A worktree is in a broken state.** Check `worktrees/` for uncommitted changes or merge conflicts.
3. **Cron stopped.** `crontab -l` to verify; restart via `/agency-crons` if needed.

`/agency-status` will tell you which one.

---

## 14. Troubleshooting

### `/agency-launch` fails with "no PRD found"

You skipped the PRD step. Edit `prds/<project>.md` from `templates/PRD-TEMPLATE.md` first, then re-launch.

### Sub-agents go idle without reporting back

The SubagentStop hook should catch this and remind the director to review the output. If it isn't firing:

- Verify the hook is installed: check `~/.claude/hooks/`.
- Restart the daemon (`/agency-daemon`) — it re-registers the hook.
- Check `STATUS.md` — sometimes the agent did finish and the issue is just stale state.

### Cron jobs aren't running

```bash
crontab -l                       # verify entries exist
ps aux | grep agency             # check the daemon is running (if you're using daemon mode)
tail -f ~/.agency-cron.log       # check for errors
```

If `crontab -l` is empty, run `/agency-crons` again.

### Daemon crashes on start

```bash
cd ~/Local\ Sites/great-minds-plugin/daemon
npm install                      # ensure deps are current
npm run start                    # start in foreground for visible errors
```

If the error mentions `TELEGRAM_BOT_TOKEN` missing, either set it in `.env` or comment out the telegram notification block in the daemon config.

### Memory store is corrupted / queries return nothing

```bash
ls -la <project>/memory-store/
sqlite3 <project>/memory-store/memory.db "SELECT COUNT(*) FROM memories;"
```

If the count is 0 but you've shipped projects before, the database may have been wiped. Restore from the most recent `memory-store/backups/` if available, or accept the loss and start fresh.

### `/agency-verify` always returns BLOCK

This is usually correct — Margaret is doing her job. Read the verification report. Common causes:

- **Build fails** — fix the build error.
- **Type errors** — fix or explicitly suppress with explanation.
- **Live site returns 404 or 500** — deploy didn't succeed.
- **Honesty pass found unverified claims** — find them in the report and either remove the claim or run the verification.

If Margaret is wrongly blocking — for example, claiming the build is broken when it's not — capture the disagreement in a comment and override with `/agency-ship --force`. Then file a learning to the memory store explaining what tripped her up.

### `/agency-debate` outputs feel generic

You probably skipped the project context. The debate command reads SOUL.md and USER.md before starting — if those files are templated stubs, the debate will be generic. Edit them to reflect your project.

### Lite plugin is missing pipeline commands

That's expected — `/agency-launch`, `/agency-execute`, `/agency-verify`, `/agency-ship`, `/agency-daemon`, `/agency-crons` are full-agency-only. If you need them, install the full plugin (`great-minds@sethshoultes`) instead of the lite (`great-minds-lite@sethshoultes`).

### DXT bundle won't install

```bash
cd distribution/dxt
npm install                      # ensure dependencies
npx @anthropic-ai/dxt validate   # validate the manifest
npx @anthropic-ai/dxt pack       # rebuild
```

Check `manifest.json` for malformed JSON. If validation passes but install fails in Claude Desktop, restart the Desktop app — it caches the previous installation attempt.

---

## 15. Frequently asked questions

### Should I use Lite or Full Agency?

If you're answering one decision or running one review, use Lite. If you're shipping a multi-day project where the agents will keep working when you step away, use Full Agency. The middle case — *"I want a board review now and I might want one tomorrow"* — Lite still wins; just install Lite and run the command twice.

### Can I add my own persona?

Yes. Create `agents/<name>-persona.md` (or `<name>-board.md` for board roles) following the structure of the existing agents. Edit `AGENTS.md` to add the new persona to the roster. The pre-commit hook syncs the agent file to the lite and DXT distributions automatically.

### Can I remove personas I don't need?

Don't delete persona files; the orchestration commands assume the canonical roster. If you don't want, e.g., Aaron Sorkin in your projects, leave him installed but never invoke him. The personas have no cost when they're not running.

### How do I share an agency project across machines?

Commit the project repo (without `worktrees/` and `memory-store/*.db-journal`). On the other machine, clone the repo, then run `/agency-start --resume` to rebuild local state. The memory store SQLite file commits cleanly; worktrees are recreated as needed.

### How do I share memory across projects?

Set the project's `memory-store/` to a shared GitHub repo (the distribution README has the pattern). All projects pulling from that store see each other's learnings. Be careful — shared memory means shared blast radius if a learning is wrong.

### Can the daemon run in production?

The daemon is designed for development orchestration, not production runtime. It assumes interactive Claude Code access on a developer machine. If you want a production-style autonomous agent, use the Agent SDK directly — the daemon's design is documented in `daemon/README.md` and is open to fork.

### Can I use this with non-Anthropic models?

Currently the plugin uses Claude (Anthropic) via Claude Code or Cowork. The personas are markdown files with no model-specific syntax — they would port to other agent runtimes that support specialist subagent dispatch. The orchestration commands are Claude-specific.

### What if Steve and Elon refuse to converge?

Marcus Aurelius locks the decision after round 2. If Marcus's lock feels wrong, that's a signal — either the PRD is ambiguous (clarify it) or the question is genuinely irreducible (sometimes Steve and Elon being unable to agree is the answer; ship a v0 of each and A/B test).

### How do I scope creep early?

```
/scope-check
```

Diffs your current work against the most recent plan. Flags new features that weren't in the plan. Run it before merging a feature branch.

### How do I prevent burning Sonnet quota?

The "Haiku for sub-agents" rule is the main lever. Verify in `agents/<persona>-persona.md` frontmatter that sub-agents have `model: haiku`. Only directors and Margaret should have Sonnet.

If you're still burning quota, check the daemon logs for runaway loops — sometimes a hook misfires and an agent gets re-invoked.

---

## 16. Reference

### Plugin internals

| Path | Purpose |
|------|---------|
| `agents/<name>-persona.md` | Fourteen persona files |
| `skills/agency-*/SKILL.md` | Seventeen orchestration skills |
| `skills/scope-check/SKILL.md` | Drift detection |
| `templates/SOUL.md` | Agency identity template |
| `templates/AGENTS.md` | Agent roster + hierarchy template |
| `templates/PRD-TEMPLATE.md` | PRD scaffold |
| `templates/USER.md` | Client profile template |
| `templates/CLAUDE.md` | Project instructions template |
| `templates/STATUS.md` | Live state template |
| `templates/SCOREBOARD.md` | Output tracking template |
| `templates/HEARTBEAT.md` | Cron schedule template |
| `templates/BOOTSTRAP.md` | Fresh-start sequence template |
| `templates/AGENT-TEMPLATE.md` | Skeleton for new personas |
| `daemon/` | Agent SDK long-running daemon source |
| `distribution/plugin/` | Lite plugin distribution |
| `distribution/dxt/` | DXT bundle distribution |
| `docs/OPERATIONS.md` | Operations guide (cron, daemon, rules) |

### External references

- [Three Shapes of the Same Pattern](https://sethshoultes.com/blog/three-shapes.html) — design philosophy across the trilogy
- [great-authors-plugin](https://github.com/sethshoultes/great-authors-plugin) — prose craft companion
- [great-filmmakers-plugin](https://github.com/sethshoultes/great-filmmakers-plugin) — film craft companion

### Brain references (private vault)

If you have access to Seth's brain vault:

- `learnings/orchestrator-not-channel.md` — dispatch-don't-impersonate pattern
- `learnings/plugin-v1.0-is-not-mature.md` — why real-world use is the maturity step
- `learnings/credential-handling-canonical-env.md` — secrets management
- `learnings/orchestrator-and-writer-are-different-ai-roles.md` — role distinction
- `runbooks/Migrate Project Envs to Canonical Secrets.md` — credential consolidation procedure

### License

MIT. See [LICENSE](LICENSE) at the repo root.

### Reporting issues

[github.com/sethshoultes/great-minds-plugin/issues](https://github.com/sethshoultes/great-minds-plugin/issues). When reporting agency pipeline failures, include `STATUS.md` content + the most recent `~/.agency-cron.log` excerpt + the daemon log if applicable. Those three artifacts solve most pipeline issues.
