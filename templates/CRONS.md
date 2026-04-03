# Great Minds Agency — Cron System

Complete map of all automated processes. Set these up in the orchestrator session after launching the swarm.

## Active Crons

### 1. Monitor — Every 7 minutes
**Purpose:** Check what every agent is doing, count files, check commits.

**What it does:**
- `tmux capture-pane` for worker1, worker2, worker3
- Count source files in active project
- Check recent git commits
- Report: file count, agent activity, blockers, new commits

**How to set up:**
```
CronCreate with cron: "*/7 * * * *"
```

---

### 2. Git Monitor — Every 13 minutes
**Purpose:** Commit and push uncommitted work. Keep all repos synced.

**What it does:**
- Check `git status --short` across all repos (localgenius, localgenius-sites, great-minds, great-minds-plugin)
- If uncommitted changes: commit with descriptive message and push
- Check open GitHub issues
- Verify nothing unpushed (compare local vs origin/main)

**How to set up:**
```
CronCreate with cron: "*/13 * * * *"
```

---

### 3. Organizer — Every 19 minutes
**Purpose:** Nudge idle agents. Check live site health.

**What it does:**
- Check if agents are idle (no "esc to interrupt" in tmux)
- If idle: send task via `tmux send-keys` with reminders to:
  - Use feature branches + PRs
  - Use model haiku for sub-agents
  - Self-direct across all active projects
- Check live site HTTP status + HTML content verification
- Check MEMORY.md line count (should be under 200)

**How to set up:**
```
CronCreate with cron: "*/19 * * * *"
```

---

### 4. Jensen Board Review — Every 60 minutes
**Purpose:** Strategic review from the board member.

**What it does:**
- Launches a Jensen Huang agent (background)
- Reads latest commits, source files, previous review
- Writes review under 50 lines to `rounds/{project}/board-review-{N}.md`
- Creates GitHub issues (label: board-idea) for genuinely new findings
- One specific, actionable recommendation per review

**How to set up:**
```
CronCreate with cron: "3 * * * *"  (offset from :00 to avoid API congestion)
```

**Track record:** 15 reviews, 10 issues filed, 8 fixed in this session.

---

### 5. Dream Consolidation — Every 60 minutes (optional)
**Purpose:** Keep system files current. Memory consolidation.

**What it does:**
- Check AGENTS.md reflects actual agent roster
- Check STATUS.md reflects current project state
- Update MEMORY.md with new operational learnings
- Update SCOREBOARD.md with latest metrics
- Sync plugin if anything changed
- Commit and push

**How to set up:**
```
CronCreate with cron: "33 * * * *"  (offset from Jensen at :03)
```

---

## Non-Cron Automation

### Margaret Hamilton (tmux: worker3)
**Not a cron** — runs as a persistent Claude session in her own tmux window.

**What she does:**
- Continuous QA loop (checks every ~10 minutes on her own)
- Checks live site HTML content (not just HTTP status)
- Runs `npm run build` and `npm run test`
- Reviews PRs when notified via tmux send-keys
- Writes QA reports to `rounds/{project}/qa-report-{N}.md`
- Files bugs to Steve/Elon via tmux send-keys

**Track record:** 19 QA reports, 3 P0s caught, all resolved.

---

## Cron Timing Map

```
:00  :07  :13  :19  :26  :33  :39  :46  :52  :03
 |    |    |    |    |    |    |    |    |    |
 |    MON  GIT  ORG  MON  DRM  ORG  MON  GIT  JEN
 |         |         |         |         |
 |         |         |         |         └─ Jensen review
 |         |         |         └─ Dream consolidation
 |         |         └─ Organizer nudge
 |         └─ Git monitor
 └─ Monitor check
```

No two crons fire at the same minute. Staggered to avoid API congestion.

## Important Notes

- All crons are **session-only** — they die when the Claude session ends (7-day max auto-expiry)
- Use **SEPARATE bash calls** in all cron prompts (no `cd &&` chaining) to avoid permission prompts
- Crons only fire when the REPL is **idle** (not mid-query)
- The organizer nudge should remind agents about **feature branches + PRs** and **haiku for sub-agents**
- Jensen should reference previous reviews to **avoid repeating** findings

## Setting Up All Crons

Run `/agency-crons` after launching the swarm, or set them up manually:

```bash
# In your Claude Code orchestrator session:
# The /agency-crons skill handles this automatically
/agency-crons
```

Or create them individually using the CronCreate tool with the schedules above.

## Monitoring the Crons

```bash
# List all active crons
CronList

# Delete a specific cron
CronDelete with id: "job_id"
```
