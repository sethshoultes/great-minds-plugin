# /agency-setup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the `/agency-setup` slash command — a 3-phase conversational wizard that scans a project directory, asks targeted questions, and generates `.great-minds.json`, `STATUS.md`, `SCOREBOARD.md`, `TASKS.md`, and a cron reference script.

**Architecture:** A skill prompt (`skills/agency-setup/SKILL.md`) handles the conversational flow. A TypeScript module (`memory-store/src/config-schema.ts`) defines the config type, validates it, and converts natural-language schedule input to cron expressions. The daemon reads `.great-minds.json` at startup; if the file is absent it falls back to `config.ts` defaults.

**Tech Stack:** Claude Code skill (markdown), TypeScript, Vitest, better-sqlite3 (no new deps needed)

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `memory-store/src/config-schema.ts` | Create | `GreatMindsConfig` type, `parseSchedule()`, `normalizeAgentName()`, `defaultConfig()`, `validateConfig()` |
| `memory-store/tests/config-schema.test.ts` | Create | Vitest unit tests — schema, cron conversion, agent normalization |
| `skills/agency-setup/SKILL.md` | Create | Skill prompt — 3-phase setup wizard |
| `memory-store/tests/setup-integration.test.ts` | Create | Integration test — generates files and validates them against schema |

---

## Task 1: Write failing tests for `config-schema.ts`

**Files:**
- Create: `memory-store/tests/config-schema.test.ts`

- [ ] **Step 1: Write the test file**

