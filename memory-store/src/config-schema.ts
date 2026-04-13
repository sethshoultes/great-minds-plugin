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
  if (minuteMatch) {
    const n = parseInt(minuteMatch[1], 10);
    if (n < 1 || n > 59) return null;
    return `*/${n} * * * *`;
  }

  const hourMatch = s.match(/^every\s+(\d+)\s+hours?$/);
  if (hourMatch) {
    const n = parseInt(hourMatch[1], 10);
    if (n < 1 || n > 23) return null;
    return `0 */${n} * * *`;
  }

  // Pass through raw 5-part cron expressions unchanged
  if (/^[\d*/,\-]+ [\d*/,\-]+ [\d*/,\-]+ [\d*/,\-]+ [\d*/,\-]+$/.test(s)) return s;

  return null;
}

// ── normalizeAgentName ─────────────────────────────────────────────────────

/**
 * Normalize an agent name: strip .md extension, lowercase, trim whitespace.
 */
export function normalizeAgentName(name: string): string {
  return name.trim().replace(/\.md$/i, '').toLowerCase();
}

// ── defaultConfig ──────────────────────────────────────────────────────────

/**
 * Return a fully-populated default config for the given project name.
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
  if (!pipeline) {
    throw new Error('Config.pipeline must be an object');
  }
  if (pipeline.schedule !== null && typeof pipeline.schedule !== 'string') {
    throw new Error('Config.pipeline.schedule must be a string or null');
  }
  if (typeof pipeline.autoShip !== 'boolean') {
    throw new Error('Config.pipeline.autoShip must be a boolean');
  }

  return raw as GreatMindsConfig;
}
