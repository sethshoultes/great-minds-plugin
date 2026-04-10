---
name: agency-setup
description: Interactive project initialization wizard — scans the working directory, asks targeted questions, and generates .great-minds.json, STATUS.md, SCOREBOARD.md, TASKS.md, and a cron reference script.
argument-hint: [quick]
allowed-tools: [Read, Write, Bash, Glob, Edit]
---

# Great Minds Agency — Setup Wizard

Initialize a new Great Minds project through a 3-phase conversational wizard.

**Usage:**
- `/agency-setup` — full setup (5–8 questions)
- `/agency-setup quick` — quick setup (project name only, all defaults)

---

## Phase 1 — Scan (silent, no user input required)

Run these checks silently before asking any questions.

### 1a. Detect project name
```bash
basename "$PWD"
```
Store the result as the default project name.

### 1b. Check for existing config
```bash
test -f .great-minds.json && cat .great-minds.json || echo "NO_CONFIG"
```
If a config exists, skip to the **Reconfigure** section below.

### 1c. Detect PRD directory
Check these paths in order; use the first that exists:
```bash
test -d docs/prds && echo "docs/prds" || test -d prds && echo "prds" || test -d docs && echo "docs" || echo "NOT_FOUND"
```

### 1d. List available agent specs
```bash
ls ~/.claude/agents/*.md 2>/dev/null | xargs -I{} basename {} .md || echo "NO_AGENTS"
```
Store the list of agent names (without `.md`).

---

## Phase 2 — Questions

After scanning, summarize what you found in one short paragraph, then ask questions one at a time. Never ask more than one question per message.

**If the user passed `quick` as an argument, or says "quick" at any point:**
Ask only Question 1, then proceed to Phase 3 with all other fields at defaults.

### Question 1 — Project name
> "I'll set this up as **{detected-name}**. Is that the right project name, or would you like a different one?"

If they confirm, use the detected name. If they give a new name, use that.

### Question 2 — Active agents
> "Which agents should be active on this project? Available: {list-from-scan}
>
> You can say 'all', list specific names, or 'none' to leave agents unconfigured for now."

Normalize each name (lowercase, strip `.md`). If the user names an agent not in the detected list, say:
> "I don't see **{name}** in `~/.claude/agents/` — did you mean one of these? {closest-matches}. You can also say 'skip' to leave it out."

### Question 3 — PRD directory
If a directory was detected:
> "I found a PRD directory at **{detected-path}**. Is that correct, or would you like a different path?"

If nothing was detected:
> "Where should the pipeline look for incoming PRDs? (e.g. `docs/prds`, `prds/`, or 'skip' to configure later)"

Do NOT create the directory if it doesn't exist — just record the path.

### Question 4 — Pipeline schedule
> "How often should the pipeline run? Examples: 'hourly', 'every 30 minutes', 'daily', 'manual only'"

Convert the answer to a cron expression using these rules:
- "hourly" / "every hour" → `0 * * * *`
- "every N minutes" (N 1–59) → `*/N * * * *`
- "every N hours" (N 1–23) → `0 */N * * *`
- "daily" → `0 0 * * *`
- "manual only" / "manual" / "skip" → `null` (no cron script generated)
- A raw 5-part cron expression → use as-is
- Out-of-range or unrecognized → ask again

### Question 5 — Auto-ship
> "Should the pipeline auto-ship after QA passes, or pause for your manual approval? (auto / manual — default: manual)"

If skipped or anything other than "auto", use `false`.

### Question 6 — Telegram notifications (optional)
> "Telegram notifications? Paste your bot token and chat ID (e.g. `1234567:ABC… -987654321`), or say 'skip'."

If skipped, store `botToken: ""` and `chatId: ""`.

### Question 7 — Token budget (optional)
> "Token budget per agent per session? (default: 50000 — say 'skip' to use default)"

If skipped, use `50000`.

### Question 8 — Custom rules (optional)
> "Any custom rules or banned patterns to add? (paste them, or say 'none')"

If none, store `bannedPatterns: []` and `customRules: []`. Otherwise, split by newline or comma and store each entry as a string in `customRules`.

---

## Phase 3 — Generate

Once all questions are answered, say:
> "Creating project files..."

Then write all files. Use the exact formats below.

### File 1: `.great-minds.json`