```typescript
// memory-store/tests/config-schema.test.ts
import { describe, it, expect } from 'vitest';
import {
  parseSchedule,
  normalizeAgentName,
  defaultConfig,
  validateConfig,
} from '../src/config-schema.js';

// ── parseSchedule ─────────────────────────────────────────────────────────────

describe('parseSchedule', () => {
  it('"hourly" → "0 * * * *"', () => {
    expect(parseSchedule('hourly')).toBe('0 * * * *');
  });

  it('"every hour" → "0 * * * *"', () => {
    expect(parseSchedule('every hour')).toBe('0 * * * *');
  });

  it('"every 30 minutes" → "*/30 * * * *"', () => {
    expect(parseSchedule('every 30 minutes')).toBe('*/30 * * * *');
  });

  it('"every 15 minutes" → "*/15 * * * *"', () => {
    expect(parseSchedule('every 15 minutes')).toBe('*/15 * * * *');
  });

  it('"every 2 hours" → "0 */2 * * *"', () => {
    expect(parseSchedule('every 2 hours')).toBe('0 */2 * * *');
  });

  it('"daily" → "0 0 * * *"', () => {
    expect(parseSchedule('daily')).toBe('0 0 * * *');
  });

  it('"manual only" → null', () => {
    expect(parseSchedule('manual only')).toBeNull();
  });

  it('"manual" → null', () => {
    expect(parseSchedule('manual')).toBeNull();
  });

  it('"skip" → null', () => {
    expect(parseSchedule('skip')).toBeNull();
  });

  it('"none" → null', () => {
    expect(parseSchedule('none')).toBeNull();
  });

  it('is case-insensitive', () => {
    expect(parseSchedule('Hourly')).toBe('0 * * * *');
    expect(parseSchedule('MANUAL ONLY')).toBeNull();
  });

  it('passes through a raw cron expression unchanged', () => {
    expect(parseSchedule('*/5 * * * *')).toBe('*/5 * * * *');
  });

  it('returns null for unrecognized input', () => {
    expect(parseSchedule('whenever I feel like it')).toBeNull();
  });
});

// ── normalizeAgentName ────────────────────────────────────────────────────────

describe('normalizeAgentName', () => {
  it('strips .md extension', () => {
    expect(normalizeAgentName('steve-jobs-visionary.md')).toBe('steve-jobs-visionary');
  });

  it('lowercases the name', () => {
    expect(normalizeAgentName('Steve-Jobs-Visionary')).toBe('steve-jobs-visionary');
  });

  it('trims surrounding whitespace', () => {
    expect(normalizeAgentName('  jony-ive-designer  ')).toBe('jony-ive-designer');
  });

  it('handles name without extension', () => {
    expect(normalizeAgentName('margaret-hamilton-qa')).toBe('margaret-hamilton-qa');
  });

  it('handles .MD extension (uppercase)', () => {
    expect(normalizeAgentName('elon-musk-persona.MD')).toBe('elon-musk-persona');
  });
});

// ── defaultConfig ─────────────────────────────────────────────────────────────

describe('defaultConfig', () => {
  it('sets the project name', () => {
    const c = defaultConfig('my-project');
    expect(c.project).toBe('my-project');
  });

  it('sets version to "1.0"', () => {
    expect(defaultConfig('x').version).toBe('1.0');
  });

  it('sets autoShip to false', () => {
    expect(defaultConfig('x').pipeline.autoShip).toBe(false);
  });

  it('sets schedule to null (manual)', () => {
    expect(defaultConfig('x').pipeline.schedule).toBeNull();
  });

  it('sets tokenBudgetPerAgent to 50000', () => {
    expect(defaultConfig('x').agents.tokenBudgetPerAgent).toBe(50000);
  });

  it('sets active agents to empty array', () => {
    expect(defaultConfig('x').agents.active).toEqual([]);
  });

  it('sets telegram fields to empty strings', () => {
    const c = defaultConfig('x');
    expect(c.notifications.telegram.botToken).toBe('');
    expect(c.notifications.telegram.chatId).toBe('');
  });

  it('sets bannedPatterns and customRules to empty arrays', () => {
    const c = defaultConfig('x');
    expect(c.rules.bannedPatterns).toEqual([]);
    expect(c.rules.customRules).toEqual([]);
  });

  it('sets createdAt to a valid ISO timestamp', () => {
    const c = defaultConfig('x');
    expect(() => new Date(c.createdAt)).not.toThrow();
    expect(new Date(c.createdAt).toISOString()).toBe(c.createdAt);
  });
});

// ── validateConfig ────────────────────────────────────────────────────────────

describe('validateConfig', () => {
  const valid = () => ({
    project: 'test-project',
    version: '1.0',
    createdAt: new Date().toISOString(),
    prds: { dir: './docs/prds' },
    agents: { active: ['steve-jobs-visionary'], tokenBudgetPerAgent: 50000 },
    pipeline: { schedule: '0 * * * *', autoShip: false },
    notifications: { telegram: { botToken: '', chatId: '' } },
    rules: { bannedPatterns: [], customRules: [] },
  });

  it('accepts a valid config object', () => {
    expect(() => validateConfig(valid())).not.toThrow();
  });

  it('returns the config object on success', () => {
    const c = valid();
    expect(validateConfig(c)).toBe(c);
  });

  it('throws if project is missing', () => {
    const c = valid();
    delete (c as any).project;
    expect(() => validateConfig(c)).toThrow(/project/);
  });

  it('throws if project is empty string', () => {
    expect(() => validateConfig({ ...valid(), project: '' })).toThrow(/project/);
  });

  it('throws if agents.active is missing', () => {
    const c = valid();
    delete (c as any).agents;
    expect(() => validateConfig(c)).toThrow(/agents/);
  });

  it('throws if agents.active is not an array', () => {
    expect(() => validateConfig({ ...valid(), agents: { active: 'not-array', tokenBudgetPerAgent: 50000 } })).toThrow(/agents/);
  });

  it('throws if pipeline is missing', () => {
    const c = valid();
    delete (c as any).pipeline;
    expect(() => validateConfig(c)).toThrow(/pipeline/);
  });

  it('throws if raw is not an object', () => {
    expect(() => validateConfig(null)).toThrow();
    expect(() => validateConfig('string')).toThrow();
    expect(() => validateConfig(42)).toThrow();
  });

  it('accepts schedule: null (manual-only config)', () => {
    expect(() => validateConfig({ ...valid(), pipeline: { schedule: null, autoShip: false } })).not.toThrow();
  });
});
```

