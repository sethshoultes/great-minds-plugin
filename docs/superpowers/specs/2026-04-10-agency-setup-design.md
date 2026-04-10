# /agency-setup — Interactive Project Initialization

**Date:** 2026-04-10
**Status:** Approved for implementation

---

## Overview

A new Claude Code skill `/agency-setup` that initializes a Great Minds project through a 3-phase conversational wizard. Replaces the manual template-filling workflow. Produces STATUS.md, SCOREBOARD.md, TASKS.md, and a machine-readable `.great-minds.json` config file.

---

## Architecture

### Trigger

Invoked as a slash command: `/agency-setup`

Supports two modes selected at the start of Phase 2:

- **Quick setup** — Claude asks only for a project name; all other fields use defaults. Generates all files immediately. Good for getting something running fast.
- **Full setup** — all 8 questions (3 optional). Default mode.

If `.great-minds.json` already exists in the working directory, Claude offers to reconfigure (re-runs Phase 2 with current values as defaults) or cancel.

**Skipping setup entirely:** If the user never runs `/agency-setup`, or abandons it mid-way, the daemon does not crash — it falls back to `config.ts` defaults. A minimal `.great-minds.json` (project name inferred from directory basename, all other fields at defaults) is written only when setup completes or quick mode runs. The daemon treats a missing config as "default config."

---

### Phase 1 — Scan (silent, no user input)

Claude reads the working directory and pre-fills what it can detect:

| What to detect | How |
|---|---|
| Project name | Working directory basename |
| PRD directory | Check for `docs/prds/`, `prds/`, `docs/` |
| Available agents | List `~/.claude/agents/*.md` filenames |
| Existing config | Check for `.great-minds.json` |

---

### Phase 2 — Targeted Questions

Claude asks only what it couldn't determine. 5–8 questions; items 6–8 are optional (user can say "skip" or "none").

1. **Project name** — confirm detected name or override
2. **Active agents** — multi-select from detected specs; accept names or "all"
3. **PRD directory** — confirm detected path or enter one
4. **Pipeline schedule** — natural language ("hourly", "every 30 minutes", "manual only")
5. **Auto-ship** — "Should the pipeline auto-ship after QA passes, or pause for manual approval? (auto / manual)" — default: manual
6. **Telegram notifications** — bot token + chat ID, or "skip"
7. **Token budget per agent** — integer (tokens), default: 50000
8. **Custom rules / banned patterns** — freeform text, or "none"

---

### Phase 3 — Generate

Claude writes the following files to the current working directory (project root):

#### `.great-minds.json`

```json
{
  "project": "<name>",
  "version": "1.0",
  "createdAt": "<ISO timestamp>",
  "prds": {
    "dir": "<path>"
  },
  "agents": {
    "active": ["<agent-id>", "..."],
    "tokenBudgetPerAgent": 50000
  },
  "pipeline": {
    "schedule": "<cron expression>",
    "autoShip": false
  },
  "notifications": {
    "telegram": {
      "botToken": "",
      "chatId": ""
    }
  },
  "rules": {
    "bannedPatterns": [],
    "customRules": []
  }
}
```

- `schedule` stores a standard cron expression converted from natural language input; `null` when "manual only" is selected
- `telegram` fields are empty strings when user skips notifications
- Agent names match spec filenames in `~/.claude/agents/` (without `.md`)

#### `STATUS.md`

Pre-filled with project name, active agents list, and `state: idle`.

#### `SCOREBOARD.md`

Blank slate with standard Great Minds section headings.

#### `TASKS.md`

Empty task list with standard header.

#### `crons/pipeline-runner.sh`

Cron entry written (or appended) reflecting the chosen schedule. The `crons/` directory is created if it doesn't exist. If "manual only" was selected, no cron entry is written and a note is added to STATUS.md.

---

## Error Handling

| Scenario | Behavior |
|---|---|
| `.great-minds.json` already exists | Offer reconfigure or cancel; pre-fill Phase 2 with current values |
| Detected PRD directory doesn't actually exist | Warn, ask to confirm or enter a different path; do not create the directory |
| Named agent not found in `~/.claude/agents/` | Flag the name, ask to confirm spelling or skip; setup continues without that agent |
| Telegram skipped | `botToken` and `chatId` left as empty strings; daemon skips notifications silently |
| Token budget skipped | Defaults to 50000 |
| Auto-ship skipped | Defaults to `false` (manual approval) |
| Setup skipped entirely / `.great-minds.json` absent | Daemon falls back to `config.ts` defaults; no crash |
| Phase 1 detects nothing (fresh directory) | All Phase 2 questions asked; quick mode still available |

---

## Testing

### Unit tests (Vitest)

- Config schema validation: required fields present, correct types
- Cron expression conversion: "hourly" → `"0 * * * *"`, "every 30 minutes" → `"*/30 * * * *"`, "manual" → `null`
- Agent name normalization: strips `.md`, lowercases

### Integration test

A mock skill invocation that feeds synthetic answers through all 3 phases and asserts:
- `.great-minds.json` written with correct values
- STATUS.md contains correct project name and agent list
- SCOREBOARD.md and TASKS.md are created
- Cron entry matches chosen schedule

---

## Files to Create

| File | Type | Notes |
|---|---|---|
| `skills/agency-setup.md` | Skill | New slash command |
| `memory-store/src/config-schema.ts` | TypeScript | Zod schema for `.great-minds.json` |
| `memory-store/tests/config-schema.test.ts` | Test | Unit tests for schema + cron conversion |

---

## Out of Scope

- GUI or true TUI (Clack/Ink) — interaction is conversational
- Modifying existing agent spec files
- Creating the PRD directory if it doesn't exist
- Multi-project config (one `.great-minds.json` per project root)