Write this JSON to `.great-minds.json` in the current working directory:

```json
{
  "project": "{project-name}",
  "version": "1.0",
  "createdAt": "{ISO-timestamp}",
  "prds": {
    "dir": "{prd-dir}"
  },
  "agents": {
    "active": ["{agent-1}", "{agent-2}"],
    "tokenBudgetPerAgent": {token-budget}
  },
  "pipeline": {
    "schedule": "{cron-expression-or-null}",
    "autoShip": {true-or-false}
  },
  "notifications": {
    "telegram": {
      "botToken": "{token-or-empty}",
      "chatId": "{id-or-empty}"
    }
  },
  "rules": {
    "bannedPatterns": [],
    "customRules": ["{rule-1}", "{rule-2}"]
  }
}
```

Use `null` (not `"null"`) for schedule when manual-only was selected.

### File 2: `STATUS.md`

```markdown
# Great Minds Agency — Status

## Current State
- **state**: idle
- **project**: {project-name}
- **last updated**: {YYYY-MM-DD}
- **pipeline**: {cron-expression, or "manual only" if null}

## Active Agents

| Agent | Status | Activity |
|-------|--------|----------|
{one row per active agent: | {agent-name} | Active | — |}

(If no agents configured: | — | — | Run /agency-setup to configure agents |)

## PRD Directory
- {prd-dir}
```

### File 3: `SCOREBOARD.md`

```markdown
# Great Minds Agency — Scoreboard

**Project**: {project-name}
**Session started**: {YYYY-MM-DD}
**Last updated**: {YYYY-MM-DD}

---

## Agency Totals

| Metric | Count |
|--------|-------|
| Commits | 0 |
| PRs merged | 0 |
| QA reports | 0 |
| Board reviews | 0 |

## Agent Scores

_(Updated as work progresses)_
```

### File 4: `TASKS.md`

```markdown
# Great Minds Agency — Master Task Board

**Project**: {project-name}
**Managed by**: Phil Jackson (Orchestrator)
**Last updated**: {YYYY-MM-DD}

## Open Tasks

_(No tasks yet — run /agency-plan to generate the first task list)_

## Recently Completed

_(none)_

## Blocked

_(none)_
```

### File 5: `crons/pipeline-runner.sh` (only if schedule is not null)

Create the `crons/` directory if it doesn't exist, then write `crons/pipeline-runner.sh`:

```bash
#!/bin/bash
# Great Minds Agency — Pipeline Runner
# Schedule: {cron-expression}
# Project: {project-name}
# Generated by /agency-setup on {YYYY-MM-DD}
#
# To activate: use /agency-crons or run CronCreate with cron: "{cron-expression}"

set -euo pipefail

PROJECT_DIR="{absolute-path-to-project}"
cd "$PROJECT_DIR"

# Run one pipeline cycle
npx tsx daemon/src/daemon.ts --once
```

Make it executable with `chmod +x crons/pipeline-runner.sh`.

If schedule is null (manual only), do NOT create the cron script. Instead add this note to STATUS.md's pipeline line:
```
- **pipeline**: manual only (run /agency-plan to start a pipeline cycle manually)
```

---

## Completion Message

After all files are written, say:

> "Project initialized.
>
> **Created:**
> - `.great-minds.json` — machine-readable config
> - `STATUS.md` — live state tracker
> - `SCOREBOARD.md` — metrics scoreboard
> - `TASKS.md` — task board
> {- `crons/pipeline-runner.sh` — pipeline cron (schedule: {cron}) — include only if applicable}
>
> **Next steps:**
> - Run `/agency-crons` to activate the pipeline schedule
> - Drop a PRD into `{prd-dir}` to start your first project
> - Run `/agency-plan` to kick off a manual pipeline cycle"

---

## Reconfigure (existing config found)

If Phase 1 found an existing `.great-minds.json`, say:

> "I found an existing config for **{project-name}**. Do you want to **reconfigure** it (I'll pre-fill your current values), or **cancel**?"

If they say reconfigure:
- Pre-fill all Phase 2 questions with the existing values as defaults
- User only needs to answer questions where they want to change something
- After Phase 3, overwrite all files (STATUS.md, SCOREBOARD.md, TASKS.md are regenerated fresh; .great-minds.json is overwritten)

If they say cancel: stop and do nothing.