- [ ] **Step 2: Run tests — confirm they all fail with "cannot find module"**

```bash
cd "/Users/sethshoultes/Local Sites/great-minds-plugin/memory-store"
npx vitest run tests/config-schema.test.ts
```

Expected: All tests fail with `Error: Cannot find module '../src/config-schema.js'`

- [ ] **Step 3: Commit the failing tests**

```bash
cd "/Users/sethshoultes/Local Sites/great-minds-plugin"
git add memory-store/tests/config-schema.test.ts
git commit -m "test: add failing tests for config-schema (TDD)"
```

---

## Task 2: Implement `config-schema.ts`

**Files:**
- Create: `memory-store/src/config-schema.ts`

- [ ] **Step 1: Write the implementation**

```typescript
// memory-store/src/config-schema.ts
/**
 * Config schema for .great-minds.json — the machine-readable project config
 * written by /agency-setup and read by the daemon at startup.
 */

// ── Types ──────────────────────────────────────────────────────────────────

export interface GreatMindsConfig {
  project: string;
  version: string;
  createdAt: string;
  prds: {
    dir: string;
  };
  agents: {
    active: string[];
    tokenBudgetPerAgent: number;
  };
  pipeline: {
    schedule: string | null;
    autoShip: boolean;
  };
  notifications: {
    telegram: {
      botToken: string;
      chatId: string;
    };
  };
  rules: {
    bannedPatterns: string[];
    customRules: string[];
  };
}

// ── parseSchedule ──────────────────────────────────────────────────────────

/**
 * Convert natural-language schedule input to a cron expression.
 * Returns null for "manual only", "manual", "skip", "none", or unrecognized input.
 *
 * Supported inputs:
 *   "hourly" | "every hour"         → "0 * * * *"
 *   "every N minutes"               → "*\/N * * * *"
 *   "every N hours"                 → "0 *\/N * * *"
 *   "daily"                         → "0 0 * * *"
 *   "manual only" | "manual" | etc. → null
 *   raw cron expression (5 parts)   → returned as-is
 */
export function parseSchedule(input: string): string | null {
  const s = input.trim().toLowerCase();

  if (['manual only', 'manual', 'skip', 'none'].includes(s)) return null;
  if (s === 'hourly' || s === 'every hour') return '0 * * * *';
  if (s === 'daily') return '0 0 * * *';

  const minuteMatch = s.match(/^every\s+(\d+)\s+minutes?$/);
  if (minuteMatch) return `*/${minuteMatch[1]} * * * *`;

  const hourMatch = s.match(/^every\s+(\d+)\s+hours?$/);
  if (hourMatch) return `0 */${hourMatch[1]} * * *`;

  // Pass through raw 5-part cron expressions unchanged
  if (/^[\d*/,\-]+ [\d*/,\-]+ [\d*/,\-]+ [\d*/,\-]+ [\d*/,\-]+$/.test(s)) return s;

  return null;
}

// ── normalizeAgentName ─────────────────────────────────────────────────────

/**
 * Normalize an agent name: strip .md extension, lowercase, trim whitespace.
 * Input may come from a directory listing ("steve-jobs-visionary.md") or user
 * input ("Steve Jobs Visionary").
 */
export function normalizeAgentName(name: string): string {
  return name.trim().replace(/\.md$/i, '').toLowerCase();
}

// ── defaultConfig ──────────────────────────────────────────────────────────

/**
 * Return a fully-populated default config for the given project name.
 * Used when the user skips /agency-setup or runs quick mode.
 */
export function defaultConfig(projectName: string): GreatMindsConfig {
  return {
    project: projectName,
    version: '1.0',
    createdAt: new Date().toISOString(),
    prds: { dir: './docs/prds' },
    agents: {
      active: [],
      tokenBudgetPerAgent: 50000,
    },
    pipeline: {
      schedule: null,
      autoShip: false,
    },
    notifications: {
      telegram: {
        botToken: '',
        chatId: '',
      },
    },
    rules: {
      bannedPatterns: [],
      customRules: [],
    },
  };
}

// ── validateConfig ─────────────────────────────────────────────────────────

/**
 * Validate a raw parsed JSON object as a GreatMindsConfig.
 * Throws a descriptive Error if required fields are missing or wrong type.
 * Returns the same object cast to GreatMindsConfig on success.
 */
export function validateConfig(raw: unknown): GreatMindsConfig {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Config must be a non-null object');
  }
  const c = raw as Record<string, unknown>;

  if (typeof c.project !== 'string' || c.project.trim() === '') {
    throw new Error('Config.project must be a non-empty string');
  }

  const agents = c.agents as Record<string, unknown> | undefined;
  if (!agents || !Array.isArray(agents.active)) {
    throw new Error('Config.agents.active must be an array');
  }

  const pipeline = c.pipeline as Record<string, unknown> | undefined;
  if (!pipeline || (pipeline.schedule !== null && typeof pipeline.schedule !== 'string')) {
    throw new Error('Config.pipeline must have schedule (string | null) and autoShip (boolean)');
  }
  if (typeof pipeline.autoShip !== 'boolean') {
    throw new Error('Config.pipeline.autoShip must be a boolean');
  }

  return raw as GreatMindsConfig;
}
```

