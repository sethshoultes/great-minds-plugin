# Great Minds Agency — Heartbeat

This file defines what happens on each scheduled tick. The orchestrator reads this file to determine what actions to take.

## Cron Schedule

| Job | Interval | Agent | Purpose |
|-----|----------|-------|---------|
| monitor | 7 min | Orchestrator | Check agent status, file counts, recent commits, report |
| organizer | 19 min | Organizer/Haiku | Nudge idle agents, validate structure, consolidate memory |
| jensen-review | 60 min | Jensen (Board) | Strategic review, GitHub issues, advise |
| dream | 60 min | Organizer/Haiku | Memory consolidation — orient, gather, consolidate, prune |

## Agent Roster (9 agents)

| Agent | Role | Runtime |
|-------|------|---------|
| Marcus Aurelius | Moderator / Chief of Staff | tmux: admin |
| Steve Jobs | Creative Director (Design, Brand, UX) | tmux: worker1 |
| Elon Musk | Product Director (Engineering, Growth) | tmux: worker2 |
| Jensen Huang | Board Member (Strategy, Reviews) | Cron: 60 min |
| Margaret Hamilton | QA Director (Tests, Security, A11y) | On-demand |
| Rick Rubin | Creative Direction (Brand voice, Essence) | Sub-agent |
| Jony Ive | Visual Design (UI, Components, Craft) | Sub-agent |
| Maya Angelou | Copywriting (Landing pages, Emails, Microcopy) | Sub-agent |
| Sara Blakely | Growth Strategy (GTM, Pricing, Acquisition) | Sub-agent |

## Director Operating Rules

Steve and Elon are DIRECTORS, not individual contributors:
- Break tasks into sub-tasks
- Spawn sub-agents (model: haiku) for parallel work
- Do highest-judgment work themselves
- Delegate: tests, docs, boilerplate, QA, content to sub-agents
- Should have 2-3 sub-agents running at all times during BUILD phases
- Never idle — self-direct when no task is dispatched

## Monitor Tick (every 7 min)

```
1. tmux capture-pane for worker1, worker2 (tail -8)
2. Count source files in active project
3. Check recent git commits
4. Report: file count, agent activity, blockers, new commits
```

## Organizer Tick (every 19 min)

```
1. Check if agents are idle (no "esc to interrupt" = idle)
2. If idle: nudge with proactive tasks across ALL active projects
   - Include both localgenius (Vercel app) and localgenius-sites (Cloudflare)
   - Remind to spawn sub-agents (model haiku)
3. Check MEMORY.md is under 200 lines
4. Verify STATUS.md reflects reality
```

## Jensen Board Review (every 60 min)

```
1. Read latest commits across all projects
2. Count source files
3. Read previous board review to avoid repeating
4. Write review (under 50 lines) to rounds/{project}/board-review-{N}.md
5. Create GitHub issues (label: board-idea) only if genuinely new
6. One specific, actionable recommendation per review
```

Already covered issues (don't repeat):
- Data moat architecture
- Platform partnerships (CUDA playbook)
- Outcome-based pricing evolution
- Usage ceiling / AI model degradation
- AI honesty in system prompts
- ROI metrics in digest
- Email data pipeline
- Focus risk on multi-project
- Placeholder runtime on Sites
- CORS on voice endpoint
- In-memory Map for insight actions

## QA Pipeline (Margaret Hamilton — on demand via /agency-qa)

```
Phase 1: npm run build + typecheck + lint
Phase 2: npm run test (report pass/fail count)
Phase 3: Live site screenshots (Playwright)
Phase 4: API smoke test (health, auth, key endpoints)
Phase 5: Accessibility audit (ARIA, contrast, touch targets)
Phase 6: Security review (auth, error leaking, CORS, secrets)
Output: QA report with SHIP / FIX FIRST / BLOCK recommendation
```

## Active Projects

| Project | Location | Live URL | Platform |
|---------|----------|----------|----------|
| LocalGenius (app) | /Users/sethshoultes/Local Sites/localgenius/ | localgenius.company | Vercel + Neon |
| LocalGenius Sites | /Users/sethshoultes/Local Sites/localgenius-sites/ | localgenius-sites.pages.dev | Cloudflare Pages |
| Great Minds (agency) | /Users/sethshoultes/Local Sites/great-minds/ | github.com/sethshoultes/great-minds | GitHub |

## Hybrid AI Architecture

| Task Type | Model | Platform | Cost |
|-----------|-------|----------|------|
| Conversation (complex) | Claude Sonnet | Anthropic API (Vercel) | ~$0.003/msg |
| Content drafts | Llama 3.1 8B | Cloudflare Workers AI | Free tier |
| Voice transcription | Whisper | Cloudflare Workers AI | Free tier |
| Image generation | Stable Diffusion XL | Cloudflare Workers AI | Free tier |
| Sentiment analysis | DistilBERT | Cloudflare Workers AI | Free tier |
| Sub-agent work | Claude Haiku | Anthropic API | ~5x cheaper than Sonnet |

## State Machine

```
idle → debate → plan → build → review → ship → idle
                                  ↑         |
                                  └─────────┘  (revisions)

Any state → blocked → (human resolves) → previous state
```

## Retry Policy

- Agent fails → retry once
- Retry fails → try alternative approach
- Alternative fails → mark "blocked" in STATUS.md, continue other work
- 3 total failures on same task → stop and engage human
- Usage limits hit → wait for reset, organizer nudges when available

## Plugin

Install the full agency on any machine:
```
npx plugins add sethshoultes/great-minds-plugin
```
Includes: 9 agents, 5 skills (/agency-start, /agency-status, /agency-review, /agency-qa, /agency-debate), hooks, templates.
