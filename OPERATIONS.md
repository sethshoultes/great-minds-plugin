# Great Minds Agency — Operations Guide

How to run the agency successfully. Read this before your first session.

## Quick Start

```bash
# Install the plugin
npx plugins add sethshoultes/great-minds-plugin

# Install claude-swarm (auto-installed by plugin hook, or manually)
mkdir -p ~/.local/bin
curl -sL -o ~/.local/bin/claude-swarm https://raw.githubusercontent.com/sethshoultes/claude-swarm/main/claude-swarm
chmod +x ~/.local/bin/claude-swarm
export PATH="$HOME/.local/bin:$PATH"

# Create a project
/agency-start my-project

# Drop a PRD
# Edit prds/my-project.md

# Launch the swarm
./launch.sh my-project
```

## Cron Jobs to Set Up

These run in your orchestrator session (not inside the swarm). Set them up after launching:

### Monitor (every 7 min)
Checks agent status, file counts, recent commits.

### Organizer (every 19 min)
Nudges idle agents. Checks live site HTTP status. Verifies MEMORY.md size.

### Git Monitor (every 13 min)
Commits and pushes uncommitted work across all repos. Checks GitHub issues. Ensures nothing is unpushed.

### Jensen Board Review (every 60 min)
Launches Jensen Huang agent for strategic review. Files GitHub issues for new findings.

### Dream Consolidation (every 60 min, optional)
Updates AGENTS.md, STATUS.md, MEMORY.md, SCOREBOARD.md with current reality. Syncs plugin.

## Key Rules

### Directors Must Delegate
Steve and Elon are DIRECTORS, not individual contributors. They should:
- Break tasks into sub-tasks
- Spawn sub-agents (model: haiku) for parallel work
- Do highest-judgment work themselves
- Have 2-3 sub-agents running at all times during BUILD phases

### Haiku for Sub-Agents
All sub-agents must use `model: "haiku"` to conserve usage limits (~5x cheaper). Only directors and moderator use Sonnet.

### Git Workflow (PR-Based)
Never push directly to main. Always:
1. Create a feature branch: `git checkout -b feature/description`
2. Commit work to the branch
3. Create a PR: `gh pr create --title "description" --body "summary"`
4. Margaret (QA) reviews the PR
5. Merge only after review: `gh pr merge --squash`

Vercel auto-generates preview URLs for every PR — use those for staging.

### QA Must Run Continuously
Margaret Hamilton (QA Director) should run in her own tmux window (worker3) with a continuous loop:
- Check live site HTML content (not just status codes)
- Run tests and build
- Verify forms actually work (POST to endpoints)
- Write QA reports
- Flag bugs to Steve/Elon via tmux send-keys

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

## The Pipeline

```
PRD → Debate (2 rounds) → Plan (hire sub-agents) → Build (parallel) → Review → Ship
```

### Debate Phase (Rounds 1-2)
- Steve and Elon stake positions on all deliverable areas
- Moderator logs decisions
- Lock strategic decisions before building

### Plan Phase (Round 3)
- Directors define teams by writing agent definitions in team/
- Use team/TEMPLATE.md for format
- Each agent gets specific inputs, outputs, and quality bar

### Build Phase (Rounds 4-8)
- Sub-agents execute assignments in parallel
- Directors supervise, review output
- Margaret QA runs continuously
- Jensen reviews hourly

### Review Phase (Round 9)
- Steve reviews for taste, craft, brand consistency
- Elon reviews for feasibility, accuracy, market alignment
- Margaret does final QA pass

### Ship Phase (Round 10)
- Final deliverables assembled
- Joint summary written
- Learnings saved to memory
- SCOREBOARD updated

## Day One Checklist (Do These Immediately)

These were learned the hard way. Do them at the START of every project, not after problems appear.

1. **Launch Margaret (QA) in worker3 from minute one.** Don't wait for the build to be "ready."
2. **Enforce PR workflow immediately.** No direct pushes to main, ever. Add the rule to worker override prompts.
3. **Create SCOREBOARD.md at project start.** Track every agent's output from the first commit.
4. **Set up all 5 crons** — run `/agency-crons` right after launching the swarm.
5. **Skip the moderator.** Marcus Aurelius sounds good but the crons do everything he does. The human + crons = better orchestrator.
6. **Create a task queue** — a simple list of known work items in STATUS.md that the organizer pulls from when nudging idle agents. Generic "keep improving" nudges waste tokens.

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
3. **Each agent should maintain their own "next 3 tasks" list** in their tmux session.
4. **After completing a PR, agents should immediately check the task queue for the next item.**

## Common Problems

| Problem | Solution |
|---------|----------|
| Agents idle | Organizer cron nudges them. Or send manual task via tmux send-keys |
| Usage limits hit | Wait for reset. Use Haiku for sub-agents. Stagger work. |
| Agents push to main | Remind them: feature branches + PRs only |
| Pages return 200 but show "Not Found" | Margaret must check HTML content, not just status codes |
| System files stale | Run dream consolidation |
| Plugin out of date | Sync files and push to plugin repo |
| Agent lost persona after restart | Send override prompt from /tmp/claude-shared/prompts/ |

## Infrastructure Options

| Service | Purpose | Cost |
|---------|---------|------|
| Vercel | App hosting, preview deployments | Free tier works |
| Neon | PostgreSQL database | Free tier (0.5GB) |
| Cloudflare Workers AI | Whisper, Llama, SDXL, DistilBERT | Free tier |
| Stripe | Billing | Test mode free, live mode per-transaction |
| Resend | Email | Free tier (100 emails/day) |
| GitHub | Repos, issues, PRs | Free |
| tmux | Agent orchestration | Free (local) |