- [ ] **Step 2: Run tests — confirm they all pass**

```bash
cd "/Users/sethshoultes/Local Sites/great-minds-plugin/memory-store"
npx vitest run tests/config-schema.test.ts
```

Expected: All 35 tests pass, 0 failures.

- [ ] **Step 3: Run the full memory-store test suite to confirm no regressions**

```bash
cd "/Users/sethshoultes/Local Sites/great-minds-plugin/memory-store"
npx vitest run
```

Expected: All tests pass (existing embeddings + buglog + store tests still green).

- [ ] **Step 4: Commit**

```bash
cd "/Users/sethshoultes/Local Sites/great-minds-plugin"
git add memory-store/src/config-schema.ts
git commit -m "feat: add config-schema — GreatMindsConfig type, parseSchedule, validateConfig"
```

---

## Task 3: Write failing integration test

**Files:**
- Create: `memory-store/tests/setup-integration.test.ts`

- [ ] **Step 1: Write the integration test**

This test simulates what `/agency-setup` does in Phase 3 — it generates all four files for a given config and validates them.

```typescript
// memory-store/tests/setup-integration.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { defaultConfig, validateConfig, parseSchedule, type GreatMindsConfig } from '../src/config-schema.js';

// ── Helpers ───────────────────────────────────────────────────────────────

function generateStatusMd(config: GreatMindsConfig): string {
  const agentRows = config.agents.active.length > 0
    ? config.agents.active.map(a => `| ${a} | Active | — |`).join('\n')
    : '| — | — | No agents configured yet |';

  const scheduleNote = config.pipeline.schedule === null
    ? '- **pipeline**: manual only'
    : `- **pipeline**: ${config.pipeline.schedule}`;

  return `# Great Minds Agency — Status

## Current State
- **state**: idle
- **project**: ${config.project}
- **last updated**: ${config.createdAt}
${scheduleNote}

## Active Agents

| Agent | Status | Activity |
|-------|--------|----------|
${agentRows}

## PRD Directory
- ${config.prds.dir}
`;
}

function generateScoreboardMd(config: GreatMindsConfig): string {
  return `# Great Minds Agency — Scoreboard

**Project**: ${config.project}
**Session started**: ${config.createdAt.slice(0, 10)}
**Last updated**: ${config.createdAt.slice(0, 10)}

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
`;
}

function generateTasksMd(config: GreatMindsConfig): string {
  return `# Great Minds Agency — Master Task Board

**Project**: ${config.project}
**Managed by**: Phil Jackson (Orchestrator)
**Last updated**: ${config.createdAt.slice(0, 10)}

## Open Tasks

_(No tasks yet — run /agency-plan to generate the first task list)_

## Recently Completed

_(none)_

## Blocked

