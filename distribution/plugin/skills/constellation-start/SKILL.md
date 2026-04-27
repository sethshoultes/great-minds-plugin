---
name: constellation-start
description: The discoverable entry point for newcomers to the Caseproof persona constellation. Asks 2-3 questions about project shape and routes to the right plugin's project-init skill or channels Phil Jackson for ambiguous projects. Always ensures the bible at .great-authors/project.md exists — that's the shared spine across all five plugins. Use when starting any project and you're not sure where to begin, or when you want a quick router rather than a deep orchestration conversation.
argument-hint: (no arguments — runs as an interactive Q&A)
allowed-tools: [Read, Write, Bash, Glob, Grep, Agent]
---

# /constellation-start — newcomer entry point

The fast-path router for the Caseproof persona constellation.

## Context

The constellation now has five shipped plugins, each owning one craft:

- **`great-minds`** (this plugin) — strategy + agency swarm pattern
- **`great-authors`** — prose / writing
- **`great-filmmakers`** — film / video production
- **`great-publishers`** — publication form (covers, jackets, book sites)
- **`great-marketers`** — marketing (positioning, ad copy, demand)

There's no single canonical workflow across project types. A novel doesn't go through engineers. A software product doesn't go through publishers. Different projects need different plugins in different orders. This skill is the discoverable entry point that asks the smallest set of questions to route the user correctly.

For deep orchestration of complex or mixed projects, this skill channels Phil Jackson (`phil-jackson-orchestrator`), the constellation-level orchestrator persona. For straightforward project shapes, this skill routes directly to the right plugin's project-init.

## When to use

- A user says "I'm starting a new project — where do I begin?"
- A user has a project shape in mind but isn't sure which plugin owns it
- A newcomer to the constellation needs the discoverable starting point
- An experienced user wants a fast slash-command router rather than a conversational orchestration

Not for:
- Users who already know the plugin they want — they can run that plugin's project-init directly
- Users who want deep orchestration help on a complex or mixed project — they should channel Phil Jackson via `Agent` directly
- Existing projects that already have `.great-authors/project.md` and clear next steps

## Instructions for Claude

When this skill is invoked:

### Step 1: Check the working directory

Read what already exists. The user may have arrived in the middle of an existing project, in which case the right move is "advance, don't restart."

```bash
# Run these checks
ls -la                                           # what's at the project root?
[ -f .great-authors/project.md ] && cat .great-authors/project.md
[ -d manuscript/ ] && ls manuscript/ | head
[ -d film/ ] && ls film/screenplay/ 2>/dev/null
[ -d publishers/ ] && ls publishers/
[ -d marketing/ ] && ls marketing/
```

If `.great-authors/project.md` already exists with a meaningful body, this is an existing project. **Skip directly to Step 4 (route based on what's done and what's next)** rather than asking the project-shape questions. Surface what's already in flight and propose the next constellation move.

### Step 2: Ask the project-shape question

If the working directory is empty or doesn't have a bible yet, ask one question:

> What kind of project is this?
>
>   1. **Software product** — app, service, CLI, library
>   2. **Novel or long-form writing** — fiction, essay collection, nonfiction book
>   3. **Film or video** — narrative short, trailer, documentary
>   4. **Publication of a finished manuscript** — cover, jacket, book site for an existing book
>   5. **Marketing / launch** — positioning and copy for a finished artifact
>   6. **Mixed creative project** — book + film + launch, or other multi-plugin combination
>   7. **Not yet sure / something else**

Accept the user's answer. If ambiguous, ask one follow-up question to clarify. Don't ask more than necessary.

### Step 3: Ask the immediate-goal question (only if helpful)

For options 1-3 (software / writing / film), this question is usually skippable — the user wants to start. For options 4-6 (publication / marketing / mixed), ask:

> What's the immediate goal?
>
>   - Set up from scratch
>   - Advance an existing project I have in another directory
>   - Coordinate work that's stuck across multiple parts

This shapes whether the route should be a project-init (scratch) or a Phil Jackson channeling (coordination).

### Step 4: Route to the right entry point

Based on the answers, route to one of the following. Always ensure `.great-authors/project.md` exists before any plugin-specific work — if the chosen plugin doesn't scaffold the bible itself, do it manually first.

**Software product (option 1):**

```
This sounds like a software product. Two paths:

A) Multi-agent swarm pattern (PRD → debate → build → ship):
   /agency-start <project-name>

B) Smaller, direct dispatch (no swarm needed):
   Channel Steve Jobs for vision, Elon Musk for engineering, Jony Ive for
   design. The personas in great-minds cover the developer roles until
   great-engineers ships as its own plugin.

Which fits — A (swarm) or B (direct)?
```

If the user picks A, dispatch to `/agency-start`. If B, set context and channel the right persona (probably Steve Jobs first, for vision).

**Novel or long-form writing (option 2):**

```
A novel or long-form project. The right opening move is:

  /authors-project-init

This scaffolds .great-authors/ (the bible) and manuscript/. Then for
the full pipeline:

  /authors-orchestrate-novel

That's the seven-phase autonomous pipeline (premise/architecture/
drafting/critique/rewrite/final-pass/beta-reader-package) with human
checkpoints at every phase boundary.

Run /authors-project-init now? [y/N]
```

If yes, dispatch via `Agent({subagent_type: "great-authors:authors-project-init", ...})` or instruct the user to run the slash command. (Slash command is cleaner; subagent dispatch is for cases where the user wants this skill to coordinate end-to-end.)

**Film or video (option 3):**

