---
name: team-build
description: Phil Jackson's pre-flight skill — given a project brief, recommends which constellation plugins to enable and which personas to dispatch at each pipeline phase. Reads the project brief, inspects what plugins are installed, maps the project shape to the constellation's pipeline (discovery → debate → plan → build → QA → review → ship), and produces a `team-brief.md` plus an optional `.claude/settings.json` for per-project plugin enablement. Use at the START of a project, before dispatching any personas. The output is the play call; the operator runs the plays.
argument-hint: [optional path to PRD, README, or BRIEF — otherwise asks for a 2-3 sentence description]
allowed-tools: [Read, Write, Bash, Glob, Grep]
---

# /team-build — pick the right team for the project

The pre-flight skill. Every project that runs through the constellation needs a team brief: which plugins to enable, which personas to dispatch at which phase, in what order. Operators learn this by running projects; new users have no on-ramp. `/team-build` mechanizes the decision.

The skill is Phil Jackson's voice as a pre-flight tool. He's not running the plays — he's telling you which plays the project needs and in what order, so you can run them yourself.

## When to use

- Starting a new project and you're not sure which plugins or personas to dispatch
- Inheriting a project where someone else picked the team and you want to verify the call
- Running a project shape you haven't done before (e.g., your first book proposal, your first decision memo, your first OKR set)
- Setting up a project's `.claude/settings.json` for per-project plugin enablement

Not for:
- Projects already in flight where the team is settled — keep going, don't restart
- Pure conversational help where no artifact ships ("brainstorm with me") — channel a persona directly via `Agent`
- Replacing actual discovery — `/team-build` recommends WHICH discovery persona; it doesn't do discovery itself

## What this skill produces