_(none)_
`;
}

function generateCronScript(config: GreatMindsConfig, projectDir: string): string | null {
  if (config.pipeline.schedule === null) return null;
  return `#!/bin/bash
# Great Minds Agency — Pipeline Runner
# Schedule: ${config.pipeline.schedule}
# Project: ${config.project}
# Generated by /agency-setup on ${config.createdAt.slice(0, 10)}

set -euo pipefail

PROJECT_DIR="${projectDir}"
cd "$PROJECT_DIR"

# Run one pipeline cycle
npx tsx daemon/src/daemon.ts --once
`;
}

// ── Tests ─────────────────────────────────────────────────────────────────

describe('agency-setup integration — file generation', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = join(tmpdir(), `agency-setup-test-${Date.now()}`);
    mkdirSync(tmpDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  function writeProjectFiles(config: GreatMindsConfig) {
    // .great-minds.json
    writeFileSync(join(tmpDir, '.great-minds.json'), JSON.stringify(config, null, 2));

    // STATUS.md
    writeFileSync(join(tmpDir, 'STATUS.md'), generateStatusMd(config));

    // SCOREBOARD.md
    writeFileSync(join(tmpDir, 'SCOREBOARD.md'), generateScoreboardMd(config));

    // TASKS.md
    writeFileSync(join(tmpDir, 'TASKS.md'), generateTasksMd(config));

    // crons/pipeline-runner.sh (only if schedule is set)
    const cronScript = generateCronScript(config, tmpDir);
    if (cronScript) {
      mkdirSync(join(tmpDir, 'crons'), { recursive: true });
      writeFileSync(join(tmpDir, 'crons', 'pipeline-runner.sh'), cronScript, { mode: 0o755 });
    }
  }

  it('generates .great-minds.json with correct structure', () => {
    const config = defaultConfig('sunrise-yoga');
    writeProjectFiles(config);

    const raw = JSON.parse(readFileSync(join(tmpDir, '.great-minds.json'), 'utf8'));
    expect(() => validateConfig(raw)).not.toThrow();
    expect(raw.project).toBe('sunrise-yoga');
    expect(raw.version).toBe('1.0');
    expect(raw.pipeline.autoShip).toBe(false);
  });

  it('generates STATUS.md with project name and state: idle', () => {
    const config = defaultConfig('sunrise-yoga');
    writeProjectFiles(config);

    const status = readFileSync(join(tmpDir, 'STATUS.md'), 'utf8');
    expect(status).toContain('state**: idle');
    expect(status).toContain('sunrise-yoga');
  });

  it('generates SCOREBOARD.md with project name', () => {
    const config = defaultConfig('sunrise-yoga');
    writeProjectFiles(config);

    const scoreboard = readFileSync(join(tmpDir, 'SCOREBOARD.md'), 'utf8');
    expect(scoreboard).toContain('sunrise-yoga');
    expect(scoreboard).toContain('Commits | 0');
  });

  it('generates TASKS.md with project name', () => {
    const config = defaultConfig('sunrise-yoga');
    writeProjectFiles(config);

    const tasks = readFileSync(join(tmpDir, 'TASKS.md'), 'utf8');
    expect(tasks).toContain('sunrise-yoga');
    expect(tasks).toContain('No tasks yet');
  });

  it('generates crons/pipeline-runner.sh when schedule is set', () => {
    const config: GreatMindsConfig = {
      ...defaultConfig('sunrise-yoga'),
      pipeline: { schedule: '0 * * * *', autoShip: false },
    };
    writeProjectFiles(config);

    expect(existsSync(join(tmpDir, 'crons', 'pipeline-runner.sh'))).toBe(true);
    const script = readFileSync(join(tmpDir, 'crons', 'pipeline-runner.sh'), 'utf8');
    expect(script).toContain('0 * * * *');
    expect(script).toContain('sunrise-yoga');
  });

  it('does NOT generate crons/pipeline-runner.sh when schedule is null', () => {
    const config = defaultConfig('sunrise-yoga'); // schedule: null by default
    writeProjectFiles(config);

    expect(existsSync(join(tmpDir, 'crons', 'pipeline-runner.sh'))).toBe(false);
  });

  it('STATUS.md notes manual-only pipeline when schedule is null', () => {
    const config = defaultConfig('sunrise-yoga');
    writeProjectFiles(config);

    const status = readFileSync(join(tmpDir, 'STATUS.md'), 'utf8');
    expect(status).toContain('manual only');
  });

  it('STATUS.md lists active agents', () => {
    const config: GreatMindsConfig = {
      ...defaultConfig('sunrise-yoga'),
      agents: { active: ['steve-jobs-visionary', 'margaret-hamilton-qa'], tokenBudgetPerAgent: 50000 },
    };
    writeProjectFiles(config);

    const status = readFileSync(join(tmpDir, 'STATUS.md'), 'utf8');
    expect(status).toContain('steve-jobs-visionary');
    expect(status).toContain('margaret-hamilton-qa');
  });

  it('reconfiguring (overwriting) produces correct updated files', () => {
    // First setup
    const config1 = defaultConfig('sunrise-yoga');
    writeProjectFiles(config1);

    // Reconfigure with different name + schedule
    const config2: GreatMindsConfig = {
      ...config1,
      project: 'sunset-yoga',
      pipeline: { schedule: '*/30 * * * *', autoShip: true },
    };
    writeProjectFiles(config2);

    const raw = JSON.parse(readFileSync(join(tmpDir, '.great-minds.json'), 'utf8'));
    expect(raw.project).toBe('sunset-yoga');
    expect(raw.pipeline.schedule).toBe('*/30 * * * *');
    expect(raw.pipeline.autoShip).toBe(true);

    const script = readFileSync(join(tmpDir, 'crons', 'pipeline-runner.sh'), 'utf8');
    expect(script).toContain('*/30 * * * *');
  });
});

// ── parseSchedule round-trip ──────────────────────────────────────────────

describe('agency-setup integration — schedule round-trip', () => {
  it('user says "hourly" → stored as "0 * * * *" → cron script uses "0 * * * *"', () => {
    const schedule = parseSchedule('hourly');
    expect(schedule).toBe('0 * * * *');

    const script = generateCronScript(
      { ...defaultConfig('x'), pipeline: { schedule, autoShip: false } },
      '/tmp/project'
    );
    expect(script).toContain('0 * * * *');
  });

  it('user says "manual only" → stored as null → no cron script generated', () => {
    const schedule = parseSchedule('manual only');
    expect(schedule).toBeNull();

    const script = generateCronScript(
      { ...defaultConfig('x'), pipeline: { schedule, autoShip: false } },
      '/tmp/project'
    );
    expect(script).toBeNull();
  });
});
```