```
A film or video project. The right opening move is:

  /filmmakers-project-init

This scaffolds film/ (sibling to manuscript/ and the bible). Then the
full production-doc pipeline:

  /filmmakers-crew <source-file> --backend <heygen | veo3 | remotion>

That dispatches the director, writer, and craft personas to produce
a backend-ready production doc.

Note: film projects often start with a manuscript (essay, scene notes)
in great-authors. If you don't have a source file yet, run
/authors-project-init first to scaffold the bible.

Run /filmmakers-project-init now? [y/N]
```

**Publication of a finished manuscript (option 4):**

```
Publication of a finished manuscript. The right opening move is:

  /publishers-project-init

This scaffolds publishers/ (sibling to manuscript/, film/, and the bible).
Then dispatch publisher personas:

  /publishers-channel maxwell-perkins  → threshold read of the manuscript
  /publishers-channel chip-kidd        → cover concept brief
  /publishers-channel tina-brown       → jacket copy and positioning

Or build the book site directly:

  /publishers-build-book-site <slug>

Run /publishers-project-init now? [y/N]
```

**Marketing / launch (option 5):**

```
Marketing or launch for a finished artifact. The right opening move is:

  /marketers-project-init

This scaffolds marketing/ (sibling to publishers/ and the rest). Then:

  /marketers-write-positioning <slug>           → the contract
  /marketers-write-launch-copy <slug>           → email, social, press, web

If publishers/positioning/<slug>.md already exists from a prior
publishers-stage pass, marketers will read and extend it.

Run /marketers-project-init now? [y/N]
```

**Mixed creative project (option 6):**

```
A mixed creative project. These are exactly the cases Phil Jackson
exists for — the constellation orchestrator who sees the whole board
and dispatches across plugin boundaries.

I'm channeling Phil Jackson now. He'll ask a few specific questions
about your project, identify which plugins are relevant, and propose
an orchestration plan.
```

Then dispatch via:

```
Agent({
  subagent_type: "great-minds:phil-jackson-orchestrator",
  prompt: <self-contained brief — what the user said about the project,
           what they want, the existing directory contents, the
           constellation context, and the request to coordinate>
})
```

**Not yet sure / something else (option 7):**

Same as option 6 — channel Phil Jackson with a brief that includes the user's verbatim description of what they're trying to do. Phil's persona is constellation-aware (per `phil-jackson-orchestrator.md`); he handles the ambiguous-project case as part of his job.

**Existing project (the Step 1 fallback):**

If `.great-authors/project.md` exists, surface what's done and propose next moves:

```
You have an existing project at <path>. Here's what's in flight:

  Title: <from project.md>
  Genre: <from project.md>

  Manuscript:    <chapter count, current chapter from ## Manuscript>
  Film:          <production docs / renders, if any>
  Publishers:    <covers / jackets / book site, if any>
  Marketing:     <positioning / copy, if any>

Based on what's done, the natural next move is: <one of>

  - Advance the manuscript: /authors-orchestrate-novel --resume
  - Hand off to publishers: /publishers-project-init (if not done)
  - Hand off to marketers: /marketers-write-positioning <slug>
  - Coordinate across plugins: channel phil-jackson-orchestrator

Which next move?
```

### Step 5: After routing, step back

This skill's job is to route, not to coordinate end-to-end. Once you've dispatched the user to the right entry point, the dispatched plugin or skill takes over. Don't try to maintain control of the workflow from here — that's Phil Jackson's job for complex projects, and not needed at all for simple ones.

If the user comes back to `/constellation-start` later in the same session, treat it as a fresh routing decision (the project may have advanced).

## Notes

- **The bible is the spine.** If you route to a plugin's project-init that doesn't scaffold `.great-authors/`, manually verify or scaffold the bible afterward. Without it, downstream plugins lose context.
- **Phil's persona is constellation-aware** as of great-minds v1.3+. If you need to channel him from this skill, the dispatched Phil already knows the constellation routing logic — your brief just needs to tell him what the user is trying to do.
- **This skill does NOT replace any plugin's project-init.** It's a router. The actual scaffolding work happens downstream in the plugin's own skill.
- **For experienced users**, this skill may feel like an extra step. They can skip it and run the plugin's project-init directly. The skill exists for newcomers who don't yet know which plugin owns their question.

## Error handling

- If the user can't answer the project-shape question (genuinely doesn't know), default to channeling Phil Jackson.
- If the user picks a plugin that hasn't shipped yet (e.g., "software engineering, no swarm" → great-engineers when not yet shipped), surface the gap honestly: *"great-engineers isn't shipped yet. The closest available path is the great-minds developer personas (backend-engineer, frontend-developer, etc.) or the agency swarm via `/agency-start`. Which fits?"*
- If `.great-authors/` exists but is malformed (e.g., missing required fields), warn the user and offer to either continue with the partial bible or restart it.

## Related

- `phil-jackson-orchestrator.md` — the constellation-level orchestrator persona this skill channels for ambiguous projects (great-minds v1.3+)
- `/agency-start` — the swarm-pattern entry point for software-product projects (this plugin)
- `/authors-project-init` — the writing-stage entry point (great-authors)
- `/filmmakers-project-init` — the film-stage entry point (great-filmmakers)
- `/publishers-project-init` — the publication-form entry point (great-publishers)
- `/marketers-project-init` — the marketing-stage entry point (great-marketers)
- `~/brain/projects/caseproof-ai-company-constellation.md` — the constellation roadmap
- `~/brain/projects/constellation-entry-point-design.md` — the design rationale for this skill