1. A **`team-brief.md`** at the project root with:
   - One-sentence project shape summary
   - Recommended pipeline (phase → persona → plugin → why)
   - Plugins required + which to install if missing
   - Per-project `.claude/settings.json` block (ready to copy)
   - Substitutions table (what to do if a plugin isn't loaded)
   - Phil-voice notes on the highest-leverage decision

2. **Console summary** — same content, condensed: one sentence per phase + the install commands + the settings.json delta.

3. **(Optional, with explicit confirmation) `.claude/settings.json` write** — the skill writes the file only if the operator says yes. Default: produce the brief, let operator review, ask before writing.

## Instructions for Claude

When this skill is invoked:

### Step 1: Establish the project brief

Look for a brief in this order:

1. **Argument provided** — if `/team-build path/to/file` was called, read that file as the brief.
2. **Common locations** — check for `PRD.md`, `BRIEF.md`, `README.md` in cwd. If found, ask the operator: *"Use `<filename>` as the project brief?"*
3. **No file found** — ask the operator for a 2-3 sentence project description. Examples to prompt:
   - "What are you building?"
   - "Who is the customer / end user?"
   - "What's the deliverable that ships?"

If the brief is < 50 words, ask up to 3 clarifying questions but **commit after that** — `/team-build` is fast triage, not deep discovery. If the project needs deep discovery, the brief should say so and you'll dispatch Cagan/Sara separately.

### Step 2: Inspect the constellation state

Read these to understand what's available:

```bash
# What plugins are installed at user level
cat ~/.claude/settings.json
```

Parse `enabledPlugins` (which great-* are enabled globally) and `extraKnownMarketplaces` (which marketplaces are registered). Note any great-* plugins that are **disabled at user-level** (`false`) — those will need per-project enablement.

```bash
# What's enabled for this project (if anything)
cat .claude/settings.json 2>/dev/null
```

If there's already a project-level settings file with `enabledPlugins`, the brief should highlight what's already on vs. what needs to change.

```bash
# What plugins are installed (cached)
ls ~/.claude/plugins/cache/ 2>/dev/null
```

If a plugin you'll recommend isn't in the cache, the brief includes the install command.

### Step 3: Read the constellation roadmap

```bash
[ -f ~/brain/projects/great-minds-ai-company-constellation.md ] && cat ~/brain/projects/great-minds-ai-company-constellation.md
```

This is the canonical "which plugin owns which craft" doc. If the file isn't present, use the decision table baked into this skill (next section).

### Step 4: Map the project to constellation pipeline phases

Walk through the brief and identify signals. Each signal raises the priority of certain plugins. See `decision-table.md` (in this skill's directory) for the full table; below is the load-bearing logic.

**Always include `great-minds`** — Phil for orchestration is mandatory; founder-class personas are needed for almost any project.

**Project type → plugin signals:**

| Brief language signals | Plugins this triggers |
|---|---|
| "single-page", "tool", "static", "HTML", "CSS", "JS" | great-engineers, great-designers |
| "API", "backend", "server", "database" | great-engineers |
| "long-form", "novel", "essay", "manuscript", "chapter" | great-authors |
| "decision", "should we", "ethics", "policy", "regulatory" | great-counsels |
| "research", "literature review", "study", "deep dive" | great-researchers |
| "ad copy", "launch", "positioning", "campaign", "marketing" | great-marketers |
| "book site", "trailer", "magazine", "publication", "cover" | great-publishers |
| "operations", "OKRs", "scaling", "hiring", "process" | great-operators |
| "scene", "shot", "screenplay", "film", "video" | great-filmmakers |
| "autonomous", "pipeline", "agency", "orchestration" | great-minds (especially the agency-* skills) |

Multiple signals fire = multiple plugins recommended.

### Step 5: Pick the personas for each phase

For each constellation phase, pick a persona based on the project shape:

**Discovery** — pick by domain:
- Code / product → `great-designers:marty-cagan-designer` (structured four-risks)
- Business / customer → `great-minds:sara-blakely-growth` (founder empathy)
- Research / academic → `great-researchers:carl-sagan-researcher` (what is the question really asking)
- Decision / ethics → `great-minds:marcus-aurelius-mod` or `great-counsels:john-rawls-counsel` (what serves the user)

**Debate** — pick by tension type:
- Scope / polish → `great-minds:steve-jobs-visionary`
- First-principles vs. convention → `great-minds:elon-musk-persona`
- Ethical / mediation → `great-minds:marcus-aurelius-mod`
- Strategic / capital → `great-minds:warren-buffett-persona` or `great-operators:charlie-munger-operator`
- Creative direction → `great-minds:rick-rubin-creative`

**Plan** — `great-minds:phil-jackson-orchestrator`. Always. He's the orchestrator.

**Build** — pick by deliverable:
- Code → match to specific great-engineers persona (Carmack for performance/parser, DHH for pragmatic web app, Hopper for compilers/teaching, Knuth for algorithm correctness, Torvalds for systems, Hejlsberg for language design, Eich for browser, Dijkstra for proofs, Sandi Metz for refactoring)
- Prose → match to register (Hemingway for tightness, McCarthy for weight, Didion for cool observation, Baldwin for moral urgency, Morrison for lyric register, McPhee for long-form structure, Wallace for self-aware essay, Orwell for plain-style, King for narrative voice, Le Guin for speculative, Vonnegut for compression)
- Design → match to surface (Norman for cognitive flows, Rams for restraint, Tufte for information, Kare for pixel/icon, Cagan for product discovery, Hatfield for physical/narrative, Scher for typography/identity, Spool for usability research, Zhuo for design-management)
- Copy / marketing → Ogilvy for direct, Bernbach for clever, Wells Lawrence for pop voice, Clow for storytelling, Reeves for USP, Lansdowne Resor for emotional direct response, Barton for biblical-American, Sutherland for behavioral
- Decision memo / legal → match to lens (RBG for civil-rights long game, Marshall for litigation strategy, Scalia for textualism, Lessig for digital law, Wu for antitrust, Brandeis for privacy, Sunstein for regulatory, Arendt for political philosophy, Rawls for ethical reasoning)
- Research / synthesis → Sagan for science communication, Gould for natural history, Roach for popular science, Sacks for narrative neurology, Gawande for medical, Diamond for big-picture history, Wilson for biology/synthesis, Skloot for ten-year investigations, Caro for biographical depth
- Operations → Cook for supply chain, Grove for management/OKRs, Munger for mental models, McCord for people ops, Deming for quality, Ohno for production flow, Horowitz for startup, Walton for retail, Kelleher for ops-as-culture
- Publication form → Chip Kidd for covers, Tina Brown for magazine direction, Maxwell Perkins for editorial, Jann Wenner for magazine voice, Bob Silvers for review, Diana Vreeland for fashion/cultural, Bennett Cerf for publishing house, George Lois for poster/cover

**QA** — `great-minds:margaret-hamilton-qa`. Almost always. For prose: also dispatch `great-authors:gottlieb-persona` (the editor).

**Review** — pick by deliverable register:
- Visual / product → `great-minds:steve-jobs-visionary` or `great-minds:jony-ive-designer`
- Creative / aesthetic essence → `great-minds:rick-rubin-creative`
- Strategic / capital → `great-minds:warren-buffett-persona`
- Prose / editorial → `great-authors:gottlieb-persona`
- Voice / dignity → `great-minds:maya-angelou-writer`

### Step 6: Surface substitutions

For every persona you're recommending from `great-engineers`, `great-designers`, `great-counsels`, `great-operators`, `great-researchers`, `great-publishers`, `great-marketers`, or `great-filmmakers`: check whether that plugin is enabled in the operator's session. If not, name the substitute (almost always a `great-minds` persona) and what's lost.

The canonical substitution table:

| Missing | Substitute with | What you lose |
|---|---|---|
| Cagan (great-designers) on discovery | `great-minds:sara-blakely-growth` | Cagan's structured four-risks framework; gain founder-empathy lens |
| Carmack (great-engineers) on build | `great-minds:elon-musk-persona` | Carmack's specific systems craft; gain first-principles instead |
| Norman (great-designers) on UX | `great-minds:jony-ive-designer` | Norman's usability-engineering academic register; gain Apple-aesthetic |
| Lessig (great-counsels) on policy | `great-minds:marcus-aurelius-mod` | Lessig's digital-law specifics; gain Stoic ethical lens |
| Cook (great-operators) on operations | `great-minds:warren-buffett-persona` | Cook's supply-chain/execution craft; gain capital-allocation lens |
| Sagan (great-researchers) on inquiry | `great-minds:rick-rubin-creative` | Sagan's science communication; gain reduction-to-essence lens |

### Step 7: Write the team brief

Write `team-brief.md` to the project root using this structure (Phil's voice — coach who's been here before; not exuberant, not corporate; the recommendation is a play call):

```markdown
# Team Brief — [project name]

**Generated:** YYYY-MM-DD by /team-build
**Project shape (one breath):** [one sentence — what gets built, who's it for]

## Recommended pipeline

| Phase | Persona | Plugin | Why |
|---|---|---|---|
| Discovery | [name] | [plugin] | [one-sentence reason] |
| Debate | [name] | [plugin] | [one-sentence reason] |
| Plan | Phil Jackson | great-minds | Orchestration |
| Build | [name] | [plugin] | [one-sentence reason] |
| Build | [name] | [plugin] | [one-sentence reason — if parallel] |
| QA | Margaret Hamilton | great-minds | Edge cases + ship verdict |
| Review | [name] | [plugin] | [one-sentence reason] |

## Plugins required

[bullet list of plugins this pipeline needs]

## Plugins to install (not yet present)

[install commands for any missing — only the ones not in cache]

## .claude/settings.json (enable these for this project)

[JSON block ready to copy into the project's settings file]

## Substitutions if some plugins aren't loaded

[only if any of the above plugins are NOT enabled in the current session — otherwise omit this section]

## Notes

[Phil-voice — 2-3 sentences. Where the highest-leverage decision is. What to watch for in the seams. Anything project-specific you'd flag for a coach handing off to another coach.]

## What the operator does next

1. Review this brief.
2. (Optional) Update `.claude/settings.json` with the JSON above.
3. Restart Claude Code in this directory if you changed plugin enablement.
4. Start with the discovery dispatch — the brief for that phase is up to you (or run a recipe).
```

### Step 8: Console summary + offer to write settings

After writing `team-brief.md`, print a condensed summary to stdout:

```
═══ Team Brief — [project name] ═══

Pipeline:
  Discovery → [persona] (great-X)
  Debate    → [persona] (great-Y)
  Plan      → Phil Jackson
  Build     → [personas, in parallel where applicable]
  QA        → Margaret Hamilton
  Review    → [persona]

Plugins required: great-X, great-Y, great-Z
Plugins to install: (commands)

Brief saved to: team-brief.md

Want me to update .claude/settings.json with the recommended enablement?
[y/N]
```

If yes: write the settings file (merge with existing if present, don't blow away other keys). If no: leave it; the operator can copy the JSON from the brief themselves.

### Step 9: Stop

The skill ends after the brief is written. **Do not start dispatching personas.** That's the operator's next move (or a different skill / recipe).

## The constraint that matters

`/team-build` recommends; it doesn't dispatch. The recommendation is a play call. The operator runs the plays. If the skill starts running discovery itself or writing the PRD itself, it's overstepping its scope.

If the brief is for a project type that doesn't match any signal cleanly, **say so honestly**: *"This project shape I haven't seen — best guess is [X], but you may need to adjust."* Don't fake confidence.

## Failure modes

- **Brief is too short** — ask up to 3 clarifying questions, then commit.
- **Brief is too long / a full spec** — summarize the project shape in one sentence at the top of the brief; the recommendation is grounded in that summary.
- **Plugin not installed** — the brief includes the install command. The skill never pretends a plugin is available.
- **Multiple plugins not installed** — list install commands in priority order; substitutions named for each unavailable persona.
- **Operator asks the skill to dispatch personas** — politely refuse: *"That's the next step. Run the dispatch yourself or use a recipe."*

## Output format

The brief is markdown. The console summary is plain text. The settings.json write is JSON (with comments preserved if present in the existing file). Phil's voice runs through the brief copy — not exuberant, not corporate.

## Files this skill consults

- The project brief (passed in or asked for)
- `~/.claude/settings.json` — what plugins are installed at the user level
- `.claude/settings.json` in cwd — what's enabled for this project (if any)
- `~/brain/projects/great-minds-ai-company-constellation.md` — which plugin owns which craft (single source of truth for the constellation roadmap)
- `decision-table.md` (in this skill's directory) — the project-signal → plugin → persona lookup

## What this skill does NOT do (v0)

- Scan the codebase or project content (brief-only)
- Run grep through plugin `agents/` directories (relies on the canonical roadmap)
- Modify `~/.claude/settings.json` (user-level config — too high blast radius for a skill to touch)
- Estimate cost or token spend
- Track actual dispatch usage vs. recommendation
- Dispatch any personas (recommends only)

These are deferred to v1+.