- [ ] **Step 2: Run integration tests — confirm they pass**

```bash
cd "/Users/sethshoultes/Local Sites/great-minds-plugin/memory-store"
npx vitest run tests/setup-integration.test.ts
```

Expected: All 10 tests pass. The generator functions (`generateStatusMd`, `generateScoreboardMd`, etc.) are defined as helpers in the test file and import from `config-schema.ts` (which already exists from Task 2). If any test fails, read the error and fix the relevant generator helper in the test file.

- [ ] **Step 3: Run full test suite**

```bash
cd "/Users/sethshoultes/Local Sites/great-minds-plugin/memory-store"
npx vitest run
```

Expected: All tests pass.

- [ ] **Step 4: Commit**

```bash
cd "/Users/sethshoultes/Local Sites/great-minds-plugin"
git add memory-store/tests/setup-integration.test.ts
git commit -m "test: add integration tests for agency-setup file generation"
```

---

## Task 4: Write the `agency-setup` skill

**Files:**
- Create: `skills/agency-setup/SKILL.md`

- [ ] **Step 1: Create the skill directory and file**

```bash
mkdir -p "/Users/sethshoultes/Local Sites/great-minds-plugin/skills/agency-setup"
```

- [ ] **Step 2: Write the skill**

```markdown
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
- "every N minutes" → `*/N * * * *`
- "every N hours" → `0 */N * * *`
- "daily" → `0 0 * * *`
- "manual only" / "manual" / "skip" → `null`
- A raw 5-part cron expression → use as-is

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

Create the `crons/` directory if it doesn't exist:
```bash
mkdir -p crons
```

Write `crons/pipeline-runner.sh`:
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

Make it executable:
```bash
chmod +x crons/pipeline-runner.sh
```

If schedule is null (manual only), do NOT create the cron script. Instead, append this note to STATUS.md:
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
> {- `crons/pipeline-runner.sh` — pipeline cron (schedule: {cron}) — only if applicable}
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
```

