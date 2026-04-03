---
name: agency-crons
description: Set up all Great Minds agency cron jobs — monitor, organizer, git monitor, Jensen board review, dream consolidation. Run this after launching the swarm.
allowed-tools: [Bash, CronCreate, CronList, CronDelete]
---

# Great Minds Agency — Set Up Cron Jobs

Set up all recurring agency automation. Use SEPARATE bash calls (no cd && chaining).

## Crons to Create

### 1. Monitor (every 7 min)
Check agent status via tmux capture-pane, count source files, check recent commits. Report briefly.

### 2. Git Monitor (every 13 min)
Check uncommitted work across all repos. Commit and push if dirty. Check open GitHub issues. Verify nothing unpushed.

### 3. Organizer (every 19 min)
Check if agents are idle (no "esc to interrupt"). If idle, nudge with tasks. Check live site HTTP status + HTML content. Check MEMORY.md line count.

### 4. Jensen Board Review (every 60 min)
Launch jensen-huang-board agent. Read latest commits, source files, previous review. Write review under 50 lines. File GitHub issues for new findings.

### 5. Dream Consolidation (every 60 min, offset by 30 min from Jensen)
Check system files (AGENTS.md, STATUS.md, MEMORY.md, SCOREBOARD.md). Update any that are stale. Sync plugin if needed. Commit and push.

## Important Notes
- All crons are session-only — they die when the session ends (7-day max)
- Use SEPARATE bash calls in all cron prompts (no cd && chaining)
- Jensen and Dream should use different minutes to avoid collision
- Organizer nudges should remind agents to use feature branches + PRs
- Organizer nudges should remind agents to use model haiku for sub-agents