- [ ] **Step 3: Verify the skill file parses correctly (check frontmatter)**

```bash
head -10 "/Users/sethshoultes/Local Sites/great-minds-plugin/skills/agency-setup/SKILL.md"
```

Expected output: frontmatter block with name, description, argument-hint, allowed-tools.

- [ ] **Step 4: Commit**

```bash
cd "/Users/sethshoultes/Local Sites/great-minds-plugin"
git add skills/agency-setup/SKILL.md
git commit -m "feat: add /agency-setup skill — 3-phase conversational setup wizard"
```

---

## Task 5: Manual verification

- [ ] **Step 1: Run the full memory-store test suite one final time**

```bash
cd "/Users/sethshoultes/Local Sites/great-minds-plugin/memory-store"
npx vitest run
```

Expected: All tests pass (config-schema: 35, setup-integration: 10+, embeddings: 13, buglog: 23, store: 27 = ~108+ total).

- [ ] **Step 2: Confirm skill appears in plugin**

```bash
ls "/Users/sethshoultes/Local Sites/great-minds-plugin/skills/"
```

Expected: `agency-setup/` directory listed alongside existing skills.

- [ ] **Step 3: Verify .great-minds.json schema is exported from memory-store**

```bash
cd "/Users/sethshoultes/Local Sites/great-minds-plugin/memory-store"
npx tsx -e "import { defaultConfig, validateConfig, parseSchedule } from './src/config-schema.js'; console.log(JSON.stringify(defaultConfig('test'), null, 2));"
```

Expected: Prints a valid default config JSON.

- [ ] **Step 4: Final commit and push**

```bash
cd "/Users/sethshoultes/Local Sites/great-minds-plugin"
git status
git push origin feature/agency-setup
```

---

## Spec Coverage Check

| Spec requirement | Covered by |
|---|---|
| `/agency-setup` slash command | Task 4 — SKILL.md |
| Quick mode (project name only) | Task 4 — SKILL.md Phase 2 |
| Phase 1 scan (name, PRD dir, agents, existing config) | Task 4 — SKILL.md Phase 1 |
| 8 targeted questions, 3 optional | Task 4 — SKILL.md Phase 2 |
| Generate `.great-minds.json` | Task 4 — SKILL.md Phase 3 + Task 2 (schema) |
| Generate `STATUS.md` | Task 4 — SKILL.md Phase 3 + Task 3 (integration test) |
| Generate `SCOREBOARD.md` | Task 4 — SKILL.md Phase 3 + Task 3 |
| Generate `TASKS.md` | Task 4 — SKILL.md Phase 3 + Task 3 |
| Generate `crons/pipeline-runner.sh` | Task 4 — SKILL.md Phase 3 + Task 3 |
| Reconfigure existing config | Task 4 — SKILL.md Reconfigure section |
| Daemon fallback when config absent | Noted in skill (no crash guarantee) — daemon handles this |
| Error handling: PRD dir not found | Task 4 — SKILL.md Phase 2 Q3 |
| Error handling: agent not found | Task 4 — SKILL.md Phase 2 Q2 |
| `parseSchedule` cron conversion | Task 1 (tests) + Task 2 (impl) |
| `normalizeAgentName` | Task 1 (tests) + Task 2 (impl) |
| `validateConfig` schema | Task 1 (tests) + Task 2 (impl) |
| `defaultConfig` with safe defaults | Task 1 (tests) + Task 2 (impl) |
